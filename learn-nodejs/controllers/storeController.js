const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');

const multerOptions = {
    storage: multer.memoryStorage(),
    fileFilter(req, file, next) {
        isPhoto = file.mimetype.startsWith('image/');
        if (isPhoto) {
            next(null, true);
        } else {
            next( { message: 'Taht filetype isn\'t allowed'}, false);
        } 
    } 
}

exports.homePage = (req, res) => {
    res.render('index', {
        title: 'Main'
    });
}

exports.addStore = (req, res) => {
    res.render('editStore', {
        title: 'Add Store'
    });

}

// set middleware and tell it to deal with single "photo" field
exports.upload = multer(multerOptions).single('photo');

exports.resize = async (req, res, next) => {
    // if there is no file to resize
    if (!req.file) {
        next(); // skip to next middleware
        return;
    }
    console.log(req.file);

    const extension = req.file.mimetype.split('/')[1];
    req.body.photo = `${uuid.v4()}.${extension}`;
    // resize photo
    const photo = await jimp.read(req.file.buffer);
    await photo.resize(800, jimp.AUTO);
    await photo.write(`./public/uploads/${req.body.photo}`);
    // go to next midleware once finished writing photo into our filesystem
    next();

}

exports.createStore = async (req, res) => {
    const store =  await (new Store(req.body)).save();
    req.flash('success', `Successfully Created ${store.name}. Care to leave a review?`)
    res.redirect(`/store/${store.slug}`);
}

exports.updateStore = async (req, res) => {
    // set the location data to be a Point
    req.body.location.type = 'Point'

    // find and update the store
    const store =  await Store.findOneAndUpdate({_id: req.params.id}, req.body, {
        new: true, //will return new store instead of old one
        runValidators: true // will validate schema required filled
    }).exec();

    req.flash('success', `Successfully Updated <strong>${store.name}</strong>. <a href="/stores/${store.slug}"> View Store</a>`);
    res.redirect(`/stores/${store._id}/edit`);
}

exports.getStores = async (req, res) => {
    // fetch stores data from DB
    const stores = await Store.find();

    res.render('stores', {
        title: 'Stores',
        stores
    });
}

exports.editStore = async (req, res) => {
    const store = await Store.findOne({_id: req.params.id});
    // TODO:need to make sure it's an owner of the store
    res.render('editStore',{
        title: 'Edit Store',
        store
    });
}