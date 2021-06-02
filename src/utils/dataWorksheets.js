const XLSX = require('xlsx')
let cityWorkbook = XLSX.readFile('../../../parsedtable.csv', { type: "file" })
let streetWorkbook = XLSX.readFile('../../../parsedstreettable.csv', { type: "file" })
let cityWorksheets = {}, streetWorksheets = {}
for (const sheetName of cityWorkbook.SheetNames) {
    cityWorksheets[sheetName] = XLSX.utils.sheet_to_json(cityWorkbook.Sheets[sheetName])
}
const cityWorkSheet = cityWorksheets.Sheet1
for (const sheetName of streetWorkbook.SheetNames) {
    streetWorksheets[sheetName] = XLSX.utils.sheet_to_json(streetWorkbook.Sheets[sheetName])
}
const streetWorkSheet = streetWorksheets.Sheet1

module.exports = { cityWorkSheet, streetWorkSheet }