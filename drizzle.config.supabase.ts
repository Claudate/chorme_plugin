import type { Config } from 'drizzle-kit';

// Supabase PostgreSQL 配置
export default {
  schema: './src/lib/db/schema-postgres.ts',
  out: './drizzle/migrations-postgres',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || '',
  },
} satisfies Config;
