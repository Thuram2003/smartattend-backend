import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export const uploadImage = async (base64Image) => {
  try {
    const result = await cloudinary.uploader.upload(base64Image, {
      folder: 'attendance_photos',
      resource_type: 'image',
    })
    return result.secure_url
  } catch (error) {
    throw new Error('Image upload failed: ' + error.message)
  }
}

export default cloudinary
