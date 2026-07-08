import Session from '../models/session.js';
import { generateQRToken, generateQRImage } from '../services/qrServices.js';
import { generatePIN } from '../services/pinServices.js';
import { emitNewQR } from '../services/socketService.js';

export const startSession = async (req, res) => {
  try {
    const { courseId, windowMinutes = 15 } = req.body
    
    if (!courseId) {
      return res.status(400).json({ message: 'courseId is required' })
    }
    if (windowMinutes < 1 || windowMinutes > 120) {
      return res.status(400).json({ message: 'windowMinutes must be between 1 and 120' })
    }

    // Check if there's already an active session for this course
    const existingSession = await Session.findOne({
      course: courseId,
      lecturer: req.user.id,
      isActive: true
    })

    if (existingSession) {
      return res.status(400).json({ 
        message: 'An active session already exists for this course. Please close it first.' 
      })
    }

    const pin = generatePIN()
    const now = new Date()
    const session = await Session.create({
      course: courseId,
      lecturer: req.user.id,
      pin,
      qrToken: 'pending',
      qrExpiresAt: new Date(now.getTime() + 100 * 1000), // 100 seconds - optimized timing
      windowClosesAt: new Date(now.getTime() + windowMinutes * 60000),
    })
    
    const qrToken = generateQRToken(session._id)
    session.qrToken = qrToken
    await session.save()
    
    const qrImage = await generateQRImage(qrToken)
    res.status(201).json({ success: true, session, qrImage, pin })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const refreshQR = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session || !session.isActive)
      return res.status(400).json({ message: 'Session not active' });

    const qrToken = generateQRToken(session._id);
    const pin = generatePIN();

    session.qrToken = qrToken;
    session.pin = pin;
    session.qrExpiresAt = new Date(Date.now() + 100 * 1000); // 100 seconds - optimized timing
    await session.save();

    const qrImage = await generateQRImage(qrToken);
    emitNewQR(session._id.toString(), qrImage, pin, session.qrExpiresAt);

    res.json({ 
      success: true, 
      qrImage, 
      pin, 
      qrToken,
      session: {
        _id: session._id,
        qrExpiresAt: session.qrExpiresAt
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const closeSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    session.isActive = false;
    await session.save();

    res.json({ success: true, message: 'Session closed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
