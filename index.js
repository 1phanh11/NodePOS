const express = require('express')
require('dotenv').config()
const app = express()
const serverless = require('serverless-http')
const layoutExpress = require('express-ejs-layouts')
const mongoose = require('mongoose')
const mongodb = require('mongodb')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const { rateLimit } = require('express-rate-limit')
const path = require('path')
const bodyParser = require('body-parser');
const AccountRouter = require('./routers/AccountRouter')
const ProductRouter = require('./routers/ProductRouter')
const OrderRouter = require('./routers/OrderRouter')
const AdminRouter = require('./routers/AdminRouter')
const EmployeeRouter = require('./routers/EmployeeRouter')
app.use(express.urlencoded({extended: false}))
app.use(cookieParser())
app.use(layoutExpress)
app.use(bodyParser.json())
app.set('layout', './layouts/layout')
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json())
app.set('view engine', 'ejs')
app.get('/', (req, res) =>{
    
    res.redirect('/accounts/login')
})

// const limiter = rateLimit({
// 	windowMs: 10 * 1000, 
// 	limit: 2, 
// 	standardHeaders: 'draft-7', 
// 	legacyHeaders: false, 
//     message: 'Không thể tải quá nhiều request'
// })


// app.use(limiter)
app.use('/products', ProductRouter)
app.use('/accounts', AccountRouter)
app.use('/orders', OrderRouter)
app.use('/admin', AdminRouter)
app.use('/employee', EmployeeRouter)
app.use((req, res) => {
    res.status(404).render('error', {layout: false}); 
});

app.use(cors())

app.use('/.netlify/functions/api', app._router)
module.exports.handler = serverless(app)

mongoose.connect(`mongodb+srv://phanh:test123@cluster0.gq0r5y5.mongodb.net/Final`,{
    useNewUrlParser: true,
    useUnifiedTopology: true
},
).then(() =>{
    const port = process.env.PORT || 8080

    app.listen(port, ()=>{
        console.log(`http://localhost:${port}`);
    })
}).catch(e =>{console.log('Không thể kết nối đến db ' + e.message)})







