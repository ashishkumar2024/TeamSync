import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@teamsync.local';

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: 'Admin User',
    },
  });

  const org = await prisma.organization.upsert({
    where: { id: 'demo-org' },
    update: {},
    create: {
      id: 'demo-org',
      name: 'Demo Organization',
    },
  });

  await prisma.membership.upsert({
    where: {
      userId_organizationId: {
        userId: admin.id,
        organizationId: org.id,
      },
    },
    update: { role: Role.ADMIN },
    create: {
      userId: admin.id,
      organizationId: org.id,
      role: Role.ADMIN,
    },
  });

  // eslint-disable-next-line no-console
  console.log('Seed completed');
}

void main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

