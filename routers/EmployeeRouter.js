const express = require('express')
const Router = express.Router()
const easyinvoice = require('easyinvoice')

const { validationResult } = require('express-validator')
const confirmValidator = require('./validators/confirmEmailValidation')
const { v4: uuidv4 } = require('uuid')

const Employee = require('../models/EmployeeModel')
const EmployeeVerification = require('../models/EmployeeVerification')
const {empGetListProduct} = require('../models/Products')
const {employeeGetListCustomer} = require('../models/Customer')
const {importTransactions, getAllTransactions, getTransactionByPhoneNumber} = require('../models/Transaction')
const jwt = require('jsonwebtoken')
const cookieJwt = require('../auth/CheckLogin');
const bcrypt = require('bcrypt')
const multer = require('multer')
let fs = require('fs');
let path = require('path');


Router.get('/', (req, res) => {
    return res.redirect('/employee/profile')
})

// Router.get('/dashboard', cookieJwt('staff'), (req, res) => {
//     res.render('employee/dashboard', {layout: 'layouts/layoutE'})
// });

//xử lý upload ảnh bằng multer
var storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/staff')
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now())
    }
});

var upload = multer({ storage: storage });


Router.post('/profile', upload.single('image'), async (req, res) => {
    let employee = await getEmployee(req.cookies.token)
    let imgInput = {
        data: fs.readFileSync(path.join(__dirname, '../public/uploads/staff/' + req.file.filename)),
        contentType: req.file.mimetype
    }
    Employee.findOneAndUpdate({ _id: employee.id }, { img: imgInput }, { new: true })
        .catch(error => {
            res.redirect(`/employee/profile?message=${error.message}`)
        })
    res.redirect('/employee/profile');
})

Router.get('/profile', cookieJwt('staff'), async (req, res) => {
    let employee = await getEmployee(req.cookies.token);
    res.locals.infoEmployeeLayout = employee

    res.render('employee/profile', { employeeInfo: employee, layout: 'layouts/layoutE' })
})

Router.get('/changePassword/:uid', cookieJwt('staff'), async (req, res) => {
    let employee = await getEmployee(req.cookies.token);
    res.locals.infoEmployeeLayout = employee
    res.render('employee/changePass', { password: '', confirmPassword: '', layout: 'layouts/layoutE' })
})

Router.post('/changePassword/:uid', cookieJwt('staff'), confirmValidator, async (req, res) => {
    let { password, confirmPassword } = req.body
    let { uid } = req.params
    let employee = await getEmployeeId(uid);
    let result = validationResult(req)
    if (result.errors.length === 0) {
        bcrypt.hash(password, 10)
            .then(hashed => {
                Employee.findOneAndUpdate({ _id: employee._id }, { password: hashed }, { new: true }).then(updateE => {
                    if (updateE) {
                        res.locals.infoEmployeeLayout = employee
                        res.render('employee/changePass', { success: 'Đổi mật khẩu thành công', password: '', confirmPassword: '',layout: 'layouts/layoutE' })
                    } else {
                        throw new Error('Có lỗi trong quá trình đổi mật khẩu')
                    }
                })
                    .catch(error => {
                        return res.redirect(`/employee/dashboard?error=true&message=${error.message}`)
                    })
            })

    } else {
        let messages = result.mapped()
        let message = ''
        for (m in messages) {
            message = messages[m]
            break
        }
        res.locals.infoEmployeeLayout = employee
        res.status(401).render('employee/changePass', { code: 2, errorMessage: message.msg, password, confirmPassword, layout: 'layouts/layoutE'})
    }
})

Router.post('/verify/:uId/:uniqueStringUser', confirmValidator, (req, res) => {

    let result = validationResult(req)
    let { password, confirmPassword } = req.body
    let { uId, uniqueStringUser } = req.params
    if (result.errors.length === 0) {
        bcrypt.hash(password, 10)
            .then(hashed => {
                Employee.findByIdAndUpdate({ _id: uId }, { password: hashed, verified: true }, { new: true })
                    .then(updateUser => {
                        if (updateUser) {
                            res.render('employee/verify/successVerify', { layout: false })
                        } else {
                            throw new Error('Có lỗi xảy ra trong quá trình xác nhận')
                        }
                    }).then(() => {
                        EmployeeVerification.findOneAndDelete({ eId: uId })
                            .catch(error => {
                                res.status(401).render('employee/verify/employeeConfirm', { code: 2, errorMessage: error.message, password, confirmPassword, layout: false })
                            })
                    })
                    .catch(error => {
                        res.status(401).render('employee/verify/employeeConfirm', { code: 2, errorMessage: error.message, password, confirmPassword, layout: false })
                    })
            })
            .catch(error => {
                res.status(401).render('employee/verify/employeeConfirm', { code: 2, errorMessage: error.message, password, confirmPassword, layout: false })
            })

    } else {
        let messages = result.mapped()
        let message = ''
        for (m in messages) {
            message = messages[m]
            break
        }
        res.status(401).render('employee/verify/employeeConfirm', { code: 2, errorMessage: message.msg, password, confirmPassword, layout: false })
    }
}
)

