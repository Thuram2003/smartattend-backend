import User from '../models/User.js'
import jwt from 'jsonwebtoken'

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN })
}

export const register = async (req, res) => {
  try {
    const { fullName, email, password, role, studentId, department } = req.body
    const exists = await User.findOne({ email })
    if (exists) return res.status(400).json({ message: 'Email already registered' })

    const user = await User.create({ fullName, email, password, role, studentId, department })
    const token = generateToken(user._id)

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    res.status(201).json({
      success: true,
      token,
      user: { _id: user._id, fullName: user.fullName, email: user.email, role: user.role, studentId: user.studentId, department: user.department },
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email })
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const token = generateToken(user._id)

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    res.json({
      success: true,
      token,
      user: { _id: user._id, fullName: user.fullName, email: user.email, role: user.role, studentId: user.studentId, department: user.department },
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const logout = (req, res) => {
  res.clearCookie('token')
  res.json({ success: true, message: 'Logged Out' })
}

export const getMe = async (req, res) => {
  const user = await User.findById(req.user?.id).select('-password')
  res.json({ success: true, user })
}

export const updateMe = async (req, res) => {
  try {
    const { fullName, studentId, department, profilePhoto } = req.body
    const user = await User.findById(req.user.id)
    if (!user) return res.status(404).json({ message: 'User not found' })

    if (fullName !== undefined) user.fullName = fullName
    if (studentId !== undefined) user.studentId = studentId
    if (department !== undefined) user.department = department
    if (profilePhoto !== undefined) user.profilePhoto = profilePhoto

    await user.save()
    res.json({ 
      success: true, 
      user: { 
        _id: user._id, 
        fullName: user.fullName, 
        role: user.role, 
        studentId: user.studentId, 
        department: user.department, 
        profilePhoto: user.profilePhoto 
      } 
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
