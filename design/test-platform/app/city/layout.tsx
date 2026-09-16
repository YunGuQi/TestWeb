import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "心灵逃跑车票 - 寻找契合你灵魂的那座城 | 性格城市测试",
  description: "回答20道极其真实的心理安检题，获取你的专属单程车票。探索全国34个省份中与你灵魂高度共鸣的那座专属城市。",
  openGraph: {
    title: "心灵逃跑车票 - 寻找契合你灵魂的那座城 | 性格城市测试",
    description: "回答20道极其真实的心理安检题，获取你的专属单程车票。探索全国34个省份中与你灵魂高度共鸣的那座专属城市。",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      className={`h-full antialiased min-h-full flex flex-col`}
    >
      {children}
    </div>
  );
}
