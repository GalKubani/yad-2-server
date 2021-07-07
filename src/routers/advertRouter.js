const express = require('express');
const router = new express.Router()
const auth = require('../middleware/auth')
const Advert = require('../models/advertModel');
const { uploadFilesToS3, deleteFileFromS3 } = require('../middleware/s3-handles')

router.get('/adverts/get-user', auth, async (req, res) => {
    try {
        const userAdverts = await Advert.find({ user: req.user })
        res.send(userAdverts)
    } catch (err) {
        console.log(err)
        res.status(400).send(err)
    }
})
router.get('/adverts/get-all', async (req, res) => {
    try {
        const allAdverts = await Advert.find({ isAdvertActive: true })
        res.send(allAdverts)
    } catch (err) {
        console.log(err)
        res.status(400).send(err)
    }
})
router.post('/adverts/new', auth, async (req, res) => {

    try {
        req.body.user = req.user
        const advert = new Advert(req.body)
        await advert.save()
        res.status(201).send(advert)
    } catch (error) {
        console.log(error)
        res.status(400).send(error)
    }
})
router.delete('/adverts/delete', auth, async (req, res) => {
    try {
        let advertToDelete = await Advert.findOne({ _id: req.query.id })
        await advertToDelete.remove()
        res.send(advertToDelete)
    } catch (error) {
        res.status(500).send(error)
    }
})
router.patch('/adverts/edit', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['assetCondition', 'assetTotalParking', 'assetTotalPorchs',
        'assetDetails', 'assetCharecteristics', 'assetBuiltSize', 'assetPrice',
        'assetPictures', 'assetVideo',
        'dateOfEntry', 'isAdvertActive', 'contacts']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))
    if (!isValidOperation) {
        return res.status(400).send({ error: "Invalid updates!" })
    }
    try {
        const advert = await Advert.findById({ _id: req.query.id })
        updates.forEach((update) => advert[update] = req.body[update])
        await advert.save()
        res.send(advert)
    } catch (error) {
        res.status(400).send(error)
    }
})
router.delete('/adverts/delete-picture', deleteFileFromS3, async (req, res) => {
    res.send()
})

router.post('/adverts/add-pictures', auth, uploadFilesToS3, async (req, res) => {
    if (!req.files) {
        res.send([])
    }
    try {
        let imgsrc = []
        for (let pic of req.files) {
            imgsrc.push(pic.location)
        }
        let currentAdvert = await Advert.findById({ _id: req.query.id })
        currentAdvert.assetPictures = [...currentAdvert.assetPictures, ...imgsrc]
        await currentAdvert.save();
        res.send(imgsrc)
    } catch (err) {
        console.log(err)
        res.status(400).send({ error: err.message })
    }
})


module.exports = router;