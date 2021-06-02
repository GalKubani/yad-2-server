const mongoose = require('mongoose')

const regionSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    cities: [{
        name: { type: String, required: true, trim: true },
        regions: [{
            regionName: { type: String, required: true, trim: true }
        }]
    }],
});

const region = mongoose.model('region', regionSchema);
module.exports = region