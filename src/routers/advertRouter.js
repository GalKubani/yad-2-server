const express = require('express');
const router = new express.Router()
const auth = require('../middleware/auth')
const sharp = require('sharp')
const multer = require('multer')
const Advert = require('../models/advertModel')

const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Please upload an image'))
        }
        cb(undefined, true)
    }
})

router.post('/adverts/new', auth, async (req, res) => {

    try {
        req.body.user = req.user
        const advert = new Advert(req.body)
        await advert.save()
        res.status(201).send(advert)
    } catch (error) {
        res.status(400).send(error)
    }
})
router.patch('/adverts/edit', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['assetBuildingTotalFloors', 'assetCondition', 'assetTotalParking', 'assetTotalPorchs',
        'assetDetails', 'assetCharecteristics', 'assetSize', 'assetPrice', 'dateOfEntry',
        'assetPictures', 'assetVideo', 'isAdvertActive', 'contacts']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))
    if (!isValidOperation) {
        return res.status(400).send({ error: "Invalid updates!" })
    }
    try {
        const advert = await Advert.findById({ _id: req.params.advertId })
        updates.forEach((update) => advert[update] = req.body[update])
        await advert.save()
        res.send(advert)
    } catch (error) {
        res.status(400).send(error)
    }
})
router.post('/adverts/new-picture', auth, upload.single('assetPictures'), async (req, res) => {
    const buffer = await sharp(req.image.buffer).resize({ width: 250, height: 250 }).png().toBuffer()
    let currentAdvert = await Advert.findById({ _id: req.body._id })
    currentAdvert.assetPictures.push(buffer)
    // will nn to add option to remove image or video later on
    await req.user.save();
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
})


module.exports = router;