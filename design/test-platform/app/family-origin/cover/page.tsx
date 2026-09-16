'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function CoverGenerator() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id') || 'r1';
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 p-8">
      {/* 1080x1080 小红书标准封面 1:1 比例容器，利用 zoom 等比例缩放以适应屏幕 */}
      <div 
        id="xhs-cover"
        className="relative overflow-hidden shadow-2xl bg-[#F5F2EB]"
        style={{ width: '1080px', height: '1080px', transform: 'scale(0.6)', transformOrigin: 'top center' }}
      >
        {/* 背景图层 */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#121212] via-[#2A0845] to-[#C2185B]"></div>

        {/* 潮酷冲突型 - 碎片装饰 */}
        <div className="absolute top-[10%] left-[5%] w-32 h-32 bg-[#C2185B] mix-blend-screen blur-[80px] rounded-full"></div>
        <div className="absolute bottom-[20%] right-[10%] w-64 h-64 bg-[#B9FBC0] mix-blend-overlay blur-[100px] rounded-full"></div>

        {/* 右侧人物图 - 占据画面的绝佳位置 */}
        <div className="absolute inset-0 left-[20%] z-10 pointer-events-none" style={{
            maskImage: 'linear-gradient(to right, transparent 5%, black 40%)',
            WebkitMaskImage: 'linear-gradient(to right, transparent 5%, black 40%)'
        }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={`/images/family-origin/${id}.png`} 
              alt="Character" 
              className="w-full h-full object-cover object-top opacity-100 mix-blend-normal"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
        </div>

        {/* 左侧排版层 Z-20 */}
        <div className="absolute inset-0 z-20 p-[80px] flex flex-col justify-between">
            {/* 顶部标签 */}
            <div className="flex items-start">
                <div className="bg-[#B9FBC0] text-[#121212] px-6 py-2 text-2xl font-black font-mono tracking-[0.2em] uppercase transform -skew-x-12 shadow-[8px_8px_0px_#121212] border-4 border-[#121212]">
                  原生家庭
                </div>
            </div>

            {/* 核心主标题 */}
            <div className="mt-8 flex-1">
                <h1 className="text-[140px] leading-[1.1] font-black tracking-widest text-white drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)] font-serif" style={{ textShadow: '8px 8px 0px #C2185B, -2px -2px 0px #000' }}>
                    大女主
                    <br/>
                    <span className="text-[#B9FBC0] text-[150px]" style={{ textShadow: '8px 8px 0px #121212' }}>测试</span>
                </h1>
                
                {/* 钩子短句 */}
                <div className="mt-12 inline-block bg-[#121212] border-4 border-white px-8 py-4 transform rotate-[-3deg] shadow-[12px_12px_0px_#C2185B]">
                    <p className="text-white text-4xl font-bold tracking-widest">
                        测出你的<span className="text-[#C2185B] font-black mx-2 text-5xl">隐藏爽文</span>剧本
                    </p>
                </div>
            </div>

            {/* 底部模块 - 利益点 */}
            <div className="flex flex-col gap-6 w-[55%]">
                <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md border-l-8 border-[#B9FBC0] p-6 shadow-xl">
                    <span className="text-[#B9FBC0] text-4xl font-black font-mono">01</span>
                    <span className="text-white text-3xl font-bold tracking-widest">多维深度解析</span>
                </div>
                <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md border-l-8 border-[#C2185B] p-6 shadow-xl">
                    <span className="text-[#C2185B] text-4xl font-black font-mono">02</span>
                    <span className="text-white text-3xl font-bold tracking-widest">拆解你的反差面</span>
                </div>
            </div>

            {/* 装饰与 CTA */}
            <div className="absolute bottom-[80px] right-[80px] z-30">
                <div className="bg-[#B9FBC0] text-[#121212] border-4 border-[#121212] w-48 h-48 rounded-full flex items-center justify-center font-black text-4xl tracking-widest shadow-[10px_10px_0px_#121212] transform hover:scale-105 transition-transform rotate-12">
                    开始<br/>测试
                </div>
            </div>
        </div>

        {/* 顶部氛围边框 */}
        <div className="absolute top-0 left-0 w-full h-4 bg-[#B9FBC0] z-40"></div>
        <div className="absolute bottom-0 left-0 w-full h-4 bg-[#C2185B] z-40"></div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Loading...</div>}>
      <CoverGenerator />
    </Suspense>
  );
}
