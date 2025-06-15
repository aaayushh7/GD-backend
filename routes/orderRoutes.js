import express from "express";

const router = express.Router();

import {
  createOrder,
  getAllOrders,
  getUserOrders,
  countTotalOrders,
  calculateTotalSales,
  calcualteTotalSalesByDate,
  findOrderById,
  markOrderAsPaid,
  markOrderAsDelivered,
  cashfreeOrder, 
  markOrderAsShipped,
  verifyPayment
} from "../controllers/orderController.js";

import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  getRazorpayConfig
} from "../controllers/razorpayController.js";

import { authenticate, authorizeAdmin } from "../middlewares/authMiddleware.js";

router
  .route("/")
  .post(authenticate, createOrder)
  .get(authenticate, authorizeAdmin, getAllOrders);

router.route("/mine").get(authenticate, getUserOrders);
router.route("/total-orders").get(countTotalOrders);
router.route("/total-sales").get(calculateTotalSales);
router.route("/total-sales-by-date").get(calcualteTotalSalesByDate);
router.route("/:id").get(authenticate, findOrderById);
router.route("/:id/pay").put(authenticate, markOrderAsPaid);
router.route("/:id/ship").put(authenticate, authorizeAdmin, markOrderAsShipped);
router
  .route("/:id/deliver")
  .put(authenticate, authorizeAdmin, markOrderAsDelivered);

// Cashfree payment routes
router.post("/:id/cashfree", authenticate, cashfreeOrder);
router.post("/:id/verify-payment", authenticate, verifyPayment);

// Razorpay payment routes
router.post("/:id/razorpay", authenticate, createRazorpayOrder);
router.post("/:id/verify-razorpay", authenticate, verifyRazorpayPayment);
router.get("/config/razorpay", getRazorpayConfig);

// router.route("/coupons").post(authenticate, authorizeAdmin, createCoupon);
// router.route("/coupons/validate").post(authenticate, validateCoupon);


export default router;