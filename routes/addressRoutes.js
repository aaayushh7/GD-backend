import express from "express";
const router = express.Router();
import {
  saveAddress,
  getUserAddress,
  updateAddress,
  deleteAddress,
 
} from "../controllers/addressController.js";
import { authenticate, authorizeAdmin } from "../middlewares/authMiddleware.js";

router.route("/").post(authenticate, saveAddress);
router.route("/").get(authenticate, getUserAddress);
router.route("/:id").put(authenticate, updateAddress);
router.route("/:id").delete(authenticate, deleteAddress);


export default router;