import Session from '../models/session.js';
import Attendance from '../models/attendance.js';
import User from '../models/User.js';


export const getLecturerDashboard = async (req, res) => {
  try {
    const lecturerId = req.user.id;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Currently active session for this lecturer
    const activeSession = await Session.findOne({
      lecturer: lecturerId,
      isActive: true,
    }).populate('course', 'name code');

    // All sessions held today
    const todaySessions = await Session.find({
      lecturer: lecturerId,
      createdAt: { $gte: todayStart, $lte: todayEnd },
    })
      .populate('course', 'name code')
      .sort({ createdAt: -1 });

    // Attendance count per today's session
    const sessionSummaries = await Promise.all(
      todaySessions.map(async (session) => {
        const count = await Attendance.countDocuments({ session: session._id });
        return {
          sessionId: session._id,
          course: session.course,
          isActive: session.isActive,
          windowClosesAt: session.windowClosesAt,
          attendanceCount: count,
          createdAt: session.createdAt,
        };
      })
    );

    // Total sessions ever created by this lecturer
    const totalSessions = await Session.countDocuments({ lecturer: lecturerId });

    // Total unique students who have attended any of their sessions
    const allSessionIds = await Session.find({ lecturer: lecturerId }).distinct('_id');
    const totalStudentsReached = await Attendance.distinct('student', {
      session: { $in: allSessionIds },
    });

    res.json({
      success: true,
      activeSession: activeSession || null,
      todaySessions: sessionSummaries,
      stats: {
        totalSessions,
        totalStudentsReached: totalStudentsReached.length,
        todaySessionCount: todaySessions.length,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getStudentDashboard = async (req, res) => {
  try {
    const studentId = req.user.id;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // All attendance records for this student (most recent first)
    const allRecords = await Attendance.find({ student: studentId })
      .populate({
        path: 'session',
        select: 'course createdAt windowClosesAt',
        populate: { path: 'course', select: 'name code' },
      })
      .sort({ createdAt: -1 });

    // Today's attendance records
    const todayRecords = allRecords.filter(
      (r) => r.createdAt >= todayStart && r.createdAt <= todayEnd
    );

    // 5 most recent records for the UI feed
    const recentRecords = allRecords.slice(0, 5);

    // Attendance rate: attended / total sessions that have closed
    const totalClosedSessions = await Session.countDocuments({ isActive: false });
    const attendanceRate =
      totalClosedSessions > 0
        ? ((allRecords.length / totalClosedSessions) * 100).toFixed(1)
        : '0.0';

    // Any currently active session the student can still join
    const activeSession = await Session.findOne({ isActive: true })
      .populate('course', 'name code')
      .select('course pin windowClosesAt qrExpiresAt');

    res.json({
      success: true,
      activeSession: activeSession || null,
      recentAttendance: recentRecords,
      todayAttendance: todayRecords,
      stats: {
        totalAttended: allRecords.length,
        todayCount: todayRecords.length,
        attendanceRate: `${attendanceRate}%`,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const getAdminDashboard = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [
      totalStudents,
      totalLecturers,
      totalSessions,
      activeSessions,
      totalAttendance,
      todayAttendance,
      todaySessions,
    ] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'lecturer' }),
      Session.countDocuments(),
      Session.countDocuments({ isActive: true }),
      Attendance.countDocuments(),
      Attendance.countDocuments({ createdAt: { $gte: todayStart, $lte: todayEnd } }),
      Session.countDocuments({ createdAt: { $gte: todayStart, $lte: todayEnd } }),
    ]);

    // 5 most recently created sessions with attendance counts
    const recentSessions = await Session.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('course', 'name code')
      .populate('lecturer', 'fullName');

    const recentSessionSummaries = await Promise.all(
      recentSessions.map(async (session) => {
        const count = await Attendance.countDocuments({ session: session._id });
        return {
          sessionId: session._id,
          course: session.course,
          lecturer: session.lecturer,
          isActive: session.isActive,
          attendanceCount: count,
          createdAt: session.createdAt,
        };
      })
    );

    res.json({
      success: true,
      stats: {
        totalStudents,
        totalLecturers,
        totalSessions,
        activeSessions,
        totalAttendance,
        todayAttendance,
        todaySessions,
      },
      recentSessions: recentSessionSummaries,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
