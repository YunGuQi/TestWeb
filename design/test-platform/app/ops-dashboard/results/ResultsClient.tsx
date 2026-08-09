'use client';

import { useState } from 'react';
import { useAdminStore } from '../../../lib/store/admin-store';

export default function ResultsClient({ initialResults }: { initialResults: any[] }) {
  const { isUnlocked } = useAdminStore();
  const [results, setResults] = useState(initialResults);
  const [editRes, setEditRes] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

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
    <div className="text-[#37352F]">
      <div className="flex items-center gap-2 mb-8">
        <h1 className="text-[32px] font-bold text-[#37352F]">测试结果与海报配置 (Posters)</h1>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {results.map((r: any) => (
          <div key={r.id} className="bg-white border border-[#EBEBEB] p-6 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-shadow flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-[#37352F] flex items-center gap-2">
                <span>🖼️</span> {r.title}
              </h2>
              <span className="text-xs font-mono text-[#9F9E9B] bg-[#F7F6F3] px-2 py-1 rounded-md border border-[#EBEBEB]">
                ID: {r.id}
              </span>
            </div>
            
            <p className="text-sm font-semibold text-[#787774] mb-3">条件 / 标识: <span className="text-[#37352F]">{isUnlocked ? r.condition : '***'}</span></p>
            
            <div className="text-sm bg-[#FDFBF7] p-4 rounded-xl border border-[#EBEBEB] text-[#787774] flex-1 mb-5">
              {isUnlocked ? r.desc : '敏感结论建议已被隐藏...'}
            </div>
            
            {isUnlocked && r.imageUrl && (
              <div className="mb-5">
                <div 
                  onClick={() => setPreviewImage(r.imageUrl)}
                  className="relative block w-full h-40 mb-2 rounded-lg overflow-hidden border border-[#EBEBEB] bg-[#F7F6F3] cursor-pointer hover:opacity-90 transition-opacity"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.imageUrl} alt={r.title} className="object-cover w-full h-full" />
                </div>
                <div className="flex items-center gap-2 text-xs font-mono truncate bg-blue-50/50 text-blue-600 p-2.5 rounded-lg border border-blue-100/50">
                  <span>🔗</span> {r.imageUrl}
                </div>
              </div>
            )}
            
            {isUnlocked && (
              <button 
                onClick={() => setEditRes(r)}
                className="mt-auto bg-[#F7F6F3] text-[#787774] border border-[#EBEBEB] py-2.5 rounded-xl text-sm font-semibold hover:bg-[#EBEBEB] hover:text-[#37352F] transition-colors"
              >
                编辑此结果
              </button>
            )}
          </div>
        ))}
      </div>

      {editRes && (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity">
          <div className="bg-white p-6 border border-[#EBEBEB] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] max-w-lg w-full">
            <h3 className="text-lg font-bold mb-5 text-[#37352F] flex items-center gap-2">
              <span>✍️</span> 编辑结果: {editRes.title}
            </h3>
            
            <label className="block text-sm font-semibold text-[#787774] mb-4">
              <span className="mb-1 block">标题 (Title)</span>
              <input type="text" value={editRes.title} onChange={e => setEditRes({...editRes, title: e.target.value})} className="w-full border border-[#EBEBEB] p-2.5 rounded-lg text-[#37352F] outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all" />
            </label>
            
            <label className="block text-sm font-semibold text-[#787774] mb-4">
              <span className="mb-1 block">金句 (Quote)</span>
              <input type="text" value={editRes.quote} onChange={e => setEditRes({...editRes, quote: e.target.value})} className="w-full border border-[#EBEBEB] p-2.5 rounded-lg text-[#37352F] outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all" />
            </label>

            <label className="block text-sm font-semibold text-[#787774] mb-4">
              <span className="mb-1 block">详细描述 (Description)</span>
              <textarea value={editRes.desc} onChange={e => setEditRes({...editRes, desc: e.target.value})} className="w-full border border-[#EBEBEB] p-3 rounded-lg text-[#37352F] h-28 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all resize-none"></textarea>
            </label>

            <label className="block text-sm font-semibold text-[#787774] mb-6">
              <span className="mb-1 block">海报图链接 (Image URL)</span>
              <input type="text" value={editRes.imageUrl || ''} placeholder="例如: https://..." onChange={e => setEditRes({...editRes, imageUrl: e.target.value})} className="w-full border border-[#EBEBEB] p-2.5 rounded-lg text-[#37352F] font-mono text-xs outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all" />
            </label>

            <div className="flex justify-end gap-2">
              <button onClick={() => setEditRes(null)} className="px-4 py-2 bg-white border border-[#EBEBEB] text-[#787774] hover:bg-[#F7F6F3] rounded-lg text-sm font-semibold transition-colors">取消</button>
              <button onClick={saveResult} disabled={loading} className="px-4 py-2 bg-[#37352F] hover:bg-black text-white rounded-lg text-sm font-semibold transition-colors shadow-sm">{loading ? '保存中...' : '确认保存'}</button>
            </div>
          </div>
        </div>
      )}
      {previewImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setPreviewImage(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={previewImage} 
            alt="Preview" 
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" 
          />
        </div>
      )}
    </div>
  );
}
