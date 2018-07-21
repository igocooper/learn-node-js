const mongoose = require('mongoose');
const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;
const md5 = require('md5');
const mongoErrorHandler = require('mongoose-mongodb-errors');
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new Schema({
  email: {
    type: String,
    unique: true,
    trim: true,
    lowercase: true,
    validate: [validator.isEmail, 'Invalid Email Address'], // [ validattion function, error message ] 
    required: 'Please supply an email address'
  },
  name: {
    type: String,
    trim: true,
    required: 'Please supply a name'
  }
});

userSchame.plugin(passportLocalMongoose, {usernameField: 'email'});
userSchame.plugin(mongoErrorHandler); // to get prettier Errors from mongoDB

module.exports = mongoose.model('User', userSchema);
