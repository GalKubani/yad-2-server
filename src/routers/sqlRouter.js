const express = require('express');
const router = new express.Router()
const sql = require('mssql');
const sqlAuth = require('../middleware/sqlauth');
const jwt = require('jsonwebtoken');
const { parseToTokenArray, parseArrayToString, parseAdvert } = require('../utils/parseData');
const { uploadFilesToS3, deleteFileFromS3 } = require('../middleware/s3-handles')

let config = {
    user: 'sa',
    password: process.env.SQL_PASSWORD,
    server: 'localhost',
    database: 'yad-2-db',
    options: { trustServerCertificate: true }
}
const getConnection = async () => {
    let { err } = await sql.connect(config)
    return err
}
router.post('/sql/users/add', async (req, res) => {
    try {
        let error = await getConnection()
        if (error) { res.status(400).send(error) }
        let request = new sql.Request()
        request.query(`exec addAUser @email='${req.body.email}', @password='${req.body.password}'`, (err, result) => {
            if (err) { res.status(400).send(err) }
            let user = result.recordset[0]
            const token = jwt.sign({ _id: user.ID.toString() }, process.env.JWT_SECRET, { expiresIn: '6h' })
            user.tokens = token
            let queryString = `EXEC userLogin @id=${user.ID}, @token='${token}'`
            request.query(queryString, (error) => {
                if (error) { res.status(400).send(error) }
                res.status(201).send({ user, token })
            })
        })
    } catch (error) {
        console.log(error)
        res.status(400).send(error)
    }
})
router.post('/sql/users/login', async (req, res) => {
    try {
        let email = req.body.email
        let error = await getConnection()
        if (error) { res.status(400).send(error) }
        else {
            let request = new sql.Request()
            let queryString = `select * from Users where email='${email}'`
            request.query(queryString, async (err, result) => {
                let user = result.recordset[0]
                try {
                    if (err || !user) { throw new Error("EMAIL_NOT_FOUND") }
                    else {
                        if (req.body.password !== user.password) { throw new Error("INVALID_PASSWORD") }
                        const token = jwt.sign({ _id: user.ID.toString() }, process.env.JWT_SECRET, { expiresIn: '6h' })
                        if (user.tokens) { user.tokens = user.tokens + ", " + token; }
                        else { user.tokens = token }
                        let queryString = `EXEC userLogin @id=${user.ID}, @token='${token}'`
                        request.query(queryString, (error) => {
                            if (err) { throw new Error(error) }
                            res.send({ user, token })
                        })
                    }
                } catch (err) {
                    if (err.message === "EMAIL_NOT_FOUND") res.status(404).send(err.message)
                    else res.status(400).send('INVALID_PASSWORD')
                }
            })
        }
    } catch (err) {
        console.log(err?.message)
        if (err.message === "EMAIL_NOT_FOUND") res.status(404).send(err.message)
        else res.status(400).send('INVALID_PASSWORD')
    }
})
router.patch('/sql/users/me', sqlAuth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['firstName', 'email', 'password', 'mainPhone', 'secondaryPhone',
        'city', 'neighborhood', 'street', 'houseNumber', 'lastName', 'dateOfBirth',]
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))
    if (!isValidOperation) { return res.status(400).send({ error: "Invalid updates!" }) }
    try {
        const user = req.user
        let queryString = ''
        allowedUpdates.forEach((option) => {
            if (!updates.includes(option))
                switch (option) {
                    case 'firstName': case 'city': case 'lastName': case 'street': case 'neighborhood': case 'email': case 'dateOfBirth': {
                        queryString += `@${option} = '${user[option] || null}', `
                        break;
                    }
                    default: {
                        queryString += `@${option} = ${user[option] || null}, `
                        break;
                    }
                }
        })
        updates.forEach((update) => {
            if (typeof req.body[update] === 'string') { queryString += `@${update} = '${req.body[update]}', ` }
            else { queryString += '@' + update + ' = ' + req.body[update] + ', ' }
            user[update] = req.body[update]
        })
        let request = new sql.Request()
        queryString = queryString.slice(0, queryString.length - 2)
        request.query(`exec editUser ` + queryString, (err, result) => {
            if (err) { res.status(400).send(err) }
            let updatedUser = result.recordset[0]
            updatedUser.tokens = parseToTokenArray(updatedUser.tokens)
            res.send(updatedUser)
        })
    } catch (error) {
        console.log(error)
        res.status(400).send(error)
    }
})
router.post('/sql/users/logout', sqlAuth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token !== req.token
        })
        let error = await getConnection()
        let tokensString = parseArrayToString(req.user.tokens)
        if (error) { res.status(400).send(error) }
        let request = new sql.Request()
        let queryString = `update Users set tokens = '${tokensString}' where ID=${req.user.ID}`
        request.query(queryString, (err) => {
            if (err) { res.status(400).send(err) }
            res.send()
        })
    } catch (err) {
        console.log(err)
        res.status(500).send(err)
    }
})
router.post('/sql/adverts/new', sqlAuth, async (req, res) => {
    try {
        req.body.userId = req.user.ID
        let error = await getConnection()
        if (error) { res.status(400).send(error) }
        let request = new sql.Request()
        let queryString = `exec createAdvert `
        let tableKeys = Object.keys(req.body)
        Object.keys(req.body).forEach((key, index) => {
            if (key === 'contacts') {
                queryString += `@mainContact='${req.body.contacts[0].contactName}', @mainContactPhone=${req.body.contacts[0].contactNumber}, `
                if (req.body.contacts[1]) {
                    queryString += `@secondContact='${req.body.contacts[1].contactName}', @secondContactPhone=${req.body.contacts[1].contactNumber}, `
                }
                else { queryString += `@secondContact='', @secondContactPhone=null, ` }
            }
            else if (typeof req.body[key] === 'string' || key === 'assetCharecteristics') { queryString += `@${tableKeys[index]}='${req.body[key]}', ` }
            else { queryString += `@${tableKeys[index]}=${req.body[key]}, ` }
        })
        queryString += `@isAdvertActive=1`
        request.query(queryString, (err, result) => {
            if (err) { res.status(400).send(err) }
            let advert = result.recordset[0]
            res.send(advert)
        })
    } catch (error) { res.status(400).send(error) }
})
router.post('/sql/adverts/add-pictures', sqlAuth, uploadFilesToS3, async (req, res) => {
    if (!req.files) { res.send([]) }
    try {
        let imgsrc = []
        for (let pic of req.files) { imgsrc.push(pic.location) }
        let error = await getConnection()
        if (error) { res.status(400).send(error) }
        let request = new sql.Request()
        let queryString = ``
        request.query(`select assetPictures from Adverts where ID=${req.query.id}`, (err, records) => {
            if (records.recordset.assetPictures) {
                queryString = `update Adverts set assetPictures= assetPictures +',${parseArrayToString(imgsrc)}' where ID=${req.query.id}`
            }
            else { queryString = `update Adverts set assetPictures= '${parseArrayToString(imgsrc)}' where ID=${req.query.id}` }
            request.query(queryString, (err) => {
                if (err) { res.status(400).send(err) }
                else { res.send(imgsrc) }
            })
        })
    } catch (err) {
        console.log(err)
        res.status(400).send({ error: err.message })
    }
})
router.get('/sql/adverts/get-user', sqlAuth, async (req, res) => {
    try {
        let error = await getConnection()
        if (error) { res.status(400).send(error) }
        let request = new sql.Request()
        let queryString = `select * from Adverts where userId=${req.user.ID}`
        request.query(queryString, (err, result) => {
            if (err) { res.status(400).send(err) }
            let userAdverts = []
            for (let advert of result.recordset) {
                userAdverts.push(parseAdvert(advert))
            }
            res.send(userAdverts)
        })
    } catch (err) {
        res.status(400).send(err)
    }
})
router.delete('/sql/adverts/delete', sqlAuth, async (req, res) => {
    try {
        let error = await getConnection()
        if (error) { res.status(400).send(error) }
        let request = new sql.Request()
        let queryString = `delete from Adverts where ID=${req.query.id}`
        request.query(queryString, (err) => {
            if (err) { res.status(400).send(err) }
            else { res.status(202).send() }
        })
    } catch (error) {
        res.status(500).send(error)
    }
})

