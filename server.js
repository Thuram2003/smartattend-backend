import 'dotenv/config'
import express from 'express'
import connectdb from './config/db.js'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import authRoutes from './routes/authRoutes.js'
import attendanceRoutes from './routes/attendanceRoutes.js'
import sessionRoutes from './routes/sessionRoutes.js'
import courseRoutes from './routes/courseRoutes.js'
import uploadRoutes from './routes/uploadRoutes.js'
import dashboardRoutes from './routes/dashboardRoutes.js'
import exportRoutes from './routes/exportRoutes.js'
import healthRoutes from './routes/healthRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import helmet from 'helmet'
import mongoSanitize from 'express-mongo-sanitize'
import { rateLimit } from 'express-rate-limit'
import { createServer } from 'http'
import { initSocket } from './services/socketService.js'
import { swaggerUi, swaggerSpec } from './config/swagger.js'

// Validate environment variables
if (!process.env.JWT_SECRET) {
  console.error('❌ FATAL ERROR: JWT_SECRET is not defined in .env')
  process.exit(1)
}

if (!process.env.MONGODB_URI) {
  console.error('❌ FATAL ERROR: MONGODB_URI is not defined in .env')
  process.exit(1)
}

const app = express()

// Trust proxy for rate limiter (needed when behind proxies/load balancers)
app.set('trust proxy', 1)

connectdb()

// CORS configuration - Allow multiple origins for development
const allowedOrigins = [
  'http://localhost:3000',
  'http://192.168.43.72:3000',
  process.env.FRONTEND_URL
].filter(Boolean)

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, etc.)
    if (!origin) return callback(null, true)
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      // In development, allow all origins for easier testing
      if (process.env.NODE_ENV === 'development') {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    }
  },
  credentials: true
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser())
app.use(helmet())

const sanitizeRequest = (req, res, next) => {
  ['body', 'params', 'headers'].forEach((key) => {
    if (req[key]) {
      mongoSanitize.sanitize(req[key])
    }
  })
  next()
}
app.use(sanitizeRequest)

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
})
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
})
app.use('/api', limiter)
app.use('/api/auth/login', authLimiter)

app.use('/api/auth', authRoutes)
app.use('/api/attendance', attendanceRoutes)
app.use('/api/sessions', sessionRoutes)
app.use('/api/courses', courseRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/export', exportRoutes)
app.use('/api/admin', adminRoutes)
app.use('/health', healthRoutes)

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'SmartAttend API Docs'
}))

app.get('/', (req, res) => res.json({ 
  message: 'SmartAttend API Server',
  version: '1.0.0',
  status: 'operational',
  documentation: `${req.protocol}://${req.get('host')}/api-docs`,
  health: `${req.protocol}://${req.get('host')}/health`
}))

// Import error handlers
import { errorHandler, notFound } from './middlewares/errorHandler.js'

// 404 handler (must be after all routes)
app.use(notFound)

// Global error handler (must be last)
app.use(errorHandler)

const PORT = process.env.PORT || 5000
const HOST = process.env.HOST || '0.0.0.0' // Listen on all network interfaces
const server = createServer(app)
initSocket(server)

server.listen(PORT, HOST, () => {
  console.log(`✅ Server is running on http://${HOST}:${PORT}`)
  console.log(`📱 Network access: http://192.168.43.72:${PORT}`)
  console.log(`🏠 Local access: http://localhost:${PORT}`)
})
