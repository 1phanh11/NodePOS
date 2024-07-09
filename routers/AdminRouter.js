const express = require('express')
const Router = express.Router()
const { validationResult } = require('express-validator')
const cookieJwt = require('../auth/CheckLogin');
const registerValidator = require('./validators/registerValidator')
const passwordValidator = require('./validators/confirmEmailValidation')
const productValidator = require('./validators/addproductValidator')
const editProductValidator = require('./validators/editproductValidator')
require('dotenv').config()
const { productImport, editProdust, adminGetListProduct, empGetListProduct, getProductByBarCode, deleteProduct } = require('../models/Products')
const { addCustomer, getCustomerByPhone, employeeGetListCustomer } = require('../models/Customer')
const {importTransactions, getAllTransactions, getTransactionByPhoneNumber, getTransactionByID} = require('../models/Transaction')
//mail send
const Employee = require('../models/EmployeeModel')
const EmployeeVerification = require('../models/EmployeeVerification')
const Account = require('../models/Accountmodel')
//xác định loại đường dẫn mở rộng vd: jpeg, png

const nodemailer = require('nodemailer')
const { v4: uuidv4 } = require('uuid')
const bcrypt = require('bcrypt')
//file handle
const multer = require('multer')
var fs = require('fs');
var path = require('path');


// const loginValidator = require('./validators/loginValidation')
// const registerValidator = require('./validators/registerValidator')

const jwt = require('jsonwebtoken')

// const bcrypt = require('bcrypt')



Router.get('/', (req, res) => {
  return res.redirect('/admin/dashboard')
})

Router.get('/dashboard', cookieJwt('admin'), async (req, res) => {
  let listEmployees = await getEmployeeList();
  res.locals.infoAdminForLayout = await getInfoAdmin();
  res.render('admin/dashboard', { listEmployees })
});

Router.get('/resend/:uid', cookieJwt('admin'), (req, res) => {
  let { uid } = req.params

  Employee.findOne({ _id: uid }).then(acc => {
    if (acc) {
      let { _id, email } = acc
      sendVerificationEmail({ _id, email }, res)
    } else {
      throw new Error('Không tìm thấy tài khoản')
    }
  })
    .then(() => {
      res.redirect('/admin/dashboard?status=resend&message="đã gửi lại thành công mail xác nhận"')
    })
    .catch(error => {
      return res.redirect(`/admin/dashboard?error=true&message=${error.message}`)
    })
})

Router.get('/profile', cookieJwt('admin'), async (req, res) => {


  res.locals.infoProfileAdmin = await getInfoAdmin()
  res.locals.infoAdminForLayout = await getInfoAdmin()


  res.render('admin/profile')
})

Router.get('/register', cookieJwt('admin'), async (req, res) => {
  const email = ''
  const fullname = ''
  res.locals.infoAdminForLayout = await getInfoAdmin()
  res.render('admin/register', { email, fullname })
})

Router.get('/lockEmployee/:uid', cookieJwt('admin'), (req, res) => {
  let { uid } = req.params
  Employee.findOneAndUpdate({ _id: uid }, { key: true }, { new: true }).then(updateE => {
    if (updateE) {
      return res.redirect('/admin/dashboard?status=lock&message="đã khóa nhân viên"')
    } else {
      throw new Error('Có lỗi trong quá trình cập nhật')
    }
  })
    .catch(error => {
      return res.redirect(`/admin/dashboard?error=true&message=${error.message}`)
    })
})


Router.get('/unlockEmployee/:uid', cookieJwt('admin'), (req, res) => {
  let { uid } = req.params
  Employee.findOneAndUpdate({ _id: uid }, { key: false }, { new: true }).then(updateE => {
    if (updateE) {
      return res.redirect('/admin/dashboard?status=unlock&message="đã mở khóa nhân viên"')
    } else {
      throw new Error('Có lỗi trong quá trình cập nhật')
    }
  })
    .catch(error => {
      return res.redirect(`/admin/dashboard?error=true&message=${error.message}`)
    })
})

Router.get('/employeeDetail/:uid', cookieJwt('admin'), async (req, res) => {
  let { uid } = req.params

  let employee = await Employee.findById({ _id: uid })
    .then(result => {
      return result
    })

  if (employee) {
    res.locals.infoAdminForLayout = await getInfoAdmin()
    res.render('admin/profileEmployee', { employeeInfo: employee })
  }

})

