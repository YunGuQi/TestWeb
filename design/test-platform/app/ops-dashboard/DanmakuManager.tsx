'use client';

import { useState, useEffect } from 'react';
export default function DanmakuManager({ testId, initialResults }: { testId: string, initialResults: any[] }) {
  const [speed, setSpeed] = useState(50);
  const [opacity, setOpacity] = useState(70);
  const [contentMap, setContentMap] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/config?testId=${testId}`)
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data) {
          setSpeed(res.data.danmakuSpeed ?? 50);
          setOpacity(res.data.danmakuOpacity ?? 70);
          try {
            const parsed = JSON.parse(res.data.danmakuContent || '{}');
            // convert string arrays to text blocks
            const initialMap: Record<string, string> = {};
            initialResults.forEach(r => {
              if (parsed[r.condition] && Array.isArray(parsed[r.condition])) {
                initialMap[r.condition] = parsed[r.condition].join('\n');
              } else {
                initialMap[r.condition] = '';
              }
            });
            setContentMap(initialMap);
          } catch(e) {
            console.error(e);
          }
        }
        setIsLoading(false);
      })
      .catch(e => {
         console.error(e);
         setIsLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    // convert text blocks back to arrays
    const newContentMap: Record<string, string[]> = {};
    Object.keys(contentMap).forEach(key => {
      const text = contentMap[key];
      if (text.trim()) {
        newContentMap[key] = text.split('\n').map(l => l.trim()).filter(l => l);
      }
    });

    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testId,
          danmakuSpeed: speed,
          danmakuOpacity: opacity,
          danmakuContent: newContentMap
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('弹幕设置已保存');
      } else {
        alert('保存失败：' + data.message);
      }
    } catch(e) {
      alert('保存出错');
    }
    setIsSaving(false);
  };

  if (isLoading) return <div className="text-[#9F9E9B] text-sm font-medium animate-pulse">加载中...</div>;

  return (
    <div className="bg-white p-8 rounded-2xl border border-[#EBEBEB] shadow-[0_4px_20px_rgb(0,0,0,0.03)] text-[#37352F]">
      <h2 className="text-xl font-bold mb-8 flex items-center gap-2">
        <span>💬</span> 弹幕管理设置
      </h2>
      
      <div className="space-y-8">
        <div className="flex flex-col gap-3 bg-[#FDFBF7] p-5 rounded-xl border border-[#EBEBEB]">
          <label className="font-semibold text-sm flex justify-between items-center">
            <span className="text-[#37352F]">弹幕速度 <span className="text-[#9F9E9B] font-normal text-xs ml-2">(数值越小越快)</span></span>
            <span className="text-[#787774] font-mono text-xs bg-white px-2 py-1 rounded border border-[#EBEBEB]">
              {speed}% (基准: {Math.floor(10 * (speed/50))}s - {Math.floor(16 * (speed/50))}s)
            </span>
          </label>
          <input 
            type="range" 
            min="10" 
            max="200" 
            value={speed} 
            onChange={(e) => setSpeed(parseInt(e.target.value))}
            className="w-full accent-blue-500 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div className="flex flex-col gap-3 bg-[#FDFBF7] p-5 rounded-xl border border-[#EBEBEB]">
          <label className="font-semibold text-sm flex justify-between items-center">
            <span className="text-[#37352F]">弹幕透明度</span>
            <span className="text-[#787774] font-mono text-xs bg-white px-2 py-1 rounded border border-[#EBEBEB]">{opacity}%</span>
          </label>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={opacity} 
            onChange={(e) => setOpacity(parseInt(e.target.value))}
            className="w-full accent-blue-500 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div className="pt-4 border-t border-[#EBEBEB]">
          <h3 className="font-bold mb-1 text-[#37352F]">弹幕内容管理</h3>
          <p className="text-xs text-[#9F9E9B] mb-6">按换行分隔每条弹幕。若留空，则默认使用项目的原始本地配置。</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {initialResults.map((r) => {
              const displayCondition = (() => {
                try {
                  const parsedCond = JSON.parse(r.condition);
                  return parsedCond.name || parsedCond.id || r.condition;
                } catch {
                  return r.condition;
                }
              })();
              
              return (
              <div key={r.id} className="flex flex-col gap-2 bg-white border border-[#EBEBEB] p-4 rounded-xl shadow-sm hover:border-[#D9D9D9] transition-colors">
                <span className="text-sm font-semibold text-[#37352F] truncate" title={`${r.title} (${r.condition})`}>
                  {r.title} <span className="text-[#9F9E9B] font-normal text-xs ml-1">({displayCondition})</span>
                </span>
                <textarea 
                  className="w-full h-36 border border-[#EBEBEB] p-3 rounded-lg text-sm text-[#787774] outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all resize-none bg-[#FDFBF7]"
                  placeholder="在此输入，每行一条弹幕..."
                  value={contentMap[r.condition] ?? ''}
                  onChange={(e) => setContentMap({...contentMap, [r.condition]: e.target.value})}
                />
              </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t border-[#EBEBEB]">
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="px-6 py-2.5 bg-[#37352F] hover:bg-black text-white text-sm font-semibold rounded-lg shadow-sm disabled:bg-gray-300 transition-colors"
          >
            {isSaving ? '保存中...' : '保存弹幕配置'}
          </button>
        </div>
      </div>
    </div>
  );
}
