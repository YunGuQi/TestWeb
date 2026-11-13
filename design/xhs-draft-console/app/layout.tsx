import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '平台发布控制台',
  description: '本机自动化 · 平台发布控制台 · 限频 · 熔断 · 安全发帖',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
