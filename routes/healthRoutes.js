import express from 'express'
import mongoose from 'mongoose'

const router = express.Router()

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [System]
 *     responses:
 *       200:
 *         description: System is healthy
 *       503:
 *         description: System is unhealthy
 */
router.get('/', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      checks: {
        database: 'unknown',
        memory: 'unknown'
      }
    }

    // Check MongoDB connection
    if (mongoose.connection.readyState === 1) {
      health.checks.database = 'connected'
    } else {
      health.checks.database = 'disconnected'
      health.status = 'unhealthy'
    }

    // Check memory usage
    const memUsage = process.memoryUsage()
    health.checks.memory = {
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`
    }

    const statusCode = health.status === 'healthy' ? 200 : 503
    res.status(statusCode).json(health)

  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
})

export default router
