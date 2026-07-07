import User from '../models/User.js'
import jwt from 'jsonwebtoken'

/**
 * @desc    Generate random password
 */
const generateRandomPassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

/**
 * @desc    Create a new lecturer account
 * @route   POST /api/admin/lecturers
 * @access  Private/Admin
 */
export const createLecturer = async (req, res) => {
  try {
    const { fullName, email, department, password } = req.body
    
    // Validate required fields
    if (!fullName || !email) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide fullName and email' 
      })
    }
    
    // Check if email already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'A user with this email already exists' 
      })
    }
    
    // Generate password if not provided
    const generatedPassword = password || generateRandomPassword()
    
    // Create lecturer user
    const lecturer = await User.create({
      fullName,
      email,
      password: generatedPassword,
      role: 'lecturer',
      department: department || 'Not Assigned',
      studentId: null // Lecturers don't have student IDs
    })
    
    // Return lecturer info and generated password
    res.status(201).json({
      success: true,
      message: 'Lecturer account created successfully',
      lecturer: {
        id: lecturer._id,
        fullName: lecturer.fullName,
        email: lecturer.email,
        role: lecturer.role,
        department: lecturer.department,
        createdAt: lecturer.createdAt
      },
      // Include generated password in response so admin can share it
      generatedPassword: generatedPassword
    })
  } catch (err) {
    console.error('[Create Lecturer Error]:', err)
    res.status(500).json({ 
      success: false,
      message: 'Failed to create lecturer account',
      error: err.message 
    })
  }
}

/**
 * @desc    Get single lecturer by ID
 * @route   GET /api/admin/lecturers/:id
 * @access  Private/Admin
 */
export const getLecturerById = async (req, res) => {
  try {
    const lecturer = await User.findById(req.params.id)
      .select('-password')
      .lean()
    
    if (!lecturer) {
      return res.status(404).json({ 
        success: false,
        message: 'Lecturer not found' 
      })
    }
    
    if (lecturer.role !== 'lecturer') {
      return res.status(400).json({ 
        success: false,
        message: 'User is not a lecturer' 
      })
    }
    
    res.json({
      success: true,
      lecturer
    })
  } catch (err) {
    console.error('[Get Lecturer Error]:', err)
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch lecturer',
      error: err.message 
    })
  }
}

/**
 * @desc    Update lecturer information
 * @route   PUT /api/admin/lecturers/:id
 * @access  Private/Admin
 */
export const updateLecturer = async (req, res) => {
  try {
    const { fullName, email, department } = req.body
    
    // Find lecturer
    const lecturer = await User.findById(req.params.id)
    
    if (!lecturer) {
      return res.status(404).json({ 
        success: false,
        message: 'Lecturer not found' 
      })
    }
    
    if (lecturer.role !== 'lecturer') {
      return res.status(400).json({ 
        success: false,
        message: 'User is not a lecturer' 
      })
    }
    
    // Check if email is being changed and if it's already taken
    if (email && email !== lecturer.email) {
      const emailExists = await User.findOne({ email })
      if (emailExists) {
        return res.status(400).json({ 
          success: false,
          message: 'Email is already in use' 
        })
      }
      lecturer.email = email
    }
    
    // Update fields
    if (fullName) lecturer.fullName = fullName
    if (department) lecturer.department = department
    
    await lecturer.save()
    
    res.json({
      success: true,
      message: 'Lecturer updated successfully',
      lecturer: {
        id: lecturer._id,
        fullName: lecturer.fullName,
        email: lecturer.email,
        role: lecturer.role,
        department: lecturer.department,
        updatedAt: lecturer.updatedAt
      }
    })
  } catch (err) {
    console.error('[Update Lecturer Error]:', err)
    res.status(500).json({ 
      success: false,
      message: 'Failed to update lecturer',
      error: err.message 
    })
  }
}

/**
 * @desc    Delete lecturer account
 * @route   DELETE /api/admin/lecturers/:id
 * @access  Private/Admin
 */
export const deleteLecturer = async (req, res) => {
  try {
    const lecturer = await User.findById(req.params.id)
    
    if (!lecturer) {
      return res.status(404).json({ 
        success: false,
        message: 'Lecturer not found' 
      })
    }
    
    if (lecturer.role !== 'lecturer') {
      return res.status(400).json({ 
        success: false,
        message: 'User is not a lecturer' 
      })
    }
    
    // Delete the lecturer
    await User.findByIdAndDelete(req.params.id)
    
    res.json({
      success: true,
      message: 'Lecturer deleted successfully'
    })
  } catch (err) {
    console.error('[Delete Lecturer Error]:', err)
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete lecturer',
      error: err.message 
    })
  }
}

/**
 * @desc    Create a new student account
 * @route   POST /api/admin/students
 * @access  Private/Admin
 */
