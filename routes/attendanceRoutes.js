import express from 'express'
import { markAttendance, getSessionAttendance } from '../controllers/attendanceController.js'
import { protect, restrictTo } from '../middlewares/authMiddleware.js'

const router = express.Router()

/**
 * @swagger
 * /api/attendance/mark:
 *   post:
 *     summary: Mark attendance (Student only)
 *     tags: [Attendance]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - qrToken
 *               - pin
 *               - deviceFingerprint
 *             properties:
 *               qrToken:
 *                 type: string
 *                 description: JWT token from scanned QR code
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *               pin:
 *                 type: string
 *                 description: 4-digit PIN displayed with QR code
 *                 example: "1234"
 *               deviceFingerprint:
 *                 type: string
 *                 description: Unique device identifier
 *                 example: fp_abc123xyz789
 *               location:
 *                 type: object
 *                 properties:
 *                   lat:
 *                     type: number
 *                     example: 6.5244
 *                   log:
 *                     type: number
 *                     example: 3.3792
 *               photoUrl:
 *                 type: string
 *                 description: URL of uploaded selfie
 *                 example: https://cloudinary.com/selfie.jpg
 *     responses:
 *       201:
 *         description: Attendance marked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 attendance:
 *                   $ref: '#/components/schemas/Attendance'
 *       400:
 *         description: Error - QR expired, wrong PIN, already marked, etc.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               qrExpired:
 *                 value:
 *                   message: QR code expired
 *               wrongPin:
 *                 value:
 *                   message: Incorrect PIN
 *               alreadyMarked:
 *                 value:
 *                   message: Attendance already marked
 *               windowClosed:
 *                 value:
 *                   message: Attendance window closed
 *       403:
 *         description: Access denied - Student role required
 */
router.post('/mark', protect, restrictTo('student'), markAttendance)

/**
 * @swagger
 * /api/attendance/session/{sessionId}:
 *   get:
 *     summary: Get attendance records for a session (Lecturer only)
 *     tags: [Attendance]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Attendance records retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: number
 *                   example: 25
 *                 records:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Attendance'
 *                       - type: object
 *                         properties:
 *                           student:
 *                             type: object
 *                             properties:
 *                               fullName:
 *                                 type: string
 *                               studentId:
 *                                 type: string
 *                               profilePhoto:
 *                                 type: string
 *       403:
 *         description: Access denied - Lecturer role required
 */
router.get('/session/:sessionId', protect, restrictTo('lecturer'), getSessionAttendance)

export default router