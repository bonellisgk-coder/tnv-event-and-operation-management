import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean existing data
  await prisma.passwordResetToken.deleteMany({});
  await prisma.certificateTemplate.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.additionalMember.deleteMany({});
  await prisma.participant.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.department.deleteMany({});

  // Seed Departments
  const deptSports = await prisma.department.create({
    data: { name: 'Youth Welfare and Sports Development' },
  });
  const deptDisaster = await prisma.department.create({
    data: { name: 'Disaster Management' },
  });
  const deptEnvironment = await prisma.department.create({
    data: { name: 'Environment and Climate Change' },
  });

  console.log('Seeded Departments');

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('ChangeMe123!', salt);

  // Seed Super Admin
  const superAdmin = await prisma.user.create({
    data: {
      name: 'Thiru. K. Anbarasan',
      email: 'admin@example.com',
      phone: '9876543210',
      passwordHash,
      role: 'SUPER_ADMIN',
    },
  });

  // Seed Department Admins
  const adminDisaster = await prisma.user.create({
    data: {
      name: 'Dr. Radhakrishnan IAS',
      email: 'disaster.admin@example.com',
      phone: '9876543211',
      passwordHash,
      role: 'DEPARTMENT_ADMIN',
      departmentId: deptDisaster.id,
    },
  });

  const adminEnvironment = await prisma.user.create({
    data: {
      name: 'Tmt. Supriya Sahu IAS',
      email: 'eco.admin@example.com',
      phone: '9876543212',
      passwordHash,
      role: 'DEPARTMENT_ADMIN',
      departmentId: deptEnvironment.id,
    },
  });

  // Seed Volunteers
  const volunteer1 = await prisma.user.create({
    data: {
      name: 'Selvan Karthik',
      email: 'karthik@example.com',
      phone: '9876543213',
      passwordHash,
      role: 'VOLUNTEER',
      departmentId: deptEnvironment.id,
    },
  });

  const volunteer2 = await prisma.user.create({
    data: {
      name: 'Selvi Anitha',
      email: 'anitha@example.com',
      phone: '9876543214',
      passwordHash,
      role: 'VOLUNTEER',
      departmentId: deptDisaster.id,
    },
  });

  console.log('Seeded Users');

  // Seed Events
  const event1 = await prisma.event.create({
    data: {
      slug: 'marina-beach-cleanup-2026',
      title: 'Marina Beach Mega Cleanup Drive',
      description: 'Join us for the largest coastal cleanup drive in Chennai. We will focus on plastic waste removal and raising awareness on marine pollution. Refreshments and certificates will be provided.',
      date: new Date('2026-08-15T07:00:00Z'),
      startTime: '07:00',
      endTime: '11:00',
      venue: 'Marina Beach, Near Gandhi Statue, Chennai',
      departmentId: deptEnvironment.id,
      type: 'Cleanup',
      status: 'PUBLISHED',
      checkinEnabled: true,
    },
  });

  const event2 = await prisma.event.create({
    data: {
      slug: 'cuddalore-flood-relief-camp',
      title: 'Cuddalore Flood Relief Distribution',
      description: 'Volunteers needed for sorting and distributing relief packages (food, water, medicine) to affected families in Cuddalore block.',
      date: new Date('2026-09-01T08:30:00Z'),
      startTime: '08:30',
      endTime: '17:00',
      venue: 'Government Higher Secondary School, Cuddalore',
      departmentId: deptDisaster.id,
      type: 'Relief',
      status: 'PUBLISHED',
      checkinEnabled: false,
    },
  });

  const event3 = await prisma.event.create({
    data: {
      slug: 'state-sports-meet-2026',
      title: 'TN State Youth Sports Meet',
      description: 'Volunteer support required for athlete registrations, crowd control, and logistics coordination during the state-level athletic meet.',
      date: new Date('2026-10-10T09:00:00Z'),
      startTime: '09:00',
      endTime: '18:00',
      venue: 'Jawaharlal Nehru Stadium, Periamet, Chennai',
      departmentId: deptSports.id,
      type: 'Sports Coordination',
      status: 'DRAFT',
      checkinEnabled: false,
    },
  });

  console.log('Seeded Events');

  // Seed some participants
  const participant1 = await prisma.participant.create({
    data: {
      eventId: event1.id,
      name: 'Ramesh Kumar',
      email: 'ramesh@example.com',
      phone: '9988776655',
      status: 'PRESENT',
      editToken: 'token-ramesh-123',
      editTokenExpires: new Date('2026-12-31T23:59:59Z'),
      checkinAt: new Date('2026-08-15T07:15:00Z'),
    },
  });

  const participant2 = await prisma.participant.create({
    data: {
      eventId: event1.id,
      name: 'Priya Dharshini',
      email: 'priya@example.com',
      phone: '9988776644',
      status: 'PENDING',
      editToken: 'token-priya-456',
      editTokenExpires: new Date('2026-12-31T23:59:59Z'),
    },
  });

  await prisma.additionalMember.create({
    data: {
      participantId: participant1.id,
      name: 'Suresh Kumar',
      email: 'suresh@example.com',
    },
  });

  console.log('Seeded Participants and Additional Members');

  // Seed tasks
  await prisma.task.create({
    data: {
      title: 'Marina Beach Cleanup Logistics Coordinator',
      description: 'Set up garbage bags distribution booth and coordinate volunteer refreshments assembly.',
      assigneeId: volunteer1.id,
      priority: 'HIGH',
      deadline: new Date('2026-08-14T18:00:00Z'),
      status: 'TODO',
    },
  });

  await prisma.task.create({
    data: {
      title: 'Prepare Relief Package Inventories',
      description: 'Create digital inventory log of all incoming medical supplies and coordinate sorting layout.',
      assigneeId: volunteer2.id,
      priority: 'MEDIUM',
      deadline: new Date('2026-08-31T17:00:00Z'),
      status: 'IN_PROGRESS',
    },
  });

  console.log('Seeded Tasks');
  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
