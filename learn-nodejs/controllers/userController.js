const mongoose = require('mongoose');
// const User = mongoose.model('User');
const uuid = require('uuid');


exports.loginForm = (req, res) => {
    
    res.render('login', {
        title: 'Login'
    });
}

exports.registerForm = (req, res) => {

    res.render('register', {
        title: 'Register'
    });
}

exports.validaterRegister = (req, res, next) => {
    req.sanitizeBody('name'); // we are having it from middleware express-validator
    req.checkBody('name', 'Please supply a name').notEmpty();
    req.checkBody('email', 'Please supply an email').notEmpty();
    req.checkBody('email', 'That email is not valid').isEmail();
    req.sanitizeBody('email').normalizeEmail({
        remove_dots: false,
        remove_extension: false,
        gmail_remove_subaddress: false
    });
    req.checkBody('password', 'Password cannot be Blank!').notEmpty();
    req.checkBody('password-confirm', 'Confirmation Password cannot be Blank!').notEmpty();
    req.checkBody('password-confirm', 'Ooops, your Confirmation Password does not match your Password').equals(req.body.password);
    
    const errors = req.validationErrors();

    if (errors) {
        req.flash('error', errors.map(error => error.msg));
        res.render('register', {
            title: 'Register',
            body: req.body,
            flashes: req.flash()
        });
        return 
    }
    next();
};
