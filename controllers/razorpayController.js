import Razorpay from 'razorpay';
import crypto from 'crypto';
import Order from "../models/orderModel.js";
import asyncHandler from "../middlewares/asyncHandler.js";
import dotenv from 'dotenv';

dotenv.config();

// Initialize Razorpay with fallback for development
let razorpay;
try {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key_id',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret',
  });
} catch (error) {
  console.warn('Warning: Razorpay initialization failed. Payment features will be limited.');
  razorpay = {
    orders: {
      create: async () => {
        throw new Error('Razorpay is not properly configured');
      }
    }
  };
}

// Create Razorpay order
const createRazorpayOrder = asyncHandler(async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    console.log('Creating Razorpay order for:', req.params.id);
    const { orderAmount, currency = 'INR' } = req.body;

    // Validate required fields
    if (!orderAmount) {
      return res.status(400).json({ error: "Order amount is required" });
    }

    const order = await Order.findById(req.params.id).populate("user", "email");

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Verify order belongs to authenticated user
    if (order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized to access this order" });
    }

    // Create Razorpay order
    const razorpayOrderOptions = {
      amount: Math.round(orderAmount * 100), // Razorpay expects amount in paise
      currency: currency,
      receipt: `order_${order._id}`,
      notes: {
        orderId: order._id.toString(),
        userId: order.user._id.toString(),
        customerEmail: order.user.email
      }
    };

    console.log('Creating Razorpay order with options:', razorpayOrderOptions);

    const razorpayOrder = await razorpay.orders.create(razorpayOrderOptions);
    console.log('Razorpay order created:', razorpayOrder);

    // Update order with payment result
    order.paymentResult = {
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      status: razorpayOrder.status
    };

    await order.save();
    console.log('Order updated with Razorpay payment result');

    // Return response in format expected by frontend
    return res.json({
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID, // Frontend needs this for payment
      orderId: order._id,
      customerEmail: order.user.email,
      customerName: order.shippingAddress.fullName,
      customerPhone: order.shippingAddress.phone || '1234567890'
    });

  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ 
      error: error.message || "Razorpay order creation failed",
      details: error.description || error.message
    });
  }
});

// Verify Razorpay payment
const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const orderId = req.params.id;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: "Missing payment verification data" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      // Payment is verified, update order
      order.isPaid = true;
      order.paidAt = new Date();
      order.paymentResult = {
        ...order.paymentResult,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        paymentStatus: 'SUCCESS'
      };

      await order.save();

      return res.json({
        success: true,
        isPaid: true,
        paymentStatus: 'SUCCESS',
        message: 'Payment verified successfully',
        orderId: order._id
      });
    } else {
      return res.status(400).json({
        success: false,
        isPaid: false,
        paymentStatus: 'FAILED',
        message: 'Payment verification failed'
      });
    }

  } catch (error) {
    console.error('Razorpay payment verification error:', error);
    res.status(500).json({ 
      error: error.message || "Payment verification failed" 
    });
  }
});

// Get Razorpay config for frontend
const getRazorpayConfig = asyncHandler(async (req, res) => {
  res.json({
    key: process.env.RAZORPAY_KEY_ID,
    currency: 'INR'
  });
});

export {
  createRazorpayOrder,
  verifyRazorpayPayment,
  getRazorpayConfig
}; 