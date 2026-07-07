import Course from '../models/course.js'

export const createCourse = async (req, res) => {
  try {
    const { name, code, lecturerId } = req.body
    
    if (!name || !code || !lecturerId) {
      return res.status(400).json({ message: 'name, code, and lecturerId required' })
    }

    const course = await Course.create({
      name,
      code,
      lecturer: lecturerId,
    })
    res.status(201).json({ success: true, course })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const getCourses = async (req, res) => {
  try {
    const courses = await Course.find().populate('lecturer', 'fullName email')
    res.json({ success: true, courses })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('lecturer', 'fullName email')
      .populate('students', 'fullName studentId email')
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' })
    }
    
    res.json({ success: true, course })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const enrollStudent = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' })
    }
    
    if (course.students.includes(req.user.id)) {
      return res.status(400).json({ message: 'Already enrolled' })
    }
    
    course.students.push(req.user.id)
    await course.save()
    
    res.json({ success: true, message: 'Enrolled successfully', course })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
