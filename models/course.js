import mongoose from 'mongoose'

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true},
  code: { type: String, required: true, unique: true },
  lecturer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  // Classroom geofencing (optional)
  classroomLocation: {
    lat: { type: Number },
    lng: { type: Number },
    radius: { type: Number, default: 100 }, // meters
    name: { type: String } // e.g., "Building A, Room 203"
  }
}, { timestamps: true })

// Index for lecturer queries
courseSchema.index({ lecturer: 1 })

export default mongoose.models.Course || mongoose.model('Course', courseSchema)
