import { Role } from '@prisma/client';
import { Router } from 'express';

import { bookingController } from '../controllers/booking.controller';
import { optionalAuth, requireAuth } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import {
  bookingIdParamSchema,
  createBookingSchema,
  createPublicBookingSchema,
  updateBookingSchema,
  listBookingsQuerySchema,
} from '../schemas/booking.schema';

const router = Router();

router.post(
  '/public',
  optionalAuth(),
  validateRequest(createPublicBookingSchema),
  bookingController.createPublicSubmission
);

router.get('/', requireAuth(), validateRequest(listBookingsQuerySchema, 'query'), bookingController.list);

router.get('/:id', requireAuth(),  validateRequest(bookingIdParamSchema, 'params'), bookingController.getById);

router.post('/', requireAuth(), validateRequest(createBookingSchema), bookingController.create);

router.patch(
  '/:id',
  requireAuth(),
  validateRequest(bookingIdParamSchema, 'params'),
  validateRequest(updateBookingSchema),
  bookingController.update
);

router.delete('/:id', requireAuth([Role.ADMIN]), validateRequest(bookingIdParamSchema, 'params'), bookingController.remove);

export default router;
