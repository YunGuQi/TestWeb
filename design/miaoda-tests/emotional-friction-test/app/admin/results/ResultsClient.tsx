'use client';

import { useState } from 'react';

export default function ResultsClient({ initialResults }: { initialResults: any[] }) {
  const [results, setResults] = useState(initialResults);
  const [editRes, setEditRes] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const saveResult = async () => {
    if (!editRes) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/results/${editRes.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: editRes.title, 
          desc: editRes.desc,
          quote: editRes.quote,
          imageUrl: editRes.imageUrl 
        })
      });
      const data = await res.json();
      if (data.success) {
        setResults(results.map((r: any) => r.id === editRes.id ? editRes : r));
        setEditRes(null);
      } else {
        alert(data.error);
      }
    } catch(e) {}
    setLoading(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">测试结果与海报配置 (Posters)</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {results.map((r: any) => (
          <div key={r.id} className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_#000] flex flex-col">
            <h2 className="text-xl font-black mb-2">{r.title}</h2>
            <p className="text-sm font-bold text-gray-500 mb-2">条件 / 标识: {r.condition}</p>
            <p className="text-sm bg-gray-100 p-2 border font-medium flex-1 mb-4">{r.desc}</p>
            {r.imageUrl && (
              <div className="mb-4 text-xs font-mono truncate bg-purple-50 text-purple-700 p-1">
                海报: {r.imageUrl}
              </div>
            )}
            <button 
              onClick={() => setEditRes(r)}
              className="mt-auto bg-black text-white py-2 font-bold hover:bg-gray-800"
            >
              编辑此结果
            </button>
          </div>
        ))}
      </div>

      {editRes && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white p-6 border-4 border-black shadow-[8px_8px_0px_#000] max-w-lg w-full">
            <h3 className="text-lg font-bold mb-4">编辑结果: {editRes.title}</h3>
            
            <label className="block text-sm font-bold mb-2">
              标题 (Title)
              <input type="text" value={editRes.title} onChange={e => setEditRes({...editRes, title: e.target.value})} className="w-full border-2 border-black p-2 mt-1" />
            </label>
            
            <label className="block text-sm font-bold mb-2">
              金句 (Quote)
              <input type="text" value={editRes.quote} onChange={e => setEditRes({...editRes, quote: e.target.value})} className="w-full border-2 border-black p-2 mt-1" />
            </label>

            <label className="block text-sm font-bold mb-2">
              详细描述 (Description)
              <textarea value={editRes.desc} onChange={e => setEditRes({...editRes, desc: e.target.value})} className="w-full border-2 border-black p-2 mt-1 h-24"></textarea>
            </label>

            <label className="block text-sm font-bold mb-6">
              海报图链接 (Image URL)
              <input type="text" value={editRes.imageUrl || ''} placeholder="例如: https://..." onChange={e => setEditRes({...editRes, imageUrl: e.target.value})} className="w-full border-2 border-black p-2 mt-1 font-mono text-xs" />
            </label>

            <div className="flex justify-end gap-2">
              <button onClick={() => setEditRes(null)} className="px-4 py-2 bg-gray-200 border-2 border-black font-bold">取消</button>
              <button onClick={saveResult} disabled={loading} className="px-4 py-2 bg-black text-white font-bold border-2 border-black">{loading ? '保存中...' : '确认保存'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
