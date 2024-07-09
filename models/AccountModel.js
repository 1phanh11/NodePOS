const mongoose = require('mongoose')
const Schema = mongoose.Schema

const AccountSchema = new Schema({
    email:{
        type: 'string',
        unique: true
    },
    password: String,
    fullname: String,
    img:
    {
        data: Buffer,
        contentType: String
    },
    
})

module.exports = mongoose.model('Account', AccountSchema)