const mongoose = require('mongoose');

const user = new mongoose.Schema({
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    resetToken: String,
    resetTokenExpiration: Date,
    cart: {
        items: [{
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true
            },
            quantity: {
                type: Number,
                required: true
            }
        }]
    }
});

user.methods.addToCart = function (product) {
    const cartItems = [...this.cart.items]
    const index = this.cart.items.findIndex(cp => {
        return cp.productId.toString() === product._id.toString();
    });

    if (index >= 0) {
        cartItems[index].quantity += 1;
    } else {
        cartItems.push({
            productId: product._id,
            quantity: 1
        })
    }

    const updatedCart = {
        items: cartItems
    };

    this.cart = updatedCart;
    return this.save();
};

user.methods.removeFromCart = function (productId) {
    const cartItems = this.cart.items.filter(item => {
        return item.productId.toString() !== productId.toString();
    });
    this.cart.items = cartItems;
    return this.save();
};

user.methods.clearCart = function () {
    this.cart = { items: [] };
    return this.save();
};

module.exports = mongoose.model('User', user);