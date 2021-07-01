const express = require('express');
const router = new express.Router()
const auth = require('../middleware/auth')
const sharp = require('sharp')
const multer = require('multer')
const Advert = require('../models/advertModel');


router.get('/adverts/get-user', auth, async (req, res) => {
    try {
        const userAdverts = await Advert.find({ user: req.user })
        res.send(userAdverts)
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
    const allowedUpdates = ['assetBuildingTotalFloors', 'assetCondition',
        'assetTotalParking', 'assetTotalPorchs', 'assetDetails', 'assetCharecteristics',
        'assetSize', 'assetPrice', 'dateOfEntry', 'isAdvertActive', 'contacts']
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
const uploadPics = multer({
    limits: {
        fileSize: 10000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Please upload an image'))
        }
        cb(undefined, true)
    }
})
const uploadVideo = multer({
    limits: {
        fileSize: 30000000
    },
    fileFilter(req, file, cb) {
        console.log(file)
        if (!file.originalname.match(/\.(mp4|avi)$/)) {
            return cb(new Error('Please upload a video'))
        }
        cb(undefined, true)
    }
})
router.post('/adverts/add-pictures', auth, uploadPics.array('assetPictures'), async (req, res) => {
    try {
        let bufferedPics = []
        for (let picture of req.files) {
            let pic = await sharp(picture.buffer).resize({ width: 250, height: 250 }).png().toBuffer()
            bufferedPics.push(pic)
        }
        let currentAdvert = await Advert.findById({ _id: req.query.id })
        currentAdvert.assetPictures = [...currentAdvert.assetPictures, ...bufferedPics]
        await currentAdvert.save();
        res.send()
    } catch (err) {
        console.log(err)
        res.status(400).send({ error: err.message })
    }
})
router.post('/adverts/add-video', auth, uploadVideo.single('assetVideo'), async (req, res) => {
    try {
        let videoBuffer = req.file.buffer
        let currentAdvert = await Advert.findById({ _id: req.query.id })
        currentAdvert.assetVideo = videoBuffer;
        await currentAdvert.save();
        res.send()
    } catch (err) {
        console.log(err)
        res.status(400).send({ error: err.message })
    }
})


module.exports = router;