import './globals.css'

export const metadata = {
  title: '深度情绪内耗测试',
  description: '你的每一次纠结，都在暗中标好了价格',
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
      </head>
      <body>{children}</body>
    </html>
  )
}
