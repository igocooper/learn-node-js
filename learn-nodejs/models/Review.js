const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const ReviewSchema = new mongoose.Schema({
    created : {
      type: Date,
      default: Date.now()
    },
    author : {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: 'Please suupply an author!'
    },
    store: {
      type: mongoose.Schema.ObjectId,
      ref: 'Store',
      required: 'Please suupply a store!'
    }, 
    text: {
      type: String,
      required: 'Your review must have text',
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    }
});

module.exports = mongoose.model('Review', ReviewSchema);