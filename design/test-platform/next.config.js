/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },

  // 禁用 Turbopack，强制使用 webpack
  // 原因：Turbopack 在 Windows 构建时生成平台相关的二进制 CSS（TSD 格式），
  // 部署到 Linux 宝塔服务器后浏览器无法解析，导致所有 Tailwind 样式完全失效。
  // webpack 生成标准纯文本 CSS，可在任意平台正常运行。
  // 禁用 Turbopack 规则在 Next.js 16 中无效，已被移除

  experimental: {
    cpus: 1,
    workerThreads: false,
    memoryBasedWorkersCount: true,
  },
  
  // 核心修复：防止 Next.js 将 Prisma 引擎写死为 Windows 绝对路径
  // 这使得打包出的 .next 文件夹可以在 Linux 宝塔上正常运行
  serverExternalPackages: ['@prisma/client', 'prisma'],

  // 核心修复：动态生成 Build ID，彻底杜绝部署后被浏览器或 CDN 缓存旧版本 JS/CSS Chunk
  generateBuildId: async () => {
    return 'release-' + Date.now();
  },
}

module.exports = nextConfig
