/**
 * Global Error Handler Middleware
 * Catches all errors and formats them consistently
 */

export const errorHandler = (err, req, res, next) => {
  // Default to 500 server error
  let statusCode = err.statusCode || 500
  let message = err.message || 'Internal Server Error'

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400
    message = Object.values(err.errors).map(e => e.message).join(', ')
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 400
    const field = Object.keys(err.keyPattern)[0]
    message = `${field} already exists`
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    statusCode = 400
    message = `Invalid ${err.path}: ${err.value}`
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401
    message = 'Invalid token'
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401
    message = 'Token expired'
  }

  // Log error for debugging (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Error caught by global handler:')
    console.error(`   Path: ${req.method} ${req.path}`)
    console.error(`   Status: ${statusCode}`)
    console.error(`   Message: ${message}`)
    if (err.stack) {
      console.error(`   Stack: ${err.stack}`)
    }
  }

  // Send response
  res.status(statusCode).json({
    success: false,
    message,
    // Only include stack trace in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
}

/**
 * 404 Not Found Handler
 * Catches requests to undefined routes
 */
export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`)
  error.statusCode = 404
  next(error)
}

/**
 * Async Handler Wrapper
 * Eliminates need for try-catch in every async route
 * 
 * Usage:
 * router.get('/path', asyncHandler(async (req, res) => {
 *   const data = await Model.find()
 *   res.json(data)
 * }))
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

export default errorHandler
