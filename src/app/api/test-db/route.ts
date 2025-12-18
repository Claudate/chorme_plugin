import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    // 测试数据库连接
    const result = await db.execute(sql`SELECT current_database(), current_user, version()`);
    const resultArray = Array.isArray(result) ? result : [];

    // 检查表是否存在
    const tables = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name LIKE 'zi_%'
      ORDER BY table_name
    `);
    const tablesArray = Array.isArray(tables) ? tables : [];

    return NextResponse.json({
      success: true,
      connection: {
        database: resultArray[0]?.current_database,
        user: resultArray[0]?.current_user,
        version: resultArray[0]?.version,
      },
      tables: tablesArray.map((r: any) => r.table_name),
      env: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasSupabaseUrl: !!process.env.SUPABASE_DB_URL,
      }
    });
  } catch (error) {
    console.error('Database test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      env: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasSupabaseUrl: !!process.env.SUPABASE_DB_URL,
      }
    }, { status: 500 });
  }
}
