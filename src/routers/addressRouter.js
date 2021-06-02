const express = require('express');
const router = new express.Router()
const { cityWorkSheet, streetWorkSheet } = require('../utils/dataWorksheets')

router.get('/search-city', async (req, res) => {
    const searchValue = req.query.searchValue
    let cityNames = []
    for (let cell in cityWorkSheet) {
        const cellAsString = cell.toString()
        if (cityWorkSheet[cellAsString].שם_ישוב.trim().includes(searchValue) && cityWorkSheet[cellAsString].שם_ישוב.trim().length < 24) {
            cityNames.push(cityWorkSheet[cellAsString].שם_ישוב.trim())
        }
    }
    cityNames.sort(function (a, b) {
        if (a.indexOf(searchValue) <= b.indexOf(searchValue)) { return -1 }
        else return 1
    })
    res.send(cityNames)
})


router.get('/get-city-streets', async (req, res) => {
    const searchValue = req.query.searchValue
    let streetNames = []
    for (let cell in streetWorkSheet) {
        const cellAsString = cell.toString()
        if (streetWorkSheet[cellAsString].שם_ישוב.trim().includes(searchValue) && streetWorkSheet[cellAsString].שם_רחוב.trim().length < 24) {
            streetNames.push(streetWorkSheet[cellAsString].שם_רחוב.trim())
        }
    }
    streetNames.sort(function (a, b) {
        if (a.indexOf(searchValue) <= b.indexOf(searchValue)) { return -1 }
        else return 1
    })
    res.send(streetNames)
})

module.exports = router;