import User from "../models/userModel.js";
import asyncHandler from "../middlewares/asyncHandler.js";
import bcrypt from "bcryptjs";
import {generateToken,  setTokenCookie } from "../utils/createToken.js";
import { load } from '@cashfreepayments/cashfree-js';
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client("248103381961-bp2eqnd9rubm4padk4aqn9fm3ek0d47c.apps.googleusercontent.com");

const cashfree = await load({
  mode: "sandbox" 
});

const createUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    res.status(400);
    throw new Error("Please fill all the inputs.");
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const newUser = new User({ username, email, password: hashedPassword });

  try {
    await newUser.save();
    const token = generateToken(newUser._id);
    setTokenCookie(res, token);

    res.status(201).json({
      _id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      isAdmin: newUser.isAdmin,
      token
    });
  } catch (error) {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const existingUser = await User.findOne({ email });

  if (existingUser && (await bcrypt.compare(password, existingUser.password))) {
    const token = generateToken(existingUser._id);
    setTokenCookie(res, token);

    res.json({
      _id: existingUser._id,
      username: existingUser.username,
      email: existingUser.email,
      isAdmin: existingUser.isAdmin,
      token
    });
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
});

const googleSignUp = asyncHandler(async (req, res) => {
  let { googleId, email, name } = req.body;

  // Handle case where data is nested in a 'token' object
  if (req.body.token) {
    ({ googleId, email, name } = req.body.token);
  }

  console.log("Received Google Sign Up data:", { googleId, email, name }); // Debugging log

  if (!googleId || typeof googleId !== 'string') {
    res.status(400);
    throw new Error("Valid Google user ID is required");
  }

  try {
    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(googleId, salt);
      
      user = await User.create({
        googleId,
        username: name || email.split('@')[0],
        email,
        password: hashedPassword,
      });
    }

    const token = generateToken(user._id);
    setTokenCookie(res, token);

    res.status(200).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin,
      token,
    });
  } catch (error) {
    console.error("Google Sign-Up Error:", error);
    res.status(500);
    throw new Error(`Failed to process Google Sign-Up: ${error.message}`);
  }
});

const logoutCurrentUser = asyncHandler(async (req, res) => {
  res.cookie("jwt", "", {
    httyOnly: true,
    expires: new Date(0),
  });

  res.status(200).json({ message: "Logged out successfully" });
});

const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({});
  res.json(users);
});

const getCurrentUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
    });
  } else {
    res.status(404);
    throw new Error("User not found.");
  }
});

const updateCurrentUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.username = req.body.username || user.username;
    user.email = req.body.email || user.email;

    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(req.body.password, salt);
      user.password = hashedPassword;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

const deleteUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    if (user.isAdmin) {
      res.status(400);
      throw new Error("Cannot delete admin user");
    }

    await User.deleteOne({ _id: user._id });
    res.json({ message: "User removed" });
  } else {
    res.status(404);
    throw new Error("User not found.");
  }
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");

  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

const updateUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    user.username = req.body.username || user.username;
    user.email = req.body.email || user.email;
    user.isAdmin = Boolean(req.body.isAdmin);

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

const createCashfreeOrderForUser = asyncHandler(async (req, res) => {
  const { orderId, amount } = req.body;

  if (!orderId || !amount) {
    res.status(400).json({ error: "Order ID and amount are required." });
    return;
  }

  try {
    const cashfreeOrder = await cashfree.createOrder({
      orderId,
      orderAmount: amount,
      customerName: req.user.username,
      customerEmail: req.user.email,
      customerPhone: req.user.phone,
    });

    res.json(cashfreeOrder);
  } catch (error) {
    res.status(500);
    throw new Error(error.message || "Cashfree order creation failed");
  }
});

export {
  createUser,
  loginUser,
  logoutCurrentUser,
  getAllUsers,
  getCurrentUserProfile,
  updateCurrentUserProfile,
  deleteUserById,
  getUserById,
  updateUserById,
  createCashfreeOrderForUser,
  googleSignUp,
};