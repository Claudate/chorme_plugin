import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// 获取数据库连接字符串
// 支持 DATABASE_URL 或 SUPABASE_DB_URL
const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL or SUPABASE_DB_URL environment variable must be set');
}

console.log('🔗 Connecting to Supabase PostgreSQL database...');

// 输出连接详情(便于调试)
console.log('📍 Connection details:', {
  host: connectionString?.split('@')[1]?.split(':')[0] || 'unknown',
  port: connectionString?.split(':').slice(-1)[0]?.split('/')[0] || 'unknown',
  database: connectionString?.split('/').slice(-1)[0]?.split('?')[0] || 'unknown',
});
console.log('🔧 Using connection pooling:', connectionString?.includes(':6543') || false);

// 创建 PostgreSQL 客户端
// 使用 connection pooling 以提高性能
const client = postgres(connectionString, {
  max: 10, // 最大连接数
  idle_timeout: 20, // 空闲超时（秒）
  connect_timeout: 10, // 连接超时（秒）
  // Supabase 使用 SSL 连接
  ssl: 'require',
  // 如果使用 connection pooling (端口 6543)，需要以下配置
  prepare: false,
});

// 创建 Drizzle 实例
export const db = drizzle(client, { schema });

// 导出 schema 以便在其他地方使用
export * from './schema';

console.log('✅ Supabase database connection established');
