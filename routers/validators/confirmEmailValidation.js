const {check} = require('express-validator')

   

module.exports = [
    check('password')
    .exists().withMessage('Vui lòng nhập mật khẩu')
    .notEmpty().withMessage('Mật khẩu bị trống, vui lòng nhập')
    .isLength({min: 6}).withMessage('Mật khẩu phải lớn hơn hoặc bằng 6 kí tự'),

    check('confirmPassword')
    .exists().withMessage('Vui lòng nhập mật khẩu xác nhận')
    .notEmpty().withMessage('Mật khẩu xác nhận trống, vui lòng nhập')
    .isLength({min: 6}).withMessage('Mật khẩu xác nhận phải lớn hơn hoặc bằng 6 kí tự')
    .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Mật khẩu xác nhận không trùng khớp với mật khẩu');
        }
        return true;
      })

]