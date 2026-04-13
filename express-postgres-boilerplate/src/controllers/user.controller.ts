import { Response } from 'express';

import { userService } from '../services/user.service';
import type { AuthenticatedRequest } from '../types/http';
import type {
  ListUsersQuery,
  UpdateUserInput,
  CreateUserInput,
  UpdateUserRoleInput,
} from '../schemas/user.schema';

export const userController = {
  list: async (req: AuthenticatedRequest, res: Response) => {
    const query = req.query as ListUsersQuery;
    const users = await userService.list(req.user!, query);
    res.status(200).json(users);
  },

  getById: async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params as unknown as { id: number };
    const user = await userService.getById(id, req.user!);
    res.status(200).json(user);
  },

  create: async (req: AuthenticatedRequest, res: Response) => {
    const payload = req.body as CreateUserInput;
    const user = await userService.create(payload, req.user!);

    res.status(201).json({
      message: 'User created successfully',
      user,
    });
  },

  update: async (req: AuthenticatedRequest, res: Response) => {
    const payload = req.body as UpdateUserInput;
    const { id } = req.params as unknown as { id: number };
    const user = await userService.update(id, payload, req.user!);

    res.status(200).json({
      message: 'User updated successfully',
      user,
    });
  },

  updateRole: async (req: AuthenticatedRequest, res: Response) => {
    const payload = req.body as UpdateUserRoleInput;
    const { id } = req.params as unknown as { id: number };
    const user = await userService.updateRole(id, payload, req.user!);

    res.status(200).json({
      message: 'User role updated successfully',
      user,
    });
  },

  remove: async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params as unknown as { id: number };
    await userService.remove(id, req.user!);
    res.status(204).send();
  },
};
