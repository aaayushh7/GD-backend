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
      required: true,
    },

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
