import type { Config } from 'drizzle-kit';

// 使用环境变量来决定配置
// 只有当 TURSO_DATABASE_URL 存在且不为空字符串时才使用 Turso
const isProduction = process.env.NODE_ENV === 'production' && process.env.TURSO_DATABASE_URL && process.env.TURSO_DATABASE_URL.trim().length > 0;

export default {
  schema: './src/lib/db/schema.ts',
  out: './drizzle/migrations',
  dialect: 'sqlite',
  ...(isProduction && process.env.TURSO_DATABASE_URL 
    ? {
        dbCredentials: {
          url: process.env.TURSO_DATABASE_URL,
          authToken: process.env.TURSO_AUTH_TOKEN!,
        },
      }
    : {
        dbCredentials: {
          url: 'file:./dev.db',
        },
      }),
} satisfies Config;
