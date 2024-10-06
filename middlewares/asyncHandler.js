const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch((error) => {
    console.error(`Error in asyncHandler: ${error.message}`);
    res.status(error.statusCode || 500).json({
      message: error.message || 'An unexpected error occurred',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.stack,
    });
  });

export default asyncHandler;