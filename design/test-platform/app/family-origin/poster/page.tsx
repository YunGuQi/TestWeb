'use client';

import { useSearchParams } from 'next/navigation';
import { FAMILY_ORIGIN_SUMMARIES } from '../../../lib/family-origin-data';
import { Suspense } from 'react';
import { getFamilyOriginFilter } from '../utils/share';

function PosterGenerator() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id') || 'r1';
  
  const result = FAMILY_ORIGIN_SUMMARIES.find(r => r.id === id) || FAMILY_ORIGIN_SUMMARIES[0];
  const visualFilter = getFamilyOriginFilter(id);
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 p-8">
      {/* 1080x1440 小红书标准 3:4 图文海报容器 */}
      <div 
        id="xhs-poster"
        className="relative overflow-hidden shadow-2xl bg-[#121212] font-serif flex flex-col"
        style={{ width: '1080px', height: '1440px', transform: 'scale(0.5)', transformOrigin: 'top center' }}
      >
        {/* 背景人物图层 (全屏铺满，下部虚化，专属高定滤镜) */}
        <div className="absolute inset-0 z-0">
          <div 
            className="absolute inset-0 z-[1] pointer-events-none" 
            style={{ backgroundImage: visualFilter.glow }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={`/images/family-origin/${id}.png`} 
            alt={result.name} 
            className="w-full h-[70%] object-cover object-top opacity-90 drop-shadow-2xl"
            style={{ filter: visualFilter.filter }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          {/* 渐变遮罩，让下方文字区域清晰 */}
          <div className="absolute inset-0 z-[2] bg-gradient-to-t from-[#121212] via-[#121212]/95 to-transparent h-full"></div>
          <div className="absolute top-0 left-0 w-full h-[40%] z-[2] bg-gradient-to-b from-[#121212]/80 to-transparent"></div>
        </div>

        {/* 顶部档案标识 */}
        <div className="relative z-10 w-full p-12 flex justify-between items-start">
            <div className="bg-[#C2185B] text-white px-6 py-2 text-2xl font-black font-mono tracking-[0.3em] uppercase transform -skew-x-12 shadow-[8px_8px_0px_#B9FBC0] border-4 border-[#121212]">
                DOSSIER // {id.toUpperCase()}
            </div>
            <div className="text-[#F5F2EB]/50 font-mono text-xl tracking-widest border border-[#F5F2EB]/20 px-4 py-1">
                RESTRICTED AREA
            </div>
        </div>

        {/* 核心内容区 (靠下排版) */}
        <div className="relative z-10 flex-1 flex flex-col justify-end p-16 pb-20">
            
            {/* 标签 */}
            <div className="flex flex-wrap gap-4 mb-8">
                {result.tags.map((tag, idx) => (
                    <span key={idx} className="bg-transparent border-2 border-[#B9FBC0] text-[#B9FBC0] px-5 py-2 text-3xl font-mono font-bold tracking-widest uppercase">
                        # {tag}
                    </span>
                ))}
            </div>

            {/* 结果大标题 */}
            <h1 className="text-[110px] leading-[1.1] font-black tracking-widest text-white drop-shadow-2xl mb-12 font-serif">
                {result.name.substring(0, 4)}
                <br/>
                <span className="text-[#C2185B]">{result.name.substring(4)}</span>
            </h1>

            {/* 名言金句 (Quote) */}
            <div className="bg-[#F5F2EB] text-[#121212] p-10 mb-12 border-l-[16px] border-[#C2185B] shadow-[12px_12px_0px_rgba(255,255,255,0.1)]">
                <p className="text-4xl font-bold tracking-wider leading-snug italic font-serif">
                    “{result.quote}”
                </p>
            </div>

            {/* 雷达图数据面板 (纯文字排版展示雷达维度) */}
            <div className="grid grid-cols-2 gap-8 mb-12 bg-white/5 backdrop-blur-sm p-8 border border-white/10">
                {result.radar.map((item, idx) => (
                    <div key={idx} className="flex flex-col gap-2">
                        <span className="text-[#F5F2EB]/60 text-2xl font-mono uppercase tracking-widest">{item.subject}</span>
                        <div className="flex items-center gap-4">
                            <div className="h-4 flex-1 bg-white/10">
                                <div className="h-full bg-[#B9FBC0]" style={{ width: `${item.A}%` }}></div>
                            </div>
                            <span className="text-[#B9FBC0] text-3xl font-black font-mono">{item.A}%</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* 底部 Footer 标识 */}
            <div className="flex items-center justify-between border-t-2 border-white/20 pt-8 mt-4">
                <div className="flex flex-col gap-2">
                    <span className="text-white text-3xl font-bold tracking-widest">原生家庭人生剧本测试</span>
                    <span className="text-[#F5F2EB]/50 text-xl font-mono">YOUR HIDDEN SCRIPT UNLOCKED</span>
                </div>
                <div className="w-32 h-12 bg-white/20 flex flex-col justify-between p-1">
                    {/* 模拟条形码 */}
                    <div className="w-full h-[3px] bg-white"></div>
                    <div className="w-full h-[5px] bg-white"></div>
                    <div className="w-full h-[2px] bg-white"></div>
                    <div className="w-full h-[6px] bg-white"></div>
                    <div className="w-full h-[4px] bg-white"></div>
                </div>
            </div>

        </div>

        {/* 边框修饰 */}
        <div className="absolute top-0 left-0 w-full h-[12px] bg-[#C2185B] z-40"></div>
        <div className="absolute bottom-0 left-0 w-full h-[12px] bg-[#B9FBC0] z-40"></div>
        <div className="absolute top-0 left-0 w-[12px] h-full bg-[#121212] z-40"></div>
        <div className="absolute top-0 right-0 w-[12px] h-full bg-[#121212] z-40"></div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Loading...</div>}>
      <PosterGenerator />
    </Suspense>
  );
}
