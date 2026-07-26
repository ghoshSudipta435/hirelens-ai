import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await hash('password123', 12);

  const recruiter = await prisma.user.upsert({
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

  const jobs = [
    {
      title: 'Senior Frontend Engineer',
      description: 'We are looking for a Senior Frontend Engineer with deep React and Next.js experience. You will build highly responsive UIs.',
      employmentType: 'FULL_TIME',
      locationMode: 'REMOTE',
      experienceYears: 5,
      salaryMin: 120000,
      salaryMax: 160000,
      category: 'Engineering',
      extractedSkills: ['React', 'Next.js', 'TypeScript', 'TailwindCSS'],
      recruiterId: recruiter.id,
      status: 'ACTIVE',
    },
    {
      title: 'Backend Developer',
      description: 'Strong backend engineer needed for building scalable APIs using Node.js and PostgreSQL.',
      employmentType: 'FULL_TIME',
      locationMode: 'HYBRID',
      experienceYears: 3,
      salaryMin: 90000,
      salaryMax: 130000,
      category: 'Engineering',
      extractedSkills: ['Node.js', 'PostgreSQL', 'Express', 'Prisma'],
      recruiterId: recruiter.id,
      status: 'ACTIVE',
    },
    {
      title: 'Full Stack Developer',
      description: 'Join our fast-paced startup to build end-to-end features. Next.js on the frontend, Node on the backend.',
      employmentType: 'FULL_TIME',
      locationMode: 'REMOTE',
      experienceYears: 2,
      salaryMin: 80000,
      salaryMax: 120000,
      category: 'Engineering',
      extractedSkills: ['React', 'Node.js', 'TypeScript', 'SQL'],
      recruiterId: recruiter.id,
      status: 'ACTIVE',
    },
    {
      title: 'Product Designer',
      description: 'Creative product designer to lead UI/UX for our SaaS platform.',
      employmentType: 'FULL_TIME',
      locationMode: 'ONSITE',
      experienceYears: 4,
      salaryMin: 100000,
      salaryMax: 140000,
      category: 'Design',
      extractedSkills: ['Figma', 'UI/UX', 'Wireframing', 'Prototyping'],
      recruiterId: recruiter.id,
      status: 'ACTIVE',
    },
  ];

  console.log('Seeding jobs...');
  for (const job of jobs) {
    await prisma.jobPosting.create({ data: job });
  }

  // Also seed a student user with a resume and some matches?
  const student = await prisma.user.upsert({
    where: { email: 'student@example.com' },
    update: {},
    create: {
      email: 'student@example.com',
      name: 'Alice Student',
      passwordHash,
      role: 'STUDENT',
      studentProfile: {
        create: {
          university: 'Tech University',
          graduationYear: 2024,
          bio: 'Passionate full-stack developer.',
        },
      },
    },
  });

  const uploadedFile = await prisma.uploadedFile.create({
    data: {
      ownerId: student.id,
      fileName: 'Alice_Resume_2024.pdf',
      fileSize: 1024,
      fileType: 'application/pdf',
      fileUrl: 'https://example.com/mock.pdf',
      cloudinaryPublicId: 'mock-id',
    },
  });

  const resume = await prisma.resume.create({
    data: {
      owner: { connect: { id: student.id } },
      uploadedFile: { connect: { id: uploadedFile.id } },
      title: 'Alice_Resume_2024.pdf',
      version: 1,
      parsedData: {
        rawText: 'I am a software engineer with experience in React, TypeScript, and Node.js.',
        skills: ['React', 'TypeScript', 'Node.js', 'HTML', 'CSS'],
      },
    },
  });

  const allJobs = await prisma.jobPosting.findMany();
  for (const job of allJobs) {
    const score = job.title.includes('Frontend') ? 95 : job.title.includes('Full') ? 85 : 40;
    await prisma.matchResult.create({
      data: {
        contextType: 'AUTO_MATCH',
        status: 'COMPLETED',
        resumeId: resume.id,
        jobPostingId: job.id,
        score,
        matchedSkills: ['React', 'TypeScript'],
        missingSkills: ['PostgreSQL'],
        strengths: ['Great match for React roles.'],
        scoreVersion: '1.0.0',
      },
    });
  }

  console.log('Seed completed! Added jobs and a student with matches.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
