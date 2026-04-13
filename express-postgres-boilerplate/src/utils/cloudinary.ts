import { UploadApiOptions, UploadApiResponse, v2 as cloudinary } from 'cloudinary';

import { env } from './env';

if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
}

export const uploadBufferToCloudinary = (
  buffer: Buffer,
  options: UploadApiOptions
): Promise<UploadApiResponse> => {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary credentials are not configured');
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) {
        reject(error);
        return;
      }

      if (!result) {
        reject(new Error('Cloudinary upload returned no result'));
        return;
      }

      resolve(result);
    });

    uploadStream.end(buffer);
  });
};
