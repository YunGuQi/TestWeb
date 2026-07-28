'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect } from 'react';

// === Variant A: 东方玄学 · 暗夜星界命盘 (Dark Astral) ===
function VariantA() {
  return (
    <div className="w-full min-h-screen relative flex items-center justify-center p-4 md:p-8 overflow-hidden text-[#E8E2D5]"
         style={{ background: 'radial-gradient(circle at 50% 30%, #1c151b 0%, #0c0a0e 70%, #050406 100%)' }}>
      {/* 命盘装饰暗纹 */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
        <svg className="w-[750px] h-[750px] animate-spin-slow text-amber-500/20" viewBox="0 0 400 400" fill="none" stroke="currentColor">
          <circle cx="200" cy="200" r="180" strokeWidth="0.5" strokeDasharray="4 4"/>
          <circle cx="200" cy="200" r="140" strokeWidth="0.5"/>
          <circle cx="200" cy="200" r="100" strokeWidth="0.8" strokeDasharray="2 6"/>
          <circle cx="200" cy="200" r="60" strokeWidth="0.5"/>
          <path d="M200 10 L200 390 M10 200 L390 200 M65 65 L335 335 M65 335 L335 65" strokeWidth="0.3" opacity="0.5"/>
          <polygon points="200,30 220,190 370,200 220,210 200,370 180,210 30,200 180,190" strokeWidth="0.5" fill="none"/>
        </svg>
      </div>
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* 命定恋人经典卡片 */}
      <div className="max-w-md w-full p-8 md:p-10 rounded-sm relative z-10 text-center backdrop-blur-md shadow-2xl border border-amber-500/30"
           style={{ background: 'rgba(22, 18, 24, 0.85)', boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 30px rgba(185,58,50,0.15)' }}>
        <div className="inline-block border border-amber-500/40 bg-amber-500/5 px-4 py-1.5 mb-6 rounded-full">
          <span className="text-amber-300 text-xs tracking-[0.3em] uppercase">· 星盘因缘 · 命理测算 ·</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-black mb-3 tracking-widest text-white leading-tight">
          解密你的<span className="text-red-500 block md:inline mt-1 md:mt-0 font-serif">命定恋人</span>
        </h1>
        <div className="w-16 h-px bg-gradient-to-r from-transparent via-amber-500/60 to-transparent mx-auto my-6"></div>
        <p className="text-sm md:text-base leading-relaxed text-gray-300 mb-8 text-justify opacity-90 font-light">
          在这深邃的命数轨迹中，谁与你的灵魂波频同频共振？是为你在长夜引路的灯火，还是共赴浮沉的执手之人？<br/><br/>
          花 <span className="font-bold text-amber-400">3 分钟</span>完成红娘心相勘测，开启被星斗守护的一对一姻缘契约。
        </p>
        <button className="w-full bg-gradient-to-r from-red-800 to-red-600 text-amber-100 text-lg font-bold py-4 px-6 rounded-sm tracking-[0.25em] hover:brightness-110 active:scale-[0.99] transition-all shadow-lg border border-red-500/30">
          开启因缘命盘
        </button>
      </div>
    </div>
  );
}

// === Variant B: 宣纸古卷 · 朱砂姻缘绳与墨渍 (Antique Rice Paper) ===
function VariantB() {
  return (
    <div className="w-full min-h-screen relative flex items-center justify-center p-4 md:p-8 overflow-hidden text-[#2C2825]"
         style={{ 
           backgroundColor: '#F4EFE6', 
           backgroundImage: 'radial-gradient(rgba(185,58,50,0.06) 1px, transparent 0), radial-gradient(rgba(44,40,37,0.08) 1px, transparent 0)',
           backgroundSize: '32px 32px',
           backgroundPosition: '0 0, 16px 16px'
         }}>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
        <svg className="w-full h-full" viewBox="0 0 1440 900" fill="none">
          <path d="M-100,200 C300,400 600,100 1540,600" stroke="#B93A32" strokeWidth="1.5" strokeDasharray="6 4" fill="none"/>
          <path d="M-50,700 C400,500 900,800 1500,150" stroke="#B93A32" strokeWidth="1" opacity="0.6" fill="none"/>
        </svg>
      </div>
      <div className="max-w-md w-full p-8 md:p-10 rounded-sm relative z-10 text-center border-2 border-[#D9CFBE]"
           style={{ background: '#FAF7F0', boxShadow: '0 24px 60px rgba(44,40,37,0.12), 0 4px 12px rgba(185,58,50,0.05)' }}>
        <div className="inline-block border-2 border-[#B93A32] px-4 py-1 mb-6 bg-[#B93A32]/5">
          <span className="text-[#B93A32] text-xs font-bold tracking-[0.3em] font-serif">· 姻缘簿 · 专属红绳档案 ·</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-black mb-3 tracking-widest text-[#2C2825] leading-tight">
          解密你的<span className="text-[#B93A32] block md:inline mt-1 md:mt-0 underline decoration-[#B93A32]/40 underline-offset-8">命定恋人</span>
        </h1>
        <div className="w-12 h-0.5 bg-[#B93A32] mx-auto my-6"></div>
        <p className="text-sm md:text-base leading-relaxed text-[#4A423A] mb-8 text-justify">
          你是否曾在夜深时思绪翻涌，想象那个将一生相伴的 TA 究竟是什么性格？是偏向成熟包容的避风港，还是带来无尽心动的知己？<br/><br/>
          花 <span className="font-bold text-[#B93A32]">3 分钟</span>完成心理契约测试，推算属于你灵魂归宿的【红娘姻缘卡】。
        </p>
        <button className="w-full bg-[#B93A32] text-white text-lg font-bold py-4 px-6 rounded-sm tracking-[0.25em] hover:bg-[#9B2D26] active:scale-[0.99] transition-all shadow-md border-b-4 border-[#7A211B]">
          亲手解开姻缘签
        </button>
      </div>
    </div>
  );
}

// === Variant C: 赛博新中式 · 红娘印局暗黑契约 (Cyber-Neo-Chinese) ===
function VariantC() {
  return (
    <div className="w-full min-h-screen relative flex items-center justify-center p-4 md:p-8 overflow-hidden text-[#F7EAEB]"
         style={{ background: 'linear-gradient(135deg, #18080C 0%, #0D0507 50%, #14080B 100%)' }}>
      <div className="absolute inset-0 opacity-15 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#E03E36 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}></div>
      <div className="max-w-md w-full p-8 md:p-10 rounded-sm relative z-10 text-center border border-[#E03E36]/35"
           style={{ background: 'rgba(28, 12, 16, 0.9)', boxShadow: '0 20px 50px rgba(0,0,0,0.7), inset 0 0 20px rgba(224,62,54,0.08)' }}>
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#E03E36]/30">
          <span className="text-[10px] font-mono text-[#E03E36] tracking-widest">// DEEP-EMO // SYNC: 100%</span>
          <span className="text-xs px-2 py-0.5 bg-[#E03E36] text-black font-bold font-mono">红娘印局</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-black mb-3 tracking-widest text-white leading-tight">
          解密你的<span className="text-[#FF4A40] block md:inline mt-1 md:mt-0 font-serif">命定恋人</span>
        </h1>
        <div className="w-full h-px bg-gradient-to-r from-transparent via-[#E03E36]/50 to-transparent my-6"></div>
        <p className="text-sm md:text-base leading-relaxed text-gray-300 mb-8 text-justify">
          感情绝非随便尝试，而是一场契约高阶算法。TA 是否能够接住你复杂的情绪边界，懂你未宣之于口的骄傲与软弱？<br/><br/>
          花 <span className="font-bold text-[#FF4A40]">3 分钟</span>进行潜意识连线，签收你的专属【姻缘鉴定书】。
        </p>
        <button className="w-full bg-[#E03E36] text-white text-lg font-bold py-4 px-6 rounded-sm tracking-[0.25em] hover:bg-[#F24B42] active:scale-[0.99] transition-all shadow-[0_0_25px_rgba(224,62,54,0.4)]">
          测算灵魂配对率
        </button>
      </div>
    </div>
  );
}

// === Switcher (Bottom Pill) ===
function PrototypeSwitcher({ variants, current }: { variants: string[], current: string }) {
  const router = useRouter();
  const currentIndex = variants.indexOf(current) === -1 ? 0 : variants.indexOf(current);

  const switchVariant = (step: number) => {
    const nextIndex = (currentIndex + step + variants.length) % variants.length;
    router.replace(`?variant=${variants[nextIndex]}`);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft') switchVariant(-1);
      if (e.key === 'ArrowRight') switchVariant(1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, variants]);

  const variantNames: Record<string, string> = {
    'A': 'Variant A — 东方玄学·星界命盘 (Recommended)',
    'B': 'Variant B — 宣纸古卷·朱砂红绳',
    'C': 'Variant C — 赛博新中式·红娘印局',
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-black/90 backdrop-blur-md text-white px-5 py-2.5 rounded-full flex items-center gap-5 shadow-2xl z-50 font-sans text-xs md:text-sm border border-white/20 select-none">
      <button onClick={() => switchVariant(-1)} className="p-1 hover:text-red-400 active:scale-90 transition-all font-bold text-base cursor-pointer">←</button>
      <div className="flex flex-col items-center min-w-[210px]">
        <span className="font-bold text-amber-300 tracking-wider">{variantNames[current] || current}</span>
        <span className="text-[10px] text-gray-400 font-mono">PROTOTYPE THROWAWAY BOLDER</span>
      </div>
      <button onClick={() => switchVariant(1)} className="p-1 hover:text-red-400 active:scale-90 transition-all font-bold text-base cursor-pointer">→</button>
    </div>
  );
}

function PrototypeBgContent() {
  const searchParams = useSearchParams();
  const variant = searchParams.get('variant') ?? 'A';

  return (
    <>
      {variant === 'A' && <VariantA />}
      {variant === 'B' && <VariantB />}
      {variant === 'C' && <VariantC />}
      <PrototypeSwitcher variants={['A', 'B', 'C']} current={variant} />
    </>
  );
}

export default function DestinyLoverBgPrototype() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Loading Bolder Prototype...</div>}>
      <PrototypeBgContent />
    </Suspense>
  );
}
