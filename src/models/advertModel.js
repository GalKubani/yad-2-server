const mongoose = require('mongoose')

const advertSchema = new mongoose.Schema({
    assetType: { type: String, required: true },
    assetCondition: { type: String, required: true },
    assetCity: { type: String, required: true },
    assetStreet: { type: String, required: true },
    assetNeighborhood: { type: String, },
    assetHouseNumber: { type: Number },
    assetFloorNumber: { type: Number },
    assetEntrenceNumber: { type: Number },
    assetBuildingTotalFloors: { type: Number },
    assetTotalRooms: { type: Number, required: true },
    assetTotalParking: { type: Number, required: true },
    assetTotalPorchs: { type: Number, required: true },
    assetDetails: { type: String, default: "" },
    assetCharecteristics: [{
        type: String
    }],
    assetSize: { type: Number, required: true },
    assetBuiltSize: { type: Number },
    assetPrice: { type: Number },
    dateOfEntry: { type: String, required: true },
    assetPictures: [{
        type: String
    }],
    assetVideo: { type: String },
    contacts: [{
        contactName: { type: String, required: true },
        contactNumber: { type: Number, required: true },
    }],
    isAdvertActive: { type: Boolean, default: true },
    user: { type: mongoose.Schema.Types.ObjectId, require: true }
}, { timestamps: true });

const advert = mongoose.model('advert', advertSchema);
module.exports = advert