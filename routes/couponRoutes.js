import express from "express";
import { createCoupon, validateCoupon, useCoupon, getAllCoupons } from "../controllers/couponController.js";
import { authenticate, authorizeAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

// GET route to fetch all coupons
router.get("/", authenticate, authorizeAdmin, getAllCoupons);

// POST route to create a new coupon
router.post("/", authenticate, authorizeAdmin, createCoupon);

// Validate coupon route
router.post("/validate", validateCoupon);

// Use coupon route
router.post("/use", authenticate, useCoupon);
router.post("/test-create", createCoupon);
// Test route
router.get("/test", async (req, res) => {
  try {
    const coupons = await Coupon.find({});
    res.json({ message: "Coupon model is working", count: coupons.length, coupons });
  } catch (error) {
    console.error('Error in test route:', error);
    res.status(500).json({ message: "Error testing Coupon model", error: error.message });
  }
});

export default router;