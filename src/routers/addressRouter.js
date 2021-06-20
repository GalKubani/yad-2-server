const express = require('express');
const { searchCitySheet, searchStreetSheet, findCityStreets } = require('../utils/worksheetRequests');
const router = new express.Router()


router.get('/search-city', async (req, res) => {
    const searchValue = req.query.searchValue
    let cityNames = searchCitySheet(searchValue)
    res.send(cityNames)
})

router.get('/get-city-streets', async (req, res) => {
    const searchValue = req.query.searchValue
    let { streetNames, neighborhoods } = findCityStreets(searchValue)
    res.send({ streetNames, neighborhoods })
})

router.get('/get-location-options', async (req, res) => {
    const searchValue = req.query.searchValue
    let cityNames = searchCitySheet(searchValue)
    let { streetNames, neighborhoods } = searchStreetSheet(searchValue)
    res.send({ cityNames, streetNames, neighborhoods })
})
module.exports = router;