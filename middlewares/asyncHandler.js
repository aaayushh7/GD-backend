const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch((error) => {
    console.error(`Error in asyncHandler: ${error.message}`);
    res.status(500).json({
      message: 'An unexpected error occurred',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
    });
  });

export default asyncHandler;