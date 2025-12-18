/**
 * 本地执行脚本：修复表名（将所有表添加 zi_ 前缀）
 *
 * 使用方法：
 * 1. 确保 .env 中有正确的 POSTGRES_URL（使用 Transaction 模式，不是 Pooler）
 * 2. 运行: npm run db:fix-names:local
 *
 * 注意：这个脚本只需要执行一次！
 */
import { Client } from 'pg';
import * as dotenv from 'dotenv';

// 加载 .env 文件
dotenv.config();

async function fixTableNames() {
  // 优先使用 POSTGRES_URL (Transaction 模式)
  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('❌ POSTGRES_URL 或 DATABASE_URL 未设置');
    console.error('请在 .env 文件中设置 POSTGRES_URL（使用 Supabase Transaction 连接字符串）');
    process.exit(1);
  }

  console.log('🔗 连接到数据库...');
  console.log('📍 使用连接:', connectionString.replace(/:[^:@]+@/, ':***@'));

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });

  try {
    await client.connect();
    console.log('✅ 数据库连接成功');

    // 检查是否需要重命名
    const { rows: oldTables } = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('users', 'articles', 'publish_records', 'publish_presets', 'redeem_codes', 'image_usage_stats', 'video_contents')
    `);

    if (oldTables.length === 0) {
      console.log('✅ 表名已经正确（使用 zi_ 前缀），无需重命名');
      return;
    }

    console.log(`📋 发现 ${oldTables.length} 个需要重命名的表:`);
    oldTables.forEach(row => console.log(`   - ${row.table_name}`));

    const renameMappings = [
      { from: 'users', to: 'zi_users' },
      { from: 'articles', to: 'zi_articles' },
      { from: 'publish_records', to: 'zi_publish_records' },
      { from: 'publish_presets', to: 'zi_publish_presets' },
      { from: 'redeem_codes', to: 'zi_redeem_codes' },
      { from: 'image_usage_stats', to: 'zi_image_usage_stats' },
      { from: 'video_contents', to: 'zi_video_contents' },
    ];

    console.log('\n🔄 开始重命名表...\n');

    for (const { from, to } of renameMappings) {
      try {
        await client.query(`ALTER TABLE IF EXISTS "${from}" RENAME TO "${to}"`);
        console.log(`✅ ${from} -> ${to}`);
      } catch (error: any) {
        if (error.code === '42P01') {
          // 表不存在，跳过
          console.log(`⏭️  ${from} 表不存在，跳过`);
        } else {
          console.error(`❌ 重命名 ${from} 失败:`, error.message);
          throw error;
        }
      }
    }

    // 重命名索引
    console.log('\n🔄 重命名索引...\n');

    try {
      await client.query(`ALTER INDEX IF EXISTS "users_email_unique" RENAME TO "zi_users_email_unique"`);
      console.log('✅ users_email_unique -> zi_users_email_unique');
    } catch (error: any) {
      if (error.code === '42704') {
        console.log('⏭️  users_email_unique 索引不存在，跳过');
      } else {
        console.log('⚠️  索引重命名失败:', error.message);
      }
    }

    try {
      await client.query(`ALTER INDEX IF EXISTS "redeem_codes_code_unique" RENAME TO "zi_redeem_codes_code_unique"`);
      console.log('✅ redeem_codes_code_unique -> zi_redeem_codes_code_unique');
    } catch (error: any) {
      if (error.code === '42704') {
        console.log('⏭️  redeem_codes_code_unique 索引不存在，跳过');
      } else {
        console.log('⚠️  索引重命名失败:', error.message);
      }
    }

    console.log('\n🎉 所有表名已成功添加 zi_ 前缀！');
    console.log('✅ 现在可以正常部署到 Vercel 了');
  } catch (error) {
    console.error('\n❌ 表名修复失败:', error);
    throw error;
  } finally {
    await client.end();
  }
}

fixTableNames().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
