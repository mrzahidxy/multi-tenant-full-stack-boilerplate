import { Request, Response } from 'express';

import { uploadService } from '../services/upload.service';

export const uploadController = {
  uploadSingleImage: async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ message: 'File is required' });
    }

    const result = await uploadService.uploadImage(req.file);
    res.status(201).json(result);
  },
};
