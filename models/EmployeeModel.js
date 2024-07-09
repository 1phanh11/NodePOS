const mongoose = require('mongoose')
const Schema = mongoose.Schema

const EmployeeSchema = new Schema({
    email:{
        type: 'string',
        unique: true
    },
    password: String,
    fullname: String, 
    verified: Boolean,
    key: Boolean,
    img:
    {
        data: Buffer,
        contentType: String
    }
})

module.exports = mongoose.model('Employee', EmployeeSchema)