import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '深度情绪内耗测试 | 安安心灵便利店 · 情绪消费账单',
  description: '你的每一次内耗纠结，都在暗中标好了价格。精准测量敏感税、反刍税、讨好税与边界税，生成你的专属热敏纸内耗明细小票。',
  keywords: ['情绪内耗', '情绪账单', '心理测试', '敏感税', '反刍内耗', '安安心灵便利店'],
  openGraph: {
    title: '深度情绪内耗测试 | 安安心灵便利店 · 情绪消费账单',
    description: '你的每一次内耗纠结，都在暗中标好了价格。生成你的专属热敏小票账单！',
    type: 'website',
  },
};

export default function EmoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="emo-layout-wrapper min-h-[100dvh] bg-[#fdfbf7] text-black">
      {children}
    </div>
  );
}
