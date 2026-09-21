import { PrismaClient, Role } from '@prisma/client';
import { hashPassword } from '../src/utils/password.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  const adminUsername = process.env.SEED_ADMIN_USERNAME;
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const rawPassword = process.env.SEED_ADMIN_PASSWORD;

  if (!adminUsername || !adminEmail || !rawPassword) {
    throw new Error(
      'Missing required seed environment variables. Please configure SEED_ADMIN_USERNAME, SEED_ADMIN_EMAIL, and SEED_ADMIN_PASSWORD.'
    );
  }

  const existingAdmin = await prisma.user.findFirst({
    where: {
      OR: [{ username: adminUsername }, { email: adminEmail }],
    },
  });

  if (!existingAdmin) {
    const passwordHash = await hashPassword(rawPassword);

    const adminUser = await prisma.user.create({
      data: {
        username: adminUsername,
        email: adminEmail,
        passwordHash,
        firstName: 'System',
        lastName: 'Admin',
        role: Role.SUPER_ADMIN,
        isActive: true,
        isVerified: true,
      },
    });

    console.log(`✅ Super Admin created: ${adminUser.username} (${adminUser.email})`);
  } else {
    console.log(`ℹ️ Super Admin user '${adminUsername}' (${adminEmail}) already exists.`);
  }

  console.log('✅ Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

