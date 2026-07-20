const { execSync } = require('child_process');

function runDeploy() {
  try {
    console.log('Running prisma migrate deploy...');
    execSync('npx prisma migrate deploy --schema=prisma/schema.prisma', { stdio: 'pipe', encoding: 'utf-8' });
    console.log('Migrations deployed successfully!');
    return true;
  } catch (error) {
    const output = error.stdout + '\n' + error.stderr;
    console.error('Deploy failed with output:\n', output);

    const matchName = output.match(/Migration name: (\S+)/);
    const isAlreadyExists = output.includes('already exists');

    if (matchName && isAlreadyExists) {
      const migrationName = matchName[1];
      console.log(`\nDetected that migration ${migrationName} actually exists in the database. Resolving as applied...`);
      try {
        execSync(`npx prisma migrate resolve --applied ${migrationName} --schema=prisma/schema.prisma`, { stdio: 'inherit' });
        console.log(`Successfully resolved ${migrationName}. Retrying deploy...`);
        return false; // Return false to indicate we should retry
      } catch (resolveError) {
        console.error(`Failed to resolve migration ${migrationName}`);
        process.exit(1);
      }
    } else {
      console.error('An unrecoverable migration error occurred.');
      process.exit(1);
    }
  }
}

let success = false;
let attempts = 0;
while (!success && attempts < 10) {
  attempts++;
  success = runDeploy();
}

if (!success) {
  console.error('Failed to deploy migrations after 10 attempts.');
  process.exit(1);
}