Router.get('/changePassword', cookieJwt('admin'), async (req, res) => {
  res.locals.infoAdminForLayout = await getInfoAdmin()
  res.render('admin/changePass', { password: '', confirmPassword: '' })
})

Router.post('/changePassword', cookieJwt('admin'), passwordValidator, async (req, res) => {
  let { password, confirmPassword } = req.body
  let admin = await getInfoAdmin()
  let result = validationResult(req)

  if (result.errors.length === 0) {
    bcrypt.hash(password, 10)
      .then(hashed => {
        Account.findOneAndUpdate({ _id: admin._id }, { password: hashed }, { new: true }).then(updateA => {
          if (updateA) {
            res.locals.infoAdminForLayout = admin
            res.render('admin/changePass', { success: 'Đổi mật khẩu thành công', password: '', confirmPassword: '' })
          } else {
            throw new Error('Có lỗi trong quá trình đổi mật khẩu')
          }
        })
          .catch(error => {
            return res.redirect(`/admin/dashboard?error=true&message=${error.message}`)
          })
      })

  } else {
    let messages = result.mapped()
    let message = ''
    for (m in messages) {
      message = messages[m]
      break
    }
    res.locals.infoAdminForLayout = admin
    res.status(401).render('admin/changePass', { code: 2, errorMessage: message.msg, password, confirmPassword })
  }
})

//xử lý upload ảnh bằng multer
var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/admin')
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now())
  }
});

var upload = multer({ storage: storage });

Router.post('/profile', upload.single('image'), (req, res, next) => {
  let imgInput = {
    data: fs.readFileSync(path.join(__dirname, '../public/uploads/admin/' + req.file.filename)),
    contentType: req.file.mimetype
  }
  Account.findOneAndUpdate({ _id: req.body.idAdmin }, { img: imgInput }, { new: true })
    .catch(error => {
      res.redirect(`/admin/profile?message=${error.message}`)
    })
  res.redirect('/admin/profile');
})

Router.get('/product', cookieJwt('admin'), async (req, res) => {
  res.locals.infoAdminForLayout = await getInfoAdmin()
  let listProduct = await adminGetListProduct()
  res.render('admin/product', { listProduct })
})

Router.get('/product/add', cookieJwt('admin'), async (req, res) => {
  res.locals.infoAdminForLayout = await getInfoAdmin()
  let { productBarcode, productName, productPriceImp, productPriceEx, productCategory } = ''
  res.render('admin/addProductForm', { productBarcode, productName, productPriceImp, productPriceEx, productCategory });
})

Router.post('/product/add', cookieJwt('admin'), productValidator, async (req, res) => {
  let result = validationResult(req)
  let admin = await getInfoAdmin()
  let { productBarcode, productName, productPriceImp, productPriceEx, productCategory } = req.body
  if (result.errors.length == 0) {

    productImport(productBarcode, productName, productPriceImp, productPriceEx, productCategory)
      .then(result => {
        let { productBarcode, productName, productPriceImp, productPriceEx, productCategory } = ''
        res.locals.infoAdminForLayout = admin
        res.render('admin/addProductForm', { code: 0, success: 'Đã thêm sản phẩm thành công', productBarcode, productName, productPriceImp, productPriceEx, productCategory })
      })
      .catch(error => {
        res.locals.infoAdminForLayout = admin
        res.status(401).render('admin/addProductForm', { code: 2, errorMessage: 'Mã sản phẩm đã tồn tại', productBarcode, productName, productPriceImp, productPriceEx, productCategory })
      })

    // res.redirect('/admin/product')
  } else {
    let messages = result.mapped()
    let message = ''
    for (m in messages) {
      message = messages[m]
      break
    }
    res.locals.infoAdminForLayout = admin
    res.status(401).render('admin/addProductForm', { code: 2, errorMessage: message.msg, productBarcode, productName, productPriceImp, productPriceEx, productCategory })

  }

})

Router.get('/product/edit/:barcode', cookieJwt('admin'), async (req, res) => {
  let { barcode } = req.params
  let product = await getProductByBarCode(barcode)
  res.locals.infoAdminForLayout = await getInfoAdmin()

  if(product){
    res.render('admin/editProductForm', { productBarcode: barcode, productName: product.Product, productPriceImp: product.ImPrice, productPriceEx: product.RePrice, productCategory: product.Catelogy })
  }else{
    return res.render('error', {layout: false})
  }
  // editProdust(barcode)

})

