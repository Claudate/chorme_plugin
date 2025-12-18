import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

// 判断是否使用 Turso 数据库
// 只有当 TURSO_DATABASE_URL 存在且不是示例值时才使用
const useTurso = process.env.TURSO_DATABASE_URL &&
  !process.env.TURSO_DATABASE_URL.includes('your-database-name');

const dbUrl = useTurso
  ? process.env.TURSO_DATABASE_URL!
  : (process.env.DATABASE_URL || 'file:./dev.db');

console.log('Using database:', dbUrl);

// 创建数据库客户端
const client = createClient({
  url: dbUrl,
  authToken: useTurso ? process.env.TURSO_AUTH_TOKEN : undefined,
});

// 创建Drizzle实例
export const db = drizzle(client, { schema });

// 导出schema以便在其他地方使用
export * from './schema';
