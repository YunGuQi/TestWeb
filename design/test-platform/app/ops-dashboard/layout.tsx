import { Suspense } from 'react';
import AdminNav from './AdminNav';

// 内容区骨架：切换模块时显示，避免白屏等待
function DashboardSkeleton() {
  return (
    <div className="animate-pulse">
      {/* 标题骨架 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="h-3 w-32 bg-gray-200 rounded mb-2"/>
          <div className="h-8 w-48 bg-gray-200 rounded"/>
        </div>
        <div className="hidden sm:block h-7 w-40 bg-gray-200 rounded-lg"/>
      </div>
      {/* 卡片组骨架 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {[0,1,2].map(i => (
          <div key={i} className="bg-gray-100/60 p-6 rounded-2xl h-36"/>
        ))}
      </div>
      {/* 分析区骨架 */}
      <div className="mb-12">
        <div className="h-6 w-56 bg-gray-200 rounded mb-5"/>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {[0,1,2,3].map(i => (
            <div key={i} className="bg-gray-100/60 p-5 rounded-2xl h-24"/>
          ))}
        </div>
      </div>
      {/* 表格骨架 */}
      <div className="bg-gray-100/60 rounded-2xl h-80"/>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#FDFBF7] text-[#1c1c1e] font-sans relative selection:bg-black selection:text-white">
      {/* 后台实时遥测监控顶栏 (TELEMETRY STATUS BAR) */}
      <div className="w-full bg-black text-white px-4 py-1.5 flex items-center justify-between font-mono text-[11px] tracking-widest z-30 border-b border-white/15 shrink-0 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-bold">ANAN OPS TELEMETRY // SYS: ONLINE</span>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-gray-400 font-bold">
          <span>CLUSTER: AP-EAST-1</span>
          <span>STREAM: ACTIVE</span>
          <span className="text-emerald-400">&bull; REAL-TIME SYNC</span>
        </div>
      </div>

      {/* ✨ 细线工程方格蓝图底纹与环境渲染多色彩层 (/impeccable colorize) */}
      {/* ✅ 性能优化：添加 will-change + translate3d 将光晕提升到独立 GPU 合成层，避免触发主线程重绘 */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" style={{ willChange: 'transform' }}>
        {/* Engineering Blueprint Grid */}
        <div 
          className="absolute inset-0 opacity-[0.45]"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.06) 1px, transparent 1px)`,
            backgroundSize: '28px 28px'
          }}
        />
        {/* Emerald Glow (右上角) - GPU 合成层 */}
        <div className="absolute -top-24 -right-24 w-[28rem] h-[28rem] rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" style={{ transform: 'translate3d(0,0,0)' }} />
        {/* Violet & Amber Aura (左下与中心) - GPU 合成层 */}
        <div className="absolute -bottom-24 -left-24 w-[28rem] h-[28rem] rounded-full bg-violet-500/12 blur-3xl pointer-events-none" style={{ transform: 'translate3d(0,0,0)' }} />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" style={{ transform: 'translate3d(-50%,0,0)' }} />
      </div>

      <div className="flex flex-1 flex-col md:flex-row overflow-hidden relative z-10">
        <aside className="w-full md:w-64 bg-white/75 backdrop-blur-md border-b md:border-b-0 md:border-r border-black/10 flex-shrink-0 flex flex-col z-20 shadow-[2px_0_20px_rgba(0,0,0,0.02)]">
          <Suspense fallback={<div className="p-4 text-[#787774] text-sm">Loading Nav...</div>}>
            <AdminNav />
          </Suspense>
        </aside>

        <main className="flex-1 overflow-y-auto w-full relative">
          <div className="max-w-6xl mx-auto py-4 px-3 md:py-8 md:px-8 lg:px-12">
            {/* ✅ 切换模块时显示骨架屏，避免白屏等待 */}
            <Suspense fallback={<DashboardSkeleton />}>
              {children}
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
