const config = require('../server.config');
const path = require('path');

const PDFDocument = require('pdfkit');
const Product = require('../models/product');
const Order = require('../models/order');

exports.getProducts = (req, res, next) => {
    const page = +req.query.page || 1;
    let totalItems;
    Product.find()
        .countDocuments()
        .then(numProducts => {
            totalItems = numProducts;
            return Product.find()
                .skip((page - 1) * config.ITEMS_PER_PAGE)
                .limit(config.ITEMS_PER_PAGE);
        })
        .then(products => {
            res.render('shop/product-list', {
                pageTitle: 'All Products',
                prods: products,
                path: '/products',
                currentPage: page,
                hasNextPage: config.ITEMS_PER_PAGE * page < totalItems,
                hasPreviousPage: page > 1,
                nextPage: page + 1,
                previousPage: page - 1,
                lastPage: Math.ceil(totalItems / config.ITEMS_PER_PAGE)
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getProduct = (req, res, next) => {
    Product.findById(req.params.productId)
        .then(product => {
            res.render('shop/product-detail',
                {
                    product: product,
                    pageTitle: product.title,
                    path: '/products'
                });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getIndex = (req, res, next) => {
    const page = +req.query.page || 1;
    let totalItems;
    Product.find()
        .countDocuments()
        .then(numProducts => {
            totalItems = numProducts;
            return Product.find()
                .skip((page - 1) * config.ITEMS_PER_PAGE)
                .limit(config.ITEMS_PER_PAGE);
        })
        .then(products => {
            res.render('shop/index', {
                pageTitle: 'Shop',
                prods: products,
                path: '/',
                currentPage: page,
                hasNextPage: config.ITEMS_PER_PAGE * page < totalItems,
                hasPreviousPage: page > 1,
                nextPage: page + 1,
                previousPage: page - 1,
                lastPage: Math.ceil(totalItems / config.ITEMS_PER_PAGE)
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postCartDeleteProduct = (req, res, next) => {
    const id = req.body.productId;
    req.user.removeFromCart(id)
        .then(result => {
            res.redirect('/cart');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postCart = (req, res, next) => {
    const id = req.body.productId;
    Product.findById(id)
        .then(product => {
            return req.user.addToCart(product);
        })
        .then(result => {
            console.log('Add item to cart');
            res.redirect('/cart');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getCart = (req, res, next) => {
    req.user
        .populate('cart.items.productId')
        .execPopulate()
        .then(user => {
            const products = user.cart.items;
            res.render('shop/cart', {
                pageTitle: 'Your Cart',
                path: '/cart',
                products: products
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getCheckout = (req, res, next) => {
    req.user
        .populate('cart.items.productId')
        .execPopulate()
        .then(user => {
            const products = user.cart.items;
            let total = 0;
            products.forEach(prod => {
                total += prod.quantity * prod.productId.price;
            });

            res.render('shop/checkout', {
                pageTitle: 'checkout',
                path: '/checkout',
                products: products,
                totalSum: total
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });

};

exports.postOrder = (req, res, next) => {
    req.user
        .populate('cart.items.productId')
        .execPopulate()
        .then(user => {
            const products = user.cart.items.map(i => {
                return {
                    quantity: i.quantity,
                    product: { ...i.productId._doc }
                };
            });

            return Order({
                user: {
                    email: req.user.email,
                    userId: req.user
                },
                products: products
            }).save();
        })
        .then(result => {
            return req.user.clearCart();
        })
        .then(() => {
            res.redirect('/orders');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getOrders = (req, res, next) => {
    Order.find({ 'user.userId': req.user._id })
        .then(orders => {
            res.render('shop/orders', {
                pageTitle: 'Your Orders',
                path: '/orders',
                orders: orders
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getInvoice = (req, res, next) => {
    Order.findById(req.params.orderId)
        .then(order => {
            if (!order) {
                return next(new Error('No order was found.'));
            }

            if (order.user.userId.toString() !== req.user._id.toString()) {
                return next(new Error('Unauthorized'));
            }

            const invoiceName = 'invoice-' + req.params.orderId + '.pdf';
            const invoicePath = path.join('data', 'invoices', invoiceName);

            const pdfDoc = new PDFDocument();
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"');
            //pdfDoc.pipe(fs.createWriteStream(invoicePath));
            pdfDoc.pipe(res);
            pdfDoc.fontSize(26).text('Invoice', { underline: true });
            pdfDoc.fontSize(14);
            pdfDoc.text('----------------------');
            let total = 0;
            order.products.forEach(prod => {
                total += prod.quantity * prod.product.price;
                pdfDoc.text(`${prod.product.title}  -  ${prod.quantity} x ${prod.product.price}$`);
            });
            pdfDoc.text('----------------------');
            pdfDoc.fontSize(20).text(`Total price: ${total}$`);
            pdfDoc.end();
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}