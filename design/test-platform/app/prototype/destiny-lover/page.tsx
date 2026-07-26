'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect } from 'react';

// --- MOCK DATA ---
const mockData = {
  title: '爹系/妈系守护者',
  subtitle: '全方位人生兜底专家',
  tags: ['细节狂魔', '情绪稳定', '无限包容'],
  radar: [
    { label: '陪伴感', value: 95 },
    { label: '安全感', value: 100 },
    { label: '惊喜度', value: 70 },
    { label: '掌控力', value: 85 },
  ],
  description: '你的命定恋人是一个能为你的人生“兜底”的人。你内心深处其实有些缺乏安全感，容易精神内耗，而 TA 就像一座沉稳的大山。TA 不会整天把爱挂在嘴边，但会在下雨时为你撑伞，在你熬夜时给你倒杯热牛奶。',
  quote: '“这世界兵荒马乱，而我是你永远的避风港。”'
};

// --- VARIANT A: 档案袋式 (Dossier / Envelope) ---
function VariantA({ data }: { data: typeof mockData }) {
  return (
    <div className="min-h-screen bg-[#F4F1EA] p-4 flex items-center justify-center font-serif text-[#2C2825]">
      <div className="relative w-full max-w-md bg-[#FAF8F5] shadow-xl border border-[#D9D0C1] p-8 overflow-hidden rounded-sm">
        {/* Decorative corner / seal */}
        <div className="absolute top-6 right-6 w-16 h-16 border-2 border-[#B93A32] rounded-full flex items-center justify-center opacity-80 rotate-12">
          <span className="text-[#B93A32] text-sm font-bold tracking-widest leading-tight text-center">月老<br/>办事处</span>
        </div>
        
        <div className="flex flex-row-reverse justify-between items-start mb-8">
          <div className="w-12 border-l border-[#D9D0C1] pl-4 text-xl tracking-[0.3em] font-bold" style={{ writingMode: 'vertical-rl' }}>
            红娘档案卡
          </div>
          <div className="flex-1 pr-6">
            <h1 className="text-3xl font-bold text-[#B93A32] mb-2">{data.title}</h1>
            <h2 className="text-lg text-[#5A524A] mb-4">— {data.subtitle}</h2>
            <div className="flex flex-wrap gap-2 mb-6">
              {data.tags.map(t => (
                <span key={t} className="px-3 py-1 bg-[#F4F1EA] text-[#B93A32] text-xs border border-[#E8E2D5]">{t}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t-2 border-b-2 border-dashed border-[#D9D0C1] py-6 mb-6">
          <h3 className="text-sm font-bold mb-4 tracking-widest text-[#B93A32]">【能力雷达】</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {data.radar.map(r => (
              <div key={r.label} className="flex flex-col">
                <span className="text-[#8C847A]">{r.label}</span>
                <div className="w-full bg-[#E8E2D5] h-1.5 mt-1">
                  <div className="bg-[#B93A32] h-1.5" style={{width: `${r.value}%`}}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-8 leading-loose text-[#5A524A]">
          <h3 className="text-sm font-bold mb-2 tracking-widest text-[#B93A32]">【深度解析】</h3>
          <p>{data.description}</p>
        </div>

        <div className="text-center italic text-[#B93A32] border-l-4 border-[#B93A32] pl-4 py-2 bg-[#F4F1EA]">
          {data.quote}
        </div>
      </div>
    </div>
  );
}

// --- VARIANT B: 折页卷轴式 (Scroll / Calligraphy) ---
function VariantB({ data }: { data: typeof mockData }) {
  return (
    <div className="min-h-screen bg-[#EBE7DF] p-4 flex flex-col items-center py-12 font-serif text-[#1F1B18]">
      <div className="w-full max-w-sm flex flex-col items-center">
        {/* Scroll Header */}
        <div className="w-full h-12 bg-[#D13030] rounded-t-md relative flex items-center justify-center shadow-md">
          <div className="absolute -top-3 w-8 h-8 rounded-full bg-[#EBE7DF] border-4 border-[#D13030]"></div>
          <span className="text-[#EBE7DF] tracking-[0.5em] font-medium text-sm">命定恋人签</span>
        </div>
        
        {/* Scroll Body */}
        <div className="w-[96%] bg-[#F9F7F1] shadow-xl p-8 flex flex-col items-center text-center pb-12 relative">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#1F1B18 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
          
          <h2 className="text-[#D13030] text-sm tracking-[0.4em] mb-2">{data.subtitle}</h2>
          <h1 className="text-4xl font-bold mb-6 tracking-wider border-b-2 border-[#1F1B18] pb-4">{data.title}</h1>
          
          <div className="flex gap-3 mb-8">
            {data.tags.map(t => (
              <span key={t} className="text-xs bg-[#1F1B18] text-[#F9F7F1] px-2 py-1 rounded-sm">{t}</span>
            ))}
          </div>

          <div className="w-full mb-8">
            <div className="flex justify-center items-center gap-2 mb-4">
              <span className="w-8 h-[1px] bg-[#D13030]"></span>
              <span className="text-[#D13030] text-xs tracking-widest">属性评估</span>
              <span className="w-8 h-[1px] bg-[#D13030]"></span>
            </div>
            <div className="flex justify-around text-xs flex-wrap gap-y-4">
              {data.radar.map(r => (
                <div key={r.label} className="flex flex-col items-center w-[45%]">
                  <span className="text-[#7A7268] mb-1">{r.label}</span>
                  <span className="text-lg font-bold">{r.value}<span className="text-[10px]">%</span></span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-left text-sm leading-8 text-[#4A433D] mb-8 indent-6">
            {data.description}
          </p>

          <div className="w-full flex flex-col items-center">
            <div className="w-6 h-6 border border-[#D13030] text-[#D13030] flex items-center justify-center text-xs mb-3 transform rotate-45">
              <span className="transform -rotate-45">批</span>
            </div>
            <p className="font-bold text-[#D13030] tracking-wide">{data.quote}</p>
          </div>
        </div>
        
        {/* Scroll Footer */}
        <div className="w-full h-4 bg-[#A32626] rounded-b-md shadow-md"></div>
      </div>
    </div>
  );
}

// --- VARIANT C: 玉牌签文式 (Jade Token / Minimalist) ---
function VariantC({ data }: { data: typeof mockData }) {
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex justify-center items-center p-4 font-serif">
      <div className="w-full max-w-sm bg-white border border-[#E0E0E0] shadow-[0_20px_50px_rgba(0,0,0,0.05)] h-[85vh] max-h-[800px] flex flex-col relative">
        {/* Header Block */}
        <div className="bg-[#8A2B2B] text-white p-6 flex justify-between items-end">
          <div>
            <div className="text-xs opacity-70 tracking-widest mb-1">NO. 082</div>
            <h1 className="text-2xl font-medium tracking-wider">{data.title}</h1>
          </div>
          <div className="text-3xl opacity-20 font-bold" style={{ writingMode: 'vertical-rl' }}>姻缘</div>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 flex flex-col overflow-y-auto">
          <h2 className="text-[#555] text-sm tracking-widest mb-6">「 {data.subtitle} 」</h2>
          
          <div className="flex gap-2 flex-wrap mb-8">
            {data.tags.map(t => (
              <span key={t} className="text-xs text-[#8A2B2B] border border-[#8A2B2B] px-3 py-1 rounded-full">{t}</span>
            ))}
          </div>

          <div className="space-y-4 mb-8">
            {data.radar.map(r => (
              <div key={r.label} className="flex justify-between items-center text-sm border-b border-[#F0F0F0] pb-2">
                <span className="text-[#888]">{r.label}</span>
                <span className="font-medium text-[#333]">{r.value}</span>
              </div>
            ))}
          </div>

          <div className="mt-auto">
            <p className="text-sm leading-relaxed text-[#444] mb-6">
              {data.description}
            </p>
            <div className="bg-[#F9F9F9] p-4 text-[#8A2B2B] text-sm italic border-l-2 border-[#8A2B2B]">
              {data.quote}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- SWITCHER COMPONENT ---
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
    'A': 'A — 档案袋式 (Dossier)',
    'B': 'B — 折页卷轴式 (Scroll)',
    'C': 'C — 玉牌签文式 (Minimalist)',
  };

  if (process.env.NODE_ENV === 'production') return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur text-white px-4 py-2 rounded-full flex items-center gap-4 shadow-2xl z-50 font-sans text-sm">
      <button onClick={() => switchVariant(-1)} className="p-1 hover:text-[#B93A32] transition-colors">←</button>
      <span className="font-medium min-w-[200px] text-center">{variantNames[current] || current}</span>
      <button onClick={() => switchVariant(1)} className="p-1 hover:text-[#B93A32] transition-colors">→</button>
    </div>
  );
}

// --- MAIN PAGE ---
function PrototypePageContent() {
  const searchParams = useSearchParams();
  const variant = searchParams.get('variant') ?? 'A';

  return (
    <>
      {variant === 'A' && <VariantA data={mockData} />}
      {variant === 'B' && <VariantB data={mockData} />}
      {variant === 'C' && <VariantC data={mockData} />}
      <PrototypeSwitcher variants={['A', 'B', 'C']} current={variant} />
    </>
  );
}

export default function PrototypePage() {
  return (
    <Suspense fallback={<div>Loading prototype...</div>}>
      <PrototypePageContent />
    </Suspense>
  );
}
