import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const ALL_DEPARTMENTS = [
  // Management Team (11 Departments)
  'Chairperson / Chief Coordinator Office',
  'CEO / President / Operational Leadership',
  'Board of Trustees & Governance',
  'Monitoring, Evaluation & Impact (MEI)',
  'Administration & Human Resources (HR)',
  'Finance & Compliance',
  'Partnerships & NGO Relations',
  'Technology & Digital Systems',
  'Communications & Media',
  'Online Volunteering',
  'Field Volunteering',

  // Operations Team (25 Departments)
  'Differently Abled Welfare',
  'Disaster Response & Emergency Management',
  'Homeless Care',
  'Food & Rescue',
  'Blood Donation',
  'Health and Hygiene',
  'Nutrition and Wellness',
  'Mental Health Awareness',
  'Education Empowerment Initiative',
  'Youth Empowerment',
  'Sport Development',
  'Volunteer Empowerment',
  'Livelihood Development',
  'Legal Rights & Protection',
  'Drug-Free Society & Mission',
  'Public Awareness',
  'Women & Children Safety',
  'Tribal Welfare',
  'Village Development',
  'Social Responsibility',
  'Affordable Housing',
  'Sustainable Development Goals (SDG)',
  'Farmer Welfare',
  'Animal Welfare',
  'Environment Protection',
];

async function seedDepartments() {
  console.log('Seeding all 36 Tamil Nadu Volunteers Organization departments...');

  for (const deptName of ALL_DEPARTMENTS) {
    const existing = await prisma.department.findFirst({
      where: { name: { equals: deptName, mode: 'insensitive' } },
    });

    if (!existing) {
      await prisma.department.create({
        data: { name: deptName },
      });
      console.log(`+ Added department: ${deptName}`);
    } else {
      console.log(`= Existing department: ${deptName}`);
    }
  }

  const count = await prisma.department.count();
  console.log(`\nTotal Departments in Database: ${count}`);
}

seedDepartments()
  .catch((e) => {
    console.error('Error seeding departments:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
