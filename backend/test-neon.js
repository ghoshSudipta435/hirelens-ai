import { neon } from '@neondatabase/serverless';

async function testConnection() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }
  console.log('Testing connection to:', url.replace(/:[^:@]+@/, ':***@'));
  const sql = neon(url);
  try {
    const rows = await sql`SELECT version()`;
    console.log('Success! Connected to NeonDB:', rows[0].version);
  } catch (error) {
    console.error('Connection failed:', error);
  }
}

testConnection();
