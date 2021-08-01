const parseToTokenArray = (tokens) => {
    let tokensArray = []
    let tokensString = tokens
    if (tokensString) {
        while (tokensString.includes(",")) {
            let currentCommaIndex = tokensString.indexOf(",")
            tokensArray.push(tokensString.slice(0, currentCommaIndex))
            tokensString = tokensString.slice(currentCommaIndex + 1)
        }
        tokensArray.push(tokensString)
    }
    return tokensArray
}
const parseArrayToString = (tokens) => {
    let tokensString = ''
    for (let token of tokens) { tokensString += token + ',' }
    return tokensString.slice(0, tokensString.length - 1)
}
const parseAdvert = (advert) => {
    let parsedAdvert = { ...advert }
    delete parsedAdvert.assetPictures
    delete parsedAdvert.assetCharecteristics
    delete parsedAdvert.mainContact
    delete parsedAdvert.mainContactPhone
    delete parsedAdvert.secondContact
    delete parsedAdvert.secondContactPhone
    delete parsedAdvert.ID
    delete parsedAdvert.updated_at
    parsedAdvert.updatedAt = advert.updated_at
    parsedAdvert._id = advert.ID
    parsedAdvert.contacts = [{ contactName: advert.mainContact, contactNumber: advert.mainContactPhone }]
    if (advert.secondContact) {
        parsedAdvert.contact.push({ contactName: advert.secondContact, contactNumber: advert.secondContactPhone })
    }
    parsedAdvert.assetCharecteristics = parseToTokenArray(advert.assetCharecteristics)
    if (advert.assetPictures) {
        if (advert.assetPictures[0] === ",") {
            parsedAdvert.assetPictures = parseToTokenArray(advert.assetPictures.slice(1))
        }
        else { parsedAdvert.assetPictures = parseToTokenArray(advert.assetPictures) }
    }
    else { parsedAdvert.assetPictures = [] }
    return (parsedAdvert)
}
module.exports = { parseToTokenArray, parseArrayToString, parseAdvert }