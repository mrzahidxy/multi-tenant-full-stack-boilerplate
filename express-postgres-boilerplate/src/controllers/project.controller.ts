import type { Request, Response } from 'express';

import { projectService } from '../services/project.service';
import { successResponse } from '../utils/api-response';

type OrganizerRequest = Request<{ organizerId: string }>;
type ProjectRequest = Request<{ organizerId: string; projectId: string }>;

export const projectController = {
  async listOrganizers(req: Request, res: Response) {
    res.json(successResponse(await projectService.listOrganizers(req.user!)));
  },

  async list(req: OrganizerRequest, res: Response) {
    res.json(successResponse(await projectService.list(req.user!, req.params.organizerId)));
  },

  async create(req: OrganizerRequest, res: Response) {
    const project = await projectService.create(req.user!, req.params.organizerId, req.body.name);
    res.status(201).json(successResponse(project));
  },

  async update(req: ProjectRequest, res: Response) {
    await projectService.update(req.user!, req.params.organizerId, req.params.projectId, req.body.name);
    res.sendStatus(204);
  },

  async remove(req: ProjectRequest, res: Response) {
    await projectService.remove(req.user!, req.params.organizerId, req.params.projectId);
    res.sendStatus(204);
  },
};
