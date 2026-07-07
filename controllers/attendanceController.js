import jwt from 'jsonwebtoken';
import Session from '../models/session.js';
import Attendance from '../models/attendance.js';
import UsedToken from '../models/usedToken.js';
import Course from '../models/course.js';
import { getIO } from '../services/socketService.js';

// Helper: Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
}

// @POST /api/attendance/mark
export const markAttendance = async (req, res) => {
    try {
        const { qrToken, pin, deviceFingerprint, location } = req.body;

        // 1. Verify QR token
        let decoded;
        try {
            decoded = jwt.verify(qrToken, process.env.JWT_SECRET);
        } catch {
            return res.status(400).json({ message: 'QR code expired or invalid' });
        }

        // 2. Check token not already used
        const tokenUsed = await UsedToken.findOne({ token: qrToken });
        if (tokenUsed) return res.status(400).json({ message: 'QR code already used' });

        // 3. Find active session with course data
        const session = await Session.findById(decoded.sessionId).populate('course');
        if (!session || !session.isActive) {
            return res.status(400).json({ message: 'Session is not active' });
        }

        // 4. Check QR expiry (be lenient - allow if within session window)
        const qrAge = (new Date() - session.qrExpiresAt) / 1000; // seconds
        
        // Allow up to 2 minutes grace period after QR expires for students to complete the flow
        if (qrAge > 120) {
            return res.status(400).json({ message: 'QR code expired. Please scan the latest QR code.' });
        }

        // 5. Check attendance window
        if (new Date() > session.windowClosesAt)
            return res.status(400).json({ message: 'Attendance window closed' });

        // 6. NEW: Check PIN lockout
        if (session.pinLockedUntil && new Date() < session.pinLockedUntil) {
            const waitMinutes = Math.ceil((session.pinLockedUntil - new Date()) / 60000);
            return res.status(429).json({ 
                message: `Too many failed PIN attempts. Try again in ${waitMinutes} minute(s).` 
            });
        }

        // 7. NEW: Validate PIN with attempt tracking
        if (pin !== session.pin) {
            session.pinAttempts += 1;
            
            if (session.pinAttempts >= 3) {
                session.pinLockedUntil = new Date(Date.now() + 5 * 60000); // 5 min lockout
                await session.save();
                return res.status(429).json({ 
                    message: 'Too many failed PIN attempts. Session locked for 5 minutes.' 
                });
            }
            
            await session.save();
            return res.status(400).json({ 
                message: `Incorrect PIN. ${3 - session.pinAttempts} attempt(s) remaining.` 
            });
        }

        // Reset PIN attempts on success
        session.pinAttempts = 0;
        session.pinLockedUntil = null;

        // 8. NEW: Geofencing validation
        if (session.course?.classroomLocation?.lat && session.course?.classroomLocation?.lng) {
            if (!location?.lat || !location?.lng) {
                return res.status(400).json({ message: 'Location is required for this session' });
            }

            const distance = calculateDistance(
                session.course.classroomLocation.lat,
                session.course.classroomLocation.lng,
                location.lat,
                location.lng
            );

            const maxDistance = session.course.classroomLocation.radius || 100;

            if (distance > maxDistance) {
                // Mark as suspicious but still record
                const suspiciousAttendance = await Attendance.create({
                    student: req.user._id,
                    session: session._id,
                    deviceFingerprint,
                    location,
                    photoUrl: req.body.photoUrl || null,
                    status: 'suspicious'
                });

                await session.save();

                return res.status(201).json({ 
                    success: true, 
                    attendance: suspiciousAttendance,
                    warning: `You are ${Math.round(distance)}m away from the classroom. Marked as suspicious.`
                });
            }
        }

        // 9. Check duplicate attendance
        const duplicate = await Attendance.findOne({
            student: req.user.id,
            session: session._id,
        });
        if (duplicate) return res.status(400).json({ message: 'Attendance already marked' });

        // 10. Blacklist token
        await UsedToken.create({ token: qrToken });

        // 11. Record attendance
        const attendance = await Attendance.create({
            student: req.user._id,
            session: session._id,
            deviceFingerprint,
            location,
            photoUrl: req.body.photoUrl || null,
            status: 'present'
        });

        // Save session (to persist PIN attempt reset)
        await session.save();

        // 12. Emit attendance-marked event via WebSocket
        try {
            const populatedAttendance = await Attendance.findById(attendance._id)
                .populate('student', 'fullName studentId profilePhoto');
            
            const io = getIO();
            io.to(session._id.toString()).emit('attendance-marked', {
                attendance: populatedAttendance,
                student: populatedAttendance.student
            });
        } catch (socketErr) {
            console.error('⚠️ Failed to emit socket event:', socketErr.message);
        }

        res.status(201).json({ success: true, attendance });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @GET /api/attendance/session/:sessionId
export const getSessionAttendance = async (req, res) => {
    try {
        const records = await Attendance.find({ session: req.params.sessionId })
            .populate('student', 'fullName studentId profilePhoto');
        res.json({ success: true, count: records.length, records });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
