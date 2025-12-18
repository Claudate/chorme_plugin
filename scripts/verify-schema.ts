import * as fs from 'fs';
import * as path from 'path';

/**
 * 验证 Drizzle 配置文件中引用的 schema 文件是否存在
 * 防止配置错误导致数据库查询失败
 */
function verifySchemaFiles() {
  console.log('🔍 验证 Drizzle 配置文件...\n');

  const configFiles = [
    'drizzle.config.ts',
    'drizzle.config.supabase.ts',
  ];

  let hasErrors = false;

  for (const configFile of configFiles) {
    const configPath = path.join(process.cwd(), configFile);

    if (!fs.existsSync(configPath)) {
      console.log(`⏭️  跳过不存在的配置: ${configFile}`);
      continue;
    }

    console.log(`📄 检查: ${configFile}`);

    const content = fs.readFileSync(configPath, 'utf-8');
    const schemaMatch = content.match(/schema:\s*['"]([^'"]+)['"]/);

    if (!schemaMatch) {
      console.log(`   ⚠️  未找到 schema 配置`);
      continue;
    }

    const schemaPath = schemaMatch[1];
    const fullSchemaPath = path.join(process.cwd(), schemaPath);

    if (!fs.existsSync(fullSchemaPath)) {
      console.error(`   ❌ Schema 文件不存在: ${schemaPath}`);
      console.error(`      完整路径: ${fullSchemaPath}`);
      hasErrors = true;
    } else {
      console.log(`   ✅ Schema 文件存在: ${schemaPath}`);

      // 验证文件不为空
      const schemaContent = fs.readFileSync(fullSchemaPath, 'utf-8');
      if (schemaContent.trim().length === 0) {
        console.error(`   ❌ Schema 文件为空: ${schemaPath}`);
        hasErrors = true;
      } else {
        console.log(`   ✅ Schema 文件有效 (${schemaContent.length} 字符)`);
      }
    }
  }

  console.log('');

  if (hasErrors) {
    console.error('❌ 发现配置错误! 请修复后再继续。');
    console.error('');
    console.error('💡 提示:');
    console.error('   1. 检查 drizzle.config.*.ts 文件中的 schema 路径');
    console.error('   2. 确保引用的 schema 文件确实存在');
    console.error('   3. 常见错误: schema-postgres.ts 已被重命名为 schema.ts');
    process.exit(1);
  } else {
    console.log('✅ 所有配置验证通过!');
  }
}

// 执行验证
verifySchemaFiles();
