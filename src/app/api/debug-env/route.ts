import { NextResponse } from 'next/server';

/**
 * 临时调试 API - 用于检查 Vercel 环境变量
 * 部署后访问此 API 来查看实际设置的环境变量
 *
 * 使用后记得删除此文件!
 */
export async function GET() {
  // 检查所有可能的数据库环境变量
  const envVars = {
    // 数据库连接字符串
    POSTGRES_URL: process.env.POSTGRES_URL ? '✅ 已设置' : '❌ 未设置',
    POSTGRES_URL_PREFIX: process.env.POSTGRES_URL?.substring(0, 40) || 'N/A',

    DATABASE_URL: process.env.DATABASE_URL ? '✅ 已设置' : '❌ 未设置',
    DATABASE_URL_PREFIX: process.env.DATABASE_URL?.substring(0, 40) || 'N/A',

    SUPABASE_DB_URL: process.env.SUPABASE_DB_URL ? '✅ 已设置' : '❌ 未设置',
    SUPABASE_DB_URL_PREFIX: process.env.SUPABASE_DB_URL?.substring(0, 40) || 'N/A',

    // Vercel Supabase Integration 可能设置的其他变量
    POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL ? '✅ 已设置' : '❌ 未设置',
    POSTGRES_URL_NON_POOLING: process.env.POSTGRES_URL_NON_POOLING ? '✅ 已设置' : '❌ 未设置',
    POSTGRES_USER: process.env.POSTGRES_USER ? '✅ 已设置' : '❌ 未设置',
    POSTGRES_HOST: process.env.POSTGRES_HOST ? '✅ 已设置' : '❌ 未设置',
    POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD ? '✅ 已设置' : '❌ 未设置',
    POSTGRES_DATABASE: process.env.POSTGRES_DATABASE ? '✅ 已设置' : '❌ 未设置',

    // NextAuth 配置
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ? '✅ 已设置' : '❌ 未设置',
    NEXTAUTH_URL_VALUE: process.env.NEXTAUTH_URL || 'N/A',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? '✅ 已设置' : '❌ 未设置',
    NEXTAUTH_SECRET_LENGTH: process.env.NEXTAUTH_SECRET?.length || 0,

    // Supabase 公开变量
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ 已设置' : '❌ 未设置',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ 已设置' : '❌ 未设置',

    // 其他
    NODE_ENV: process.env.NODE_ENV || 'N/A',
    VERCEL: process.env.VERCEL || 'N/A',
    VERCEL_ENV: process.env.VERCEL_ENV || 'N/A',
  };

  // 查找实际使用的数据库 URL
  const actualDbUrl =
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.SUPABASE_DB_URL ||
    '未找到数据库连接字符串';

  const result = {
    message: '环境变量检查结果',
    timestamp: new Date().toISOString(),
    actualConnectionString: actualDbUrl === '未找到数据库连接字符串'
      ? actualDbUrl
      : actualDbUrl.substring(0, 50) + '...',
    environmentVariables: envVars,
    recommendation: '',
  };

  // 提供建议
  const recommendations = [];

  if (process.env.POSTGRES_URL) {
    recommendations.push('✅ POSTGRES_URL 已设置,这是 Vercel Supabase Integration 的默认变量名。');
  } else if (process.env.DATABASE_URL) {
    recommendations.push('✅ DATABASE_URL 已设置,可以正常使用。');
  } else if (process.env.SUPABASE_DB_URL) {
    recommendations.push('✅ SUPABASE_DB_URL 已设置,可以正常使用。');
  } else {
    recommendations.push('❌ 未找到数据库连接字符串。请在 Vercel Dashboard → Settings → Environment Variables 中设置 POSTGRES_URL 或 DATABASE_URL。');
  }

  if (process.env.NEXTAUTH_SECRET) {
    if ((process.env.NEXTAUTH_SECRET?.length || 0) < 32) {
      recommendations.push('⚠️  NEXTAUTH_SECRET 已设置,但长度少于32字符,建议使用更长的密钥。');
    } else {
      recommendations.push('✅ NEXTAUTH_SECRET 已设置且长度合适。');
    }
  } else {
    recommendations.push('❌ NEXTAUTH_SECRET 未设置!这会导致 NextAuth 认证失败。请设置至少32字符的随机密钥。');
  }

  if (process.env.NEXTAUTH_URL) {
    recommendations.push('✅ NEXTAUTH_URL 已设置: ' + process.env.NEXTAUTH_URL);
  } else {
    recommendations.push('⚠️  NEXTAUTH_URL 未设置。在生产环境中应该设置此变量。');
  }

  result.recommendation = recommendations.join('\n');

  return NextResponse.json(result, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    }
  });
}
