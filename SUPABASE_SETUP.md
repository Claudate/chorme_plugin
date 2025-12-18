# Supabase 数据库设置指南

## 问题诊断

当前遇到 "Tenant or user not found" 错误，这通常是由于以下原因之一：

1. ❌ 数据库密码已过期或不正确
2. ❌ 项目 ID 不正确
3. ❌ Supabase 项目已暂停或删除
4. ❌ 使用了错误的数据库连接字符串

## 解决步骤

### 步骤 1: 获取正确的数据库连接字符串

1. 访问 [Supabase Dashboard](https://app.supabase.com/)
2. 选择你的项目 (项目ID: dsxowflwwyagymsmlyyc)
3. 点击左侧菜单的 **Project Settings** (齿轮图标)
4. 选择 **Database** 标签
5. 在 **Connection string** 部分，你会看到两个选项：
   - **Session mode (Port 5432)** - 用于长时间连接
   - **Transaction mode (Port 6543)** - 用于短连接和连接池

### 步骤 2: 复制正确的连接字符串

选择 **Transaction mode** 或 **Session mode** 的连接字符串，格式类似：

```
postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

**重要提示：**
- 将 `[YOUR-PASSWORD]` 替换为你的**实际数据库密码**
- 数据库密码 **不是** Service Role Key
- 如果忘记密码，可以在 Database Settings 中重置

### 步骤 3: 更新环境变量

将正确的连接字符串更新到 `.env.local` 文件：

```env
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://dsxowflwwyagymsmlyyc.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-role-key-here
```

### 步骤 4: 获取其他必需的密钥

在 **Project Settings > API** 页面，你可以找到：

- **Project URL**: `SUPABASE_URL`
- **anon/public key**: `SUPABASE_ANON_KEY`
- **service_role key**: `SUPABASE_SERVICE_KEY` (仅用于服务端)

### 步骤 5: 初始化数据库

配置好环境变量后，运行以下命令创建数据库表：

```bash
npm run db:init
```

或者手动推送 schema：

```bash
npm run db:push:pg
```

## 常见问题解决

### Q: 仍然出现 "Tenant or user not found" 错误

**解决方法：**
1. 确认你的 Supabase 项目状态是 **Active**
2. 尝试在 Supabase Dashboard 中重置数据库密码
3. 确认使用的是 Database Password，而不是 Service Role Key

### Q: 如何重置数据库密码？

1. 进入 **Project Settings > Database**
2. 向下滚动到 **Database Password** 部分
3. 点击 **Reset Database Password**
4. 复制新密码并更新到 `.env.local` 中的 `DATABASE_URL`

### Q: 可以手动创建表吗？

可以！如果命令行工具失败，你可以：

1. 登录 Supabase Dashboard
2. 进入 **SQL Editor**
3. 复制 `drizzle/migrations-postgres/0000_lowly_rafael_vega.sql` 的内容
4. 在 SQL Editor 中执行

## 验证数据库连接

创建 `test-db-connection.ts` 文件来测试连接：

```typescript
import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testConnection() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ 数据库连接成功!');

    const result = await client.query('SELECT version()');
    console.log('PostgreSQL 版本:', result.rows[0].version);

    await client.end();
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
  }
}

testConnection();
```

运行测试：

```bash
npx tsx test-db-connection.ts
```

## 下一步

数据库设置成功后：

1. ✅ 验证所有表已创建（应该看到 7 个 `zi_` 开头的表）
2. ✅ 运行开发服务器：`npm run dev`
3. ✅ 访问 `http://localhost:3000` 测试应用

## 需要帮助？

如果问题仍然存在：

1. 检查 Supabase 项目的状态和配额
2. 确认项目没有被暂停
3. 查看 Supabase Dashboard 的 Logs 获取更多错误信息
4. 参考 [Supabase 数据库文档](https://supabase.com/docs/guides/database)
