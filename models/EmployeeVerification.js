const mongoose = require('mongoose')
const Schema = mongoose.Schema

const EmployeeVerificationSchema = new Schema({
    eId: String,
    uniqueString: String,
    createAt: Date,
    expiresAt: Date
})

module.exports = mongoose.model('EmployeeVerification', EmployeeVerificationSchema)