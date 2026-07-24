function notFound(req, res, next) {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
}

function errorHandler(err, req, res, next) {
  console.error(err.stack || err);

  // If a response (e.g. a streamed PDF) has already started, we can't send
  // a fresh JSON body anymore — trying to do so throws "Cannot set headers
  // after they are sent" and leaves the client with a corrupted download.
  // Just terminate the connection instead of compounding the error.
  if (res.headersSent) {
    return res.destroy(err);
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      message: 'Duplicate value',
      errors: err.errors?.map((e) => e.message),
    });
  }

  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: err.errors?.map((e) => e.message),
    });
  }

  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal server error',
  });
}

module.exports = { notFound, errorHandler };