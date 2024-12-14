import mongoose from "mongoose";

const addressSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    address: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    postalCode: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    extraCharge: {
      type: Number,
      default: 0,
    },
    isDefault: {
      type: Boolean,
      default: false,
    }
  },
  { timestamps: true }
);

const Address = mongoose.model("Address", addressSchema);

export default Address;