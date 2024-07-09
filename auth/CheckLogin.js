const jwt = require('jsonwebtoken');

module.exports = (requireRole) => {
    return(req, res, next) => {
        const token = req.cookies.token;
        try{
            
            jwt.verify(token, process.env.JWT_SECRET, (error, decodeToken) => {
                const role = decodeToken.role;
                if(role !== requireRole){
                    res.render('employee/verify/expireLink', {errorMessage: "không có quyền đăng nhập", layout: false})
                }
                req.user = decodeToken
                next();
            })
            
        }catch(err){
            res.clearCookie("token");
            console.log(err.message);
            return res.redirect('/accounts')
        }
    }
}
