import { NextRequest, NextResponse } from 'next/server';
import { registerUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    console.log('📝 Registration request received');

    const body = await request.json();
    console.log('📧 Registration attempt for email:', body.email);

    const user = await registerUser(body);

    console.log('✅ Registration successful:', { userId: user.id, email: user.email });

    return NextResponse.json({
      success: true,
      data: user,
      message: '注册成功',
    });
  } catch (error) {
    console.error('❌ Registration API error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      env: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasSupabaseUrl: !!process.env.SUPABASE_DB_URL,
        nodeEnv: process.env.NODE_ENV,
        isVercel: !!process.env.VERCEL,
      },
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '注册失败',
      },
      { status: 400 }
    );
  }
}
