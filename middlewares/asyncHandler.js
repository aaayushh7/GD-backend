const asyncHandler = (fn) => async (req, res, next) => {
  try {
    await fn(req, res, next);
  } catch (error) {
    console.error("Detailed Error:", {
      message: error.message,
      stack: error.stack,
      requestBody: req.body,
      requestHeaders: req.headers,
    });
    res.status(error.statusCode || 500).json({
      message: error.message || 'An unexpected error occurred',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.stack,
    });
  }
};

export default asyncHandler;