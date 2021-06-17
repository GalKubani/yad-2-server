const express = require('express');
const router = new express.Router()
const auth = require('../middleware/auth');
const User = require('../models/userModel');
const bcrypt = require('bcryptjs')

router.post('/users/add', async (req, res) => {

    try {
        req.body.name = req.body.email[0];
        const user = new User(req.body)
        await user.save()
        const token = await user.generateAuthToken()
        res.status(201).send({ user, token })
    } catch (error) {
        console.log(error)
        res.status(400).send(error)
    }
})
router.post('/users/login', async (req, res) => {
    try {
        let email = req.body.email
        const user = await User.findOne({ email })
        if (!user) {
            throw new Error("EMAIL_NOT_FOUND")
        }
        const isMatch = await bcrypt.compare(req.body.password, user.password)
        if (!isMatch) {
            throw new Error("INVALID_PASSWORD")
        }
        const token = await user.generateAuthToken()
        res.send({ user, token });
    } catch (err) {
        console.log(err?.message)
        if (err.message === "EMAIL_NOT_FOUND") res.status(404).send(err.message)
        else res.status(400).send('INVALID_PASSWORD')
    }
})
router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.user.save()
        res.send()
    } catch (err) {
        res.status(500).send()
    }
})
router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.send()
    } catch (err) {
        res.status(500).send()
    }
})
router.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.remove()
        res.send(req.user)
    } catch (error) {
        res.status(500).send(error)
    }
})
router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))
    if (!isValidOperation) {
        return res.status(400).send({ error: "Invalid updates!" })
    }
    try {
        const user = req.user
        updates.forEach((update) => user[update] = req.body[update])
        await user.save()
        res.send(user)
    } catch (error) {
        res.status(400).send(error)
    }
})



module.exports = router;