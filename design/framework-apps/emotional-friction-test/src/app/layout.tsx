import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "深度情绪内耗测算",
  description: "你的情绪到底花了多少冤枉钱？测一测你的情绪账单",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <body className="antialiased min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