export const createStudent = async (req, res) => {
  try {
    const { fullName, email, studentId, department, password } = req.body
    
    // Validate required fields
    if (!fullName || !email || !studentId) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide fullName, email, and studentId' 
      })
    }
    
    // Check if email already exists
    const existingEmail = await User.findOne({ email })
    if (existingEmail) {
      return res.status(400).json({ 
        success: false,
        message: 'A user with this email already exists' 
      })
    }
    
    // Check if studentId already exists
    const existingStudentId = await User.findOne({ studentId })
    if (existingStudentId) {
      return res.status(400).json({ 
        success: false,
        message: 'A student with this ID already exists' 
      })
    }
    
    // Generate password if not provided
    const generatedPassword = password || generateRandomPassword()
    
    // Create student user
    const student = await User.create({
      fullName,
      email,
      password: generatedPassword,
      role: 'student',
      studentId,
      department: department || 'Not Assigned'
    })
    
    // Return student info and generated password
    res.status(201).json({
      success: true,
      message: 'Student account created successfully',
      student: {
        id: student._id,
        fullName: student.fullName,
        email: student.email,
        studentId: student.studentId,
        role: student.role,
        department: student.department,
        createdAt: student.createdAt
      },
      // Include generated password in response so admin can share it
      generatedPassword: generatedPassword
    })
  } catch (err) {
    console.error('[Create Student Error]:', err)
    res.status(500).json({ 
      success: false,
      message: 'Failed to create student account',
      error: err.message 
    })
  }
}

/**
 * @desc    Get single student by ID
 * @route   GET /api/admin/students/:id
 * @access  Private/Admin
 */
export const getStudentById = async (req, res) => {
  try {
    const student = await User.findById(req.params.id)
      .select('-password')
      .lean()
    
    if (!student) {
      return res.status(404).json({ 
        success: false,
        message: 'Student not found' 
      })
    }
    
    if (student.role !== 'student') {
      return res.status(400).json({ 
        success: false,
        message: 'User is not a student' 
      })
    }
    
    res.json({
      success: true,
      student
    })
  } catch (err) {
    console.error('[Get Student Error]:', err)
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch student',
      error: err.message 
    })
  }
}

/**
 * @desc    Update student information
 * @route   PUT /api/admin/students/:id
 * @access  Private/Admin
 */
export const updateStudent = async (req, res) => {
  try {
    const { fullName, email, studentId, department } = req.body
    
    // Find student
    const student = await User.findById(req.params.id)
    
    if (!student) {
      return res.status(404).json({ 
        success: false,
        message: 'Student not found' 
      })
    }
    
    if (student.role !== 'student') {
      return res.status(400).json({ 
        success: false,
        message: 'User is not a student' 
      })
    }
    
    // Check if email is being changed and if it's already taken
    if (email && email !== student.email) {
      const emailExists = await User.findOne({ email })
      if (emailExists) {
        return res.status(400).json({ 
          success: false,
          message: 'Email is already in use' 
        })
      }
      student.email = email
    }
    
    // Check if studentId is being changed and if it's already taken
    if (studentId && studentId !== student.studentId) {
      const studentIdExists = await User.findOne({ studentId })
      if (studentIdExists) {
        return res.status(400).json({ 
          success: false,
          message: 'Student ID is already in use' 
        })
      }
      student.studentId = studentId
    }
    
    // Update fields
    if (fullName) student.fullName = fullName
    if (department) student.department = department
    
    await student.save()
    
    res.json({
      success: true,
      message: 'Student updated successfully',
      student: {
        id: student._id,
        fullName: student.fullName,
        email: student.email,
        studentId: student.studentId,
        role: student.role,
        department: student.department,
        updatedAt: student.updatedAt
      }
    })
  } catch (err) {
    console.error('[Update Student Error]:', err)
    res.status(500).json({ 
      success: false,
      message: 'Failed to update student',
      error: err.message 
    })
  }
}

/**
 * @desc    Delete student account
 * @route   DELETE /api/admin/students/:id
 * @access  Private/Admin
 */
export const deleteStudent = async (req, res) => {
  try {
    const student = await User.findById(req.params.id)
    
    if (!student) {
      return res.status(404).json({ 
        success: false,
        message: 'Student not found' 
      })
    }
    
    if (student.role !== 'student') {
      return res.status(400).json({ 
        success: false,
        message: 'User is not a student' 
      })
    }
    
    // Delete the student
    await User.findByIdAndDelete(req.params.id)
    
    res.json({
      success: true,
      message: 'Student deleted successfully'
    })
  } catch (err) {
    console.error('[Delete Student Error]:', err)
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete student',
      error: err.message 
    })
  }
}

/**
 * @desc    Reset user password
 * @route   POST /api/admin/users/:id/reset-password
 * @access  Private/Admin
 */
export const resetUserPassword = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      })
    }
    
    // Generate new random password
    const newPassword = generateRandomPassword()
    
    // Update password
    user.password = newPassword
    await user.save()
    
    res.json({
      success: true,
      message: 'Password reset successfully',
      newPassword: newPassword,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role
      }
    })
  } catch (err) {
    console.error('[Reset Password Error]:', err)
    res.status(500).json({ 
      success: false,
      message: 'Failed to reset password',
      error: err.message 
    })
  }
}
