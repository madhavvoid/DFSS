export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function notFoundHandler(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  if (error?.name === 'MulterError' && error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File exceeds the configured upload limit' });
  }
  if (error?.name === 'CastError' || error?.name === 'BSONError') {
    return res.status(400).json({ error: 'Invalid identifier' });
  }

  const status = Number.isInteger(error.status) ? error.status : 500;
  if (status >= 500) console.error(error);
  return res.status(status).json({ error: status >= 500 ? 'Internal server error' : error.message });
}