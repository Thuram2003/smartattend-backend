import Attendance from '../models/attendance.js'
import Session from '../models/session.js'

export const exportAttendanceCSV = async (req, res) => {
  try {
    const { sessionId } = req.params

    // Get session with course info
    const session = await Session.findById(sessionId).populate('course', 'name code')
    
    if (!session) {
      return res.status(404).json({ message: 'Session not found' })
    }

    // Verify lecturer owns this session
    if (session.lecturer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' })
    }

    // Get all attendance records
    const records = await Attendance.find({ session: sessionId })
      .populate('student', 'fullName studentId email department')
      .sort({ createdAt: 1 })

    // Build CSV
    const headers = ['Student Name', 'Student ID', 'Email', 'Department', 'Timestamp', 'Status', 'Location', 'Photo URL']
    const rows = records.map(record => [
      record.student?.fullName || 'N/A',
      record.student?.studentId || 'N/A',
      record.student?.email || 'N/A',
      record.student?.department || 'N/A',
      record.createdAt.toISOString(),
      record.status,
      record.location ? `${record.location.lat},${record.location.lng}` : 'N/A',
      record.photoUrl || 'N/A'
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    // Send as downloadable file
    const filename = `attendance_${session.course?.code || 'session'}_${new Date().toISOString().split('T')[0]}.csv`
    
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(csv)

  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
