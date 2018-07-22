const mongoose = require('mongoose');
const User = mongoose.model('User');
const uuid = require('uuid');
const promisify = require('es6-promisify');


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

exports.register = async (req, res, next) => {
    const user = new User({
        email: req.body.email,
        name: req.body.name
    });

    // promisifying User.register fn from passport-mongoose-local plugin 
    // applied to out User schema, which is callback based
    // fn promisify(method, context to Bind to)
    const register = promisify(User.register, User); 
    // now we can await it instead of User.register(user, req.body.password, function(){
        // and write out code here  which might be an issue when it's nested
    //});

    await register(user, req.body.password);
    next();
};

exports.account = (req, res) => {
    res.render('account', {
        title: 'Account'
    });
};

exports.updateAccount = async (req, res) => {
    const updates = {
        name: req.body.name,
        email: req.body.email
    };

    const user = await User.findOneAndUpdate(
      {_id: req.user._id},
      {$set: updates},
      {new: true, runValidators: true, context: 'query'}  
    );

    req.flash('success', 'Updated profile!');
    res.redirect('back');
}