Router.get('/verify/:uId/:uniqueStringUser', (req, res) => {
    let { uId, uniqueStringUser } = req.params
    EmployeeVerification.find({ eId: uId }).then((result) => {
        if (result.length > 0) {
            const { expiresAt } = result[0]

            //check expires
            if (expiresAt < Date.now()) {
                EmployeeVerification.deleteOne({ eId: uId })
                    .then(() => {
                        //link hết hạn xóa phần mail verification
                        res.render('employee/verify/expireLink', { errorMessage: 'Đường dẫn đã hết hạn', layout: false })
                    })
                    .catch(() => {
                        throw new Error('error when remove expires link verification')
                    })
            } else {
                bcrypt.compare(uniqueStringUser, result[0].uniqueString)
                    .then(result => {
                        if (result) {
                            res.render('employee/verify/employeeConfirm', { password: '', confirmPassword: '', layout: false })
                        } else {
                            throw new Error('Có lỗi trong quá trình xác thực')
                        }
                    })
                    .catch((error) => {
                        res.render('employee/verify/expireLink', { errorMessage: error.message, layout: false })
                    })
            }
        } else {
            throw new Error('Tài khoản đã được xác thực trước đó hoặc có lỗi')
        }
    })
        .catch((error) => {
            res.render('employee/verify/expireLink', { errorMessage: error.message, layout: false })
            // res.redirect(`/employee/verify/error=true&message=${error.message}`)
        })

})

Router.get('/product', cookieJwt('staff'), async (req, res) => {
    let listProduct = await empGetListProduct()
    res.locals.infoEmployeeLayout = await getEmployee(req.cookies.token);
    res.render('employee/product', {listProduct, layout: 'layouts/layoutE'})
})

Router.get('/transaction', cookieJwt('staff'), async (req, res) => {
    let employee = await getEmployee(req.cookies.token);
    res.locals.infoEmployeeLayout = employee
    res.render('employee/transaction', {layout: 'layouts/layoutE'})
})


Router.post('/transaction', cookieJwt('staff'), (req, res) => {
    importTransactions(req.body)
    .then(result => {
        if(result == 'Successfully imported'){
            res.json({success: 'Successfully imported'})
        }
    }).catch(error => {
        res.json({err: 'fail imported'})
    })
})

Router.post('/transactionOder', cookieJwt('staff'), async (req, res) => {
    const result = await easyinvoice.createInvoice(req.body);
    let date = req.body['information']
    let cusName = req.body['client']["company"]
    console.log(date["date"]);
    await fs.writeFileSync(path.join(__dirname, '../public/uploads/staff/invoice/' + `${uuidv4()}-${date["date"]}-${cusName}.pdf`), result.pdf, 'base64');
    res.json({success: 'ok'})
})



Router.get('/dataTransaction', cookieJwt('staff'), async (req, res) =>{
    try {
        const data = await empGetListProduct(); // Lấy dữ liệu từ MongoDB
        res.json(data); // Trả về dữ liệu dưới dạng JSON
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})


Router.get('/dataCustomer', cookieJwt('staff'), async (req, res) =>{
    try {
        const data = await employeeGetListCustomer(); // LLấy dữ liệu từ MongoDB
        res.json(data); // Trả về dữ liệu dưới dạng JSON
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

function getEmployee(cookieToken) {
    const token = cookieToken;
    let objToken;

    try {
        jwt.verify(token, process.env.JWT_SECRET, async (error, decodeToken) => {
            if (decodeToken) {
                objToken = decodeToken
            }
        })
    } catch (error) {
        console.log(error.message);
    }

    let employee = Employee.findById({ _id: objToken.id })
        .then(result => {
            return result
        })

    return employee
}

function getEmployeeId(id) {
    let infoEmploy = Employee.findById({ _id: id })
        .then(employee => {
            return employee
        })
    return infoEmploy
}

module.exports = Router