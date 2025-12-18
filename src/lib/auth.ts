import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db, users } from './db';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

// 登录表单验证schema
const loginSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码至少6位'),
});

// 注册表单验证schema
const registerSchema = z.object({
  name: z.string().min(2, '姓名至少2个字符'),
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码至少6位'),
});

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log('❌ Auth: Missing credentials');
            return null;
          }

          // 验证输入
          const { email, password } = loginSchema.parse(credentials);
          console.log('🔍 Auth: Validating user:', email);

          // 查找用户
          const user = await db.query.users.findFirst({
            where: eq(users.email, email)
          });

          if (!user || !user.passwordHash) {
            console.log('❌ Auth: User not found or no password:', email);
            return null;
          }

          // 验证密码
          const isValidPassword = await bcrypt.compare(password, user.passwordHash);
          if (!isValidPassword) {
            console.log('❌ Auth: Invalid password for:', email);
            return null;
          }

          console.log('✅ Auth: User authenticated:', email);
          // 返回用户信息（不包含密码）
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.avatar,
          };
        } catch (error) {
          console.error('❌ Auth error:', error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error', // 添加错误页面
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      try {
        if (user) {
          token.id = user.id;
        }

        // 当session.update()被调用时，重新从数据库获取最新用户信息
        if (trigger === 'update' && token.id) {
          const updatedUser = await db.query.users.findFirst({
            where: eq(users.id, token.id as string)
          });

          if (updatedUser) {
            token.name = updatedUser.name;
            token.email = updatedUser.email;
            token.image = updatedUser.avatar;
          }
        }

        return token;
      } catch (error) {
        console.error('❌ JWT callback error:', error);
        return token;
      }
    },
    async session({ session, token }) {
      try {
        if (token && session.user) {
          session.user.id = token.id as string;
          session.user.name = token.name as string;
          session.user.email = token.email as string;
          session.user.image = token.image as string;
        }
        return session;
      } catch (error) {
        console.error('❌ Session callback error:', error);
        return session;
      }
    },
  },
  // 添加调试日志
  debug: process.env.NODE_ENV === 'development',
  // 确保使用环境变量
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

// Helper function to get session on server side
export async function getServerSession() {
  const { getServerSession } = await import('next-auth/next');
  return getServerSession(authOptions);
}

// 注册用户函数
export async function registerUser(data: z.infer<typeof registerSchema>) {
  try {
    // 验证输入
    const { name, email, password } = registerSchema.parse(data);

    // 检查用户是否已存在
    console.log('🔍 Checking if user exists:', { email });
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email)
    });
    console.log('✅ User check complete:', {
      exists: !!existingUser,
      email
    });

    if (existingUser) {
      throw new Error('用户已存在');
    }

    // 加密密码
    console.log('🔐 Hashing password...');
    const passwordHash = await bcrypt.hash(password, 12);
    console.log('✅ Password hashed');

    // 创建用户
    console.log('👤 Creating new user:', { name, email });
    const [newUser] = await db.insert(users).values({
      name,
      email,
      passwordHash,
    }).returning();

    console.log('✅ User created successfully:', {
      id: newUser.id,
      email: newUser.email
    });

    return {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
    };
  } catch (error) {
    // 增强错误日志
    console.error('❌ User registration failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      email: data.email,
    });

    if (error instanceof z.ZodError) {
      throw new Error(error.issues?.[0]?.message || '参数错误');
    }
    throw error;
  }
}

// 导出验证schemas
export { loginSchema, registerSchema };
