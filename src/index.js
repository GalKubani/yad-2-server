const express = require('express')
const cors = require('cors')
const port = process.env.PORT
const app = express()
require('./db/mongoose')
const addressRouter = require('./routers/addressRouter')
const userRouter = require('./routers/userRouter')
const advertRouter = require('./routers/advertRouter')
app.use(cors())
app.use(express.json())
app.use(addressRouter)
app.use(userRouter)
app.use(advertRouter)
app.use('/', (req, res) => {
    res.send("ok")
})

app.listen(port, () => console.log("server on port:", port))