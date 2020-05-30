const { validationResult } = require('express-validator');
const Product = require('../models/product');
const fileHelper = require('../utils/file');

exports.getAddProduct = (req, res, next) => {
    res.render('admin/edit-product', {
        pageTitle: 'Add Product',
        path: '/admin/add-product',
        editing: false,
        errorMessage: null,
        validationErrors: []
    });
    //res.sendfile(path.join(rootDir, 'views', 'add-product.html'));
    //res.sendfile(path.join(__dirname, '..', 'views', 'add-product.html'));
};

exports.postAddProduct = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty() || !req.file) {
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Add Product',
            path: '/admin/add-product',
            errorMessage: !errors.isEmpty() ? errors.array()[0].msg : 'Attached file is not an image',
            editing: false,
            product: {
                title: req.body.title,
                price: req.body.price,
                description: req.body.description
            },
            validationErrors: !errors.isEmpty() ? errors.array() : []
        });
    }

    const product = new Product({
        title: req.body.title,
        price: req.body.price,
        description: req.body.description,
        imageUrl: req.file.path,
        userId: req.user
    });

    product.save()
        .then(result => {
            res.redirect('/admin/products');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getEditProduct = (req, res, next) => {
    const editMode = req.query.edit;

    if (!editMode) {
        return res.redirect('/')
    }

    Product.findById(req.params.productId)
        .then(product => {
            if (!product) {
                return res.redirect('/');
            }

            res.render('admin/edit-product', {
                pageTitle: 'Edit Product',
                path: '/admin/add-product',
                editing: editMode,
                product: product,
                errorMessage: null,
                validationErrors: []
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postEditProduct = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Edit Product',
            path: '/admin/add-product',
            errorMessage: errors.array()[0].msg,
            editing: true,
            product: {
                title: req.body.title,
                price: req.body.price,
                description: req.body.description,
                _id: req.body.productId
            },
            validationErrors: errors.array()
        });
    }

    Product.findById(req.body.productId)
        .then(product => {
            if (product.userId.toString() !== req.user._id.toString()) {
                return res.redirect('/');
            }

            product.title = req.body.title;
            product.price = req.body.price;
            product.description = req.body.description;
            if (req.file) {
                fileHelper.deleteFile(product.imageUrl);
                product.imageUrl = req.file.path;
            }

            return product.save()
                .then(result => {
                    console.log("updated product")
                    res.redirect('/admin/products');
                });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getProducts = (req, res, next) => {
    Product.find({ userId: req.user._id })
        .then(products => {
            // render uses default view engine
            res.render('admin/products', {
                pageTitle: 'Admin Products',
                prods: products,
                path: '/admin/products'
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.deleteProduct = (req, res, next) => {
    Product.findById(req.params.productId)
        .then(product => {
            if (!product) {
                return next(new Error('Product not found.'));
            }
            fileHelper.deleteFile(product.imageUrl);
            return Product.deleteOne({ _id: req.params.productId, userId: req.user._id });
        })
        .then(() => {
            res.status(200).json({ message: 'Success' });
        })
        .catch(err => {
            res.status(500).json({ message: 'Deleting product fail' });
        });
};