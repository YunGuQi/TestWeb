'use client';

import { useState, useEffect } from 'react';
import { results } from '../../lib/data';

export default function DanmakuManager() {
  const [speed, setSpeed] = useState(50);
  const [opacity, setOpacity] = useState(70);
  const [contentMap, setContentMap] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/config')
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data) {
          setSpeed(res.data.danmakuSpeed ?? 50);
          setOpacity(res.data.danmakuOpacity ?? 70);
          try {
            const parsed = JSON.parse(res.data.danmakuContent || '{}');
            // convert string arrays to text blocks
            const initialMap: Record<string, string> = {};
            results.forEach(r => {
              if (parsed[r.key] && Array.isArray(parsed[r.key])) {
                initialMap[r.key] = parsed[r.key].join('\n');
              } else if ((r as any).danmaku && Array.isArray((r as any).danmaku)) {
                initialMap[r.key] = (r as any).danmaku.join('\n');
              } else {
                initialMap[r.key] = '';
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

  if (isLoading) return <div>加载中...</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-[4px_4px_0px_#000] border-2 border-black">
      <h2 className="text-xl font-bold mb-6">弹幕管理设置</h2>
      
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <label className="font-bold flex justify-between">
            <span>弹幕速度 (越小越快)</span>
            <span className="text-gray-500">{speed}% (当前基准: {Math.floor(10 * (speed/50))}s - {Math.floor(16 * (speed/50))}s)</span>
          </label>
          <input 
            type="range" 
            min="10" 
            max="200" 
            value={speed} 
            onChange={(e) => setSpeed(parseInt(e.target.value))}
            className="w-full accent-black"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-bold flex justify-between">
            <span>弹幕透明度</span>
            <span className="text-gray-500">{opacity}%</span>
          </label>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={opacity} 
            onChange={(e) => setOpacity(parseInt(e.target.value))}
            className="w-full accent-black"
          />
        </div>

        <div>
          <h3 className="font-bold mb-2">弹幕内容管理 (留空则默认使用原始本地配置，按换行分隔)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {results.map((r) => (
              <div key={r.key} className="flex flex-col gap-1 border border-gray-300 p-2 rounded">
                <span className="text-sm font-bold">{r.title} ({r.key})</span>
                <textarea 
                  className="w-full h-32 border border-gray-400 p-2 text-sm"
                  placeholder="每行一条弹幕..."
                  value={contentMap[r.key] ?? ''}
                  onChange={(e) => setContentMap({...contentMap, [r.key]: e.target.value})}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="px-6 py-2 bg-black text-white font-bold disabled:bg-gray-400"
          >
            {isSaving ? '保存中...' : '保存弹幕配置'}
          </button>
        </div>
      </div>
    </div>
  );
}
