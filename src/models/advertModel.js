const mongoose = require('mongoose')

const advertSchema = new mongoose.Schema({
    assetType: { type: String, required: true },
    assetCondition: { type: String, required: true },
    assetCity: { type: String, required: true },
    assetStreet: { type: String, required: true },
    assetHouseNumber: { type: Number },
    assetFloorNumber: { type: Number },
    assetEntrenceNumber: { type: Number },
    assetBuildingTotalFloors: { type: Number },
    // might nn to add how many floors are total in case of an apartment
    // might need to add neighborhood and region, will get back to this
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
        type: Buffer
    }],
    assetVideo: { type: Buffer },
    contacts: [{
        contactName: { type: String, required: true },
        contactNumber: { type: Number, required: true },
    }],
    isAdvertActive: { type: Boolean, default: true },
    user: { type: mongoose.Schema.Types.ObjectId, require: true }
}, { timestamps: true });

const advert = mongoose.model('advert', advertSchema);
module.exports = advert