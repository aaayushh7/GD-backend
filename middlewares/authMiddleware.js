import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import asyncHandler from "./asyncHandler.js";

const authenticate = asyncHandler(async (req, res, next) => {
  let token;

  // Try multiple sources for the token
  // 1. Read JWT from the 'jwt' cookie (original method)
  token = req.cookies.jwt;
  
  // 2. If no cookie, try Authorization header
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  // 3. If no Authorization header, try x-auth-token header
  if (!token && req.headers['x-auth-token']) {
    token = req.headers['x-auth-token'];
  }
  
  // 4. Debug logging
  console.log('🔍 Auth middleware - Token sources:');
  console.log('Cookie jwt:', req.cookies.jwt ? 'Found' : 'Not found');
  console.log('Authorization header:', req.headers.authorization ? 'Found' : 'Not found');
  console.log('x-auth-token header:', req.headers['x-auth-token'] ? 'Found' : 'Not found');
  console.log('Final token:', token ? 'Found' : 'Not found');

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.userId).select("-password");
      next();
    } catch (error) {
      res.status(401);
      throw new Error("Not authorized, token failed.");
    }
  } else {
    res.status(401);
    throw new Error("Not authorized, no token.");
  }
});

const authorizeAdmin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(401).send("Not authorized as an admin.");
  }
};

export { authenticate, authorizeAdmin };