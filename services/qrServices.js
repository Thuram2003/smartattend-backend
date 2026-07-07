import QRCode from 'qrcode'
import jwt from 'jsonwebtoken'

export const generateQRToken = (sessionId) => {
  return jwt.sign(
    { sessionId, type: 'qr' },
    process.env.JWT_SECRET,
    { expiresIn: '30s' }
  )
}

export const generateQRImage = async (token) => {
  return QRCode.toDataURL(token)
}
