const express = require('express');
const router = new express.Router()
const sql = require('mssql');
const sqlAuth = require('../middleware/sqlauth');
const jwt = require('jsonwebtoken');
const { parseToTokenArray, parseArrayToString, parseAdvert } = require('../utils/parseData');
const { uploadFilesToS3 } = require('../middleware/s3-handles')

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
const initDB = async () => {
    let error = await getConnection()
    if (error) { throw new Error("DB connection error") }
    let request = new sql.Request()
    request.query(`CREATE TABLE Users(
        ID int IDENTITY(1,1) NOT NULL,
        firstName nvarchar(255) NULL,
        lastName nvarchar(255) NULL,
        city nvarchar(255) NULL,
        neighborhood nvarchar(255) NULL,
        street nvarchar(255) NULL,
        houseNumber int NULL,
        mainPhone nvarchar(25) NULL,
        secondaryPhone nvarchar(25) NULL,
        dateOfBirth nvarchar(100) NULL,
        email nvarchar(255) NOT NULL,
        password nvarchar(25) NOT NULL,
        tokens nvarchar(4000) NULL,
        CONSTRAINT pk_users PRIMARY KEY (ID),
        CONSTRAINT uc_email UNIQUE (email) 
     )`, (error) => {
        if (error) {
            console.log("Connecting to existing db")
            return
        }
        request.query(`create TABLE Adverts(
            ID int IDENTITY(1,1) NOT NULL,
            assetType nvarchar(255) NOT NULL,
            assetCondition nvarchar(255) NOT NULL,
            assetCity nvarchar(255) NOT NULL,
            assetStreet nvarchar(255) NOT NULL,
            assetNeighborhood nvarchar(255) NULL,
            assetHouseNumber int NULL,
            assetFloorNumber int NULL,
            assetEntrenceNumber int NULL,
            assetBuildingTotalFloors int NULL,
            assetTotalRooms float NULL,
            assetTotalParking int NOT NULL,
            assetTotalPorchs int NOT NULL,
            assetDetails nvarchar(255) DEFAULT '',
            assetCharecteristics nvarchar(255) NULL,
            assetSize int NOT NULL,
            assetBuiltSize int NULL,
            assetPrice int NULL,
            dateOfEntry nvarchar(255) NOT NULL,
            assetPictures nvarchar(1000) NULL,
            assetVideo nvarchar(255) NULL,
            mainContact nvarchar(255) NOT NULL,
            mainContactPhone int NOT NULL,
            secondContact nvarchar(255) NULL,
            secondContactPhone int NULL,
            isAdvertActive bit NOT NULL,
            userId int NOT NULL,
            updated_at datetime DEFAULT GETDATE(),
            CONSTRAINT pk_adverts PRIMARY KEY (ID),
            CONSTRAINT FK_advert_userID FOREIGN KEY (userId)
            REFERENCES Users(ID),
            CONSTRAINT CHK_numbers CHECK (([assetTotalParking]<=(3) AND [assetTotalParking]>=(0) AND [assetTotalPorchs]<=(3) AND [assetTotalPorchs]>=(0) AND [assetTotalRooms]<=(12) AND [assetTotalRooms]>=(0)))
            )`, (err) => {
            if (err) { console.log(err) }
            else {
                request.query(`CREATE trigger tr_updated_at
                on Adverts after Update as update Adverts
                    set updated_at= getDate()
                    from inserted i
                    where Adverts.ID=i.ID`, (e) => {
                    if (e) { console.log(e) }
                })
                request.query(`create proc createAdvert @assetType nvarchar(30), @assetCondition nvarchar(60), @assetCity nvarchar(60), @assetStreet nvarchar(60), @assetNeighborhood nvarchar(60), 
                @assetHouseNumber int,  @assetTotalRooms float, @assetTotalParking int, @assetTotalPorchs int, @assetDetails nvarchar(500),
                @assetCharecteristics nvarchar(500), @assetSize int, @assetBuiltSize int, @assetPrice int, @dateOfEntry nvarchar(255),
                @mainContact nvarchar(60), @mainContactPhone int, @secondContact nvarchar(60), @secondContactPhone int, @isAdvertActive bit, @userId int
                as begin
                insert into Adverts (assetType,assetCondition,assetCity,assetStreet,assetNeighborhood,assetHouseNumber,assetTotalRooms,
                assetTotalParking,assetTotalPorchs,assetDetails,assetCharecteristics,assetSize,assetBuiltSize,assetPrice,dateOfEntry,mainContact,mainContactPhone,
                secondContact,secondContactPhone,isAdvertActive,userId) 
                values(@assetType , @assetCondition , @assetCity, @assetStreet, @assetNeighborhood, 
                @assetHouseNumber,  @assetTotalRooms, @assetTotalParking, @assetTotalPorchs, @assetDetails,
                @assetCharecteristics, @assetSize, @assetBuiltSize, @assetPrice, @dateOfEntry,
                @mainContact, @mainContactPhone, @secondContact, @secondContactPhone, @isAdvertActive, @userId)
                begin select * from Adverts where assetStreet=@assetStreet AND assetCity= @assetCity AND assetSize=@assetSize end end`, (e) => {
                    if (e) { console.log(e) }
                })
                request.query(`create proc editAdvert @assetCondition nvarchar(255), @assetTotalParking int,
                @assetTotalPorchs int, @assetDetails nvarchar(500),@assetCharecteristics nvarchar(255),
                @assetBuiltSize int,@assetPrice int, @dateOfEntry nvarchar(255),@mainContact nvarchar(255),
                @mainContactPhone int,@isAdvertActive bit,@ID int as begin
                update Adverts set assetCondition=@assetCondition,assetTotalParking=@assetTotalParking,
                assetTotalPorchs=@assetTotalPorchs, assetDetails=@assetDetails, assetCharecteristics=@assetCharecteristics,
                assetBuiltSize=@assetBuiltSize, assetPrice=@assetPrice, dateOfEntry=@dateOfEntry,mainContact=@mainContact,
                mainContactPhone=@mainContactPhone, isAdvertActive=@isAdvertActive
                where @ID=ID begin select * from Users where @ID=ID end end`, (e) => {
                    if (e) { console.log(e) }
                })
            }
        })
        request.query(`CREATE proc addAUser @email nvarchar(255), @password nvarchar(15)
                as begin insert into Users (email,password)
                Values (@email,@password)
                select * from Users where @email=email
                end`, (err) => { if (err) { console.log(err) } })
        request.query(`CREATE proc editUser @email nvarchar(255), @password nvarchar(15),
                @firstName nvarchar(20),@lastName nvarchar(20),@city nvarchar(30),
                @neighborhood nvarchar(30),@street nvarchar(30),@houseNumber int,
                @mainPhone int, @secondaryPhone int, @dateOfBirth nvarchar(100)
                as begin
                update Users set password=@password, firstName=@firstName, lastName=@lastName, city=@city,
                neighborhood=@neighborhood, street=@street, houseNumber=@houseNumber,
                mainPhone=@mainPhone, secondaryPhone=@secondaryPhone, dateOfBirth=@dateOfBirth
                where @email=email begin select * from Users where @email=email end end
                `, (err) => { if (err) { console.log(err) } })
        request.query(`create proc userLogin @id int, @token nvarchar(4000)  
                as begin update Users   
                set tokens = tokens + ','+@token where ID=@id end`, (err) => { if (err) { console.log(err) } })
    })
}
initDB()
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