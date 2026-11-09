/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const ADMIN = {
  name: 'Admin KampusEvent',
  email: 'admin@kampus.ac.id',
  password: 'Admin123!',
};

const STUDENTS = [
  { name: 'Budi Santoso', email: 'budi@kampus.ac.id', password: 'Mahasiswa123!' },
  { name: 'Sari Wulandari', email: 'sari@kampus.ac.id', password: 'Mahasiswa123!' },
];

function daysFromNow(days, hour = 9) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date;
}

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: ADMIN.email },
    update: { name: ADMIN.name, role: 'ADMIN' },
    create: {
      name: ADMIN.name,
      email: ADMIN.email,
      passwordHash: await bcrypt.hash(ADMIN.password, 10),
      role: 'ADMIN',
    },
  });

  for (const student of STUDENTS) {
    await prisma.user.upsert({
      where: { email: student.email },
      update: { name: student.name, role: 'STUDENT' },
      create: {
        name: student.name,
        email: student.email,
        passwordHash: await bcrypt.hash(student.password, 10),
        role: 'STUDENT',
      },
    });
  }

  const existingEvents = await prisma.event.count();
  if (existingEvents === 0) {
    await prisma.event.createMany({
      data: [
        {
          title: 'Seminar Nasional Teknologi 2026',
          description:
            'Seminar tahunan membahas tren AI, cloud, dan keamanan siber bersama praktisi industri. Terbuka untuk seluruh mahasiswa.',
          category: 'Seminar',
          location: 'Auditorium Utama Gedung A',
          startsAt: daysFromNow(7, 9),
          capacity: 200,
          createdById: admin.id,
        },
        {
          title: 'Workshop Docker & CI/CD',
          description:
            'Workshop praktik langsung membangun image Docker, menulis docker-compose, dan membuat pipeline CI/CD dengan GitHub Actions. Peserta wajib membawa laptop.',
          category: 'Workshop',
          location: 'Lab Komputer 3',
          startsAt: daysFromNow(12, 13),
          capacity: 40,
          createdById: admin.id,
        },
        {
          title: 'Hackathon Kampus 2026',
          description:
            'Kompetisi 24 jam untuk membangun solusi digital bagi permasalahan kampus. Tim terdiri dari 2-4 orang, hadiah jutaan rupiah.',
          category: 'Kompetisi',
          location: 'Gedung Student Center',
          startsAt: daysFromNow(21, 8),
          capacity: 120,
          createdById: admin.id,
        },
        {
          title: 'Career Talk: Karier di Bidang DevOps',
          description:
            'Berbagi pengalaman bersama alumni yang kini bekerja sebagai DevOps Engineer dan Site Reliability Engineer.',
          category: 'Karier',
          location: 'Ruang Multimedia B',
          startsAt: daysFromNow(30, 15),
          capacity: 80,
          createdById: admin.id,
        },
      ],
    });
  }

  console.log('Seed selesai.');
  console.log('Akun demo:');
  console.log(`  Admin     : ${ADMIN.email} / ${ADMIN.password}`);
  for (const student of STUDENTS) {
    console.log(`  Mahasiswa : ${student.email} / ${student.password}`);
  }
}

main()
  .catch((error) => {
    console.error('Seed gagal:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
