const express = require('express')
const Router = express.Router()

const {validationResult} = require('express-validator')

const productValidator = require('./validators/addproductValidator')

const CheckLogin = require('../auth/CheckLogin')

Router.get('/', (req, res) =>{
    Product.find()
    .then((products) =>{
        if(products.length === 0){
            return res.json({code: 1, message: 'Danh sách sản phẩm trống'})
        }
        return res.json({code: 0, message: 'Đọc sản phẩm thành công',data: products})
    }).catch(e => {
        return res.json({code: 2, message: 'Đọc sản phẩm thất bại ' + e.message})
    })
});

Router.post('/', CheckLogin, productValidator, (req, res) =>{
    let result = validationResult(req)

    if(result.errors.length === 0){

        let {name,  price, description} = req.body

        let product = new Product({name, price, description})
        
        product.save()
        .then(() => {
            return res.json({code:0, message:'Thêm sản phẩm thành công'})
        }).catch(() => {
            return res.json({code: 2, message: 'Thêm sản phẩm thất bại'})
        })

    }else{
        let messages = result.mapped()
        let message = ''
        for(m in messages){
            message = messages[m]
            break
        }
        return res.json({code:0, message: message})
    }
})

Router.delete('/:id', CheckLogin ,(req, res) =>{
    let {id} = req.params
    if(!id){
        return res.json({code: 1, message: 'Không có thông tin sản phẩm'})
    }
    Product.findByIdAndDelete(id)
    .then(p => {
        if(p){
            return res.json({code: 0, message: 'Đã tìm thấy và xóa sản phẩm'})
        }
        else{
            return res.json({code: 2, message: 'Không tìm thấy sản phẩm'})
        }
    }).catch(e => {
        if(e.message.includes('Cast to ObjectId failed')){
            return res.json({code: 3, message: 'Mã sản phẩm không hợp lệ'})
        }
        return res.json({code: 3, message:e.message})
    })
})

Router.get('/:id', (req, res) => {
    let {id} = req.params
    if(!id){
        return res.json({code: 1, message: 'Không có thông tin sản phẩm'})
    }
    Product.findById(id)
    .then(p => {
        if(p){
            return res.json({code: 0, message: 'Đã tìm thấy sản phẩm', data: p})
        }
        else{
            return res.json({code: 2, message: 'Không tìm thấy sản phẩm'})
        }
    }).catch(e => {
        if(e.message.includes('Cast to ObjectId failed')){
            return res.json({code: 3, message: 'Mã sản phẩm không hợp lệ'})
        }
        return res.json({code: 3, message:e.message})
    })
})

Router.put('/:id', (req, res) => {
    let {id} = req.params
    if(!id){
        return res.json({code: 1, message: 'Không có thông tin sản phẩm'})
    }

    let supportFields = ['name', 'price', 'desc']
    let updateData = req.body
    if(!updateData){
        return res.json({code: 2, message: 'Không có dữ liệu cập nhật'})
    }

    for (field in updateData){
        if(!supportFields.includes(field)){
            delete updateData[field]
        }
    }

    Product.findByIdAndUpdate(id, updateData, {new: true})
    .then(p => {
        if(p){
            return res.json({code: 0, message: 'Đã tìm thấy sản phẩm và cập nhật', data: p})
        }
        else{
            return res.json({code: 2, message: 'Không tìm thấy sản phẩm'})
        }
    }).catch(e => {
        if(e.message.includes('Cast to ObjectId failed')){
            return res.json({code: 3, message: 'Mã sản phẩm không hợp lệ'})
        }
        return res.json({code: 3, message:e.message})
    })
})

module.exports = Router