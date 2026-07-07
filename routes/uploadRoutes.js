import express from 'express'
import { uploadPhoto } from '../controllers/uploadController.js'
import { protect } from '../middlewares/authMiddleware.js'

const router = express.Router()

/**
 * @swagger
 * /api/upload/photo:
 *   post:
 *     summary: Upload a photo to Cloudinary
 *     tags: [Upload]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 description: Base64 encoded image data URL
 *                 example: data:image/jpeg;base64,/9j/4AAQSkZJRg...
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 photoUrl:
 *                   type: string
 *                   example: https://res.cloudinary.com/dhvt2f6x4/image/upload/v1234567890/attendance_photos/abc123.jpg
 *                 message:
 *                   type: string
 *                   example: Image uploaded successfully
 *       400:
 *         description: Invalid image format or missing image
 *       401:
 *         description: Not authenticated
 */
router.post('/photo', protect, uploadPhoto)

export default router
