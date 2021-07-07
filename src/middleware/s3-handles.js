const AWS = require('aws-sdk');
const multer = require('multer')
const multerS3 = require('multer-s3')


const s3 = new AWS.S3({ region: process.env.AWS_REGION });
const bucket = process.env.S3_BUCKET
const fileStorage = multerS3({
    s3,
    acl: 'public-read',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    contentDisposition: "inline",
    bucket,
    metadata: (req, file, cb) => {
        cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
        const fileName = "images/" + req.user.email + "/" + new Date().getTime() + "-" + file.originalname
        cb(null, fileName)
    }
})

const uploadFilesToS3 = multer({ storage: fileStorage }).array("assetPictures");

const deleteFileFromS3 = async (req, res, next) => {
    const Key = req.query.key
    try {
        await s3.deleteObject({
            Key,
            Bucket: bucket
        }).promise()
        next();
    } catch (err) {
        res.status(404).send({
            message: "File not found"
        })
    }
}

module.exports = {
    uploadFilesToS3,
    deleteFileFromS3
}