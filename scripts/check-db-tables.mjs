import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL || "postgresql://postgres.dsxowflwwyagymsmlyyc:BmNUjJVdNMTVi15N@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres";

const sql = postgres(connectionString, {
  ssl: 'require',
  prepare: false,
});

try {
  const tables = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `;

  console.log('📋 All tables in database:');
  tables.forEach(t => console.log(`  - ${t.table_name}`));

  const columns = await sql`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users'
    ORDER BY ordinal_position
  `;

  if (columns.length > 0) {
    console.log('\n📊 Columns in "users" table:');
    columns.forEach(c => console.log(`  - ${c.column_name} (${c.data_type})`));
  }

  const ziColumns = await sql`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'zi_users'
    ORDER BY ordinal_position
  `;

  if (ziColumns.length > 0) {
    console.log('\n📊 Columns in "zi_users" table:');
    ziColumns.forEach(c => console.log(`  - ${c.column_name} (${c.data_type})`));
  }

  await sql.end();
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