router.patch('/sql/adverts/edit', sqlAuth, async (req, res) => {
    const updates = Object.keys(req.body)
    if (updates.length === 1) {
        let error = await getConnection()
        if (error) { res.status(400).send(error) }
        let request = new sql.Request()
        if (updates[0] === 'isAdvertActive') {
            request.query(`update Adverts set isAdvertActive=${req.body.isAdvertActive} where ID=${req.query.id}`, (err) => {
                if (err) { res.status(400).send(err) }
                else { res.send() }
            })
        }
        if (updates[0] === 'assetDetails') {
            request.query(`update Adverts set assetDetails=assetDetails +' ' where ID=${req.query.id}`, (err) => {
                if (err) { res.status(400).send(err) }
                else { res.send() }
            })
        }
    }
    else {
        const allowedUpdates = ['assetCondition', 'assetTotalParking', 'assetTotalPorchs',
            'assetDetails', 'assetCharecteristics', 'assetBuiltSize',
            'assetPrice', 'dateOfEntry', 'isAdvertActive', 'contacts']
        let queryString = `exec editAdvert `
        const isValidOperation = updates.every((update) => {
            if (allowedUpdates.includes(update)) {
                switch (update) {
                    case 'contacts': { queryString += `@mainContact =' ${req.body.contacts.contactName}', @mainContactPhone =${req.body.contacts.contactNumber}, `; break; }
                    case 'assetPrice': case 'assetTotalParking': case 'assetTotalPorchs': case 'assetPrice': case 'assetBuiltSize': {
                        queryString += `@${update} = ${req.body[update]}, `
                        break;
                    }
                    case 'isAdvertActive':
                        queryString += `@${update} = ${req.body[update] === "true" ? 1 : 0}, `;
                        break;
                    default: {
                        queryString += `@${update} = '${req.body[update]}', `
                        break;
                    }
                }
                return true
            }
            return false
        })
        if (!isValidOperation) { return res.status(400).send({ error: "Invalid updates!" }) }
        try {
            sql.connect(config, (err) => {
                if (err) { res.status(400).send(err) }
                else {
                    let request = new sql.Request()
                    request.query(`select * from Adverts where ID=${req.query.id}`, (err, result) => {
                        if (err) { res.status(400).send(err) }
                        let currentAdvert = result.recordset[0]
                        allowedUpdates.forEach((option) => {
                            if (!updates.includes(option)) {
                                if (typeof currentAdvert[option] === 'string') { queryString += `@${option} = '${currentAdvert[option]}', ` }
                                else { queryString += `@${option} = ${currentAdvert[option]}, ` }
                            }
                        })
                        queryString += `@ID = ` + req.query.id
                        request.query(queryString, (err, result) => {
                            if (err) { res.status(400).send(err) }
                            else { res.send(result.recordsets) }
                        })
                    })

                }
            })
        } catch (error) {
            res.status(400).send(error)
        }
    }
})

router.get('/sql/adverts/get-all', async (req, res) => {
    try {
        let error = await getConnection()
        if (error) { res.status(400).send(error) }
        let request = new sql.Request()
        request.query(`select * from Adverts WHERE isAdvertActive=1`, (err, result) => {
            if (err) { res.status(400).send(err) }
            else {
                let allActiveAdverts = []
                for (let advert of result.recordset) { allActiveAdverts.push(parseAdvert(advert)) }
                res.send(allActiveAdverts)
            }
        })
    } catch (err) {
        res.status(400).send(err)
    }
})

module.exports = router;