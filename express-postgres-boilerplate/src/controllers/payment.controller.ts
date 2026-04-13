import { Request, Response } from 'express';

import { paymentService } from '../services/payment.service';
import type { AuthenticatedRequest } from '../types/http';

export const paymentController = {
  handleWebhook: async (req: Request, res: Response) => {
    const signature = req.headers['stripe-signature'];
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from('');

    await paymentService.handleWebhook(
      Array.isArray(signature) ? signature[0] : signature,
      rawBody
    );

    res.status(200).json({ received: true });
  },

  createCheckoutSession: async (req: AuthenticatedRequest, res: Response) => {
    const session = await paymentService.createCheckoutSession(req.body, req.user!);
    res.status(200).json(session);
  },

  listUserPayments: async (req: AuthenticatedRequest, res: Response) => {
    const payments = await paymentService.listByUser(req.user!.id);
    res.status(200).json(payments);
  },
};
