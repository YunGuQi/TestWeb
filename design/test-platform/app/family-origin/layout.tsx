import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '原生家庭人生剧本解析 | 安安心灵便利店',
  description: '原生家庭人生剧本解析 | 心理学深度分析',
};

export default function FamilyOriginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children;
}
