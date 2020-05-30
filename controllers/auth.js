const bcrypt = require('bcryptjs');
const User = require('../models/user');
const email = require('../utils/email');
const config = require('../server.config');
const crypto = require('crypto');
const { validationResult } = require('express-validator');

exports.getLogin = (req, res, next) => {
    let message = req.flash('error');
    message = message.length > 0 ? message[0] : null;

    res.render('auth/login', {
        pageTitle: 'Login',
        path: '/login',
        errorMessage: message,
        validationErrors: [],
        oldInput: {
            email: '',
            password: ''
        }
    });
};

exports.postLogin = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render('auth/login', {
            pageTitle: 'Login',
            path: '/login',
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array(),
            oldInput: {
                email: req.body.email,
                password: req.body.password
            }
        });
    }

    //res.setHeader('Set-Cookie', 'loggedIn=true; Max-Age=10; Expires=(http date format)');
    User.findOne({ email: req.body.email })
        .then(user => {
            if (user) {
                return bcrypt.compare(req.body.password, user.password)
                    .then(match => {
                        if (match) {
                            req.session.user = user;
                            req.session.isLoggedIn = true;
                            return req.session.save(err => {
                                if (err) {
                                    console.log(err);
                                }

                                res.redirect('/');
                            });
                        }

                        res.status(422).render('auth/login', {
                            pageTitle: 'Login',
                            path: '/login',
                            errorMessage: 'Invalid email or password.',
                            validationErrors: [],
                            oldInput: {
                                email: req.body.email,
                                password: req.body.password
                            }
                        });
                    })
                    .catch(err => {
                        console.log(err);
                        res.status(422).render('auth/login', {
                            pageTitle: 'Login',
                            path: '/login',
                            errorMessage: 'Invalid email or password.',
                            validationErrors: [],
                            oldInput: {
                                email: req.body.email,
                                password: req.body.password
                            }
                        });
                    });
            }

            return res.status(422).render('auth/login', {
                pageTitle: 'Login',
                path: '/login',
                errorMessage: 'Invalid email or password.',
                validationErrors: [],
                oldInput: {
                    email: req.body.email,
                    password: req.body.password
                }
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postLogout = (req, res, next) => {
    req.session.destroy(err => {
        if (err) {
            console.log(err);
        }

        res.redirect('/');
    });
};

exports.getSignup = (req, res, next) => {
    let message = req.flash('error');
    message = message.length > 0 ? message[0] : null;

    res.render('auth/signup', {
        path: '/signup',
        pageTitle: 'Signup',
        errorMessage: message,
        validationErrors: [],
        oldInput: {
            email: '',
            password: '',
            confirmPassword: ''
        }
    });
};

exports.postSignup = (req, res, next) => {
    const errors = validationResult(req);
    console.log(errors);
    if (!errors.isEmpty()) {
        return res.status(422).render('auth/signup', {
            path: '/signup',
            pageTitle: 'Signup',
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array(),
            oldInput: {
                email: req.body.email,
                password: req.body.password,
                confirmPassword: req.body.confirmPassword
            }
        });
    }

    bcrypt.hash(req.body.password, 12)
        .then(password => {
            return User({
                email: req.body.email,
                password: password,
                cart: { items: [] }
            }).save()
        })
        .then(result => {
            res.redirect('/login');
            return email.sendMail({
                to: req.body.email,
                from: config.MAIL_FROM,
                subject: 'Signup succeeded',
                html: '<h1>You successfully signed up!</h1>'
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getReset = (req, res, next) => {
    let message = req.flash('error');
    message = message.length > 0 ? message[0] : null;

    res.render('auth/reset', {
        path: '/reset',
        pageTitle: 'Reset password',
        errorMessage: message
    });
};

exports.postReset = (req, res, next) => {
    crypto.randomBytes(32, (err, buffer) => {
        if (err) {
            console.log(err);
            res.redirect('/reset');
        }

        User.findOne({ email: req.body.email })
            .then(user => {
                if (!user) {
                    req.flash('error', 'No account with that email found');
                    return res.redirect('/reset');
                }
                console.log('test email rest');
                const token = buffer.toString('hex');
                user.resetToken = token;
                user.resetTokenExpiration = Date.now() + 3600000; // 1 hour
                return user.save()
                    .then(user => {
                        res.redirect('/');
                        email.sendMail({
                            to: req.body.email,
                            from: config.MAIL_FROM,
                            subject: 'Password Reset',
                            html: `
                                <p>You requested a password reset</p>
                                <p>Click here fot reset: <a href="http://localhost:3000/reset/${token}">link</a></p>
                            `
                        });
                    })
                    .catch(err => {
                        throw new Error(err);
                    });
            })
            .catch(err => {
                const error = new Error(err);
                error.httpStatusCode = 500;
                return next(error);
            });
    })
};

exports.getNewPassword = (req, res, next) => {
    const token = req.params.token;
    User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
        .then(user => {
            let message = req.flash('error');
            message = message.length > 0 ? message[0] : null;

            res.render('auth/new-password', {
                path: '/new-password',
                pageTitle: 'New password',
                errorMessage: message,
                userId: user._id.toString(),
                passwordToken: token
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postNewPassword = (req, res, next) => {
    let resetUser;
    User.findOne({
        resetToken: req.body.passwordToken,
        resetTokenExpiration: { $gt: Date.now() },
        _id: req.body.userId
    })
        .then(user => {
            resetUser = user;
            return bcrypt.hash(req.body.password, 12);
        })
        .then(password => {
            resetUser.password = password;
            resetUser.resetToken = undefined;
            resetUser.resetTokenExpiration = undefined;
            return resetUser.save();
        })
        .then(result => {
            res.redirect('/login');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};
