import express from 'express'
import { getLecturerDashboard, getStudentDashboard, getAdminDashboard } from '../controllers/dashboardController.js'
import { protect, restrictTo } from '../middlewares/authMiddleware.js'

const router = express.Router()

router.get('/lecturer', protect, restrictTo('lecturer'), getLecturerDashboard)
router.get('/student', protect, restrictTo('student'), getStudentDashboard)
router.get('/admin', protect, restrictTo('admin'), getAdminDashboard)

export default router
