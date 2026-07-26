'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LobbyPage() {
  const [clickCount, setClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);
  const router = useRouter();

  const handleTitleClick = () => {
    const now = Date.now();
    let newCount = 1;

    // If the interval is less than or equal to 1s (1000ms), increment the count
    if (now - lastClickTime <= 1000) {
      newCount = clickCount + 1;
    }

    setClickCount(newCount);
    setLastClickTime(now);

    if (newCount >= 5) {
      setClickCount(0);
      router.push('/ops-login');
    }
  };

  return (
    <div className="text-white min-h-[100dvh] relative overflow-hidden bg-[#09090b]">
      <style dangerouslySetInnerHTML={{__html: `
        .glass-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
        }
        
        .glowing-tag {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: inset 0 0 8px rgba(255, 255, 255, 0.05), 0 0 10px rgba(255, 255, 255, 0.05);
        }

        @keyframes pulse-slow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }
        .aurora-orb {
          animation: pulse-slow 8s infinite ease-in-out;
        }

        @keyframes spin-slow {
          100% { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 12s linear infinite;
        }
        
        @keyframes spin-reverse-slow {
          100% { transform: rotate(-360deg); }
        }
        .animate-spin-reverse-slow {
          animation: spin-reverse-slow 8s linear infinite;
        }

        @keyframes dash-flow {
          to { stroke-dashoffset: -50; }
        }
        .animate-dash {
          animation: dash-flow 4s linear infinite;
        }
        
        @keyframes ping-soft {
          75%, 100% { transform: scale(1.5); opacity: 0; }
        }
        .animate-ping-soft {
          animation: ping-soft 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}} />

      {/* BACKGROUND: 全息极光网格 (Aurora Mesh) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="aurora-orb absolute -top-20 -left-20 w-96 h-96 bg-purple-600/30 rounded-full blur-[100px]"></div>
        <div className="aurora-orb absolute top-1/3 -right-32 w-[30rem] h-[30rem] bg-indigo-600/30 rounded-full blur-[120px]" style={{animationDelay: '2s'}}></div>
        <div className="aurora-orb absolute -bottom-20 -left-10 w-80 h-80 bg-rose-600/20 rounded-full blur-[90px]" style={{animationDelay: '4s'}}></div>
      </div>

      {/* MAIN CONTENT: 卡片列表 */}
      <div className="relative z-10 pb-24 px-4 pt-10 max-w-md mx-auto">
        <div className="mb-10 text-center select-none cursor-pointer active:scale-95 transition-transform" onClick={handleTitleClick}>
          <h2 className="text-2xl font-black tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-blue-300 via-purple-300 to-rose-300">EXPLORE</h2>
          <p className="text-xs text-gray-400 mt-2 tracking-widest uppercase">探索更多心理深潜</p>
        </div>

        <div className="space-y-6">
          
          {/* Card 1: 深度情绪内耗测试 (This is the one we actually built) */}
          <Link href="/emo" className="block group overflow-hidden rounded-3xl p-5 glass-card hover:bg-white/10 transition-all duration-300 hover:scale-[1.02]">
            <div className="flex gap-4">
              <div className="w-24 h-24 shrink-0 rounded-[1.25rem] bg-gradient-to-br from-[#1E1B4B] to-[#312E81] flex items-center justify-center relative shadow-[0_8px_16px_rgba(49,46,129,0.4)] overflow-hidden border border-indigo-500/30">
                <svg className="w-16 h-16 text-indigo-300 absolute animate-spin-slow" viewBox="0 0 100 100" fill="none">
                  <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="1.5" strokeDasharray="10 15" className="opacity-60 animate-dash" />
                </svg>
                <svg className="w-10 h-10 text-purple-400 absolute animate-spin-reverse-slow" viewBox="0 0 100 100" fill="none">
                  <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="2" strokeDasharray="20 10" className="opacity-80" />
                </svg>
                <div className="w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_10px_#fff]"></div>
                <div className="absolute top-0 right-0 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-lg shadow-lg">🔥 HOT</div>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-base mb-1.5 text-white/95 tracking-wide">深度情绪内耗测试</h3>
                <p className="text-xs text-white/60 leading-relaxed line-clamp-2 mb-3">定位你的情绪黑洞。基于认知行为学，深度拆解你的防御机制，告别精神内耗。</p>
                <div className="flex flex-wrap items-center gap-2 text-[10px] text-white/80">
                  <div className="glowing-tag rounded-full px-2 py-1 flex items-center gap-1">✨ 钝感力</div>
                  <div className="glowing-tag rounded-full px-2 py-1 flex items-center gap-1">🔮 反刍指数</div>
                </div>
              </div>
            </div>
            <div className="mt-4 border-t border-white/10 pt-3 flex justify-between items-center text-xs">
              <span className="text-white/40 font-mono">120K+ Users</span>
              <span className="bg-white/10 text-white/90 px-4 py-1.5 rounded-full font-bold group-hover:bg-white/20 transition">Start →</span>
            </div>
          </Link>
          {/* Card 2: 命定恋人档案卡 */}
          <Link href="/destiny-lover" className="block group overflow-hidden rounded-3xl p-5 glass-card hover:bg-white/10 transition-all duration-300 hover:scale-[1.02]">
            <div className="flex gap-4">
              <div className="w-24 h-24 shrink-0 rounded-[1.25rem] bg-gradient-to-br from-[#8A2B2B] to-[#5c1c1c] flex items-center justify-center relative shadow-[0_8px_16px_rgba(138,43,43,0.4)] overflow-hidden border border-[#D13030]/30">
                <div className="w-12 h-12 border border-[#E8E2D5]/50 flex items-center justify-center animate-pulse">
                    <span className="text-[#E8E2D5] font-serif text-2xl font-bold tracking-widest" style={{ writingMode: 'vertical-rl' }}>缘</span>
                </div>
                <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-400 to-amber-500 text-amber-900 text-[9px] font-bold px-2 py-0.5 rounded-bl-lg shadow-lg">NEW</div>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-base mb-1.5 text-white/95 tracking-wide">月老办事处：解密命定恋人</h3>
                <p className="text-xs text-white/60 leading-relaxed line-clamp-2 mb-3">你命中注定的那个人究竟是什么模样？花3分钟完成灵魂问卷，抽取你的专属红娘档案卡。</p>
                <div className="flex flex-wrap items-center gap-2 text-[10px] text-white/80">
                  <div className="glowing-tag rounded-full px-2 py-1 flex items-center gap-1">💖 情感解析</div>
                  <div className="glowing-tag rounded-full px-2 py-1 flex items-center gap-1">📜 签文解读</div>
                </div>
              </div>
            </div>
            <div className="mt-4 border-t border-white/10 pt-3 flex justify-between items-center text-xs">
              <span className="text-white/40 font-mono">NEW LAUNCH</span>
              <span className="bg-white/10 text-white/90 px-4 py-1.5 rounded-full font-bold group-hover:bg-white/20 transition">Start →</span>
            </div>
          </Link>
          {/* Card 2: 性格城市匹配测试 (Now Active!) */}
          <Link href="/city" className="block group overflow-hidden rounded-3xl p-5 glass-card hover:bg-white/10 transition-all duration-300 hover:scale-[1.02]">
            <div className="flex gap-4">
              <div className="w-24 h-24 shrink-0 rounded-[1.25rem] bg-gradient-to-br from-[#064E3B] to-[#065F46] flex items-center justify-center relative shadow-[0_8px_16px_rgba(6,95,70,0.4)] overflow-hidden border border-teal-500/30">
                <svg className="w-14 h-14 text-teal-200" viewBox="0 0 100 100" fill="none">
                  <path d="M10 50 L90 50 M50 10 L50 90 M20 20 L80 80 M20 80 L80 20" stroke="currentColor" strokeWidth="0.5" className="opacity-30" />
                  <circle cx="50" cy="50" r="4" fill="currentColor" className="shadow-[0_0_10px_currentColor]" />
                  <circle cx="20" cy="20" r="3" fill="currentColor" className="opacity-80" />
                  <circle cx="80" cy="20" r="2.5" fill="currentColor" className="opacity-60" />
                  <circle cx="20" cy="80" r="2" fill="currentColor" className="opacity-50" />
                  <circle cx="80" cy="80" r="3.5" fill="currentColor" className="opacity-90" />
                  <circle cx="50" cy="50" r="10" stroke="currentColor" strokeWidth="1" className="animate-ping-soft" />
                </svg>
                <div className="absolute top-0 right-0 bg-gradient-to-r from-teal-400 to-emerald-500 text-teal-900 text-[9px] font-bold px-2 py-0.5 rounded-bl-lg shadow-lg">NEW</div>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-base mb-1.5 text-white/95 tracking-wide">性格城市匹配测试</h3>
                <p className="text-xs text-white/60 leading-relaxed line-clamp-2 mb-3">测试你的精神老家在哪里。你的生活节奏最契合世界上哪一座城市？</p>
                <div className="flex flex-wrap items-center gap-2 text-[10px] text-white/80">
                  <div className="glowing-tag rounded-full px-2 py-1 flex items-center gap-1">☕ 节奏感</div>
                  <div className="glowing-tag rounded-full px-2 py-1 flex items-center gap-1">👥 社交度</div>
                </div>
              </div>
            </div>
            <div className="mt-4 border-t border-white/10 pt-3 flex justify-between items-center text-xs">
              <span className="text-white/40 font-mono">214K+ Users</span>
              <span className="bg-white/10 text-white/90 px-4 py-1.5 rounded-full font-bold group-hover:bg-white/20 transition">Start →</span>
            </div>
          </Link>
          
          <div className="block group overflow-hidden rounded-3xl p-5 glass-card opacity-60 grayscale cursor-not-allowed">
            <div className="flex gap-4">
              <div className="w-24 h-24 shrink-0 rounded-[1.25rem] bg-gradient-to-br from-[#082F49] to-[#0C4A6E] flex items-center justify-center relative border border-sky-500/30">
                <div className="absolute top-0 right-0 bg-gray-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-lg">UPCOMING</div>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-base mb-1.5 text-white/95 tracking-wide">MBTI 水晶人格</h3>
                <p className="text-xs text-white/60 leading-relaxed line-clamp-2 mb-3">你是哪种稀缺的自然宝石？发掘你独一无二的性格能量场与共鸣原石。</p>
                <div className="flex flex-wrap items-center gap-2 text-[10px] text-white/80">
                  <div className="glowing-tag rounded-full px-2 py-1 flex items-center gap-1">🚧 开发中</div>
                </div>
              </div>
            </div>
          </div>

        </div>

        <div className="mt-12 text-center flex items-center justify-center gap-3 opacity-30">
          <div className="h-[1px] w-8 bg-white"></div>
          <span className="text-[10px] tracking-widest uppercase">到底啦</span>
          <div className="h-[1px] w-8 bg-white"></div>
        </div>
      </div>
    </div>
  );
}
