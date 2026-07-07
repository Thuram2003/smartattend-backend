import mongoose from 'mongoose'

const usedTokenSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now, expires: 3000 },
})

export default mongoose.models.UsedToken || mongoose.model('UsedToken', usedTokenSchema)
