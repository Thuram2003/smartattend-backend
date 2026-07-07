import express from 'express';
import {
  createCourse,
  getCourses,
  getCourse,
  enrollStudent,
} from '../controllers/courseController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/courses:
 *   post:
 *     summary: Create a new course (Lecturer only)
 *     tags: [Courses]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - code
 *               - lecturerId
 *             properties:
 *               name:
 *                 type: string
 *                 example: Introduction to Computer Science
 *               code:
 *                 type: string
 *                 example: CS101
 *               lecturerId:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439011
 *     responses:
 *       201:
 *         description: Course created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 course:
 *                   $ref: '#/components/schemas/Course'
 *       400:
 *         description: Missing required fields
 *       403:
 *         description: Access denied - Lecturer role required
 *   get:
 *     summary: Get all courses
 *     tags: [Courses]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of all courses
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 courses:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Course'
 */
router.post('/', protect, restrictTo('lecturer'), createCourse)
router.get('/', protect, getCourses)

/**
 * @swagger
 * /api/courses/{id}:
 *   get:
 *     summary: Get course by ID
 *     tags: [Courses]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Course details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 course:
 *                   $ref: '#/components/schemas/Course'
 *       404:
 *         description: Course not found
 */
router.get('/:id', protect, getCourse)

/**
 * @swagger
 * /api/courses/{id}/enroll:
 *   post:
 *     summary: Enroll in a course (Student only)
 *     tags: [Courses]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Enrolled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Enrolled successfully
 *                 course:
 *                   $ref: '#/components/schemas/Course'
 *       400:
 *         description: Already enrolled
 *       403:
 *         description: Access denied - Student role required
 *       404:
 *         description: Course not found
 */
router.post('/:id/enroll', protect, restrictTo('student'), enrollStudent)

export default router;
