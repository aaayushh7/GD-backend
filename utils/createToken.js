import jwt from "jsonwebtoken";

const generateToken = (userId) => {
  if (!userId) {
    throw new Error("UserId is required to generate token");
  }
  
  try {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });
    console.log("Generated token:", token); // Debugging log
    return token;
  } catch (error) {
    console.error("Token generation error:", error);
    throw error;
  }
};

export const setTokenCookie = (res, token) => {
  if (typeof token !== 'string') {
    console.error("Invalid token type in setTokenCookie:", typeof token);
    throw new Error("Invalid token type");
  }

  res.cookie('jwt', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
};

export default generateToken;