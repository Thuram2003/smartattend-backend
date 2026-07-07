import express from 'express'
import { 
  getAdminStats,
  getAllLecturers,
  getAllStudents,
  getAllCourses
} from '../controllers/adminDashboardController.js'
import {
  createLecturer,
  getLecturerById,
  updateLecturer,
  deleteLecturer,
  createStudent,
  getStudentById,
  updateStudent,
  deleteStudent,
  resetUserPassword
} from '../controllers/adminUserController.js'
import {
  createCourseAdmin,
  getCourseByIdAdmin,
  updateCourseAdmin,
  deleteCourseAdmin,
  enrollStudentAdmin,
  removeStudentAdmin,
  getCourseStatsAdmin
} from '../controllers/adminCourseController.js'
import { protect, restrictTo } from '../middlewares/authMiddleware.js'

const router = express.Router()

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Get admin dashboard statistics
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Admin statistics retrieved successfully
 *       403:
 *         description: Access denied - Admin role required
 */
router.get('/stats', protect, restrictTo('admin'), getAdminStats)

/**
 * @swagger
 * /api/admin/lecturers:
 *   get:
 *     summary: Get all lecturers (with pagination and search)
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, email, or department
 *     responses:
 *       200:
 *         description: Lecturers retrieved successfully
 *       403:
 *         description: Access denied - Admin role required
 */
router.get('/lecturers', protect, restrictTo('admin'), getAllLecturers)

/**
 * @swagger
 * /api/admin/students:
 *   get:
 *     summary: Get all students (with pagination and search)
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, email, or student ID
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Filter by department
 *     responses:
 *       200:
 *         description: Students retrieved successfully
 *       403:
 *         description: Access denied - Admin role required
 */
router.get('/students', protect, restrictTo('admin'), getAllStudents)

/**
 * @swagger
 * /api/admin/courses:
 *   get:
 *     summary: Get all courses (admin view with lecturer info)
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by course name or code
 *     responses:
 *       200:
 *         description: Courses retrieved successfully
 *       403:
 *         description: Access denied - Admin role required
 */
router.get('/courses', protect, restrictTo('admin'), getAllCourses)

// ==========================================
// USER MANAGEMENT ROUTES
// ==========================================

/**
 * @swagger
 * /api/admin/lecturers:
 *   post:
 *     summary: Create a new lecturer account
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - email
 *             properties:
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *               department:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Lecturer created successfully
 *       403:
 *         description: Access denied - Admin role required
 */
router.post('/lecturers', protect, restrictTo('admin'), createLecturer)

/**
 * @swagger
 * /api/admin/lecturers/{id}:
 *   get:
 *     summary: Get lecturer by ID
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lecturer retrieved successfully
 *       404:
 *         description: Lecturer not found
 */
router.get('/lecturers/:id', protect, restrictTo('admin'), getLecturerById)

/**
 * @swagger
 * /api/admin/lecturers/{id}:
 *   put:
 *     summary: Update lecturer information
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *               department:
 *                 type: string
 *     responses:
 *       200:
 *         description: Lecturer updated successfully
 *       404:
 *         description: Lecturer not found
 */
router.put('/lecturers/:id', protect, restrictTo('admin'), updateLecturer)

/**
 * @swagger
 * /api/admin/lecturers/{id}:
 *   delete:
 *     summary: Delete lecturer account
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lecturer deleted successfully
 *       404:
 *         description: Lecturer not found
 */
router.delete('/lecturers/:id', protect, restrictTo('admin'), deleteLecturer)

/**
 * @swagger
 * /api/admin/students:
 *   post:
 *     summary: Create a new student account
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - email
 *               - studentId
 *             properties:
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *               studentId:
 *                 type: string
 *               department:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Student created successfully
 *       403:
 *         description: Access denied - Admin role required
 */
router.post('/students', protect, restrictTo('admin'), createStudent)

/**
 * @swagger
 * /api/admin/students/{id}:
 *   get:
 *     summary: Get student by ID
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Student retrieved successfully
 *       404:
 *         description: Student not found
 */
router.get('/students/:id', protect, restrictTo('admin'), getStudentById)

/**
 * @swagger
 * /api/admin/students/{id}:
 *   put:
 *     summary: Update student information
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *               studentId:
 *                 type: string
 *               department:
 *                 type: string
 *     responses:
 *       200:
 *         description: Student updated successfully
 *       404:
 *         description: Student not found
 */
router.put('/students/:id', protect, restrictTo('admin'), updateStudent)

/**
 * @swagger
 * /api/admin/students/{id}:
 *   delete:
 *     summary: Delete student account
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Student deleted successfully
 *       404:
 *         description: Student not found
 */
router.delete('/students/:id', protect, restrictTo('admin'), deleteStudent)

/**
 * @swagger
 * /api/admin/users/{id}/reset-password:
 *   post:
 *     summary: Reset user password (generates new random password)
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       404:
 *         description: User not found
 */
router.post('/users/:id/reset-password', protect, restrictTo('admin'), resetUserPassword)

// ==========================================
// COURSE MANAGEMENT ROUTES
// ==========================================

/**
 * @swagger
 * /api/admin/courses:
 *   post:
 *     summary: Create a new course (admin can assign any lecturer)
 *     tags: [Admin]
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
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               lecturerId:
 *                 type: string
 *               classroomLocation:
 *                 type: object
 *     responses:
 *       201:
 *         description: Course created successfully
 *       403:
 *         description: Access denied - Admin role required
 */
router.post('/courses', protect, restrictTo('admin'), createCourseAdmin)

/**
 * @swagger
 * /api/admin/courses/{id}:
 *   get:
 *     summary: Get course by ID with full details
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course retrieved successfully
 *       404:
 *         description: Course not found
 */
router.get('/courses/:id', protect, restrictTo('admin'), getCourseByIdAdmin)

/**
 * @swagger
 * /api/admin/courses/{id}:
 *   put:
 *     summary: Update course information
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               lecturerId:
 *                 type: string
 *               classroomLocation:
 *                 type: object
 *     responses:
 *       200:
 *         description: Course updated successfully
 *       404:
 *         description: Course not found
 */
router.put('/courses/:id', protect, restrictTo('admin'), updateCourseAdmin)

/**
 * @swagger
 * /api/admin/courses/{id}:
 *   delete:
 *     summary: Delete course (only if no students enrolled)
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course deleted successfully
 *       400:
 *         description: Cannot delete course with enrolled students
 *       404:
 *         description: Course not found
 */
router.delete('/courses/:id', protect, restrictTo('admin'), deleteCourseAdmin)

/**
 * @swagger
 * /api/admin/courses/{id}/enroll:
 *   post:
 *     summary: Enroll a student in a course
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - studentId
 *             properties:
 *               studentId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Student enrolled successfully
 *       400:
 *         description: Student already enrolled
 *       404:
 *         description: Course or student not found
 */
router.post('/courses/:id/enroll', protect, restrictTo('admin'), enrollStudentAdmin)

/**
 * @swagger
 * /api/admin/courses/{id}/students/{studentId}:
 *   delete:
 *     summary: Remove a student from a course
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Student removed successfully
 *       400:
 *         description: Student not enrolled in course
 *       404:
 *         description: Course not found
 */
router.delete('/courses/:id/students/:studentId', protect, restrictTo('admin'), removeStudentAdmin)

/**
 * @swagger
 * /api/admin/courses/{id}/stats:
 *   get:
 *     summary: Get course statistics
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course statistics retrieved successfully
 *       404:
 *         description: Course not found
 */
router.get('/courses/:id/stats', protect, restrictTo('admin'), getCourseStatsAdmin)

export default router
