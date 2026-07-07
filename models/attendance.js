import mongoose from 'mongoose'

const attendanceSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
  photoUrl: { type: String },
  deviceFingerprint: { type: String },
  location: { lat: Number, lng: Number },  // FIXED: log → lng
  status: { type: String, enum: ['present', 'suspicious'], default: 'present' },
}, { timestamps: true })

// Indexes for query optimization
attendanceSchema.index({ student: 1, session: 1 }, { unique: true })
attendanceSchema.index({ createdAt: -1 })  // NEW: For "today's attendance" queries
attendanceSchema.index({ session: 1, createdAt: -1 })  // NEW: For session attendance lists

export default mongoose.models.Attendance || mongoose.model('Attendance', attendanceSchema)
