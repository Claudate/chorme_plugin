import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// 延迟初始化数据库连接
// 这样可以避免在构建时尝试连接数据库
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;
let _client: ReturnType<typeof postgres> | null = null;

function getDb() {
  // 如果已经初始化过,直接返回
  if (_db) {
    return _db;
  }

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
  _client = postgres(connectionString, {
    max: 10, // 最大连接数
    idle_timeout: 20, // 空闲超时(秒)
    connect_timeout: 10, // 连接超时(秒)
    // Supabase 使用 SSL 连接
    ssl: 'require',
    // 如果使用 connection pooling (端口 6543),需要以下配置
    prepare: false,
  });

  // 创建 Drizzle 实例
  _db = drizzle(_client, { schema });

  console.log('✅ Supabase database connection established');

  return _db;
}

// 导出延迟初始化的数据库实例
export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(target, prop) {
    const dbInstance = getDb();
    return (dbInstance as any)[prop];
  }
});

// 导出 schema 以便在其他地方使用
export * from './schema';
