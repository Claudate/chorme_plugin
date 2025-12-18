'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { CustomerSupportButton } from "@/components/ui/customer-support-button";
import { StructuredData } from "@/components/seo/structured-data";

export default function Home() {
  const { data: session, status } = useSession();
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-cyan-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-blue-300/10 to-purple-300/10 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 container mx-auto px-6 py-6">
        <nav className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <span className="text-white font-bold text-lg">述</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent tracking-tight">
              述而作
            </span>
          </div>
          <div className="hidden md:flex items-center space-x-6">
            <Link href="#features">
              <Button variant="ghost" size="sm">功能</Button>
            </Link>
            <Link href="/pricing">
              <Button variant="ghost" size="sm">定价</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">工作台</Button>
            </Link>
            <Link href="/extension">
              <Button variant="ghost" size="sm">插件</Button>
            </Link>
          </div>
          <div className="flex items-center space-x-3">
            {status === 'loading' ? (
              <div className="flex items-center space-x-3">
                <div className="w-16 h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ) : session ? (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600 hidden sm:inline">
                  欢迎，{session.user?.name || session.user?.email}
                </span>
                <Link href="/dashboard">
                  <Button size="sm">进入工作台</Button>
                </Link>
              </div>
            ) : (
              <>
                <Link href="/auth/signin">
                  <Button variant="ghost" size="sm">登录账号</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">立即免费使用</Button>
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 container mx-auto px-6 py-20 text-center">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 leading-tight tracking-tight">
            <span className="bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
              让文字如
            </span>
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              流水
            </span>
            <span className="bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
              般顺畅
            </span>
          </h1>

          <div className="mb-12">
            <p className="text-2xl md:text-3xl text-gray-600 mb-6 leading-relaxed max-w-4xl mx-auto font-light">
              AI 驱动的多平台内容发布工具
            </p>
            <p className="text-lg md:text-xl text-gray-500 leading-relaxed max-w-3xl mx-auto">
              一次创作，智能适配
              <span className="font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mx-2">
                公众号、知乎、掘金、知识星球、视频号、抖音、B站、小红书
              </span>
              等平台格式
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-6 mb-16">
            {session ? (
              <>
                <Link href="/dashboard">
                  <Button
                    size="lg"
                    className="px-12 py-4 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 rounded-xl"
                  >
                    进入工作台
                  </Button>
                </Link>
                <Link href="/editor/new">
                  <Button
                    variant="outline"
                    size="lg"
                    className="px-12 py-4 text-lg font-semibold border-2 border-gray-300 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300 hover:-translate-y-1 rounded-xl"
                  >
                    开始创作
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth/signup">
                  <Button
                    size="lg"
                    className="px-12 py-4 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 rounded-xl"
                  >
                    立即免费使用
                  </Button>
                </Link>
                <Link href="/auth/signin">
                  <Button
                    variant="outline"
                    size="lg"
                    className="px-12 py-4 text-lg font-semibold border-2 border-gray-300 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300 hover:-translate-y-1 rounded-xl"
                  >
                    已有账户？登录
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20 max-w-4xl mx-auto">
            <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50">
              <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">16+</div>
              <div className="text-gray-600 text-lg">持续扩展的平台支持</div>
            </div>
            <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50">
              <div className="text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">85%</div>
              <div className="text-gray-600 text-lg">格式自动适配省时</div>
            </div>
            <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50">
              <div className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">7倍</div>
              <div className="text-gray-600 text-lg">发布效率提升</div>
            </div>
          </div>

          {/* Core Features */}
          <div id="features" className="mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-6 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              核心功能
            </h2>
            <p className="text-xl text-gray-600 text-center mb-12 max-w-3xl mx-auto">
              四大特色功能，让内容创作和发布变得简单高效
            </p>
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <div className="group bg-white/80 backdrop-blur-sm p-10 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-500 border border-white/50 hover:border-blue-200/50 hover:-translate-y-1">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-105 transition-transform duration-300 shadow-lg shadow-blue-500/25">
                  🚀
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">多平台同步发布</h3>
                <p className="text-gray-600 leading-relaxed text-lg mb-4">
                  支持微信公众号、知乎、掘金、小红书、抖音、B站、微博等 16+ 主流平台，一键同步发布内容
                </p>
                <Link href="/extension">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-blue-300 hover:border-blue-500 hover:bg-blue-50"
                  >
                    🔌 安装浏览器插件
                  </Button>
                </Link>
              </div>

              <div className="group bg-white/80 backdrop-blur-sm p-10 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-500 border border-white/50 hover:border-green-200/50 hover:-translate-y-1">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-105 transition-transform duration-300 shadow-lg shadow-green-500/25">
                  🎨
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">智能格式转换</h3>
                <p className="text-gray-600 leading-relaxed text-lg">
                  AI 自动识别和转换格式，智能适配各平台的特殊要求，85% 的时间都节省在格式调整上
                </p>
              </div>

              <div className="group bg-white/80 backdrop-blur-sm p-10 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-500 border border-white/50 hover:border-purple-200/50 hover:-translate-y-1">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-105 transition-transform duration-300 shadow-lg shadow-purple-500/25">
                  ✍️
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">Markdown 专业体验</h3>
                <p className="text-gray-600 leading-relaxed text-lg">
                  所见即所得的 Markdown 编辑器，实时预览多平台效果，支持代码高亮、数学公式、图表等丰富内容
                </p>
              </div>

              <div className="group bg-white/80 backdrop-blur-sm p-10 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-500 border border-white/50 hover:border-orange-200/50 hover:-translate-y-1">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-105 transition-transform duration-300 shadow-lg shadow-orange-500/25">
                  ☁️
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">云端存储安全</h3>
                <p className="text-gray-600 leading-relaxed text-lg">
                  所有内容自动云端备份，多设备同步，数据加密存储，永不丢失您的创作成果
                </p>
              </div>
            </div>
          </div>

          {/* Workflow Section */}
          <div className="mb-20 max-w-6xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-6 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              工作流程
            </h2>
            <p className="text-xl text-gray-600 text-center mb-12 max-w-3xl mx-auto">
              简单四步，让内容触达全网
            </p>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="relative">
                <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-white/50 text-center h-full">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4 mx-auto shadow-lg">
                    1
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-900">创作与导入</h3>
                  <p className="text-gray-600 leading-relaxed">
                    使用 Markdown 编辑器创作，或导入已有内容
                  </p>
                </div>
                <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 text-3xl text-blue-300">
                  →
                </div>
              </div>

              <div className="relative">
                <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-white/50 text-center h-full">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4 mx-auto shadow-lg">
                    2
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-900">智能适配</h3>
                  <p className="text-gray-600 leading-relaxed">
                    AI 自动转换格式，适配各平台特殊要求
                  </p>
                </div>
                <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 text-3xl text-green-300">
                  →
                </div>
              </div>

              <div className="relative">
                <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-white/50 text-center h-full">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4 mx-auto shadow-lg">
                    3
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-900">一键分发</h3>
                  <p className="text-gray-600 leading-relaxed">
                    选择目标平台，一键同步发布到多个渠道
                  </p>
                </div>
                <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 text-3xl text-purple-300">
                  →
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-white/50 text-center h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4 mx-auto shadow-lg">
                  4
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">数据回收</h3>
                <p className="text-gray-600 leading-relaxed">
                  追踪发布记录，分析内容表现数据
                </p>
              </div>
            </div>
          </div>

          {/* Platform Support */}
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-6 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              平台支持
            </h2>
            <p className="text-xl text-gray-600 text-center mb-12 max-w-3xl mx-auto">
              覆盖 16+ 主流内容平台，持续扩展中
            </p>
            <div className="bg-white/80 backdrop-blur-sm p-10 rounded-3xl shadow-lg border border-white/50">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-8">
                <div className="flex flex-col items-center justify-center p-4 hover:scale-105 transition-transform">
                  <div className="text-4xl mb-3">💬</div>
                  <div className="text-center font-semibold text-gray-700">微信公众号</div>
                </div>
                <div className="flex flex-col items-center justify-center p-4 hover:scale-105 transition-transform">
                  <div className="text-4xl mb-3">🎓</div>
                  <div className="text-center font-semibold text-gray-700">知乎</div>
                </div>
                <div className="flex flex-col items-center justify-center p-4 hover:scale-105 transition-transform">
                  <div className="text-4xl mb-3">💎</div>
                  <div className="text-center font-semibold text-gray-700">掘金</div>
                </div>
                <div className="flex flex-col items-center justify-center p-4 hover:scale-105 transition-transform">
                  <div className="text-4xl mb-3">📕</div>
                  <div className="text-center font-semibold text-gray-700">小红书</div>
                </div>
                <div className="flex flex-col items-center justify-center p-4 hover:scale-105 transition-transform">
                  <div className="text-4xl mb-3">🎵</div>
                  <div className="text-center font-semibold text-gray-700">抖音</div>
                </div>
                <div className="flex flex-col items-center justify-center p-4 hover:scale-105 transition-transform">
                  <div className="text-4xl mb-3">📺</div>
                  <div className="text-center font-semibold text-gray-700">B站</div>
                </div>
                <div className="flex flex-col items-center justify-center p-4 hover:scale-105 transition-transform">
                  <div className="text-4xl mb-3">🐦</div>
                  <div className="text-center font-semibold text-gray-700">微博</div>
                </div>
                <div className="flex flex-col items-center justify-center p-4 hover:scale-105 transition-transform">
                  <div className="text-4xl mb-3">⭐</div>
                  <div className="text-center font-semibold text-gray-700">知识星球</div>
                </div>
                <div className="flex flex-col items-center justify-center p-4 hover:scale-105 transition-transform">
                  <div className="text-4xl mb-3">📹</div>
                  <div className="text-center font-semibold text-gray-700">视频号</div>
                </div>
                <div className="flex flex-col items-center justify-center p-4 hover:scale-105 transition-transform">
                  <div className="text-4xl mb-3">🌐</div>
                  <div className="text-center font-semibold text-gray-700">CSDN</div>
                </div>
                <div className="flex flex-col items-center justify-center p-4 hover:scale-105 transition-transform">
                  <div className="text-4xl mb-3">📰</div>
                  <div className="text-center font-semibold text-gray-700">今日头条</div>
                </div>
                <div className="flex flex-col items-center justify-center p-4 hover:scale-105 transition-transform">
                  <div className="text-4xl mb-3">✨</div>
                  <div className="text-center font-semibold text-gray-500">更多平台...</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 bg-white/70 backdrop-blur-md border-t border-white/30 mt-20">
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="flex flex-col items-start space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">述</span>
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent tracking-tight">
                  述而作
                </span>
              </div>
              <p className="text-sm text-gray-600">让文字如流水般顺畅流向每个平台</p>
            </div>

            {/* Product Links */}
            <div>
              <h3 className="font-bold text-gray-900 mb-4">产品</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">
                    功能特色
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="text-gray-600 hover:text-blue-600 transition-colors">
                    定价方案
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="text-gray-600 hover:text-blue-600 transition-colors">
                    工作台
                  </Link>
                </li>
                <li>
                  <Link href="/extension" className="text-gray-600 hover:text-blue-600 transition-colors">
                    浏览器插件
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="font-bold text-gray-900 mb-4">资源</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/auth/signup" className="text-gray-600 hover:text-blue-600 transition-colors">
                    开始使用
                  </Link>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                    使用教程
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                    API 文档
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                    更新日志
                  </a>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="font-bold text-gray-900 mb-4">支持</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                    帮助中心
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                    联系我们
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                    隐私政策
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                    服务条款
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-500 text-sm text-center md:text-left mb-4 md:mb-0">
              <p>&copy; 2025 述而作. 专注于内容创作的美好体验.</p>
            </div>
            <div className="flex space-x-6 text-gray-500">
              <a href="#" className="hover:text-blue-600 transition-colors">
                <span className="text-xl">📧</span>
              </a>
              <a href="#" className="hover:text-blue-600 transition-colors">
                <span className="text-xl">💬</span>
              </a>
              <a href="#" className="hover:text-blue-600 transition-colors">
                <span className="text-xl">🐦</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
      
      {/* 全局浮动客服按钮 */}
      <CustomerSupportButton />
      
      {/* 结构化数据 */}
      <StructuredData type="WebApplication" />
    </div>
  );
}
