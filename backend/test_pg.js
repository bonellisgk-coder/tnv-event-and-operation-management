const { Client } = require('pg');

async function test(port) {
  const connectionString = `postgresql://postgres.liwnracionvrkwztqytv:tamilnadu%40123@aws-1-ap-south-1.pooler.supabase.com:${port}/postgres`;
  const client = new Client({ connectionString, connectionTimeoutMillis: 5000 });
  
  try {
    console.log(`Connecting to port ${port}...`);
    await client.connect();
    console.log(`Success on port ${port}!`);
  } catch (err) {
    console.error(`Failed on port ${port}:`, err.message);
  } finally {
    await client.end().catch(()=>{});
  }
}

async function run() {
  await test(6543);
  await test(5432);
}
run();
