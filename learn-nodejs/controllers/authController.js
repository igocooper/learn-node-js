const passport = require('passport');
const crypto = require('crypto');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');

exports.login = passport.authenticate('local', {
  failureRedirect: '/login',
  failureFlash: 'Failed Login!',
  successRedirect: '/',
  successFlash: 'You are now logged in!' 
});

exports.logout = (req, res) => {
  req.logout();
  req.flash('success', 'You are now logged out 👋');
  res.redirect('/');
}

exports.isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
    return;
  }

  req.flash('error', 'Oops 💩. You must login');
  res.redirect('/login');
};

exports.forgot = async (req, res) => {
  // 1. See if user with that email exists
  
  const user = await User.findOne({
    email: req.body.email
  });
  
  if(!user) {
    req.flash('error', 'No account with that email exists');
    res.redirect('/login');
  }
  // 2. Set reset tokens and expiryon their account
  user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
  user.resetPasswordExpires = Date.now() + (1000 * 60 * 60) // 1 hour
  await user.save();

  // 3. Send them an email with the Token
  const resetURL = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`
  req.flash('success', 'You have been emailed password reset link.' + '' + resetURL);
  // 4. redirect to Login page
  res.redirect('/login');
  

};

exports.reset = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: {$gt: Date.now()}
  });
  if(!user) {
    req.flash('error', 'Password reset token is invalid or has expired!');
    res.redirect('/login');
  }
  // if there is a user show reset password form
  res.render('reset', {
    title: 'Reset your Password'
  });
};

exports.confirmedPasswords = (req, res, next) => {
  if (req.body.password === req.body['password-confirm']) {
    next();
    return;
  }

  req.flash('error', 'Passwords do not matches');
  res.redirect('back');

};

exports.update = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: {$gt: Date.now()}
  });

  if(!user) {
    req.flash('error', 'Password reset token is invalid or has expired!');
    res.redirect('/login');
  }

  const setPassword = promisify( user.setPassword, user);
  await setPassword(req.body.password);

  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  const updatedUser = await user.save();
  // login with updated user
  await req.login(updatedUser);

  req.flash('success', 'Nice your password has been succesfully reset. You are now loged in!');
  res.redirect('/');

};