const express = require('express')
const Router = express.Router()
const { validationResult } = require('express-validator')
const cookieJwt = require('../auth/CheckLogin');
const loginValidator = require('./validators/loginValidation')
const registerValidator = require('./validators/registerValidator')

//mail send
const Employee = require('../models/EmployeeModel')
const EmployeeVerification = require('../models/EmployeeVerification')
const nodemailer = require('nodemailer')
const {v4: uuidv4} = require('uuid')


const jwt = require('jsonwebtoken')

const bcrypt = require('bcrypt')
const Account = require('../models/Accountmodel')

Router.get('/', (req, res) => {
    return res.redirect('/accounts/login')
});

Router.get('/login',(req, res) => {
    let cookie = req.cookies.token;
    if(cookie){
        //kiểm tra role và điều hướng admin và staff
        try{
            jwt.verify(cookie, process.env.JWT_SECRET, (error, decodeToken) => {
                const role = decodeToken.role;
                if(role == 'staff'){
                    res.redirect('/employee/profile')
                }else{
                    res.redirect('/admin/dashboard')
                }
            })
        }catch(err){
            return res.redirect('/accounts/login')
        }
    }else{
        const password = ''
        const fullname = ''
        res.render('login', { fullname, password, layout: false });
    }
    
})

Router.post('/login', loginValidator, (req, res) => {
    let result = validationResult(req)

    let error = '';
    if (result.errors.length === 0) {

        let { fullname, password } = req.body
        let mail = `${fullname}@gmail.com`
        let account = undefined
        Employee.findOne({ email: mail }).then(acc => {
            
            if (!acc) {
                error = 'Tài khoản không tồn tại'
                throw new Error(error)
                // res.status(401).render('login', { errorMessage: error, fullname, password, layout: false })
            }
            if(!acc.verified){
                error = 'Tài khoản chưa xác nhận thông qua email.'
                throw new Error(error)
            }
            if(acc.key){
                error = 'Tài khoản đã bị admin khóa'
                throw new Error(error)
            }
            account = acc
            return bcrypt.compare(password, acc.password)
        })
            .then(match => {
                if (!match) {
                    error = 'mật khẩu không đúng'
                    throw new Error(error)
                    // res.status(401).render('login', { code: 2, errorMessage: 'Mật khẩu không đúng.', fullname, password, layout: false })
                }

                const { JWT_SECRET } = process.env

                jwt.sign({
                    id: account.id,
                    email: account.email,
                    fullname: account.fullname,
                    role: 'staff'
                }, JWT_SECRET, {
                    expiresIn: '5h'
                }, (err, token) => {
                    if (err) throw err
                    res.cookie('token', token, {
                        httpOnly: true
                    })
                    return res.redirect('/employee/profile')
                })
            })
            .catch(e => {
                res.status(401).render('login',{ code: 2, errorMessage: e.message, fullname, password, layout: false})
            })
    } else {
        //Kiểm tra admin
        const specificErrorValue = result.array().find(error => error.msg === 'admin');
        if (specificErrorValue) {
            let { fullname, password } = req.body
            let mail = `${fullname}@gmail.com`
            let error = ''
            if (!password) {
                error = 'Vui lòng nhập mật khẩu'
                
                res.status(401).render('login',{ code: 0, errorMessage: error, fullname, password, layout: false})
            } else {
                Account.findOne({ email: mail }).then(acc => {
                    return bcrypt.compare(password, acc.password)
                })
                    .then(match => {
                        if (!match) {
                            error = 'Tài khoản không tồn tại'
                            throw new Error(error)
                            // res.status(401).render('login', { code: 2, errorMessage: 'Mật khẩu không đúng.', fullname, password, layout: false })
                        }
                        const { JWT_SECRET } = process.env

                        jwt.sign({
                            email: process.env.ADMIN_EMAIL,
                            role: 'admin',
                            fullname: fullname
                        }, JWT_SECRET, {
                            expiresIn: '1h'
                        }, (err, token) => {
                            if (err) throw err
                            res.cookie('token', token, {
                                httpOnly: true
                            })
                            return res.redirect('/admin/dashboard')
                        })
                    })
                    .catch(e => {
                        res.status(401).render('login',{ code: 2, errorMessage: e.message, fullname, password, layout: false})
                    })
            }
        } else {
            let { fullname, password } = req.body
            let messages = result.mapped()
            let message = ''
            for (m in messages) {
                message = messages[m]
                break
            }
            res.status(401).render('login', { errorMessage: message.msg, fullname, password, layout: false })
        }

    }
})



Router.get('/logout', function (req, res) {
    let token = req.cookies.token
    if (!token) {
        return res.redirect('/accounts')
    }
    res.clearCookie('token');
    res.redirect('/');
});

module.exports = Router