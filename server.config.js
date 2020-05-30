module.exports = {
    MONGO_DB_URI: process.env.MONGO_DB_URI || 'mongodb+srv://bakuryu:1671Dr@cluster0-b2pb5.mongodb.net/shop?retryWrites=true&w=majority',
    MAIL_FROM: process.env.MAIL_FROM || 'denisrux92@gmail.com',
    MAIL_KEY: process.env.MAIL_KEY || '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',
    ITEMS_PER_PAGE: process.env.ITEMS_PER_PAGE || 2
};