Router.post('/product/edit/:barcode', cookieJwt('admin'), editProductValidator, async (req, res) => {
  let { barcode } = req.params
  let admin = await getInfoAdmin()
  let { productBarcode, productName, productPriceImp, productPriceEx, productCategory } = req.body
  let result = validationResult(req)
  console.log(req.body);
  if (result.errors.length == 0) {
    let product = 
      {
        "Barcode": barcode,
        "Product": productName,
        "ImPrice": productPriceImp,
        "RePrice": productPriceEx,
        "Catelogy": productCategory,
      }

      editProdust(barcode, product).then(result => {
        if(result == 'Updated'){
          
          res.locals.infoAdminForLayout = admin
          res.render('admin/editProductForm', {success:'đã sửa sản phẩm thành công' , productBarcode: barcode, productName, productPriceImp, productPriceEx, productCategory })
        }
      }).catch(error => {
        res.render('admin/editProductForm', {errorMessage:'sửa sản phẩm thất bại' , productBarcode: barcode, productName, productPriceImp, productPriceEx, productCategory })
      })

    }else {
    let messages = result.mapped()
    let message = ''
    for (m in messages) {
      message = messages[m]
      break
    }
    res.locals.infoAdminForLayout = admin
    res.status(401).render('admin/editProductForm', { code: 2, errorMessage: message.msg, productBarcode: barcode, productName, productPriceImp, productPriceEx, productCategory })

  }
})

Router.get('/product/delete/:barcode', cookieJwt('admin'), async (req, res) =>{
  let { barcode } = req.params

  deleteProduct(barcode).then(result => {
    if(result == 'Deleted'){
      return res.redirect('/admin/product?status=deleted&message="Đã xóa sản phẩm thành công"')
    }
  }).catch(error => {
    return res.redirect('/admin/product?status=error&message="Sản phẩm đã tồn tại trong transaction"')
  })
})

Router.get('/customer', cookieJwt('admin'), async (req, res) =>{
  res.locals.infoAdminForLayout = await getInfoAdmin()
  let listCustomer = await employeeGetListCustomer()
  res.render('admin/customer', { listCustomer })
})

Router.get('/customer/transaction/:phone', cookieJwt('admin'), async (req,res) =>{
  let {phone} = req.params 
  res.locals.infoAdminForLayout = await getInfoAdmin()
  let listCustomerTrans = await getTransactionByPhoneNumber(phone)
  res.render('admin/customerTransaction', { listCustomerTrans })
})

Router.get('/customer/detailTransaction/:id', cookieJwt('admin'), async (req,res) => {
  let {id} = req.params
  res.locals.infoAdminForLayout = await getInfoAdmin()
  let detailOrder = await getTransactionByID(id);
  console.log(detailOrder);
  res.render('admin/detailOrder', {detailOrder})

})

//kiểm tra kết nối
// transport.verify((error, success) => {
//     if (error) {
//         console.log(error);
//     } else {
//         console.log('message ready');
//         console.log(success);
//     }
// })


Router.post('/register', registerValidator, (req, res) => {
  let result = validationResult(req)
  let { email, fullname } = req.body
  let name = email.split('@')[0]
  if (result.errors.length === 0) {
    let error = ''
    Employee.findOne({ email: email }).then( async acc => {
      if (acc) {
        error = "Email đã được dùng."
        res.locals.infoAdminForLayout = await getInfoAdmin()
        throw new Error(error)
      }
    })
      .then(async () => {
        let hash = await bcrypt.hash(name, 10)
        return hash
      })
      .then(hashed => {

        let user = new Employee({
          email: email,
          password: hashed,
          fullname: fullname,
          verified: false,
          key: false,
          img: {
            data: '',
            contentType: 'image/png',
          }
        })
        user.save()
          .then(result => {
            sendVerificationEmail(result, res)
          })
      }).then(async () => {
        res.locals.infoAdminForLayout = await getInfoAdmin()
        res.status(200).render('admin/register', { code: 0, email, fullname, success: 'Đăng ký tài khoản thành công và gửi mail' })

      }).catch(e => {
        res.status(401).render('admin/register', { code: 2, errorMessage: e.message, email, fullname })
      })

  } else {
    let messages = result.mapped()
    let message = ''
    for (m in messages) {
      message = messages[m]
      break
    }
    res.status(401).render('admin/register', { code: 2, errorMessage: message.msg, email, fullname })

  }
})

