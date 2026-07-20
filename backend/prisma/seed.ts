import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await hash('password123', 12);

  const user = await prisma.user.upsert({
    where: { email: 'sudipta@gmail.com' },
    update: {},
    create: {
      email: 'sudipta@gmail.com',
      name: 'Sudipta Ghosh',
      passwordHash,
      role: 'RECRUITER',
      recruiterProfile: {
        create: {
          companyName: 'HireLens AI',
          designation: 'Senior Engineer',
        },
      },
    },
  });

  console.log('Seed completed! Test user created:');
  console.log('Email:', user.email);
  console.log('Password: password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
