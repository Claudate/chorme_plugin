import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

/**
 * 健康检查 API
 * 用于快速诊断应用和数据库的健康状态
 *
 * 访问: GET /api/health
 */
export async function GET() {
  const checks: Record<string, any> = {};

  // 检查环境变量
  checks.hasDatabaseUrl = !!process.env.DATABASE_URL;
  checks.hasSupabaseUrl = !!process.env.SUPABASE_DB_URL;
  checks.hasNextAuthSecret = !!process.env.NEXTAUTH_SECRET;
  checks.nodeEnv = process.env.NODE_ENV || 'development';
  checks.isVercel = !!process.env.VERCEL;

  // 检查数据库连接字符串格式
  const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || '';
  if (dbUrl) {
    const port = dbUrl.split(':').slice(-1)[0]?.split('/')[0] || 'unknown';
    checks.databasePort = port;
    checks.usingConnectionPool = port === '6543';
  }

  // 检查数据库连接
  try {
    const result = await db.execute(sql`SELECT 1 as ok`);
    // postgres-js 驱动返回的是数组，不是带 rows 的对象
    const resultArray = Array.isArray(result) ? result : [];
    checks.databaseConnection = resultArray[0]?.ok === 1;

    // 获取数据库版本
    const versionResult = await db.execute(sql`SELECT version()`);
    const versionArray = Array.isArray(versionResult) ? versionResult : [];
    checks.databaseVersion = versionArray[0]?.version || 'unknown';
  } catch (error) {
    checks.databaseConnection = false;
    checks.databaseError = error instanceof Error ? error.message : 'Unknown error';
  }

  // 检查表是否存在
  try {
    const tables = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name LIKE 'zi_%'
    `);
    const tablesArray = Array.isArray(tables) ? tables : [];
    const tableCount = Number(tablesArray[0]?.count || 0);
    checks.tablesExist = tableCount > 0;
    checks.tableCount = tableCount;

    // 列出所有 zi_ 表
    if (tableCount > 0) {
      const tableList = await db.execute(sql`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name LIKE 'zi_%'
        ORDER BY table_name
      `);
      const tableListArray = Array.isArray(tableList) ? tableList : [];
      checks.tables = tableListArray.map((row: any) => row.table_name);
    }
  } catch (error) {
    checks.tablesExist = false;
    checks.tablesError = error instanceof Error ? error.message : 'Unknown error';
  }

  // 检查迁移记录
  try {
    const migrations = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM drizzle_migrations
    `);
    const migrationsArray = Array.isArray(migrations) ? migrations : [];
    checks.migrationsApplied = Number(migrationsArray[0]?.count || 0);
  } catch (error) {
    // 迁移表可能不存在
    checks.migrationsApplied = 0;
  }

  // 判断整体健康状态
  const isHealthy =
    checks.hasDatabaseUrl &&
    checks.hasNextAuthSecret &&
    checks.databaseConnection &&
    checks.tablesExist &&
    checks.usingConnectionPool; // 确保使用连接池

  const statusCode = isHealthy ? 200 : 503;

  return NextResponse.json(
    {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks,
      recommendations: !isHealthy
        ? [
            !checks.hasDatabaseUrl && '设置 DATABASE_URL 环境变量',
            !checks.hasNextAuthSecret && '设置 NEXTAUTH_SECRET 环境变量',
            !checks.databaseConnection && '检查数据库连接是否正常',
            !checks.tablesExist && '运行数据库迁移: npm run db:init',
            !checks.usingConnectionPool && '使用端口 6543 (连接池) 而非 5432 (直连)',
          ].filter(Boolean)
        : [],
    },
    { status: statusCode }
  );
}