function htmlContent(currentUrl, userId, uniqueString) {
  let content = `
    <!doctype html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width" />
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <title>Simple Transactional Email</title>
        <style>
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;700&display=swap');

    img {
      border: none;
      -ms-interpolation-mode: bicubic;
      max-width: 100%;
    }

    body {
      background-color: #f6f6f6;
      font-family: 'Poppins', sans-serif;
      -webkit-font-smoothing: antialiased;
      font-size: 14px;
      line-height: 1.4;
      margin: 0;
      padding: 0;
      -ms-text-size-adjust: 100%;
      -webkit-text-size-adjust: 100%;
    }

    table {
      border-collapse: separate;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
      width: 100%;
    }

    table td {
      font-family: 'Poppins', sans-serif;
      font-size: 14px;
      vertical-align: top;
    }

    .body {
      background-color: #f6f6f6;
      width: 100%;
    }

    .container {
      display: block;
      Margin: 0 auto !important;
      max-width: 580px;
      padding: 10px;
      width: 580px;
    }

    .content {
      box-sizing: border-box;
      display: block;
      Margin: 0 auto;
      max-width: 580px;
      padding: 10px;
    }

    .main {
      background: #334d50;
      background: -webkit-linear-gradient(45deg, #cbcaa5, #acb6e5);
      background: linear-gradient(90deg, #cbcaa5, #acb6e5);
      ;
      border-radius: 6px;
      width: 100%;
    }

    .wrapper {
      box-sizing: border-box;
      padding: 20px;
    }

    .footer {
      clear: both;
      padding-top: 10px;
      text-align: center;
      width: 100%;
    }

    .footer td,
    .footer p,
    .footer span,
    .footer a {
      color: #999999;
      font-size: 12px;
      text-align: center;
    }

    h1,
    h2,
    h3,
    h4 {
      color: #000000;
      font-family: sans-serif;
      font-weight: 400;
      line-height: 1.4;
      margin: 0;
      Margin-bottom: 30px;
    }

    h1 {
      font-size: 35px;
      font-weight: 300;
      text-align: center;
      text-transform: capitalize;
    }

    p,
    ul,
    ol {
      font-family: sans-serif;
      font-size: 14px;
      font-weight: normal;
      margin: 0;
      Margin-bottom: 15px;
    }

    p li,
    ul li,
    ol li {
      list-style-position: inside;
      margin-left: 5px;
    }

    a {
      color: #3498db;
      text-decoration: underline;
    }

    .btn {
      box-sizing: border-box;
      width: 100%;
    }

    .btn>tbody>tr>td {
      padding-bottom: 15px;
    }

    .btn table {
      width: auto;
    }

    .btn table td {
      background-color: #ffffff;
      border-radius: 5px;
      text-align: center;
    }

    .btn a {
      background-color: #ffffff;
      border: solid 1px #3498db;
      border-radius: 5px;
      box-sizing: border-box;
      color: #3498db;
      cursor: pointer;
      display: inline-block;
      font-size: 14px;
      font-weight: bold;
      margin: 0;
      padding: 12px 25px;
      text-decoration: none;
      text-transform: capitalize;
    }

    .btn-primary table td {
      background-color: #3498db;
    }

    .btn-primary a {
      background-color: #3498db;
      border-color: #3498db;
      color: #ffffff;
    }

    .last {
      margin-bottom: 0;
    }

    .first {
      margin-top: 0;
    }

    .align-center {
      text-align: center;
    }

    .align-right {
      text-align: right;
    }

    .align-left {
      text-align: left;
    }

    .clear {
      clear: both;
    }

    .mt0 {
      margin-top: 0;
    }

    .mb0 {
      margin-bottom: 0;
    }

    .preheader {
      color: transparent;
      display: none;
      height: 0;
      max-height: 0;
      max-width: 0;
      opacity: 0;
      overflow: hidden;
      mso-hide: all;
      visibility: hidden;
      width: 0;
    }

    .powered-by a {
      text-decoration: none;
    }

    hr {
      border: 0;
      border-bottom: 1px solid #f6f6f6;
      Margin: 20px 0;
    }

    @media only screen and (max-width: 620px) {
      table[class=body] h1 {
        font-size: 28px !important;
        margin-bottom: 10px !important;
      }

      table[class=body] p,
      table[class=body] ul,
      table[class=body] ol,
      table[class=body] td,
      table[class=body] span,
      table[class=body] a {
        font-size: 16px !important;
      }

      table[class=body] .wrapper,
      table[class=body] .article {
        padding: 10px !important;
      }

      table[class=body] .content {
        padding: 0 !important;
      }

      table[class=body] .container {
        padding: 0 !important;
        width: 100% !important;
      }

      table[class=body] .main {
        border-left-width: 0 !important;
        border-radius: 0 !important;
        border-right-width: 0 !important;
      }

      table[class=body] .btn table {
        width: 100% !important;
      }

      table[class=body] .btn a {
        width: 100% !important;
      }

      table[class=body] .img-responsive {
        height: auto !important;
        max-width: 100% !important;
        width: auto !important;
      }
    }

    @media all {
      .ExternalClass {
        width: 100%;
      }

      .ExternalClass,
      .ExternalClass p,
      .ExternalClass span,
      .ExternalClass font,
      .ExternalClass td,
      .ExternalClass div {
        line-height: 100%;
      }

      .apple-link a {
        color: inherit !important;
        font-family: inherit !important;
        font-size: inherit !important;
        font-weight: inherit !important;
        line-height: inherit !important;
        text-decoration: none !important;
      }

      .btn-primary table td:hover {
        background-color: #34495e !important;
      }

      .btn-primary a:hover {
        background-color: #34495e !important;
        border-color: #34495e !important;
      }
    }
  </style>
      </head>
      <body class="">
        <table border="0" cellpadding="0" cellspacing="0" class="body">
          <tr>
            <td>&nbsp;</td>
            <td class="container">
              <div class="content">
                <span class="preheader">Subscribe to Coloured.com.ng mailing list</span>
                <table class="main">
    
                  <!-- START MAIN CONTENT AREA -->
                  <tr>
                    <td class="wrapper">
                      <table border="0" cellpadding="0" cellspacing="0">
                        <tr>
                          <td>
                            <h1>Confirm your email</h1>
                            <h2 align="center">You are just one step away</h2>
                            <table border="0" cellpadding="0" cellspacing="0" class="btn btn-primary">
                              <tbody>
                                <tr>
                                  <td align="center">
                                    <table border="0" cellpadding="0" cellspacing="0">
                                      <tbody>
                                        <tr>
                                          <td> <a href="${currentUrl}employee/verify/${userId}/${uniqueString}" target="_blank">confirm email</a> </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                            <p align="center">This link expires in 1 minutes</p>
          
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
    
                <!-- END MAIN CONTENT AREA -->
                </table>
    
              
              
              </div>
            </td>
            <td>&nbsp;</td>
          </tr>
        </table>
      </body>
    </html>
    `
  return content
}

