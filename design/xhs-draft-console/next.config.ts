import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 本机控制台；不部署公网
  reactStrictMode: true,
  // worker/ 仅由 tsx 跑，勿进 Next 类型收集导致误编译
  typescript: {
    // 仍检查 app/lib；worker 侧单独用 vitest 覆盖
    ignoreBuildErrors: false,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve = config.resolve || {};
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }
    return config;
  },
};

export default nextConfig;
