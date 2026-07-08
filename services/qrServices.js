import QRCode from 'qrcode'
import jwt from 'jsonwebtoken'

export const generateQRToken = (sessionId) => {
  return jwt.sign(
    { sessionId, type: 'qr' },
    process.env.JWT_SECRET,
    { expiresIn: '2m' } // 2 minutes (120s) - optimized: 100s QR + 15s grace + 5s buffer
  )
}

export const generateQRImage = async (token) => {
  return QRCode.toDataURL(token)
}
