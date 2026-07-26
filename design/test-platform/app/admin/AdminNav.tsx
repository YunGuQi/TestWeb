'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

const TESTS = [
  { id: 'emotional-friction', name: '深度情绪内耗测算', icon: '🔥', tag: 'EMO' },
  { id: 'city-personality', name: '性格城市匹配测试', icon: '🏙️', tag: 'CITY' }
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
        className={`w-full flex items-center justify-between gap-2 bg-white border border-[#E2E1DE] text-[#37352F] font-semibold rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:border-[#C4C3BF] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all cursor-pointer ${
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
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-colors cursor-pointer ${
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
  
  const currentTestId = searchParams.get('testId') || 'emotional-friction';
  
  const buildHref = (path: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('testId', currentTestId);
    return `${path}?${params.toString()}`;
  };

  const handleTestChange = (newTestId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('testId', newTestId);
    window.location.href = `${pathname}?${params.toString()}`;
  };

  const navItems = [
    { name: '概览 (Overview)', shortName: '概览', path: '/admin', icon: '📊' },
    { name: '题库编辑 (CMS)', shortName: '题库', path: '/admin/questions', icon: '📝' },
    { name: '结果海报 (Posters)', shortName: '海报', path: '/admin/results', icon: '🖼️' },
    { name: '弹幕管理 (Danmaku)', shortName: '弹幕', path: '/admin/danmaku', icon: '💬' },
  ];

  return (
    <>
      {/* ============ Mobile Top Bar (Only visible on screens < md) ============ */}
      <div className="md:hidden flex flex-col w-full bg-[#F7F6F3] px-3 py-2 border-b border-[#EBEBEB]">
        <div className="flex items-center justify-between pb-2 border-b border-[#EBEBEB]">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-md bg-orange-100 flex items-center justify-center text-xs shadow-sm">🪴</div>
            <span className="font-bold text-sm tracking-tight text-[#37352F]">PSYCHE CMS</span>
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
            return (
              <Link
                key={item.path}
                href={buildHref(item.path)}
                className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-md whitespace-nowrap transition-colors ${
                  isActive 
                    ? 'bg-white text-[#37352F] shadow-sm border border-[#EBEBEB]' 
                    : 'text-[#787774] hover:bg-[#EBEBEB]/50 hover:text-[#37352F]'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.shortName}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ============ Desktop Sidebar (Only visible on screens >= md) ============ */}
      <div className="hidden md:flex flex-col h-full">
        <div className="p-4 mb-4">
          <div className="flex items-center gap-2 px-2 py-3">
            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-sm shadow-sm">🪴</div>
            <span className="font-bold tracking-tight text-[#37352F]">PSYCHE CMS</span>
          </div>
          
          <div className="mt-6 px-4">
            <label className="block text-xs font-semibold text-[#9F9E9B] mb-2 uppercase tracking-wider">
              Workspace
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
            return (
              <Link
                key={item.path}
                href={buildHref(item.path)}
                className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive 
                    ? 'bg-white text-[#37352F] shadow-sm' 
                    : 'text-[#787774] hover:bg-[#EBEBEB]/50 hover:text-[#37352F]'
                }`}
              >
                <span>{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-[#EBEBEB]">
          <div className="flex items-center gap-3 px-3 py-2 hover:bg-[#EBEBEB]/50 rounded-md cursor-pointer transition-colors">
            <div className="w-6 h-6 rounded-full bg-gray-200 border border-gray-300"></div>
            <span className="text-sm font-medium text-[#787774]">Admin</span>
          </div>
        </div>
      </div>
    </>
  );
}
