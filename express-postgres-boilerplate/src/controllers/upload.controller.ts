import { Request, Response } from 'express';

import { uploadService } from '../services/upload.service';
import { HttpError } from '../utils/http-error';
import { successResponse } from '../utils/api-response';

export const uploadController = {
  uploadSingleImage: async (req: Request, res: Response) => {
    if (!req.file) {
      throw new HttpError(400, 'File is required');
    }

    const result = await uploadService.uploadImage(req.file);
    res.status(201).json(successResponse(result, { message: 'Image uploaded successfully' }));
  },
};
