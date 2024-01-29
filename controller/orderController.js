const Cart = require('../model/cartModel')
const products = require('../model/productModel')
const User = require('../model/userModel')
const categories = require('../model/categoryModel')
const Order = require('../model/orderModel')
const Coupon = require('../model/couponModel')
const moment = require('moment')
const razorpay = require("razorpay");


var instance = new razorpay({
    key_id: process.env.RAZORPAY_ID_KEY,
    key_secret: process.env.RAZORPAY_SECRET_KEY,
});




const placeOrder = async (req, res) => {
    try {
        const date = new Date();
        const userId = req.session.user_id;
        const { address, paymentMethod, subTotal, CouponDiscTotal } = req.body.orderData;
        console.log('sub:', req.body.orderData);
        // console.log('coupon:', req.session.coupon);

        let couponApply = false;

        let couponName;

        const couponData = req.session.coupon;
        let id;

        console.log('couponData:', couponData);

        if (couponData) {
            id = couponData._id;
            couponName = couponData.couponCode;
        }


        const randomNum = Math.floor(10000 + Math.random() * 90000);

        const orderID = "CZST" + randomNum;

        // Wallet


        if (paymentMethod === "Wallet") {
            const user = await User.findById(userId);

            console.log('wal:', user.wallet, 'his:', user.wallet_history);

            // Check if wallet balance is sufficient
            if (user.wallet < subTotal) {
                return res.json({
                    walletFailed: true,
                    message: "Insufficient wallet balance.",
                });
            }
            const status = "placed";

            // Deduct order amount from wallet
            user.wallet -= subTotal;

            // Update wallet history
            user.wallet_history.push({
                date: new Date(),
                amount: -subTotal,
                description: "Order placed",
            });

            await user.save();


            const userData = await User.findOne({ _id: userId });
            let cartData;
            let cartProducts;
            if (req.session.couponApplied === true) {
              
                couponApply = true;

                const updateCouponUsed = await Coupon.updateOne(
                    { _id: id },
                    { $push: { userUsed: { user_id: userId } } }
                );
                await Coupon.updateOne(
                    { _id: id },
                    { $inc: { Availability: -1 } }
                );

                const couponDiscount = req.session.discountAmount || 0;

                cartData = await Cart.findOne({ user_id: userId });
                cartProducts = cartData.items;
          

                const totalQuantity = cartProducts.reduce((total, item) => total + item.quantity, 0);

                for (let i = 0; i < cartProducts.length; i++) {
                    const item = cartProducts[i];
                    const discountFraction = item.quantity / totalQuantity;
                    const itemDiscount = Math.round(couponDiscount * discountFraction);

                    cartProducts[i].discountAmount = itemDiscount;

                    cartProducts[i].couponDiscountTotal += itemDiscount;
                }
                req.session.couponApplied = false;

            } else {



                cartData = await Cart.findOne({ user_id: userId });
                cartProducts = cartData.items;

            }
            const delivery = new Date(date.getTime() + 10 * 24 * 60 * 60 * 1000);
            const deliveryDate = delivery
                .toLocaleString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "2-digit",
                })
                .replace(/\//g, "-");


            const order = new Order({
                user_id: userId,
                order_id: orderID,
                delivery_address: address,
                user_name: userData.username,
                total_amount: subTotal,
                totalDiscountAmount: CouponDiscTotal,
                coupon_name: couponName,
                date: date,
                status: status,
                expected_delivery: deliveryDate,
                couponApplied: couponApply,
                payment: paymentMethod,
                items: cartProducts,
            });

            let orderData = await order.save();
            console.log('order:', orderData);

            const orderId = orderData._id;
            await Cart.deleteOne({ user_id: userId });

            for (let i = 0; i < cartData.items.length; i++) {
                const productId = cartProducts[i].product_id;
                const count = cartProducts[i].quantity;

                await products.updateOne(
                    { _id: productId },
                    { $inc: { quantity: -count } }
                );
            }

            return res.json({ success: true, params: orderId });
        }
        const status = paymentMethod === "COD" ? "placed" : "pending";
        const userData = await User.findOne({ _id: userId });
        let cartData;
        let cartProducts;

        if (req.session.couponApplied === true) {
            console.log('NKGHYFGT VLOG');
            couponApply = true;

            const updateCouponUsed = await Coupon.updateOne(
                { _id: id },
                { $push: { userUsed: { user_id: userId } } }
            );
            await Coupon.updateOne(
                { _id: id },
                { $inc: { Availability: -1 } }
            );

            const couponDiscount = req.session.discountAmount || 0;


            cartData = await Cart.findOne({ user_id: userId });
            if (!cartData || !cartData.items) {
                // Handle the case where cartData or cartData.items is null
                return res.json({
                    success: false,
                    message: "Cart data not found or empty.",
                });
            }

            cartProducts = cartData.items;


            const totalQuantity = cartProducts.reduce((total, item) => total + item.quantity, 0);


            for (let i = 0; i < cartProducts.length; i++) {
                const item = cartProducts[i];
                const discountFraction = item.quantity / totalQuantity;
                const itemDiscount = Math.round(couponDiscount * discountFraction);

                cartProducts[i].discountAmount = itemDiscount;

                cartProducts[i].couponDiscountTotal = itemDiscount;
            }
            req.session.couponApplied = false;

        } else {

            
            cartData = await Cart.findOne({ user_id: userId });

            if (!cartData || !cartData.items) {
                // Handle the case where cartData or cartData.items is null
                return res.json({
                    success: false,
                    message: "Cart data not found or empty.",
                });
            }

            cartProducts = cartData.items;


        }

        const delivery = new Date(date.getTime() + 10 * 24 * 60 * 60 * 1000);
        const deliveryDate = delivery
            .toLocaleString("en-US", {
                year: "numeric",
                month: "short",
                day: "2-digit",
            })
            .replace(/\//g, "-");

        const order = new Order({
            user_id: userId,
            order_id: orderID,
            delivery_address: address,
            user_name: userData.username,
            total_amount: subTotal,
            totalDiscountAmount: CouponDiscTotal,
            coupon_name: couponName,
            date: date,
            status: status,
            expected_delivery: deliveryDate,
            couponApplied: couponApply,
            payment: paymentMethod,
            items: cartProducts,
        });
        let orderData = await order.save();
        const orderId = orderData._id;

        if (orderData.status === "placed") {
            await Cart.deleteOne({ user_id: userId });


            for (let i = 0; i < cartData.items.length; i++) {
                const productId = cartProducts[i].product_id;
                const count = cartProducts[i].quantity;

                await products.updateOne(
                    { _id: productId },
                    { $inc: { quantity: -count } }
                );
            }
            res.json({ success: true, params: orderId });
        } else {

        const orderid = orderData._id;
        const total = orderData.total_amount;

        var options = {
            amount: total * 100, // amount in the smallest currency unit
            currency: "INR",
            receipt: "" + orderid,
        };

        instance.orders.create(options, function (err, order) {
            console.log(order);
            return res.json({ success: false, order: order });
        });

    }


} catch (error) {
    console.log(error);
}
};

