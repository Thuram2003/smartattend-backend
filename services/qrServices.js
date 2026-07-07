import QRCode from 'qrcode'
import jwt from 'jsonwebtoken'

export const generateQRToken = (sessionId) => {
  return jwt.sign(
    { sessionId, type: 'qr' },
    process.env.JWT_SECRET,
    { expiresIn: '7m' } // 7 minutes - matches 5min session + 2min grace period
  )
}

export const generateQRImage = async (token) => {
  return QRCode.toDataURL(token)
}
