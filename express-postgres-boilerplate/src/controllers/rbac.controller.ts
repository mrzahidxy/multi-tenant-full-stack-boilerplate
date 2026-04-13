import { Response } from 'express';

import { rbacDefinitions } from '../config/rbac';
import type { AuthenticatedRequest } from '../types/http';

export const rbacController = {
  definitions: async (_req: AuthenticatedRequest, res: Response) => {
    res.status(200).json(rbacDefinitions());
  },
};