const applyCoupon = async (req, res) => {
    try {
        console.log(req.body);
        const { couponCode, cartTotal } = req.body;
        const { user_id } = req.session;
        const couponData = await Coupon.findOne({ couponCode: couponCode });

        req.session.coupon = couponData;
        let discountedTotal = 0;
        if (couponData) {
            let currentDate = new Date();
            console.log("currnewdate", currentDate);

            let minAmount = couponData.minAmount;

            if (cartTotal >= couponData.minAmount) {
                console.log('cartTOTAL SUCCESS');
                if (
                    currentDate <= couponData.expiryDate &&
                    couponData.status !== false

                ) {
                    console.log("COuponData false");
                    const id = couponData._id;
                    const couponUsed = await Coupon.findOne({
                        _id: id,
                        "userUsed.user_id": user_id,
                    });

                    if (couponUsed) {
                        console.log("this coupon is already used");
                        res.send({ usedCoupon: true });
                    } else {
                        console.log("COupon not used");
                        if (req.session.couponApplied === false) {
                            console.log("Coupon Applied false");

                            if (couponData.Availability <= 0) {
                                // Update the status to expired
                                await Coupon.updateOne({ _id: couponData._id }, { $set: { status: false } });
                                return res.send({ expired: true });

                            }

                            req.session.couponApplied = true;
                            console.log('req.session.couponApplied:', req.session.couponApplied);
                            req.session.discountAmount = couponData.discountAmount;

                            console.log('discount::::KLKJA', req.session.discountAmount);
                            ;
                            // req.session.discountAmount = minAmount;
                            res.send({
                                couponApplied: true,
                                discountAmount: req.session.discountAmount,
                            });
                        } else {
                            console.log("COuponData true");
                            res.send({ onlyOneTime: true });
                        }
                    }
                } else {
                    console.log("Coupon expired");
                    res.send({ expired: true });
                }
            } else {
                console.log(`you should purchase atleast ${cartTotal}`);
                res.send({ shouldMinAmount: true, minAmount });
            }
        } else {
            console.log("Wrong Coupon");
            res.send({ wrongCoupon: true });
        }

        console.log("coupondata", couponData);
    } catch (error) {
        console.log(error.message);
    }
};

