import Session from '../models/session.js';
import Attendance from '../models/attendance.js';
import User from '../models/User.js';
import Course from '../models/course.js';


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

    // Get student's enrolled courses first
    const enrolledCourses = await Course.find({
      students: studentId
    }).select('_id name code');
    const enrolledCourseIds = enrolledCourses.map(c => c._id);

    // Get all sessions for enrolled courses (to calculate total possible sessions)
    const allEnrolledSessions = await Session.find({
      course: { $in: enrolledCourseIds }
    }).select('_id isActive createdAt course');

    // Filter closed sessions from enrolled courses
    const closedEnrolledSessions = allEnrolledSessions.filter(s => !s.isActive);
    const closedEnrolledSessionIds = closedEnrolledSessions.map(s => s._id);

    // Get attendance records for enrolled courses only
    const allRecords = await Attendance.find({ 
      student: studentId,
      session: { $in: allEnrolledSessions.map(s => s._id) }
    })
      .populate({
        path: 'session',
        select: 'course createdAt windowClosesAt isActive',
        populate: { path: 'course', select: 'name code' },
      })
      .sort({ createdAt: -1 });

    // Today's attendance records from enrolled courses
    const todayRecords = allRecords.filter(
      (r) => r.createdAt >= todayStart && r.createdAt <= todayEnd
    );

    // 5 most recent records for the UI feed
    const recentRecords = allRecords.slice(0, 5);

    // Calculate attendance rate based on closed sessions from enrolled courses
    const totalClosedEnrolledSessions = closedEnrolledSessions.length;
    const attendedSessionsCount = allRecords.filter(record => 
      closedEnrolledSessionIds.some(id => id.equals(record.session._id))
    ).length;
    
    const attendanceRate = totalClosedEnrolledSessions > 0
      ? Math.round((attendedSessionsCount / totalClosedEnrolledSessions) * 100)
      : 0;

    // Calculate streak (consecutive days with attendance)
    const attendanceDates = allRecords.map(r => {
      const date = new Date(r.createdAt);
      date.setHours(0, 0, 0, 0);
      return date.getTime();
    });
    const uniqueDates = [...new Set(attendanceDates)].sort((a, b) => b - a);
    
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (uniqueDates.length > 0) {
      const mostRecentDate = uniqueDates[0];
      if (mostRecentDate === today.getTime() || mostRecentDate === yesterday.getTime()) {
        currentStreak = 1;
        let expectedDate = mostRecentDate - (24 * 60 * 60 * 1000);
        
        for (let i = 1; i < uniqueDates.length; i++) {
          if (uniqueDates[i] === expectedDate) {
            currentStreak++;
            expectedDate -= (24 * 60 * 60 * 1000);
          } else {
            break;
          }
        }
      }
    }

    // Any currently active session for enrolled courses
    const activeSession = await Session.findOne({ 
      isActive: true,
      course: { $in: enrolledCourseIds }
    })
      .populate('course', 'name code')
      .select('course pin windowClosesAt qrExpiresAt');

    // Check if student already marked attendance for the active session
    let alreadyMarked = false;
    if (activeSession) {
      const existingAttendance = await Attendance.findOne({
        student: studentId,
        session: activeSession._id
      });
      alreadyMarked = !!existingAttendance;
    }

    res.json({
      success: true,
      activeSession: activeSession || null,
      alreadyMarked,
      recentAttendance: recentRecords,
      todayAttendance: todayRecords,
      enrolledCoursesCount: enrolledCourses.length,
      stats: {
        totalAttended: attendedSessionsCount,
        totalSessions: totalClosedEnrolledSessions,
        todayCount: todayRecords.length,
        attendanceRate: `${attendanceRate}%`,
        currentStreak: currentStreak,
        missedSessions: totalClosedEnrolledSessions - attendedSessionsCount,
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
