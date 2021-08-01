const jwt = require('jsonwebtoken')
const sql = require('mssql');
const { parseToTokenArray } = require('../utils/parseData');


let config = {
    user: 'sa',
    password: '80gal80',
    server: 'localhost',
    database: 'yad-2-db',
    options: { trustServerCertificate: true }
}
const sqlAuth = async (req, res, next) => {
    try {
        const token = req.header("Authorization").replace("Bearer ", "");
        const data = jwt.verify(token, process.env.JWT_SECRET)
        sql.connect(config, (err) => {
            if (err) { res.status(500).send(err) }
            let request = new sql.Request()
            let queryString = `SELECT * from Users where ID=` + data._id + ` AND CHARINDEX('${token}', tokens) > 0`
            request.query(queryString, (err, result) => {
                try {
                    if (err || !result.recordset[0]) {
                        console.log(err)
                        throw new Error();
                    }
                    else {
                        req.user = result.recordset[0];
                        req.user.tokens = parseToTokenArray(req.user.tokens)
                        req.token = token;
                        next();
                    }
                } catch (err) {
                    console.log(err)
                    res.status(500).send({
                        status: 500, message: "authentication failed"
                    })
                }
            })
        })
    }
    catch (err) {
        console.log(err)
        res.status(500).send({
            status: 500, message: "authentication failed"
        })
    }
}
module.exports = sqlAuth;