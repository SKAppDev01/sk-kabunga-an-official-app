import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  const adminUsername = process.env.SEED_ADMIN_USERNAME || 'admin';
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'sk.kabungaan.admin@gmail.com';
  const rawPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@SK2026';

  const existingAdmin = await prisma.user.findFirst({
    where: {
      OR: [{ username: adminUsername }, { email: adminEmail }],
    },
  });

  if (!existingAdmin) {
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(rawPassword, salt);

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
