import Order from "../models/orderModel.js";
import Product from "../models/productModel.js";
import asyncHandler from "../middlewares/asyncHandler.js";
import axios from "axios";
import Coupon from "../models/couponModel.js";
import User from "../models/userModel.js";


// import { PaymentGateway } from '@cashfreepayments/cashfree-sdk';
import { Cashfree } from "cashfree-pg";
import dotenv from 'dotenv';
dotenv.config();


Cashfree.XClientId = process.env.CASHFREE_APP_ID;
Cashfree.XClientSecret = process.env.CASHFREE_SECRET_KEY ;
Cashfree.XEnvironment = Cashfree.Environment.SANDBOX;





const createOrder = asyncHandler(async (req, res) => {
  const { 
    orderItems, 
    shippingAddress, 
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    couponCode,
    couponDiscount
  } = req.body;

  if (!orderItems || orderItems.length === 0) {
    res.status(400);
    throw new Error("No order items");
  }

  try {
    const itemsFromDB = await Product.find({
      _id: { $in: orderItems.map((x) => x._id) },
    });

    const dbOrderItems = orderItems.map((itemFromClient) => {
      const matchingItemFromDB = itemsFromDB.find(
        (itemFromDB) => itemFromDB._id.toString() === itemFromClient._id
      );
      if (!matchingItemFromDB) {
        throw new Error(`Product not found: ${itemFromClient._id}`);
      }
      return {
        ...itemFromClient,
        product: itemFromClient._id,
        price: matchingItemFromDB.price,
        _id: undefined,
      };
    });

    let finalCouponDiscount = 0;

    // If a coupon was used, mark it as used for this user
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode, isActive: true });
      if (!coupon) {
        throw new Error("Invalid coupon code");
      }

      const user = await User.findById(req.user._id);
      if (!user) {
        throw new Error("User not found");
      }

      if (user.usedCoupons.includes(coupon._id)) {
        throw new Error("Coupon already used by this user");
      }

      user.usedCoupons.push(coupon._id);
      await user.save();

      finalCouponDiscount = coupon.discount;
    }
    const order = new Order({
      orderItems: dbOrderItems,
      user: req.user._id,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice: totalPrice - finalCouponDiscount,
      couponDiscount: finalCouponDiscount
    });

    const createdOrder = await order.save();
    res.status(201).json(createdOrder);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});


function calcPrices(orderItems) {
  const itemsPrice = orderItems.reduce(
    (acc, item) => acc + item.price * item.qty,
    0
  );
  const shippingPrice = itemsPrice > 100 ? 0 : 10;
  const taxRate = 0.18;
  const taxPrice = (itemsPrice * taxRate).toFixed(2);
  const totalPrice = (
    itemsPrice +
    shippingPrice +
    parseFloat(taxPrice)
  ).toFixed(2);
  return {
    itemsPrice: itemsPrice.toFixed(2),
    shippingPrice: shippingPrice.toFixed(2),
    taxPrice,
    totalPrice,
  };
}



const cashfreeOrder = asyncHandler(async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    console.log('Received request body:', req.body);
    const { orderId, orderAmount, customerName, customerEmail, customerPhone, returnUrl, notifyUrl } = req.body;

    const order = await Order.findById(req.params.id).populate("user", "email");

    if (!order) {
      console.log('Order not found:', orderId);
      return res.status(404).json({ error: "Order not found" });
    }

    console.log('Found order:', order);

    const orderReq = {
      "order_amount": orderAmount,
      "order_currency": "INR",
      "order_id": order._id.toString(),
      "customer_details": {
        "customer_id": order.user._id.toString(),
        "customer_name": customerName || order.shippingAddress.fullName,
        "customer_phone": customerPhone || order.shippingAddress.phone || "1234567890",
        "customer_email": customerEmail || order.user.email

      },
      "order_meta": {
        "return_url": `https://cravehub.store/order/${order._id.toString()}`,
        "notify_url": `https://api.cravehub.store/api/webhook/cashfree`
      }
    }
    var data = null;

    try {
      const response = await Cashfree.PGCreateOrder("2022-09-01", orderReq);
      console.log('Cashfree order created:', response.data);
      data = response.data;
    } catch (err) {
      console.log('Error creating Cashfree order:', err);
      return res.status(500).json({ error: "Failed to create order with Cashfree" });
    }

    order.paymentResult = {
      orderId: data.cf_order_id,
      orderStatus: data.order_status,
      paymentSessionId: data.payment_session_id
    };

    await order.save();

    console.log('Order updated with payment result');
    return res.json({
      returnUrl: data.order_meta.return_url,
      paymentSessionId: data.payment_session_id,
      cforder: data.cf_order_id
    });

    res.json({
      order: order,
      cashfreeOrder: {
        orderId: data.cf_order_id,
        orderStatus: data.order_status,
        paymentSessionId: data.payment_session_id,
        paymentLink: data.payment_link
      }
    });


  } catch (error) {
    console.error('Error in createCashfreeOrder:', error);
    res.status(500).json({ error: error.message || "Cashfree order creation failed", stack: error.stack });
  }
})

const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).populate("user", "id username");
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getUserOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .sort({ createdAt: -1 }) // Sort by most recent first
    .select('-__v'); // Exclude the version key

  if (orders.length === 0) {
    return res.status(404).json({ message: "No orders found for this user" });
  }

  res.json(orders);
});

const countTotalOrders = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    res.json({ totalOrders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const calculateTotalSales = async (req, res) => {
  try {
    const orders = await Order.find();
    const totalSales = orders.reduce((sum, order) => sum + order.totalPrice, 0);
    res.json({ totalSales });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const calcualteTotalSalesByDate = async (req, res) => {
  try {
    const salesByDate = await Order.aggregate([
      {
        $match: {
          isPaid: true,
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$paidAt" },
          },
          totalSales: { $sum: "$totalPrice" },
        },
      },
    ]);

    res.json(salesByDate);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const findOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "user",
      "username email"
    );

    if (order) {
      res.json(order);
    } else {
      res.status(404).json({ error: "Order not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const markOrderAsPaid = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      order.isPaid = true;
      order.paidAt = Date.now();
      order.paymentResult = {
        id: req.body.id,
        status: req.body.status,
        update_time: req.body.update_time,
        email_address: req.body.payer.email_address,
      };

      const updateOrder = await order.save();
      res.status(200).json(updateOrder);
    } else {
      res.status(404).json({ error: "Order not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const markOrderAsShipped = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (order) {
      order.isShipped = true;
      order.shippedAt = Date.now();
      const updatedOrder = await order.save();
      res.status(200).json(updatedOrder);
    } else {
      res.status(404).json({ error: "Order not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const markOrderAsDelivered = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      order.isDelivered = true;
      order.deliveredAt = Date.now();

      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404).json({ error: "Order not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export {
  createOrder,
  cashfreeOrder,
  getAllOrders,
  getUserOrders,
  countTotalOrders,
  calculateTotalSales,
  calcualteTotalSalesByDate,
  findOrderById,
  markOrderAsPaid,
  markOrderAsDelivered,
  markOrderAsShipped
};
