const { execSync } = require('child_process');

function runDeploy() {
  try {
    console.log('Running prisma db push to sync schema...');
    execSync('npx prisma db push --schema=prisma/schema.prisma --accept-data-loss', { stdio: 'inherit' });
    console.log('Database synced successfully!');
    return true;
  } catch (error) {
    console.error('Failed to sync database:', error);
    process.exit(1);
  }
}

runDeploy();