const verifyPayment = async (req, res) => {
    try {
        console.log("verifyPAyment");
        const cartData = await Cart.findOne({ user_id: req.session.user_id });
        const cartProducts = cartData.items;
        const details = req.body;

        console.log("detailsSSSSSSS:", details);

        const crypto = require("crypto");

        // Your secret key from the environment variable
        const secretKey = process.env.RAZORPAY_SECRET_KEY;

        // Creating an HMAC with SHA-256
        const hmac = crypto.createHmac("sha256", secretKey);
        console.log(hmac);

        // Updating the HMAC with the data
        hmac.update(
            details.payment.razorpay_order_id +
            "|" +
            details.payment.razorpay_payment_id
        );

        // Getting the hexadecimal representation of the HMAC
        const hmacFormat = hmac.digest("hex");

        console.log(hmacFormat);

        console.log(details.payment.razorpay_signature);

        if (hmacFormat == details.payment.razorpay_signature) {
            await Order.findByIdAndUpdate(
                { _id: details.order.receipt },
                { $set: { paymentId: details.payment.razorpay_payment_id } }
            );

            for (let i = 0; i < cartProducts.length; i++) {
                let count = cartProducts[i].quantity; await products.findByIdAndUpdate({
                    _id: cartProducts[i].product_id
                },
                    { $inc: { quantity: -count } });
            }


            await Order.findByIdAndUpdate({ _id: details.order.receipt }, { $set: { status: "placed" } });


            const userData = await User.findOne({ _id: req.session.user_id });
            await Cart.deleteOne({ user_id: userData._id });

            res.json({ success: true, params: details.order.receipt });
        } else {
            await Order.findByIdAndDelete({ _id: details.order.receipt });
            res.json({ success: false });
        }
    } catch (error) {
        console.log(error.message);
    }
};




const orderPage = async (req, res) => {
    try {

        const userid = req.session.user_id
        const id = req.params.id
        const orders = await Order.findOne({ _id: id })
        const user = await User.findOne({ _id: userid })


        res.render('orderPage', { user: user, orders: orders, moment })

    } catch (error) {
        console.log(error);
    }

}
const orderList = async (req, res) => {
    try {
        const id = req.session.user_id;
        const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
        const perPage = 3; // Adjust as needed

        // Count total number of orders
        const totalOrders = await Order.countDocuments({ user_id: id });

        // Calculate total pages
        const totalPages = Math.ceil(totalOrders / perPage);

        // Ensure the requested page is within valid range
        if (page < 1 || page > totalPages) {
            return res.status(404).render('error', { error: 'Page not found' });
        }

        // Sort the orders in descending order based on the date field and paginate the results
        const data = await Order.find({ user_id: id })
            .sort({ date: -1 })
            .populate('items.product_id')
            .skip((page - 1) * perPage)
            .limit(perPage);

        const user = await User.find({ _id: id });

        res.render('orderlist', { orders: data, user, moment, currentPage: page, totalPages });
    } catch (error) {
        console.log(error);
        // Handle errors as needed
        res.status(500).render('error', { error: 'Internal Server Error' });
    }
};



const viewOrder = async (req, res) => {
    try {
        const userId = req.session.user_id
        const orderId = req.query.orderId

        const mainOrder = await Order.findOne({ _id: orderId, user_id: userId }).populate('items.product_id');
        const user = await User.findOne({ _id: userId })
        // console.log('mainOrder:',mainOrder);
        res.render('viewOrder', { order: mainOrder, user, moment })

    } catch (error) {
        console.log(error);
    }
}

const loadProfileAddress = async (req, res) => {
    try {

        const userId = req.session.user_id
        const data = await User.findOne({ _id: userId })
        res.render('address', { user: data })

    } catch (error) {
        console.log(error);
    }
}

module.exports = {
    orderPage,
    placeOrder,
    orderList,
    loadProfileAddress,
    viewOrder,
    verifyPayment,
    applyCoupon
}   