import type { AuthenticatedUser } from '../types/user';
import { HttpError } from '../utils/http-error';
import { prisma } from '../utils/prisma';
import { organizerMembershipScope } from './tenant-scope.service';

export const projectService = {
  listOrganizers(actor: AuthenticatedUser) {
    return prisma.organizer.findMany({
      where: organizerMembershipScope(actor),
      select: { id: true, name: true },
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
    });
  },

  async list(actor: AuthenticatedUser, organizerId: string) {
    const organizer = await prisma.organizer.findFirst({
      where: { id: organizerId, ...organizerMembershipScope(actor) },
      select: {
        projects: {
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        },
      },
    });

    if (!organizer) throw new HttpError(404, 'Organizer not found');
    return organizer.projects;
  },

  create(actor: AuthenticatedUser, organizerId: string, name: string) {
    return prisma.$transaction(async (tx) => {
      const organizer = await tx.organizer.findFirst({
        where: { id: organizerId, ...organizerMembershipScope(actor) },
        select: { id: true },
      });
      if (!organizer) throw new HttpError(404, 'Organizer not found');
      return tx.project.create({ data: { organizerId: organizer.id, name } });
    });
  },

  async update(actor: AuthenticatedUser, organizerId: string, id: string, name: string) {
    const result = await prisma.project.updateMany({
      where: { id, organizerId, organizer: organizerMembershipScope(actor) },
      data: { name },
    });
    if (result.count !== 1) throw new HttpError(404, 'Project not found');
  },

  async remove(actor: AuthenticatedUser, organizerId: string, id: string) {
    const result = await prisma.project.deleteMany({
      where: { id, organizerId, organizer: organizerMembershipScope(actor) },
    });
    if (result.count !== 1) throw new HttpError(404, 'Project not found');
  },
};
