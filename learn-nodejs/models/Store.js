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
        },
    },
    photo: String,
    author: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: 'You must supply an author'
      }
}, {
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
});

// define indexes

storeSchema.index({
    name: 'text',
    description: 'text'
});

storeSchema.index({
    location: '2dsphere'
});

// auto generate slug before save

storeSchema.pre('save', async function(next) {
    if(!this.isModified('name')) {
        next(); //skip it
        return;
    }
    // remember it should be not arrow function, cuz we need proper this refference to storeSchema object
    this.slug = slug(this.name);
    // find other stores with same slugs if any
    const slugRegExp = new RegExp(`^${this.slug}((-[0-9]*$)?)$`, 'i');

    const storesWithSlug = await this.constructor.find({
        slug: slugRegExp
    });

    // reasign slug if there are any matches 
    if(storesWithSlug.length) {
        this.slug = `${this.slug}-${storesWithSlug.length + 1}`;
    }
    next();
});

function autopopulate(next) {
    this.populate('reviews');
    next();
}

storeSchema.pre('find', autopopulate);
storeSchema.pre('findOne', autopopulate);

// additional methods using mongoDb AGGRAGATION to retrieve specific data  

storeSchema.statics.getTagList = function() {
    return this.aggregate([
        { $unwind: '$tags' },
        { $group: {_id: '$tags', count: { $sum: 1 } } },
        { $sort: { count: - 1 } }
    ]);
};

storeSchema.statics.getTopStores = function() {
    return this.aggregate([
        // Lookup Stores and populate their reviews
        { $lookup: {from: 'reviews', localField: '_id', foreignField: 'store', as: 'reviews'} },
        // filter for only items that have one or more reviews
        { $match: {'reviews.1': {$exists: true} } },
        // Add the average review field
        { $project: {
            photo: '$$ROOT.photo',
            name: '$$ROOT.name',
            slug: '$$ROOT.slug',
            reviews: '$$ROOT.reviews',
            averageRating: { $avg: '$reviews.rating'}
        }},
        // sort it by newly added field
        { $sort: {averageRating: -1 }},
        { $limit: 10}
    ]);
}

// find reviews where stores _id property === reviews store porperty 

storeSchema.virtual('reviews', {
    ref: 'Review', // what model to link ?
    localField: '_id', // which field in the Store?
    foreignField: 'store' //which field in the Review?
});

module.exports = mongoose.model('Store', storeSchema);