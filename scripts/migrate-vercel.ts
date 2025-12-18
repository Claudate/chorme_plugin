import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Vercel 自动数据库迁移脚本
 * 在 Vercel 构建时自动运行,确保数据库 Schema 与代码同步
 */
async function migrateVercel() {
  // 仅在生产环境或 Vercel 环境运行
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    console.log('⏭️  跳过 Vercel 迁移 (非生产环境)');
    console.log('   当前环境: NODE_ENV=' + (process.env.NODE_ENV || 'development'));
    console.log('   VERCEL=' + (process.env.VERCEL || 'false'));
    return;
  }

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('❌ DATABASE_URL 未设置,跳过迁移');
    console.error('   请在 Vercel Dashboard 设置环境变量:');
    console.error('   DATABASE_URL=postgresql://...');
    return;
  }

  console.log('🔗 连接到 Vercel 数据库...');

  // Vercel 不支持 IPv6，必须使用 Supabase Pooler (Supavisor)
  // 参考: https://supabase.com/docs/guides/troubleshooting/supabase--your-network-ipv4-and-ipv6-compatibility-cHe3BP
  let finalConnectionString = connectionString;

  if (process.env.VERCEL) {
    // 检查是否使用直连地址 (db.xxx.supabase.co)
    if (connectionString.includes('db.') && connectionString.includes('.supabase.co')) {
      console.error('❌ 错误：DATABASE_URL 使用了直连地址 (db.xxx.supabase.co)');
      console.error('   Vercel 不支持 IPv6，必须使用 Supabase Pooler (Supavisor)');
      console.error('');
      console.error('   请在 Vercel Dashboard 更新 DATABASE_URL 为 Pooler 地址：');
      console.error('   格式: postgresql://postgres.[REF]:[PWD]@aws-0-[REGION].pooler.supabase.com:6543/postgres');
      console.error('');
      console.error('   📖 参考文档: https://supabase.com/docs/guides/database/connecting-to-postgres');
      throw new Error('DATABASE_URL must use pooler address on Vercel (IPv6 not supported)');
    }

    // 如果使用 pooler 但端口是 5432，建议切换到 6543 (Transaction Mode)
    if (connectionString.includes('pooler.supabase.com:5432')) {
      finalConnectionString = connectionString.replace(':5432', ':6543');
      console.log('⚠️  已自动从 Session Mode (5432) 切换到 Transaction Mode (6543)');
      console.log('   Transaction Mode 更适合 Serverless 环境');
    }
  }

  console.log('📍 数据库地址:', finalConnectionString.split('@')[1]?.split('/')[0] || 'unknown');

  const client = new Client({
    connectionString: finalConnectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });

  try {
    await client.connect();
    console.log('✅ 数据库连接成功');

    // 创建迁移记录表
    console.log('📋 检查迁移记录表...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash TEXT NOT NULL UNIQUE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('✅ 迁移记录表就绪');

    // 读取迁移文件
    const migrationsDir = path.join(process.cwd(), 'drizzle', 'migrations-postgres');

    if (!fs.existsSync(migrationsDir)) {
      console.error('❌ 迁移目录不存在:', migrationsDir);
      return;
    }

    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    console.log(`📁 找到 ${files.length} 个迁移文件`);

    if (files.length === 0) {
      console.log('⚠️  没有找到迁移文件,跳过迁移');
      return;
    }

    let appliedCount = 0;
    let skippedCount = 0;

    for (const file of files) {
      // 检查是否已应用
      const { rows } = await client.query('SELECT id FROM drizzle_migrations WHERE hash = $1', [file]);

      if (rows.length > 0) {
        console.log(`⏭️  跳过已应用的迁移: ${file}`);
        skippedCount++;
        continue;
      }

      console.log(`📄 执行迁移: ${file}`);
      const sqlPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(sqlPath, 'utf-8');

      // 分割 SQL 语句
      const statements = sql
        .split('--> statement-breakpoint')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      console.log(`   执行 ${statements.length} 条 SQL 语句...`);

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        try {
          await client.query(statement);
          console.log(`   ✓ 语句 ${i + 1}/${statements.length} 执行成功`);
        } catch (error: any) {
          // 忽略"表已存在"错误
          if (error.code === '42P07') {
            console.log(`   ⚠️  表已存在,跳过语句 ${i + 1}`);
            continue;
          }

          // 忽略"列已存在"错误
          if (error.code === '42701') {
            console.log(`   ⚠️  列已存在,跳过语句 ${i + 1}`);
            continue;
          }

          // 忽略"约束已存在"错误
          if (error.code === '42710') {
            console.log(`   ⚠️  约束已存在,跳过语句 ${i + 1}`);
            continue;
          }

          console.error(`   ❌ 语句 ${i + 1} 执行失败:`);
          console.error(`      错误代码: ${error.code}`);
          console.error(`      错误信息: ${error.message}`);
          console.error(`      SQL: ${statement.substring(0, 100)}...`);
          throw error;
        }
      }

      // 记录迁移
      await client.query('INSERT INTO drizzle_migrations (hash) VALUES ($1)', [file]);

      console.log(`   ✅ 迁移完成: ${file}`);
      appliedCount++;
    }

    console.log('');
    console.log('🎉 所有迁移完成!');
    console.log(`   ✅ 新应用: ${appliedCount} 个迁移`);
    console.log(`   ⏭️  跳过: ${skippedCount} 个迁移`);
    console.log(`   📊 总计: ${files.length} 个迁移文件`);
  } catch (error) {
    console.error('');
    console.error('❌ 迁移失败:');
    if (error instanceof Error) {
      console.error('   错误信息:', error.message);
      console.error('   Stack trace:', error.stack);
    } else {
      console.error('   未知错误:', error);
    }
    console.error('');
    console.error('💡 调试提示:');
    console.error('   1. 检查 DATABASE_URL 是否正确');
    console.error('   2. 确保使用连接池端口 6543 而非直连端口 5432');
    console.error('      正确格式: postgresql://user:pass@host.supabase.co:6543/postgres');
    console.error('   3. 检查数据库是否在线');
    console.error('   4. Vercel 环境可能不支持 IPv6，确保使用 pooler 连接');
    console.error('   5. 查看 Vercel Function Logs 获取更多信息');
    throw error;
  } finally {
    await client.end();
    console.log('🔌 数据库连接已关闭');
  }
}

// 执行迁移
migrateVercel().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
