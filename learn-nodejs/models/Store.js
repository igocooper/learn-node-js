const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const slug = require('slugs');

const storeSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: 'Please enter a store name' // you can set it's value to default error message instead of bolean true
    },
    slug: String,
    description: {
        type: String,
        trim: true
    },
    tags: [String],
    created: {
        type: Date,
        default: Date.now
    },
    location: {
        type: {
            type: String,
            default: 'Point'
        },
        coordinates: [{
            type: Number,
            required: 'You must supply coordinates!'
        }],
        address: {
            type: String,
            required: 'You must supply an address!'
        }
    }
});

// auto generate slug before save

storeSchema.pre('save', function(next) {
    if(!this.isModified('name')) {
        next(); //skip it
        return;
    }
    // remember it should be not arrow function, cuz we need proper this refference to storeSchema object
    this.slug = slug(this.name);
    next();
    // TODO: make more resiliant so slugs are unique 
});

module.exports = mongoose.model('Store', storeSchema);