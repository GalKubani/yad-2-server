const jwt = require('jsonwebtoken')
const User = require("../models/userModel")

const auth = async (req, res, next) => {
    try {
        const token = req.header("Authorization").replace("Bearer ", "");
        const data = jwt.verify(token, process.env.JWT_SECRET)
        const user = await User.findOne({
            _id: data._id,
            "tokens.token": token,
        })
        if (!user) {
            throw new Error();
        }
        req.user = user;
        req.token = token;
        next();
    }
    catch (err) {
        console.log(err)
        res.status(500).send({
            status: 500, message: "authentication failed"
        })
    }
}
module.exports = auth;