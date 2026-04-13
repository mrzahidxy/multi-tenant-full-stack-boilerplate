import { uploadBufferToCloudinary } from '../utils/cloudinary';
import { HttpError } from '../utils/http-error';

export const uploadService = {
  uploadImage: async (file: Express.Multer.File) => {
    if (!file.mimetype.startsWith('image/')) {
      throw new HttpError(400, 'Only image uploads are supported');
    }

    const result = await uploadBufferToCloudinary(file.buffer, {
      folder: 'booking-app/uploads',
      resource_type: 'image',
      public_id: file.originalname.split('.').shift(),
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      bytes: result.bytes,
      format: result.format,
    };
  },
};
