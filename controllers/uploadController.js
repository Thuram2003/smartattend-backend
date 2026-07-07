import { uploadImage } from '../services/imageService.js'

export const uploadPhoto = async (req, res) => {
  try {
    const { image } = req.body

    if (!image) {
      return res.status(400).json({ message: 'Image is required' })
    }

    // Validate base64 format
    if (!image.startsWith('data:image/')) {
      return res.status(400).json({ message: 'Invalid image format. Expected base64 data URL' })
    }

    const photoUrl = await uploadImage(image)
    
    res.json({ 
      success: true, 
      photoUrl,
      message: 'Image uploaded successfully' 
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
