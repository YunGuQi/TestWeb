'use client';

import React from 'react';
import { SharePayload } from '../utils/share';
import { getEmoTheme } from '../utils/emo-themes';

interface SharedReceiptCardProps {
  shareData: SharePayload;
  onStartTest: () => void;
  onGoHome: () => void;
}

export default function SharedReceiptCard({ shareData, onStartTest, onGoHome }: SharedReceiptCardProps) {
  const theme = getEmoTheme(shareData.k);
  const formattedCost = typeof shareData.f === 'number' 
    ? `¥${shareData.f.toLocaleString()}` 
    : '¥18,500+';

  return (
    <main id="view-shared" className="flex-1 flex flex-col w-full max-w-md mx-auto relative min-h-[100dvh] pt-[max(16px,env(safe-area-inset-top))] pb-[max(32px,env(safe-area-inset-bottom))] px-3 sm:px-4 z-10">
      <div className="w-full flex-1 flex flex-col items-center justify-center my-auto">
        
        {/* 复古波普顶部通知标签 */}
        <div className={`w-full max-w-[335px] mb-3 flex items-center justify-between font-mono text-[10px] px-3 py-1.5 ${theme.medalCard}`}>
          <span className="font-bold uppercase tracking-wider">● 好友共享档案副本</span>
          <span className={`text-[9px] ${theme.textSecondary}`}>RECEIPT COPY</span>
        </div>

        {/* 主票据容器 */}
        <div className={`w-full max-w-[335px] relative ${theme.outerContainer}`}>
          <div className="receipt-top shrink-0"></div>

          <div className={`receipt-paper px-4 py-5 flex flex-col relative overflow-hidden ${theme.paperBg}`}>
            {/* 专属出纳盖章水印 */}
            <div className={`absolute top-4 right-3 transform ${theme.stamp.rotate || 'rotate-12'} border-2 ${theme.stamp.border} px-2 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider pointer-events-none opacity-80 flex flex-col items-center leading-none`}>
              <span>{theme.stamp.title}</span>
              <span className="text-[8px] my-0.5 border-t border-b border-current w-full text-center py-0.5 font-sans font-bold">{theme.stamp.sub}</span>
            </div>

            {/* 票据抬头 */}
            <div className="text-center font-mono mb-4">
              <div className="text-[9px] text-gray-400 uppercase tracking-widest mb-0.5">=== CONVENIENCE STORE ===</div>
              <h2 className={`text-xl font-black tracking-widest mb-1 ${theme.textMain}`}>安安心灵便利店</h2>
              <div className={`inline-block text-[11px] font-bold px-2 py-0.5 mt-1 ${theme.titleBadge}`}>
                好友情绪消费结账简报
              </div>
              <p className={`text-[9px] mt-1 ${theme.textSecondary}`}>NO. FRIEND-{Math.floor(1000 + Math.random() * 9000)} // VERIFIED</p>
            </div>

            <div className={`${theme.dashedDivider} mb-4`}></div>

            {/* 好友鉴定结果卡片 */}
            <div className="text-center mb-4">
              <span className={`text-[11px] font-bold font-mono block mb-1 ${theme.textSecondary}`}>TA 的情绪内耗主型</span>
              <div className={`text-xl font-black py-2 px-4 inline-block transform -rotate-1 tracking-wide ${theme.titleBadge}`}>
                {shareData.t || '高敏内耗者'}
              </div>
            </div>

            {/* 核心数据量化展示 */}
            <div className={`p-3 mb-4 space-y-2 ${theme.medalCard}`}>
              <div className="flex justify-between items-center text-xs font-mono font-bold">
                <span className={theme.textSecondary}>隐性内耗年化扣费:</span>
                <span className="text-red-600 text-sm font-black">{formattedCost}</span>
              </div>
              <div className="border-t border-dashed border-gray-300 pt-2">
                <span className={`text-[10px] font-mono block mb-0.5 ${theme.textSecondary}`}>能力击败排位:</span>
                <div className={`text-xs font-bold leading-snug ${theme.textMain}`}>
                  {shareData.ot || `击败了 ${shareData.r || 98.5}% 的脆皮人类`}
                </div>
              </div>
            </div>

            {/* 情绪共鸣破防文案 */}
            <div className={`border-l-4 pl-3 py-2 text-xs font-bold leading-relaxed italic mb-4 ${theme.quoteBox}`}>
              “每一笔情绪支出都有迹可循，别把所有情绪都自己咽下。你是否也常常在深夜独自复盘，耗尽心力？”
            </div>

            <div className={`text-center text-[10px] font-mono mb-2 ${theme.textSecondary}`}>
              --- TAP BUTTON BELOW TO TEST ---
            </div>
            
            {/* 醒目行动大按钮 */}
            <button
              onClick={onStartTest}
              id="btn-friend-start-test"
              className="w-full bg-black text-white border-2 border-black py-3.5 px-4 font-black text-sm tracking-widest shadow-[4px_4px_0px_#222] hover:bg-gray-800 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer touch-manipulation group"
            >
              <span className="text-yellow-300 font-mono text-base">▶</span>
              <span className="group-hover:scale-105 transition-transform">我也要测 (只需3分钟)</span>
            </button>

            <p className={`text-[9px] text-center font-bold mt-2 ${theme.textSecondary}`}>
              * 测测你的能量流失在何处 · 测算生成你的专属结账单
            </p>

            <div className="mt-3 pt-3 border-t border-dashed border-gray-300 text-center">
              <button
                onClick={onGoHome}
                id="btn-go-home"
                className="text-[11px] text-gray-500 hover:text-black font-mono underline underline-offset-4 cursor-pointer"
              >
                [ 进入便利店主页 ]
              </button>
            </div>
          </div>

          <div className="receipt-bottom shrink-0"></div>
        </div>

      </div>
    </main>
  );
}
