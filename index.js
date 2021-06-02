const express = require('express')
const cors = require('cors')
const port = process.env.PORT
const app = express()

const addressRouter = require('./src/routers/addressRouter')
const userRouter = require('./src/routers/userRouter')
app.use(cors())
app.use(express.json())
app.use(addressRouter)
app.use(userRouter)
app.use('/', (req, res) => {
    res.send("ok")
})

app.listen(port, () => console.log("server on port:", port))