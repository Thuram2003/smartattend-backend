import mongoose from 'mongoose'

const sessionSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  lecturer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  qrToken: { type: String, required: true },
  pin: { type: String, required: true },
  qrExpiresAt: { type: Date, required: true },
  windowClosesAt: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  
  // PIN brute-force protection
  pinAttempts: { type: Number, default: 0 },
  pinLockedUntil: { type: Date, default: null },
  
  // Geofencing (optional per session)
  location: {
    lat: { type: Number },
    lng: { type: Number },
    radius: { type: Number, default: 100 } // meters
  }
}, { timestamps: true })

// Index for finding active sessions
sessionSchema.index({ isActive: 1, windowClosesAt: 1 })

export default mongoose.models.Session || mongoose.model('Session', sessionSchema)
