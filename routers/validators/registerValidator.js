const {check} = require('express-validator')

   

module.exports = [
    check('email')
    .exists().withMessage('Vui lòng nhập email')
    .notEmpty().withMessage('Email bị trống, vui lòng nhập')
    .isEmail().withMessage('Email sai định dạng'),

    check('fullname')
    .exists().withMessage('Vui lòng nhập tên')
    .notEmpty().withMessage('Tên trống, vui lòng nhập')
    .isLength({min:6}).withMessage('Tên ngắn hơn 6 kí tự')

]