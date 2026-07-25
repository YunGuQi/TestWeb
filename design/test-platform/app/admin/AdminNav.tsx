'use client';

import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

const TESTS = [
  { id: 'emotional-friction', name: '深度情绪内耗测算' },
  { id: 'city-personality', name: '性格城市匹配测试' }
];

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

  const handleTestChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTestId = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    params.set('testId', newTestId);
    window.location.href = `${pathname}?${params.toString()}`;
  };

  const navItems = [
    { name: '概览 (Overview)', path: '/admin', icon: '📊' },
    { name: '题库编辑 (CMS)', path: '/admin/questions', icon: '📝' },
    { name: '结果海报 (Posters)', path: '/admin/results', icon: '🖼️' },
    { name: '弹幕管理 (Danmaku)', path: '/admin/danmaku', icon: '💬' },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 mb-4">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-sm shadow-sm">🪴</div>
          <span className="font-bold tracking-tight text-[#37352F]">PSYCHE CMS</span>
        </div>
        
        <div className="mt-6 px-4">
          <label htmlFor="test-switcher" className="block text-xs font-semibold text-[#9F9E9B] mb-2 uppercase tracking-wider">
            Workspace
          </label>
          <div className="relative">
            <select 
              id="test-switcher"
              value={currentTestId}
              onChange={handleTestChange}
              className="w-full bg-white border border-[#EBEBEB] text-[#37352F] text-sm font-semibold rounded-xl px-3 py-2 shadow-[0_2px_10px_rgb(0,0,0,0.02)] outline-none cursor-pointer hover:border-[#D9D9D9] hover:shadow-[0_4px_15px_rgb(0,0,0,0.04)] transition-all focus:ring-2 focus:ring-blue-100 appearance-none"
              style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23787774' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1em' }}
            >
              {TESTS.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
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
  );
}
