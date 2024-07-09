const {check} = require('express-validator')
require('dotenv').config()
module.exports = [
    check('fullname')
    .custom(value => {
        if (value == process.env.ADMIN) {
            throw new Error('admin')
        }else{
            return true
        }
    }).exists().withMessage('Vui lòng nhập tên đăng nhập')
    .notEmpty().withMessage('Tên đăng nhập trống.')

    ,
    check('password')
    .exists('Vui lòng nhập mật khẩu')
    .notEmpty().withMessage('Mất khẩu trống, vui lòng nhập')
    .isLength({min: 6}).withMessage('Mật khẩu phải lớn hơn hoặc bằng 6 kí tự'),

]