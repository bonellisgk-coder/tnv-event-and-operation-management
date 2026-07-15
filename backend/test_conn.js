require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  console.log("Testing connection...");
  try {
    const start = Date.now();
    const count = await prisma.user.count();
    console.log(`Success! Found ${count} users. Took ${Date.now() - start}ms`);
  } catch (err) {
    console.error("Connection failed:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}
test();
