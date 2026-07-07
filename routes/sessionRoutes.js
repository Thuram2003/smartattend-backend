import express from 'express'
import { startSession, refreshQR, closeSession } from '../controllers/sessionController.js'
import { protect, restrictTo } from '../middlewares/authMiddleware.js'

const router = express.Router()

/**
 * @swagger
 * /api/sessions/start:
 *   post:
 *     summary: Start a new attendance session (Lecturer only)
 *     tags: [Sessions]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - courseId
 *             properties:
 *               courseId:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439011
 *               windowMinutes:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 120
 *                 default: 15
 *                 example: 15
 *                 description: How long the attendance window stays open (minutes)
 *     responses:
 *       201:
 *         description: Session started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 session:
 *                   $ref: '#/components/schemas/Session'
 *                 qrImage:
 *                   type: string
 *                   description: Base64 encoded QR code image
 *                   example: data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...
 *                 pin:
 *                   type: string
 *                   example: "1234"
 *       400:
 *         description: Invalid input (missing courseId or invalid windowMinutes)
 *       403:
 *         description: Access denied - Lecturer role required
 */
router.post('/start', protect, restrictTo('lecturer'), startSession)

/**
 * @swagger
 * /api/sessions/{id}/refresh:
 *   post:
 *     summary: Refresh QR code and PIN for a session (Lecturer only)
 *     tags: [Sessions]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *     responses:
 *       200:
 *         description: QR code refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 qrImage:
 *                   type: string
 *                   description: New Base64 encoded QR code image
 *                 pin:
 *                   type: string
 *                   example: "5678"
 *                 qrToken:
 *                   type: string
 *       400:
 *         description: Session not active
 *       403:
 *         description: Access denied - Lecturer role required
 */
router.post('/:id/refresh', protect, restrictTo('lecturer'), refreshQR)

/**
 * @swagger
 * /api/sessions/{id}/close:
 *   post:
 *     summary: Close an attendance session (Lecturer only)
 *     tags: [Sessions]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *     responses:
 *       200:
 *         description: Session closed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       403:
 *         description: Access denied - Lecturer role required
 *       404:
 *         description: Session not found
 */
router.post('/:id/close', protect, restrictTo('lecturer'), closeSession)

export default router