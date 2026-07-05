import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database lookup tables...');

  // 1. Seed Roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN' },
  });

  await prisma.role.upsert({
    where: { name: 'AGENT' },
    update: {},
    create: { name: 'AGENT' },
  });

  console.log('Roles seeded.');

  // 2. Seed Policy Statuses
  const statuses = ['ACTIVE', 'EXPIRED', 'CANCELLED'];
  for (const statusName of statuses) {
    await prisma.policyStatus.upsert({
      where: { name: statusName },
      update: {},
      create: { name: statusName },
    });
  }
  console.log('Policy Statuses seeded.');

  // 3. Seed Default Insurance Companies
  const companies = [
    'HDFC Ergo General Insurance',
    'ICICI Lombard General Insurance',
    'Tata AIG General Insurance',
    'Bajaj Allianz General Insurance',
    'National Insurance Company',
    'New India Assurance',
    'Oriental Insurance Company',
    'United India Insurance Company',
    'SBI General Insurance',
    'Reliance General Insurance',
  ];

  for (const companyName of companies) {
    await prisma.insuranceCompany.upsert({
      where: { name: companyName },
      update: {},
      create: { name: companyName },
    });
  }
  console.log('Insurance Companies seeded.');

  // 4. Seed Default Admin User
  const adminEmail = 'admin@crm.com';
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('Admin@123456', 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        fullName: 'System Administrator',
        passwordHash,
        roleId: adminRole.id,
      },
    });
    console.log('Default Admin Account created:');
    console.log(`Email: ${adminEmail}`);
    console.log('Password: Admin@123456');
  } else {
    console.log('Admin account already exists.');
  }

  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
