import express from "express";
const router = express.Router();
import {
  createAddress,
  getUserAddresses,
  updateAddress,
  deleteAddress,
  setDefaultAddress
} from "../controllers/addressController.js";
import { authenticate, authorizeAdmin } from "../middlewares/authMiddleware.js";

router.route("/").post(authenticate, createAddress);
router.route("/").get(authenticate, getUserAddresses);
router.route("/:id").put(authenticate, updateAddress);
router.route("/:id").delete(authenticate, deleteAddress);
router.route("/:id/default").put(authenticate, setDefaultAddress);


export default router;