'use client';

import { useState, useTransition, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

const TESTS = [
  { id: 'emotional-friction', name: '深度情绪内耗测算', icon: '🔥', tag: 'EMO' },
  { id: 'city-personality', name: '性格城市匹配测试', icon: '🏙️', tag: 'CITY' },
  { id: 'destiny-lover', name: '命定恋人红娘测试', icon: '🧧', tag: 'DESTINY' }
];

function WorkspaceDropdown({ 
  currentTestId, 
  onSelect,
  isCompact = false 
}: { 
  currentTestId: string; 
  onSelect: (id: string) => void;
  isCompact?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const currentTest = TESTS.find(t => t.id === currentTestId) || TESTS[0];

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 bg-white border border-[#E2E1DE] text-[#37352F] font-semibold rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:border-[#C4C3BF] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all cursor-pointer touch-manipulation ${
          isCompact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2.5 text-sm'
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          <span className="text-base leading-none">{currentTest.icon}</span>
          <span className="truncate font-bold">{currentTest.name}</span>
        </div>
        <svg
          className={`w-4 h-4 text-[#787774] transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Backdrop for click outside */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Popover Menu */}
      {isOpen && (
        <div className={`absolute ${isCompact ? 'right-0 w-60 top-full mt-2' : 'left-0 right-0 top-full mt-2'} bg-white rounded-2xl border border-[#E2E1DE] shadow-[0_12px_28px_rgba(0,0,0,0.12)] p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150`}>
          <div className="px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-widest text-[#9F9E9B] border-b border-[#F0EFEA] mb-1">
            切换测算工作区 (Workspace)
          </div>
          <div className="space-y-1">
            {TESTS.map((test) => {
              const isSelected = test.id === currentTestId;
              return (
                <button
                  key={test.id}
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onSelect(test.id);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-colors cursor-pointer touch-manipulation ${
                    isSelected 
                      ? 'bg-[#F4F3EE] text-[#37352F] font-bold' 
                      : 'text-[#65645F] hover:bg-[#F9F8F6] hover:text-[#37352F] font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="text-base">{test.icon}</span>
                    <div className="truncate">
                      <div className="text-xs leading-snug">{test.name}</div>
                      <div className="text-[10px] text-[#9F9E9B] font-mono">{test.tag}</div>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-[#37352F] text-white flex items-center justify-center shrink-0 shadow-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminNav() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  // ✅ 性能优化：使用 useTransition 实现即时视觉响应
  // router.push() 后 React 保持当前 UI 可交互，并在后台完成导航，消除「没反应」感
  const [isPending, startTransition] = useTransition();
  // 记录当前正在导航到的目标路径
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  
  const currentTestId = searchParams.get('testId') || 'emotional-friction';
  
  const buildHref = (path: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('testId', currentTestId);
    return `${path}?${params.toString()}`;
  };

  const handleTestChange = useCallback((newTestId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('testId', newTestId);
    const href = `${pathname}?${params.toString()}`;
    setNavigatingTo(href);
    router.push(href);
  }, [searchParams, pathname, router]);

  const handleNavClick = useCallback((path: string) => {
    if (pathname === path) return;
    const href = buildHref(path);
    setNavigatingTo(href);
    router.push(href);
  }, [pathname, buildHref, router]);

  // 悬停时预加载页面数据，按下前数据已经就序请在缓冲中
  const handleNavPrefetch = useCallback((path: string) => {
    router.prefetch(buildHref(path));
  }, [buildHref, router]);

  const navItems = [
    { name: '概览 (Overview)', shortName: '概览', path: '/ops-dashboard', icon: '📊' },
    { name: '题库编辑 (CMS)', shortName: '题库', path: '/ops-dashboard/questions', icon: '📝' },
    { name: '结果海报 (Posters)', shortName: '海报', path: '/ops-dashboard/results', icon: '🖼️' },
    { name: '弹幕管理 (Danmaku)', shortName: '弹幕', path: '/ops-dashboard/danmaku', icon: '💬' },
  ];

  return (
    <>
      {/* ============ Mobile Top Bar (Only visible on screens < md) ============ */}
      <div className="md:hidden flex flex-col w-full bg-white/80 backdrop-blur-md px-3 py-2 border-b border-black/10">
        <div className="flex items-center justify-between pb-2 border-b border-black/10">
          <div className="flex items-center gap-1.5">
            <button 
              type="button" 
              onClick={() => router.push('/')}
              className="flex items-center gap-1 text-[10px] text-gray-600 bg-white border border-gray-300 px-1.5 py-0.5 rounded shadow-sm hover:bg-gray-50"
            >
              <span>🏠</span>返回大厅
            </button>
            <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs shadow-sm font-black ml-1">⚙️</div>
            <span className="font-black text-[13px] tracking-tight text-black truncate max-w-[100px] sm:max-w-none">ANAN OPS</span>
          </div>
          <div className="w-44">
            <WorkspaceDropdown 
              currentTestId={currentTestId} 
              onSelect={handleTestChange} 
              isCompact={true}
            />
          </div>
        </div>

        <nav className="flex items-center justify-around pt-2 gap-1 overflow-x-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            // 是否正在导航到此项
            const isLoading = isPending && navigatingTo === buildHref(item.path);
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => handleNavClick(item.path)}
                onMouseEnter={() => handleNavPrefetch(item.path)}
                disabled={isPending}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition-all touch-manipulation cursor-pointer select-none active:scale-95 ${
                  isActive 
                    ? 'bg-emerald-500/15 text-emerald-950 font-black shadow-sm border border-emerald-500/30' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-black'
                } ${isPending ? 'opacity-70' : ''}`}
              >
                {/* 导航中显示旋转加载图标 */}
                {isLoading ? (
                  <svg className="w-3.5 h-3.5 animate-spin text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                ) : (
                  <span className="text-sm">{item.icon}</span>
                )}
                <span>{item.shortName}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* ============ Desktop Sidebar (Only visible on screens >= md) ============ */}
      <div className="hidden md:flex flex-col h-full bg-white/70 backdrop-blur-md">
        <div className="p-4 mb-4">
          <div className="flex items-center gap-2.5 px-2 py-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm shadow-sm font-black">⚙️</div>
            <span className="font-black tracking-wider text-black">ANAN OPS CONSOLE</span>
          </div>
          
          <div className="mt-6 px-2">
            <label className="block text-[10px] font-mono font-bold text-gray-400 mb-2 uppercase tracking-widest">
              // WORKSPACE TELEMETRY
            </label>
            <WorkspaceDropdown 
              currentTestId={currentTestId} 
              onSelect={handleTestChange} 
              isCompact={false}
            />
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            // 是否正在导航到此项
            const isLoading = isPending && navigatingTo === buildHref(item.path);
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => handleNavClick(item.path)}
                onMouseEnter={() => handleNavPrefetch(item.path)}
                disabled={isPending}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-all touch-manipulation cursor-pointer select-none active:scale-98 text-left ${
                  isActive 
                    ? 'bg-emerald-500/15 text-emerald-950 font-black shadow-sm border-l-4 border-emerald-600 rounded-r-lg rounded-l-none' 
                    : 'text-gray-600 hover:bg-gray-100/70 hover:text-black font-semibold'
                } ${isPending ? 'opacity-70' : ''}`}
              >
                {/* 导航中显示旋转加载图标 */}
                {isLoading ? (
                  <svg className="w-4 h-4 animate-spin text-emerald-600 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                ) : (
                  <span>{item.icon}</span>
                )}
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-[#EBEBEB]">
          <button 
            type="button" 
            onClick={() => router.push('/')}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#787774] hover:bg-[#EBEBEB]/50 hover:text-[#37352F] rounded-md transition-colors mb-2 touch-manipulation cursor-pointer"
          >
            <span className="shrink-0 text-base">🏠</span>
            <span className="font-bold tracking-wider">返回探索大厅</span>
          </button>
          <div className="flex items-center gap-3 px-3 py-2 hover:bg-[#EBEBEB]/50 rounded-md cursor-pointer transition-colors">
            <div className="w-6 h-6 rounded-full bg-gray-200 border border-gray-300 shrink-0"></div>
            <span className="text-sm font-medium text-[#787774]">Admin</span>
          </div>
        </div>
      </div>
    </>
  );
}
