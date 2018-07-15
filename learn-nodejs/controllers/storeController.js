const mongoose = require('mongoose');
const Store = mongoose.model('Store');

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