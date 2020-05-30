const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth');

const router = express.Router();
const User = require('../models/user');

router.get('/login', authController.getLogin);
router.post('/login',
    [
        body('email')
            .isEmail()
            .withMessage('Invalid email')
            .normalizeEmail(),
        body('password',
            'Password must be of length min 5 and alphanumeric')
            .isLength({ min: 5 })
            .isAlphanumeric()
            .trim()
    ],
    authController.postLogin);

router.post('/logout', authController.postLogout);

router.get('/signup', authController.getSignup);
router.post('/signup',
    [
        body('email')
            .isEmail()
            .withMessage('Invalid email')
            .custom((value, { req }) => {
                // if (value === 'test@test.com') {
                //     throw new Error('Forbidden email');
                // }
                // return true;

                return User.findOne({ email: value })
                    .then(user => {
                        if (user) {
                            return Promise.reject('Email exists already.');
                        }
                    });
            })
            .normalizeEmail(),
        body('password',
            'Password must be of length min 5 and alphanumeric')
            .isLength({ min: 5 })
            .isAlphanumeric()
            .trim(),
        body('confirmPassword')
            .trim()
            .custom((value, { req }) => {
                if (value !== req.body.password) {
                    throw new Error('Passwords must match');
                }
                return true;
            })
    ],
    authController.postSignup);

router.get('/reset', authController.getReset);
router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword);
router.post('/new-password', authController.postNewPassword);

module.exports = router;