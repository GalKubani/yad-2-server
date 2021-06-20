const { cityWorkSheet, streetWorkSheet } = require('../utils/dataWorksheets')

const searchCitySheet = (searchValue) => {
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
    return cityNames
}
const findCityStreets = (searchValue) => {
    let streetNames = []
    for (let cell in streetWorkSheet) {
        const cellAsString = cell.toString()
        try {
            if (streetWorkSheet[cellAsString].שם_ישוב.trim().includes(searchValue) && streetWorkSheet[cellAsString].שם_רחוב.trim().length < 24) {
                streetNames.push(streetWorkSheet[cellAsString].שם_רחוב.trim())
            }
        } catch (err) {
            continue
        }
    }
    streetNames.sort(function (a, b) {
        if (a.indexOf(searchValue) <= b.indexOf(searchValue)) { return -1 }
        else return 1
    })
    let neighborhoods = []
    for (let i = 0; i < streetNames.length; i++) {
        if (streetNames[i].includes("שכ ")) {
            let neighborhoodName = streetNames.splice(i, 1)[0]
            neighborhoods.push(neighborhoodName)
        }
    }
    return { streetNames, neighborhoods }
}
const searchStreetSheet = (searchValue) => {
    let streetNames = []
    for (let cell in streetWorkSheet) {
        const cellAsString = cell.toString()
        //  || (streetWorkSheet[cellAsString].שם_ישוב.trim().includes(searchValue))
        try {
            if (streetWorkSheet[cellAsString].שם_רחוב.trim().includes(searchValue) && streetWorkSheet[cellAsString].שם_רחוב.trim().length < 24) {
                streetNames.push(streetWorkSheet[cellAsString].שם_רחוב.trim() + "//" + streetWorkSheet[cellAsString].שם_ישוב.trim())
            }
        } catch (err) {
            continue
        }
    }
    streetNames.sort(function (a, b) {
        if (a.indexOf(searchValue) <= b.indexOf(searchValue)) { return -1 }
        else return 1
    })
    let neighborhoods = []
    for (let i = 0; i < streetNames.length; i++) {
        if (streetNames[i].includes("שכ ")) {
            let neighborhoodName = streetNames.splice(i, 1)[0]
            neighborhoods.push(neighborhoodName)
        }
    }
    return { streetNames, neighborhoods }
}
module.exports = { searchCitySheet, searchStreetSheet, findCityStreets }