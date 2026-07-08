import User from '../models/User.js'
import Course from '../models/course.js'
import Session from '../models/session.js'
import Attendance from '../models/attendance.js'

/**
 * @desc    Get admin dashboard statistics
 * @route   GET /api/admin/stats
 * @access  Private/Admin
 */
export const getAdminStats = async (req, res) => {
  try {
    // Count users by role
    const totalStudents = await User.countDocuments({ role: 'student' })
    const totalLecturers = await User.countDocuments({ role: 'lecturer' })
    const totalAdmins = await User.countDocuments({ role: 'admin' })
    
    // Count total courses
    const totalCourses = await Course.countDocuments()
    
    // Count today's attendance
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const todayAttendance = await Attendance.countDocuments({
      createdAt: { 
        $gte: today,
        $lt: tomorrow
      }
    })
    
    // Count active sessions (currently open)
    const activeSessions = await Session.countDocuments({
      isActive: true,
      windowClosesAt: { $gt: new Date() }
    })
    
    // Calculate overall attendance rate
    const totalSessions = await Session.countDocuments()
    const totalAttendanceRecords = await Attendance.countDocuments()
    const totalEnrollments = await Course.aggregate([
      { $project: { enrolledCount: { $size: '$students' } } }, // FIXED: students not enrolledStudents
      { $group: { _id: null, total: { $sum: '$enrolledCount' } } }
    ])
    
    let attendanceRate = '0%'
    if (totalSessions > 0 && totalEnrollments.length > 0) {
      const expectedAttendance = totalSessions * totalEnrollments[0].total
      if (expectedAttendance > 0) {
        const rate = (totalAttendanceRecords / expectedAttendance * 100)
        // Format: Remove .0 from whole numbers (e.g., 4.0% -> 4%, but 4.5% stays 4.5%)
        const formattedRate = rate % 1 === 0 ? Math.round(rate) : rate.toFixed(1)
        attendanceRate = `${formattedRate}%`
      }
    }
    
    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const recentSessions = await Session.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    })
    
    const recentAttendance = await Attendance.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    })
    
    res.json({
      success: true,
      stats: {
        totalStudents,
        totalLecturers,
        totalAdmins,
        totalCourses,
        todayAttendance,
        activeSessions,
        attendanceRate,
        recentActivity: {
          sessions: recentSessions,
          attendance: recentAttendance
        }
      }
    })
  } catch (err) {
    console.error('[Admin Stats Error]:', err)
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch admin statistics',
      error: err.message 
    })
  }
}

/**
 * @desc    Get all lecturers
 * @route   GET /api/admin/lecturers
 * @access  Private/Admin
 */
export const getAllLecturers = async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '' } = req.query
    
    // Build search query
    const searchQuery = {
      role: 'lecturer'
    }
    
    if (search) {
      searchQuery.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } }
      ]
    }
    
    // Get total count for pagination
    const total = await User.countDocuments(searchQuery)
    
    // Get lecturers with pagination
    const lecturers = await User.find(searchQuery)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean()
    
    res.json({
      success: true,
      lecturers,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    })
  } catch (err) {
    console.error('[Get Lecturers Error]:', err)
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch lecturers',
      error: err.message 
    })
  }
}

/**
 * @desc    Get all students
 * @route   GET /api/admin/students
 * @access  Private/Admin
 */
export const getAllStudents = async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '', department = '' } = req.query
    
    // Build search query
    const searchQuery = {
      role: 'student'
    }
    
    if (department) {
      searchQuery.department = department
    }
    
    if (search) {
      searchQuery.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } }
      ]
    }
    
    // Get total count for pagination
    const total = await User.countDocuments(searchQuery)
    
    // Get students with pagination
    const students = await User.find(searchQuery)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean()
    
    res.json({
      success: true,
      students,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    })
  } catch (err) {
    console.error('[Get Students Error]:', err)
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch students',
      error: err.message 
    })
  }
}

/**
 * @desc    Get all courses (admin view)
 * @route   GET /api/admin/courses
 * @access  Private/Admin
 */
export const getAllCourses = async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '' } = req.query
    
    // Build search query
    const searchQuery = {}
    
    if (search) {
      searchQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ]
    }
    
    // Get total count for pagination
    const total = await Course.countDocuments(searchQuery)
    
    // Get courses with lecturer info
    const courses = await Course.find(searchQuery)
      .populate('lecturer', 'fullName email department')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean()
    
    // Add enrollment count to each course
    const coursesWithStats = courses.map(course => ({
      ...course,
      enrollmentCount: course.students?.length || 0 // FIXED: students not enrolledStudents
    }))
    
    res.json({
      success: true,
      courses: coursesWithStats,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    })
  } catch (err) {
    console.error('[Get Courses Error]:', err)
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch courses',
      error: err.message 
    })
  }
}
