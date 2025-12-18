'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const errorMessages: Record<string, string> = {
  Configuration: '服务器配置错误。请联系管理员。',
  AccessDenied: '访问被拒绝。您没有权限访问此资源。',
  Verification: '验证令牌已过期或已被使用。',
  Default: '发生了一个错误。请稍后再试。',
};

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string>('');
  const [errorDetails, setErrorDetails] = useState<string>('');

  useEffect(() => {
    const errorType = searchParams?.get('error') || 'Default';
    setError(errorType);

    // 获取详细错误信息
    const details = searchParams?.get('details');
    if (details) {
      setErrorDetails(details);
    }
  }, [searchParams]);

  const message = errorMessages[error] || errorMessages.Default;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8">
          {/* 错误图标 */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>

          {/* 标题 */}
          <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-4">
            认证错误
          </h1>

          {/* 错误信息 */}
          <div className="space-y-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-800 dark:text-red-200">{message}</p>
            </div>

            {/* 错误代码 */}
            {error && error !== 'Default' && (
              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  错误代码: <code className="font-mono">{error}</code>
                </p>
              </div>
            )}

            {/* 详细错误信息 (仅开发环境) */}
            {errorDetails && process.env.NODE_ENV === 'development' && (
              <details className="mt-4">
                <summary className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                  查看详细信息
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-900 p-3 rounded overflow-auto">
                  {errorDetails}
                </pre>
              </details>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="mt-8 space-y-3">
            <a
              href="/auth/signin"
              className="block w-full text-center px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
            >
              返回登录
            </a>
            <a
              href="/"
              className="block w-full text-center px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors"
            >
              返回首页
            </a>
          </div>

          {/* 帮助信息 */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-center text-gray-600 dark:text-gray-400">
              如果问题持续存在,请联系{' '}
              <a
                href="mailto:support@example.com"
                className="text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                技术支持
              </a>
            </p>
          </div>
        </div>

        {/* 常见问题 */}
        <div className="mt-6 bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            常见问题
          </h2>
          <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                为什么会出现这个错误?
              </h3>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>服务器配置问题</li>
                <li>环境变量未正确设置</li>
                <li>数据库连接失败</li>
                <li>认证密钥缺失或无效</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                如何解决?
              </h3>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>稍后重试</li>
                <li>清除浏览器缓存和 Cookie</li>
                <li>联系网站管理员</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
