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
    // 1秒内连续点击则计数
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
    <div className="text-white min-h-[100dvh] relative overflow-hidden bg-[#07070a]">
      <style dangerouslySetInnerHTML={{__html: `
        /* 毛玻璃卡片 */
        .glass-card {
          background: rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 8px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.06);
        }
        .glass-card:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.16);
          box-shadow: 0 16px 60px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255,255,255,0.1);
        }

        /* 标签徽章 */
        .glowing-tag {
          background: rgba(255, 255, 255, 0.07);
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: inset 0 0 8px rgba(255,255,255,0.03);
        }

        /* 极光呼吸动效 */
        @keyframes aurora-drift {
          0%, 100% { opacity: 0.55; transform: scale(1) translate(0, 0); }
          33% { opacity: 0.75; transform: scale(1.06) translate(15px, -10px); }
          66% { opacity: 0.5; transform: scale(0.95) translate(-10px, 8px); }
        }
        .aurora-orb { animation: aurora-drift 10s infinite ease-in-out; }

        /* 旋转动效 */
        @keyframes spin-slow { 100% { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 14s linear infinite; }
        @keyframes spin-reverse-slow { 100% { transform: rotate(-360deg); } }
        .animate-spin-reverse-slow { animation: spin-reverse-slow 9s linear infinite; }

        /* 虚线流动 */
        @keyframes dash-flow { to { stroke-dashoffset: -60; } }
        .animate-dash { animation: dash-flow 4s linear infinite; }

        /* 柔和 ping */
        @keyframes ping-soft { 75%, 100% { transform: scale(1.6); opacity: 0; } }
        .animate-ping-soft { animation: ping-soft 2.5s cubic-bezier(0, 0, 0.2, 1) infinite; }

        /* 卡片图标光晕漂浮 */
        @keyframes float-icon {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .float-icon { animation: float-icon 4s ease-in-out infinite; }

        /* 标题 gradient 文字 */
        .hero-gradient {
          background: linear-gradient(135deg, #e0e7ff 0%, #c4b5fd 35%, #f9a8d4 70%, #fde68a 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* 角标旋转粒子 */
        @keyframes spin-badge {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin-badge { animation: spin-badge 3s linear infinite; }

        /* 颗粒噪音背景 */
        .grain-overlay {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none;
        }

        /* 活跃卡片的微光扫描效果 */
        @keyframes shimmer-slide {
          0% { transform: translateX(-100%) skewX(-15deg); }
          100% { transform: translateX(300%) skewX(-15deg); }
        }
        .card-shimmer::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
          animation: shimmer-slide 4s ease-in-out infinite;
          pointer-events: none;
          border-radius: inherit;
        }

        /* 主卡片: 精选徽章脉冲 */
        @keyframes badge-glow {
          0%, 100% { box-shadow: 0 0 6px rgba(251, 146, 60, 0.5); }
          50% { box-shadow: 0 0 16px rgba(251, 146, 60, 0.9), 0 0 30px rgba(251, 146, 60, 0.3); }
        }
        .hot-badge { animation: badge-glow 2s ease-in-out infinite; }

        /* 底部线条淡入 */
        @keyframes fade-line {
          from { opacity: 0; width: 0; }
          to { opacity: 1; width: 2rem; }
        }
      `}} />

      {/* ---- BACKGROUND: 增强版极光宇宙 ---- */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* 主光球：深紫 */}
        <div className="aurora-orb absolute -top-32 -left-32 w-[500px] h-[500px] bg-violet-700/45 rounded-full blur-[130px]" />
        {/* 右上蓝靛 */}
        <div className="aurora-orb absolute top-1/4 -right-40 w-[420px] h-[420px] bg-indigo-600/40 rounded-full blur-[110px]" style={{animationDelay:'3s'}} />
        {/* 下方玫瑰 */}
        <div className="aurora-orb absolute bottom-0 -left-20 w-[360px] h-[360px] bg-rose-600/30 rounded-full blur-[100px]" style={{animationDelay:'6s'}} />
        {/* 中央琥珀光晕 - 制造焦点 */}
        <div className="aurora-orb absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] bg-amber-600/15 rounded-full blur-[80px]" style={{animationDelay:'1.5s'}} />
        {/* 颗粒噪音 */}
        <div className="grain-overlay absolute inset-0 opacity-60" />
      </div>

      {/* ---- MAIN CONTENT ---- */}
      <div className="relative z-10 pb-28 px-4 pt-12 max-w-md mx-auto">

        {/* ---- HERO HEADER ---- */}
        <div
          className="mb-10 select-none cursor-pointer active:scale-[0.98] transition-transform duration-200"
          onClick={handleTitleClick}
        >
          {/* 超级标题 */}
          <div className="text-center mb-2">
            <span className="text-[11px] font-mono tracking-[0.4em] text-white/30 uppercase block mb-3">
              · SOULSCAPE · 探索中心 ·
            </span>
            <h1 className="hero-gradient text-4xl font-black tracking-tight leading-[1.1]">
              心理<br/>深潜空间
            </h1>
          </div>
          {/* 副标题徽章行 */}
          <div className="flex items-center justify-center gap-3 mt-4">
            <div className="h-[1px] flex-1 max-w-[60px] bg-gradient-to-r from-transparent to-white/20" />
            <span className="text-[10px] text-white/40 tracking-widest uppercase">Select a Test</span>
            <div className="h-[1px] flex-1 max-w-[60px] bg-gradient-to-l from-transparent to-white/20" />
          </div>
        </div>

        {/* ---- CARD GRID ---- */}
        <div className="space-y-4">

          {/* ======================= */}
          {/* Card 1: 深度情绪内耗 (主推) */}
          {/* ======================= */}
          <Link
            href="/emo"
            className="card-shimmer block group overflow-hidden rounded-[22px] relative transition-all duration-300 hover:scale-[1.015] active:scale-[0.99]"
            style={{
              background: 'linear-gradient(135deg, rgba(30,27,75,0.85) 0%, rgba(49,46,129,0.75) 50%, rgba(109,40,217,0.5) 100%)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(139,92,246,0.35)',
              boxShadow: '0 20px 60px rgba(109,40,217,0.35), inset 0 1px 0 rgba(255,255,255,0.1)',
            }}
          >
            {/* 精选主卡头部横幅 */}
            <div className="px-5 pt-3.5 pb-2 flex items-center justify-between border-b border-violet-500/20">
              <div className="flex items-center gap-2">
                <span className="hot-badge inline-block w-1.5 h-1.5 rounded-full bg-orange-400" />
                <span className="text-[10px] font-bold text-orange-300 tracking-widest uppercase">精选推荐</span>
              </div>
              <span className="text-[10px] font-mono text-violet-300/60">120K+ 用户</span>
            </div>

            {/* 主体内容 */}
            <div className="p-5 pt-4 flex gap-4">
              {/* 图标区 */}
              <div className="w-[88px] h-[88px] shrink-0 rounded-2xl bg-gradient-to-br from-[#1E1B4B] to-[#312E81] flex items-center justify-center relative overflow-hidden border border-indigo-400/20 float-icon"
                style={{boxShadow: '0 8px 24px rgba(49,46,129,0.6), 0 0 40px rgba(109,40,217,0.2)'}}>
                <svg className="w-16 h-16 text-indigo-300 absolute animate-spin-slow" viewBox="0 0 100 100" fill="none">
                  <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="1.2" strokeDasharray="10 15" className="opacity-50 animate-dash" />
                </svg>
                <svg className="w-10 h-10 text-violet-300 absolute animate-spin-reverse-slow" viewBox="0 0 100 100" fill="none">
                  <circle cx="50" cy="50" r="38" stroke="currentColor" strokeWidth="2" strokeDasharray="20 10" className="opacity-70" />
                </svg>
                <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse shadow-[0_0_16px_rgba(255,255,255,0.9)]" />
              </div>

              {/* 文字区 */}
              <div className="flex-1 min-w-0">
                <h2 className="font-black text-[17px] mb-1.5 text-white tracking-wide leading-tight">
                  深度情绪内耗测试
                </h2>
                <p className="text-[12px] text-violet-200/70 leading-relaxed line-clamp-2 mb-3">
                  定位你的情绪黑洞。基于认知行为学，深度拆解你的防御机制，告别精神内耗。
                </p>
                <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                  <span className="glowing-tag rounded-full px-2.5 py-1 text-violet-200/80">✨ 钝感力</span>
                  <span className="glowing-tag rounded-full px-2.5 py-1 text-violet-200/80">🔮 反刍指数</span>
                </div>
              </div>
            </div>

            {/* CTA 底部 */}
            <div className="px-5 pb-4 flex justify-end">
              <span className="inline-flex items-center gap-1.5 bg-violet-500/80 hover:bg-violet-500 text-white text-[11px] font-bold px-4 py-2 rounded-full transition-colors group-hover:bg-violet-400/90 shadow-[0_4px_16px_rgba(139,92,246,0.5)]">
                立即测试
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5h6M5.5 2.5L8 5l-2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </div>
          </Link>

          {/* ======================= */}
          {/* Card 2: 命定恋人 (次推) */}
          {/* ======================= */}
          <Link
            href="/destiny-lover"
            className="block group overflow-hidden rounded-[20px] p-5 glass-card transition-all duration-300 hover:scale-[1.015] active:scale-[0.99] relative"
          >
            {/* 渐变底色叠层 */}
            <div className="absolute inset-0 rounded-[20px] bg-gradient-to-br from-[#4a1010]/40 to-transparent pointer-events-none" />

            <div className="relative flex gap-4">
              {/* 图标 */}
              <div className="w-[80px] h-[80px] shrink-0 rounded-[18px] bg-gradient-to-br from-[#7f1d1d] to-[#5c1c1c] flex items-center justify-center relative overflow-hidden border border-red-500/25 float-icon"
                style={{boxShadow: '0 8px 20px rgba(127,29,29,0.5)'}}>
                {/* 角标 NEW */}
                <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-400 to-amber-500 text-amber-900 text-[8px] font-black px-1.5 py-0.5 rounded-bl-lg shadow">NEW</div>
                <div className="w-11 h-11 border border-[#E8E2D5]/40 flex items-center justify-center animate-pulse">
                  <span className="text-[#E8E2D5] font-serif text-2xl font-bold tracking-widest" style={{ writingMode: 'vertical-rl' }}>缘</span>
                </div>
              </div>

              {/* 文字 */}
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-[16px] mb-1.5 text-white/95 tracking-wide leading-tight">
                  月老办事处<br/>
                  <span className="text-[13px] text-white/70 font-medium">解密命定恋人档案</span>
                </h2>
                <p className="text-[11px] text-white/55 leading-relaxed line-clamp-2 mb-3">
                  你命中注定的那个人究竟是什么模样？花3分钟完成灵魂问卷，抽取你的专属红娘档案卡。
                </p>
                <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                  <span className="glowing-tag rounded-full px-2.5 py-1 text-rose-200/80">💖 情感解析</span>
                  <span className="glowing-tag rounded-full px-2.5 py-1 text-rose-200/80">📜 签文解读</span>
                </div>
              </div>
            </div>

            {/* 底部行 */}
            <div className="mt-3.5 pt-3 border-t border-white/8 flex justify-between items-center">
              <span className="text-[10px] text-white/30 font-mono tracking-wide">NEW LAUNCH</span>
              <span className="text-[11px] bg-rose-600/60 hover:bg-rose-600/80 text-rose-100 px-3.5 py-1.5 rounded-full font-bold group-hover:bg-rose-600/80 transition shadow-[0_2px_12px_rgba(220,38,38,0.3)]">
                进入 →
              </span>
            </div>
          </Link>

          {/* ======================= */}
          {/* Card 3: 性格城市匹配 */}
          {/* ======================= */}
          <Link
            href="/city"
            className="block group overflow-hidden rounded-[20px] p-5 glass-card transition-all duration-300 hover:scale-[1.015] active:scale-[0.99] relative"
          >
            {/* 渐变底色叠层 */}
            <div className="absolute inset-0 rounded-[20px] bg-gradient-to-br from-[#022c22]/50 to-transparent pointer-events-none" />

            <div className="relative flex gap-4">
              {/* 图标 */}
              <div className="w-[80px] h-[80px] shrink-0 rounded-[18px] bg-gradient-to-br from-[#064E3B] to-[#065F46] flex items-center justify-center relative overflow-hidden border border-teal-400/20 float-icon"
                style={{boxShadow: '0 8px 20px rgba(6,78,59,0.6)'}}>
                <div className="absolute top-0 right-0 bg-gradient-to-r from-teal-400 to-emerald-400 text-emerald-900 text-[8px] font-black px-1.5 py-0.5 rounded-bl-lg shadow">NEW</div>
                <svg className="w-12 h-12 text-teal-200" viewBox="0 0 100 100" fill="none">
                  <path d="M10 50 L90 50 M50 10 L50 90 M20 20 L80 80 M20 80 L80 20" stroke="currentColor" strokeWidth="0.5" className="opacity-25" />
                  <circle cx="50" cy="50" r="5" fill="currentColor" style={{filter:'drop-shadow(0 0 8px currentColor)'}} />
                  <circle cx="20" cy="20" r="3" fill="currentColor" className="opacity-70" />
                  <circle cx="80" cy="20" r="2.5" fill="currentColor" className="opacity-50" />
                  <circle cx="20" cy="80" r="2" fill="currentColor" className="opacity-40" />
                  <circle cx="80" cy="80" r="3.5" fill="currentColor" className="opacity-80" />
                  <circle cx="50" cy="50" r="12" stroke="currentColor" strokeWidth="1" className="animate-ping-soft opacity-50" />
                </svg>
              </div>

              {/* 文字 */}
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-[16px] mb-1.5 text-white/95 tracking-wide leading-tight">
                  性格城市匹配测试
                </h2>
                <p className="text-[11px] text-white/55 leading-relaxed line-clamp-2 mb-3">
                  测试你的精神老家在哪里。你的生活节奏最契合世界上哪一座城市？
                </p>
                <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                  <span className="glowing-tag rounded-full px-2.5 py-1 text-teal-200/80">☕ 节奏感</span>
                  <span className="glowing-tag rounded-full px-2.5 py-1 text-teal-200/80">👥 社交度</span>
                </div>
              </div>
            </div>

            {/* 底部行 */}
            <div className="mt-3.5 pt-3 border-t border-white/8 flex justify-between items-center">
              <span className="text-[10px] text-white/30 font-mono tracking-wide">214K+ Users</span>
              <span className="text-[11px] bg-teal-600/60 hover:bg-teal-600/80 text-teal-100 px-3.5 py-1.5 rounded-full font-bold group-hover:bg-teal-600/80 transition shadow-[0_2px_12px_rgba(20,184,166,0.3)]">
                进入 →
              </span>
            </div>
          </Link>

          {/* ======================= */}
          {/* Card 4: 即将上线 (UPCOMING) */}
          {/* ======================= */}
          <div className="block overflow-hidden rounded-[20px] p-5 glass-card opacity-45 cursor-not-allowed relative">
            <div className="absolute inset-0 rounded-[20px] bg-gradient-to-br from-[#082F49]/30 to-transparent pointer-events-none" />
            <div className="relative flex gap-4">
              <div className="w-[80px] h-[80px] shrink-0 rounded-[18px] bg-gradient-to-br from-[#082F49] to-[#0C4A6E] flex items-center justify-center relative border border-sky-500/20">
                <div className="absolute top-0 right-0 bg-gray-600/80 text-gray-300 text-[8px] font-bold px-1.5 py-0.5 rounded-bl-lg">即将上线</div>
                <div className="w-8 h-8 border border-sky-400/20 rounded-full" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-[16px] mb-1.5 text-white/80 tracking-wide">MBTI 水晶人格</h2>
                <p className="text-[11px] text-white/40 leading-relaxed line-clamp-2 mb-3">你是哪种稀缺的自然宝石？发掘你独一无二的性格能量场与共鸣原石。</p>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span className="glowing-tag rounded-full px-2.5 py-1 text-white/40">🚧 开发中</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ---- FOOTER ---- */}
        <div className="mt-14 text-center">
          <div className="flex items-center justify-center gap-3 mb-3 opacity-20">
            <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-white" />
            <span className="text-[9px] font-mono tracking-[0.3em] uppercase">SOULSCAPE · EXPLORE</span>
            <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-white" />
          </div>
          <p className="text-[9px] text-white/15 tracking-wider">© 安安心灵空间 · 专业心理测评</p>
        </div>

      </div>
    </div>
  );
}
