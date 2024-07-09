const { check } = require('express-validator')
const validateProductCategory = (value) => {
    return value === 'Phone' || value === 'Gear';
};
module.exports = [

    check('productBarcode')
        .exists().withMessage('Vui lòng nhập mã sản phẩm')
        .notEmpty().withMessage('Mã sản phẩm trống')
        
    ,

    check('productName')
        .exists().withMessage('Vui lòng nhập tên sản phẩm')
        .notEmpty().withMessage('Tên sản phẩm trống')

    ,
    check('productPriceImp')
        .exists('Vui lòng nhập giá nhập hàng sản phẩm')
        .notEmpty().withMessage('Giá nhập hàng sản phẩm không được trống')
        .isNumeric().withMessage('Giá nhập hàng sản phẩm phải là kiểu số'),

    check('productPriceEx')
        .exists('Vui lòng nhập giá bán sản phẩm')
        .notEmpty().withMessage('Giá bán sản phẩm không được trống')
        .isNumeric().withMessage('Giá bán sản phẩm phải là kiểu số')
        .custom((value, { req }) => {
            if (value <= req.body.productPriceImp) {
              throw new Error('Giá bán phải cao hơn giá nhập');
            }
            return true;
          })
        ,

    check('productCategory')
        .exists().withMessage('Vui lòng nhập loại sản phẩm')
        .notEmpty().withMessage('loại sản phẩm không được trống')
        .custom(validateProductCategory).withMessage('Loại sản phẩm phải là "Phone" hoặc "Gear"')
]