function getEmployeeList() {
  let employeesList = Employee.find();
  return employeesList
}

function getInfoAdmin() {
  let infoAdmin = Account.find()
    .then(adminInfo => {
      return adminInfo[0]
    })
  return infoAdmin
}

//hàm gửi mail xác nhận kèm uniqueString
const sendVerificationEmail = ({ _id, email }, res) => {
  const currentUrl = "http://localhost:9090/";

  const uniqueString = uuidv4() + _id;

  const mailCustom = {
    from: process.env.AUTH_MAIL,
    to: email,
    subject: "Verify email",
    html: htmlContent(currentUrl, _id, uniqueString)

    // `<h1>Xác thực email của bạn để hoàn tất đăng ký tài khoản</h1>
    // <p>link có hiệu lực trong 1 phút</p>
    // <p>Ấn vào đây: <a href="${currentUrl}employee/verify/${_id}/${uniqueString}">Click here</a></p>
    // `
  }

  bcrypt.hash(uniqueString, 10)
    .then(hashed => {
      const newVerificate = new EmployeeVerification({
        eId: _id,
        uniqueString: hashed,
        createAt: Date.now(),
        expiresAt: Date.now() + 60000
      })
      newVerificate.save()
        .then(() => {
          transport.sendMail(mailCustom)
            .catch(error => {
              res.json({ status: 401, message: error.message })
            })
        })
        .catch(error => {
          res.json({ status: 401, message: error.message })
        })
    })
    .catch((e) => {
      res.json({ status: 401, message: e.message })
    })

}

//tạo kết nối gửi mail đến nhân viên
let transport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.AUTH_MAIL,
    pass: process.env.AUTH_PASS
  }
})


module.exports = Router