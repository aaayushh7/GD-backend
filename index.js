import path from "path";
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import { PaymentGateway } from '@cashfreepayments/cashfree-sdk';
import { Cashfree } from "cashfree-pg";
import geolib from 'geolib';


// Utils
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import subcategoryRoutes from "./routes/subcategoryRoutes.js"; // New import
import productRoutes from "./routes/productRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import couponRoutes from './routes/couponRoutes.js';
import addressRoutes from "./routes/addressRoutes.js";

dotenv.config();
const port = process.env.PORT || 5000;

connectDB();

const app = express();


app.use(cors({
  // origin: ['https://www.nsrice.in', 'https://nsrice.in'],
  origin: true,
  credentials: true,
}));

const CENTER_POINT = {
  latitude: 12.81846,  // Example: Bangalore coordinates
  longitude: 80.04004
};
const MAX_RADIUS = 2000000; // 3km in meters

// Function to check if the user is within the allowed radius
function isWithinAllowedRadius(userLatitude, userLongitude) {
  const distance = geolib.getDistance(
    { latitude: userLatitude, longitude: userLongitude },
    CENTER_POINT
  );
  return distance <= MAX_RADIUS;
}



app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/address", addressRoutes);
app.use("/api/users", userRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/subcategory", subcategoryRoutes); // New route
app.use("/api/products", productRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/orders", orderRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/coupons', couponRoutes);

app.use((err, req, res, next) => {
  console.log("checking the location for your IP")
  console.error('Unhandled error:');
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || 'An unexpected error occurred',
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
  });
});

app.post('/api/check-location', (req, res) => {
  console.log('Received location check request:', req.body);
  
  const { latitude, longitude } = req.body;
  
  if (latitude === undefined || longitude === undefined) {
    console.error('Invalid location data received:', req.body);
    return res.status(400).json({ error: 'Invalid location data. Latitude and longitude are required.' });
  }
  
  const isAllowed = isWithinAllowedRadius(latitude, longitude);
  console.log(`Location check result: ${isAllowed ? 'Allowed' : 'Not allowed'}`);
  
  res.json({ isAllowed });
});

app.get("/api/config/paypal", (req, res) => {
  res.send({ clientId: process.env.PAYPAL_CLIENT_ID });
});


// Make cashfree available to other modules
// app.set('cashfree', cashfree);

// // Cashfree configuration
Cashfree.XClientId = process.env.CASHFREE_APP_ID ;
Cashfree.XClientSecret = process.env.CASHFREE_SECRET_KEY ;
Cashfree.XEnvironment = Cashfree.Environment.SANDBOX;

app.listen(port, () => console.log(`Server running on port: ${port}`));

export default app;