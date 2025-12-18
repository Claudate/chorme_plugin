import { Client } from 'pg';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function testConnection() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('❌ 错误: DATABASE_URL 环境变量未设置');
    console.log('\n请在 .env.local 文件中设置 DATABASE_URL');
    console.log('\n示例:');
    console.log('DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"');
    process.exit(1);
  }

  console.log('🔗 测试数据库连接...');
  console.log('📍 连接字符串:', connectionString.replace(/:[^:@]+@/, ':****@')); // 隐藏密码

  const client = new Client({
    connectionString,
    // 增加连接超时时间
    connectionTimeoutMillis: 10000,
  });

  try {
    console.log('\n⏳ 正在连接...');
    await client.connect();
    console.log('✅ 数据库连接成功!\n');

    // 获取 PostgreSQL 版本
    const versionResult = await client.query('SELECT version()');
    console.log('📊 PostgreSQL 版本:');
    console.log('   ', versionResult.rows[0].version.split(',')[0]);

    // 检查现有表
    console.log('\n📋 检查数据库表...');
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    if (tablesResult.rows.length === 0) {
      console.log('   ⚠️  没有找到数据表');
      console.log('   💡 运行 "npm run db:init" 创建数据表');
    } else {
      console.log(`   ✅ 找到 ${tablesResult.rows.length} 个数据表:`);
      tablesResult.rows.forEach((row) => {
        const prefix = row.table_name.startsWith('zi_') ? '✓' : '-';
        console.log(`   ${prefix} ${row.table_name}`);
      });

      // 统计 zi_ 开头的表
      const ziTables = tablesResult.rows.filter(row =>
        row.table_name.startsWith('zi_')
      );
      if (ziTables.length > 0) {
        console.log(`\n   🎯 其中 ${ziTables.length} 个表以 zi_ 开头`);
      }
    }

    console.log('\n✅ 数据库测试完成！');
    console.log('\n📌 下一步:');
    if (tablesResult.rows.length === 0) {
      console.log('   1. 运行: npm run db:init');
      console.log('   2. 运行: npm run dev');
    } else {
      console.log('   1. 运行: npm run dev');
      console.log('   2. 访问: http://localhost:3000');
    }

    await client.end();
  } catch (error: any) {
    console.error('\n❌ 数据库连接失败!\n');

    if (error.code === 'XX000' || error.message.includes('Tenant or user not found')) {
      console.error('🔍 错误原因: 租户或用户未找到');
      console.log('\n💡 可能的解决方案:');
      console.log('   1. 检查数据库密码是否正确');
      console.log('   2. 确认 Supabase 项目是否处于活跃状态');
      console.log('   3. 在 Supabase Dashboard 重置数据库密码:');
      console.log('      - 访问: https://app.supabase.com/');
      console.log('      - Project Settings > Database > Reset Database Password');
      console.log('   4. 更新 .env.local 中的 DATABASE_URL');
      console.log('\n📚 详细说明请查看: SUPABASE_SETUP.md');
    } else if (error.code === 'ENOTFOUND') {
      console.error('🔍 错误原因: 无法解析主机名');
      console.log('\n💡 可能的解决方案:');
      console.log('   1. 检查网络连接');
      console.log('   2. 确认 DATABASE_URL 中的主机名是否正确');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('🔍 错误原因: 连接超时');
      console.log('\n💡 可能的解决方案:');
      console.log('   1. 检查网络连接');
      console.log('   2. 尝试使用不同的端口 (5432 或 6543)');
      console.log('   3. 检查防火墙设置');
    } else {
      console.error('🔍 错误详情:');
      console.error('   代码:', error.code);
      console.error('   消息:', error.message);
    }

    process.exit(1);
  }
}

// 运行测试
testConnection();
