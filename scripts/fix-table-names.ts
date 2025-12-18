/**
 * 修复表名：将所有表添加 zi_ 前缀
 * 这个脚本会在 Vercel 部署时自动运行
 */
import { Client } from 'pg';

async function fixTableNames() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('❌ DATABASE_URL 未设置');
    process.exit(1);
  }

  console.log('🔗 连接到数据库...');
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

    console.log(`📋 发现 ${oldTables.length} 个需要重命名的表`);

    const renameMappings = [
      { from: 'users', to: 'zi_users' },
      { from: 'articles', to: 'zi_articles' },
      { from: 'publish_records', to: 'zi_publish_records' },
      { from: 'publish_presets', to: 'zi_publish_presets' },
      { from: 'redeem_codes', to: 'zi_redeem_codes' },
      { from: 'image_usage_stats', to: 'zi_image_usage_stats' },
      { from: 'video_contents', to: 'zi_video_contents' },
    ];

    for (const { from, to } of renameMappings) {
      try {
        await client.query(`ALTER TABLE IF EXISTS "${from}" RENAME TO "${to}"`);
        console.log(`✅ ${from} -> ${to}`);
      } catch (error: any) {
        if (error.code === '42P01') {
          // 表不存在，跳过
          console.log(`⏭️  ${from} 表不存在，跳过`);
        } else {
          throw error;
        }
      }
    }

    // 重命名约束
    try {
      await client.query(`ALTER INDEX IF EXISTS "users_email_unique" RENAME TO "zi_users_email_unique"`);
      console.log('✅ 重命名 users_email_unique 索引');
    } catch (error: any) {
      console.log('⚠️  索引重命名失败（可能已存在）:', error.message);
    }

    try {
      await client.query(`ALTER INDEX IF EXISTS "redeem_codes_code_unique" RENAME TO "zi_redeem_codes_code_unique"`);
      console.log('✅ 重命名 redeem_codes_code_unique 索引');
    } catch (error: any) {
      console.log('⚠️  索引重命名失败（可能已存在）:', error.message);
    }

    console.log('🎉 所有表名已成功添加 zi_ 前缀');
  } catch (error) {
    console.error('❌ 表名修复失败:', error);
    throw error;
  } finally {
    await client.end();
  }
}

fixTableNames().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
