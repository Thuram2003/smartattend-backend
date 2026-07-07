import express from 'express'
import { exportAttendanceCSV } from '../controllers/exportController.js'
import { protect, restrictTo } from '../middlewares/authMiddleware.js'

const router = express.Router()

/**
 * @swagger
 * /api/export/session/{sessionId}/csv:
 *   get:
 *     summary: Export session attendance to CSV (Lecturer only)
 *     tags: [Export]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *     responses:
 *       200:
 *         description: CSV file download
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *       403:
 *         description: Access denied
 */
router.get('/session/:sessionId/csv', protect, restrictTo('lecturer'), exportAttendanceCSV)

export default router
