import './globals.css'
import { Metadata } from 'next'
import { tailwindInlineCss } from '@/lib/tailwind-inline'

export const metadata: Metadata = {
  title: 'ANAN OPS CONSOLE',
  description: '安安心灵便利店系列测试',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh">
      <head>
        {/* DLP 绕过：.css 文件被 DLP 加密无法被浏览器解析，
            将 Tailwind CSS 内联到 JS 产物中以正常渲染样式 */}
        <style dangerouslySetInnerHTML={{ __html: tailwindInlineCss }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
