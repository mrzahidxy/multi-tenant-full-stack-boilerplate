import { Response } from 'express';

import type { AuthenticatedRequest } from '../types/http';
import { adminService } from '../services/admin.service';

export const adminController = {
  listLicenses: async (_req: AuthenticatedRequest, res: Response) => {
    const data = await adminService.listLicenses();
    res.status(200).json(data);
  },

  listAuditLogs: async (_req: AuthenticatedRequest, res: Response) => {
    const data = await adminService.listAuditLogs();
    res.status(200).json(data);
  },

  getOrganizerActivity: async (req: AuthenticatedRequest, res: Response) => {
    const { organizerId } = req.params as { organizerId: string };
    const activity = await adminService.getOrganizerActivity(organizerId);
    res.status(200).json(activity);
  },

  getSystemOverview: async (_req: AuthenticatedRequest, res: Response) => {
    const overview = await adminService.getSystemOverview();
    res.status(200).json(overview);
  },
};
