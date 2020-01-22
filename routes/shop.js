const path = require('path');
const express = require('express');

const rootDir = require('../utils/path');
const adminData = require('./admin');

const router = express.Router();

router.get('/', (req, res, next) => {
    res.render('shop', { docTitle: 'Shop', prods: adminData.products });

    // console.log('shop.js', adminData.products);
    // res.sendfile(path.join(rootDir, 'views', 'shop.html'));
    //res.sendfile(path.join(__dirname, '..', 'views', 'shop.html'));
});

module.exports = router;