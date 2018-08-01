const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const User = mongoose.model('User');
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
    // set author field to user Id
    req.body.author = req.user._id;

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
    const page = req.params.page || 1;
    const limit = 4;
    const skip = (page * limit) - limit;


    // fetch stores data from DB
    const storesPromise = Store
        .find()
        .skip(skip)
        .limit(limit)

    const countPromise = Store.count();

    const [stores, count] = await Promise.all([storesPromise, countPromise]);

    const pages = Math.ceil(count / limit);

    if(!stores.length && skip) {
        req.flash('info', `Hey! you asked for page ${page}. But that doesn' exist. So I put you on page ${pages}`);
        res.redirect(`/stores/pages/${pages}`);
        return;
    }

    res.render('stores', {
        title: 'Stores',
        stores,
        pages,
        page,
        count
    });
}

const confirmOwner = (store, user) => {
    if (!store.author || !store.author.equals(user._id) ) {
        throw Error('You must own a store in order to edit it!');
    }
}

exports.editStore = async (req, res) => {
    // find store
    const store = await Store.findOne({_id: req.params.id});
    // confirm this is the owner of the store
    confirmOwner(store, req.user);
    // render store page
    res.render('editStore',{
        title: 'Edit Store',
        store
    });
}

exports.getStoreBySlug = async (req, res, next) => {
    const store = await Store.findOne({slug: req.params.slug}).populate('author reviews');

    if(!store) return next(); // handle 404 in case no store is found
    

    res.render('store', {
        title: store.name,
        store
    });
}

exports.getStoreByTag = async (req, res, next) => {
    const tag = req.params.tag;
    const tagQuery = tag || {$exists: true};
    const tagsPromise = Store.getTagList();
    const storesPromise = Store.find({tags: tagQuery});
    const [tags, stores] = await Promise.all( [tagsPromise, storesPromise]);
    
    res.render('tag', {
        title: 'Tags Page',
        stores,
        tags,
        tag
    });
}

exports.searchStores = async (req, res) => {
    const stores = await Store
      // find stores containing query in name or descriptions using index text search
      .find({
        $text: {
          $search: req.query.q
        }
      }, {
        score: { $meta: 'textScore'}
      })
      // sort depends on how many times query match name or description
      .sort({
        score: { $meta: 'textScore'}
      })
      // limit to 5 results
      .limit(5)
      res.json(stores);
  };

  exports.mapStores = async (req, res) => {
			const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
			
    	const query = {
				location: {
					$near: {
						$geometry: {
							type: 'Point',
							coordinates
						},
						$maxDistance: 10000
					}
				}
			}

			const stores = await Store.find(query).select('slug name description location').limit(+req.query.limit || 10);
      res.json(stores);
	}
	
exports.mapPage = (req, res) => {
    res.render('map', {
        title: 'Map'
    });
};

exports.heartStore = async (req, res) => {
    const hearts = req.user.hearts.map(obj => obj.toString());
    const operator = hearts.includes(req.params.id) ? '$pull' : '$addToSet';

    const user = await User
        .findByIdAndUpdate(req.user._id, 
            {[operator]: {hearts: req.params.id} },
            { new: true}
        );
    res.json(user);
    
};

exports.getHearts = async (req, res) => {

    const stores = await Store.find({
        _id: {$in : req.user.hearts }
    });
    res.render('stores', {
        title: 'Hearted Stores',
        stores
    });
    
};

exports.getTopStores = async (req, res) => {
    const stores = await Store.getTopStores();
    res.render('topStores', {stores, title: '★ Top Stores'});
}