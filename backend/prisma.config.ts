import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

const prismaDatabaseUrl =
  process.env.DIRECT_URL ?? process.env.DATABASE_URL;

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: prismaDatabaseUrl ?? env('DATABASE_URL'),
  },
});
