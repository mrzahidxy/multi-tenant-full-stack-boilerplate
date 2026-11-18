import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const database = new URL(process.env.DATABASE_URL ?? '');
if (
  process.env.NODE_ENV === 'production' ||
  !['localhost', '127.0.0.1'].includes(database.hostname) ||
  database.port !== '5433' ||
  database.pathname !== '/app_db'
) {
  throw new Error('The starter seed requires the local Compose database on port 5433');
}

const prisma = new PrismaClient();

async function seed() {
  const passwordHash = await bcrypt.hash('changeMeOwner1!', 10);
  await prisma.$transaction(async (tx) => {
    const owners = [
      { email: 'owner@example.com', name: 'Northwind', projectId: 'cd145880-ed56-430e-9417-170a2a30153a' },
      { email: 'owner2@example.com', name: 'Blue Harbor', projectId: 'cd145880-ed56-430e-9417-170a2a30153b' },
    ];
    const staff = await tx.user.upsert({
      where: { email: 'staff1@example.com' },
      create: { email: 'staff1@example.com', name: 'Demo staff', role: Role.STAFF, passwordHash },
      update: {},
    });

    for (const { email, name, projectId } of owners) {
      const owner = await tx.user.upsert({
        where: { email },
        create: { email, name, role: Role.OWNER, passwordHash },
        update: {},
      });
      const organizer = await tx.organizer.upsert({
        where: { ownerId: owner.id },
        create: { name, ownerId: owner.id },
        update: {},
      });
      await tx.project.upsert({
        where: { id: projectId },
        create: { id: projectId, organizerId: organizer.id, name: `${name} demo project` },
        update: {},
      });

      if (email === owners[0].email) {
        await tx.organizerStaff.upsert({
          where: { organizerId_userId: { organizerId: organizer.id, userId: staff.id } },
          create: { organizerId: organizer.id, userId: staff.id },
          update: {},
        });
      }
    }
  });
}

seed()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
