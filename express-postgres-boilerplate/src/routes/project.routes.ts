import { Router } from 'express';
import { Role } from '@prisma/client';
import { z } from 'zod';

import { projectController } from '../controllers/project.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { organizerIdParamSchema } from '../schemas/organizer.schema';

const router = Router();
const projectParams = organizerIdParamSchema.extend({ projectId: z.string().uuid() });
const projectBody = z.object({ name: z.string().trim().min(1).max(120) }).strict();

router.use(requireAuth([Role.OWNER, Role.STAFF]));
router.get('/organizers', projectController.listOrganizers);
router.get('/:organizerId', validateRequest(organizerIdParamSchema, 'params'), projectController.list);
router.post(
  '/:organizerId',
  validateRequest(organizerIdParamSchema, 'params'),
  validateRequest(projectBody),
  projectController.create
);
router.patch(
  '/:organizerId/:projectId',
  validateRequest(projectParams, 'params'),
  validateRequest(projectBody),
  projectController.update
);
router.delete('/:organizerId/:projectId', validateRequest(projectParams, 'params'), projectController.remove);

export default router;
