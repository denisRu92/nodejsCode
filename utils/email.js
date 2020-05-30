const config = require('../server.config');
const nodemailer = require('nodemailer');
const sendgrid = require('nodemailer-sendgrid-transport');

module.exports = nodemailer.createTransport(sendgrid({
    auth: {
        api_key: config.MAIL_KEY
    }
}));