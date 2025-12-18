import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function initDatabase() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('❌ 错误: DATABASE_URL 环境变量未设置');
    console.log('请在 .env 或 .env.local 文件中设置 DATABASE_URL');
    process.exit(1);
  }

  console.log('🔗 连接到数据库...');
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('✅ 数据库连接成功');

    // 读取迁移文件
    const migrationsDir = path.join(process.cwd(), 'drizzle', 'migrations-postgres');
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

    if (files.length === 0) {
      console.log('⚠️  没有找到迁移文件');
      return;
    }

    console.log(`📁 找到 ${files.length} 个迁移文件`);

    for (const file of files) {
      console.log(`\n📄 执行迁移: ${file}`);
      const sqlPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(sqlPath, 'utf-8');

      // 分割 SQL 语句（按 statement-breakpoint 分割）
      const statements = sql
        .split('--> statement-breakpoint')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      console.log(`   执行 ${statements.length} 条 SQL 语句...`);

      for (const statement of statements) {
        try {
          await client.query(statement);
        } catch (error: any) {
          // 如果表已存在，跳过错误
          if (error.code === '42P07') {
            console.log(`   ⚠️  表已存在，跳过`);
            continue;
          }
          throw error;
        }
      }

      console.log(`   ✅ 迁移完成`);
    }

    console.log('\n🎉 所有数据库迁移完成！');

    // 验证表是否创建成功
    console.log('\n📊 验证数据表...');
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name LIKE 'zi_%'
      ORDER BY table_name;
    `);

    console.log(`✅ 找到 ${result.rows.length} 个以 zi_ 开头的数据表:`);
    result.rows.forEach((row) => {
      console.log(`   - ${row.table_name}`);
    });

  } catch (error) {
    console.error('\n❌ 数据库迁移失败:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 数据库连接已关闭');
  }
}

// 运行初始化
initDatabase();
