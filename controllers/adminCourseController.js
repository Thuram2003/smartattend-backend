import Course from '../models/course.js'
import User from '../models/User.js'

/**
 * @desc    Create a new course (Admin)
 * @route   POST /api/admin/courses
 * @access  Private/Admin
 */
export const createCourseAdmin = async (req, res) => {
  try {
    const { name, code, lecturerId, classroomLocation } = req.body
    
    // Validate required fields
    if (!name || !code) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide course name and code' 
      })
    }
    
    // Check if course code already exists
    const existingCourse = await Course.findOne({ code })
    if (existingCourse) {
      return res.status(400).json({ 
        success: false,
        message: 'A course with this code already exists' 
      })
    }
    
    // Validate lecturer if provided
    if (lecturerId) {
      const lecturer = await User.findById(lecturerId)
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
    }
    
    // Create course
    const courseData = {
      name,
      code,
      lecturer: lecturerId || null,
      students: []
    }
    
    if (classroomLocation) {
      courseData.classroomLocation = classroomLocation
    }
    
    const course = await Course.create(courseData)
    
    // Populate lecturer info
    await course.populate('lecturer', 'fullName email department')
    
    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      course
    })
  } catch (err) {
    console.error('[Create Course Error]:', err)
    res.status(500).json({ 
      success: false,
      message: 'Failed to create course',
      error: err.message 
    })
  }
}

/**
 * @desc    Get single course by ID (Admin)
 * @route   GET /api/admin/courses/:id
 * @access  Private/Admin
 */
export const getCourseByIdAdmin = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('lecturer', 'fullName email department')
      .populate('students', 'fullName email studentId department')
      .lean()
    
    if (!course) {
      return res.status(404).json({ 
        success: false,
        message: 'Course not found' 
      })
    }
    
    res.json({
      success: true,
      course: {
        ...course,
        enrollmentCount: course.students?.length || 0
      }
    })
  } catch (err) {
    console.error('[Get Course Error]:', err)
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch course',
      error: err.message 
    })
  }
}

/**
 * @desc    Update course information (Admin)
 * @route   PUT /api/admin/courses/:id
 * @access  Private/Admin
 */
export const updateCourseAdmin = async (req, res) => {
  try {
    const { name, code, lecturerId, classroomLocation } = req.body
    
    const course = await Course.findById(req.params.id)
    
    if (!course) {
      return res.status(404).json({ 
        success: false,
        message: 'Course not found' 
      })
    }
    
    // Check if code is being changed and if it's already taken
    if (code && code !== course.code) {
      const codeExists = await Course.findOne({ code })
      if (codeExists) {
        return res.status(400).json({ 
          success: false,
          message: 'Course code is already in use' 
        })
      }
      course.code = code
    }
    
    // Validate and update lecturer if provided
    if (lecturerId !== undefined) {
      if (lecturerId === null || lecturerId === '') {
        // Allow removing lecturer
        course.lecturer = null
      } else {
        const lecturer = await User.findById(lecturerId)
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
        course.lecturer = lecturerId
      }
    }
    
    // Update other fields
    if (name) course.name = name
    if (classroomLocation) course.classroomLocation = classroomLocation
    
    await course.save()
    await course.populate('lecturer', 'fullName email department')
    
    res.json({
      success: true,
      message: 'Course updated successfully',
      course
    })
  } catch (err) {
    console.error('[Update Course Error]:', err)
    res.status(500).json({ 
      success: false,
      message: 'Failed to update course',
      error: err.message 
    })
  }
}

/**
 * @desc    Delete course (Admin)
 * @route   DELETE /api/admin/courses/:id
 * @access  Private/Admin
 */
export const deleteCourseAdmin = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
    
    if (!course) {
      return res.status(404).json({ 
        success: false,
        message: 'Course not found' 
      })
    }
    
    // Check if course has enrolled students
    if (course.students && course.students.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: `Cannot delete course with ${course.students.length} enrolled student(s). Remove students first.` 
      })
    }
    
    await Course.findByIdAndDelete(req.params.id)
    
    res.json({
      success: true,
      message: 'Course deleted successfully'
    })
  } catch (err) {
    console.error('[Delete Course Error]:', err)
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete course',
      error: err.message 
    })
  }
}

/**
 * @desc    Enroll student in course (Admin)
 * @route   POST /api/admin/courses/:id/enroll
 * @access  Private/Admin
 */
export const enrollStudentAdmin = async (req, res) => {
  try {
    const { studentId } = req.body
    
    if (!studentId) {
      return res.status(400).json({ 
        success: false,
        message: 'Student ID is required' 
      })
    }
    
    const course = await Course.findById(req.params.id)
    
    if (!course) {
      return res.status(404).json({ 
        success: false,
        message: 'Course not found' 
      })
    }
    
    // Validate student
    const student = await User.findById(studentId)
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
    
    // Check if already enrolled
    if (course.students.includes(studentId)) {
      return res.status(400).json({ 
        success: false,
        message: 'Student is already enrolled in this course' 
      })
    }
    
    // Enroll student
    course.students.push(studentId)
    await course.save()
    
    res.json({
      success: true,
      message: 'Student enrolled successfully',
      enrollmentCount: course.students.length
    })
  } catch (err) {
    console.error('[Enroll Student Error]:', err)
    res.status(500).json({ 
      success: false,
      message: 'Failed to enroll student',
      error: err.message 
    })
  }
}

/**
 * @desc    Remove student from course (Admin)
 * @route   DELETE /api/admin/courses/:id/students/:studentId
 * @access  Private/Admin
 */
export const removeStudentAdmin = async (req, res) => {
  try {
    const { id: courseId, studentId } = req.params
    
    const course = await Course.findById(courseId)
    
    if (!course) {
      return res.status(404).json({ 
        success: false,
        message: 'Course not found' 
      })
    }
    
    // Check if student is enrolled
    if (!course.students.includes(studentId)) {
      return res.status(400).json({ 
        success: false,
        message: 'Student is not enrolled in this course' 
      })
    }
    
    // Remove student
    course.students = course.students.filter(id => id.toString() !== studentId)
    await course.save()
    
    res.json({
      success: true,
      message: 'Student removed from course successfully',
      enrollmentCount: course.students.length
    })
  } catch (err) {
    console.error('[Remove Student Error]:', err)
    res.status(500).json({ 
      success: false,
      message: 'Failed to remove student',
      error: err.message 
    })
  }
}

/**
 * @desc    Get course statistics (Admin)
 * @route   GET /api/admin/courses/:id/stats
 * @access  Private/Admin
 */
export const getCourseStatsAdmin = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('lecturer', 'fullName email')
      .populate('students', 'fullName studentId')
      .lean()
    
    if (!course) {
      return res.status(404).json({ 
        success: false,
        message: 'Course not found' 
      })
    }
    
    // You could add more stats here (attendance rates, session counts, etc.)
    const stats = {
      enrollmentCount: course.students?.length || 0,
      hasLecturer: !!course.lecturer,
      lecturerName: course.lecturer?.fullName || 'Not Assigned',
      hasClassroom: !!course.classroomLocation?.name
    }
    
    res.json({
      success: true,
      course: {
        id: course._id,
        name: course.name,
        code: course.code
      },
      stats
    })
  } catch (err) {
    console.error('[Get Course Stats Error]:', err)
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch course statistics',
      error: err.message 
    })
  }
}
