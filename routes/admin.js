const path = require('path');
const express = require('express');

const rootDir = require('../utils/path');

const router = express.Router();
const products = [];

router.get('/add-product', (req, res, next) => {
    res.sendfile(path.join(rootDir, 'views', 'add-product.html'));
    //res.sendfile(path.join(__dirname, '..', 'views', 'add-product.html'));
});

router.post('/add-product', (req, res, next) => {
    //console.log(req.body);
    products.push({ title: req.body.title });
    res.redirect('/');
});

exports.routes = router;
exports.products = products;