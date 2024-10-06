import mongoose from "mongoose";

const userSchema = mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: function() { return !this.googleId; }, // Only required if not using Google Sign Up
    },
    googleId: { type: String, unique: true, sparse: true },
    isAdmin: {
      type: Boolean,
      required: true,
      default: false,
    },
    usedCoupons: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coupon'
    }],
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
