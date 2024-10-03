import asyncHandler from "../middlewares/asyncHandler.js";
import Coupon from "../models/couponModel.js";
import User from "../models/userModel.js";

// @desc    Create a new coupon
// @route   POST /api/coupons
// @access  Private/Admin
const createCoupon = asyncHandler(async (req, res) => {
  const { code, discount } = req.body;

  const coupon = new Coupon({
    code,
    discount,
  });

  const createdCoupon = await coupon.save();
  console.log("Created coupon:", JSON.stringify(createdCoupon, null, 2));
  res.status(201).json(createdCoupon);
});

// @desc    Validate a coupon
// @route   POST /api/coupons/validate
// @access  Private
const validateCoupon = asyncHandler(async (req, res) => {
  const { code, userId } = req.body;

  console.log(`Validating coupon: ${code} for user: ${userId}`);

  const coupon = await Coupon.findOne({ code, isActive: true });

  if (!coupon) {
    console.log(`Coupon not found or inactive: ${code}`);
    return res.status(404).json({ message: 'Coupon not found or inactive' });
  }

  if (userId) {
    const user = await User.findById(userId);
    if (!user) {
      console.log(`User not found: ${userId}`);
      return res.status(404).json({ valid: false, message: 'User not found' });
    }

    if (user.usedCoupons.includes(coupon._id)) {
      console.log(`Coupon already used by user: ${userId}, coupon: ${code}`);
      return res.status(400).json({ valid: false, message: 'Coupon already used by this user' });
    }
  }

  console.log(`Coupon validated successfully: ${code}`);
  res.json({ valid: true, discount: coupon.discount });
});

// @desc    Use a coupon
// @route   POST /api/coupons/use
// @access  Private
const useCoupon = asyncHandler(async (req, res) => {
  const { code, userId } = req.body;

  const coupon = await Coupon.findOne({ code, isActive: true });

  if (!coupon) {
    return res.status(404).json({ message: 'Coupon not found or inactive' });
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (user.usedCoupons.includes(coupon._id)) {
    return res.status(400).json({ message: 'Coupon already used by this user' });
  }

  user.usedCoupons.push(coupon._id);
  await user.save();

  res.json({ message: 'Coupon marked as used successfully' });
});

// @desc    Get all coupons
// @route   GET /api/coupons
// @access  Private/Admin
const getAllCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find({});
  res.json(coupons);
});

export { createCoupon, validateCoupon, useCoupon, getAllCoupons };