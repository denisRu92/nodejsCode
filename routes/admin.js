const express = require('express');
const adminController = require('../controllers/admin');
const auth = require('../middleware/auth');
const { body } = require('express-validator');
const router = express.Router();

// /admin/add-product => get
router.get('/add-product', auth, adminController.getAddProduct);

// /admin/add-product => post
router.post('/add-product',
    [
        body('title').trim().isString().isLength({ min: 3 }).withMessage('Invalid title'),
        body('price').trim().not().isEmpty().isFloat().withMessage('Invalid price'),
        body('description').trim().not().isEmpty().isLength({ max: 200 }).withMessage('Invalid description')
    ],
    auth,
    adminController.postAddProduct);

router.get('/products', auth, adminController.getProducts);

router.get('/edit-product/:productId', auth, adminController.getEditProduct);

router.post('/edit-product',
    [
        body('title').trim().isString().isLength({ min: 3 }).withMessage('Invalid title'),
        body('price').trim().not().isEmpty().isFloat().withMessage('Invalid price'),
        body('description').trim().not().isEmpty().isLength({ max: 200 }).withMessage('Invalid description')
    ],
    auth,
    adminController.postEditProduct);

router.delete('/product/:productId', auth, adminController.deleteProduct);

exports.routes = router;