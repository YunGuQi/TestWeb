'use client';

import { useState } from 'react';

export default function PVCard({ 
  initialBaseCount, 
  testRecordCount, 
  testId 
}: { 
  initialBaseCount: number, 
  testRecordCount: number, 
  testId: string 
}) {
  const [baseCount, setBaseCount] = useState(initialBaseCount);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(initialBaseCount.toString());
  const [loading, setLoading] = useState(false);

  const totalPV = baseCount + testRecordCount * 3;
  const conversionRate = totalPV > 0 ? ((testRecordCount / totalPV) * 100).toFixed(2) : '0.00';

  const handleSave = async () => {
    const val = parseInt(editValue);
    if (isNaN(val) || val < 0) return alert('请输入有效的基数');
    
    setLoading(true);
    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseCount: val, testId })
      });
      const data = await res.json();
      if (data.success) {
        setBaseCount(val);
        setIsEditing(false);
      } else {
        alert('保存失败: ' + data.message);
      }
    } catch(e) {
      alert('保存出错');
    }
    setLoading(false);
  };

  return (
    <div className="bg-gradient-to-br from-white via-white/90 to-amber-50/50 border-2 border-amber-500/30 p-6 rounded-2xl shadow-[0_6px_30px_rgba(245,158,11,0.08)] hover:shadow-[0_10px_36px_rgba(245,158,11,0.12)] hover:-translate-y-0.5 transition-all relative overflow-hidden backdrop-blur-md">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-amber-100/80 flex items-center justify-center text-amber-700 text-lg font-black shadow-sm border border-amber-200">👁️</div>
        <span className="text-[10px] font-mono font-bold bg-amber-500 text-white px-2 py-0.5 uppercase tracking-widest">TRAFFIC PV</span>
      </div>
      <div className="text-gray-500 text-xs font-bold mb-1 flex items-center gap-1 cursor-help group font-mono uppercase tracking-wider" title="PV(Page View): 预估总页面访问量，基于基础基数和实际测算人数计算出的模拟热度指标。">
        // ESTIMATED PAGE VIEWS
        <span className="text-[10px] bg-amber-100 text-amber-800 rounded-full w-4 h-4 flex items-center justify-center font-bold">?</span>
      </div>
      <div className="text-4xl font-black text-black tracking-tight mb-3 flex items-center gap-2">
        {totalPV}
        <button 
          onClick={() => {
            setEditValue(baseCount.toString());
            setIsEditing(true);
          }}
          className="text-xs bg-amber-100/80 text-amber-900 hover:text-black hover:bg-amber-200 p-1.5 rounded-lg transition-colors ml-1 font-mono font-bold border border-amber-300"
          title="修改基础设定基数"
        >
          [修改基数 ✏️]
        </button>
      </div>
      <div className="text-xs text-amber-950 font-bold bg-amber-100/70 inline-block px-2.5 py-1 rounded-md border border-amber-300">
        完测转化率: <span className="font-mono font-black">{conversionRate}%</span>
      </div>

      {isEditing && (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity">
          <div className="bg-white p-6 rounded-2xl max-w-xs w-full border border-[#EBEBEB] shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
            <h3 className="text-lg font-bold mb-4 text-[#37352F] flex items-center gap-2">
              <span>✏️</span> 修改预估基数
            </h3>
            <p className="text-xs text-[#9F9E9B] mb-4">
              实际 PV = 基数 + (完成人数 × 3)
            </p>
            <input 
              type="number" 
              value={editValue} 
              onChange={e => setEditValue(e.target.value)}
              className="w-full border border-[#EBEBEB] px-3 py-2 rounded-lg outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all text-[#37352F] font-medium mb-6"
            />
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setIsEditing(false)} 
                className="px-4 py-2 bg-white border border-[#EBEBEB] text-[#787774] hover:bg-[#F7F6F3] rounded-lg text-sm font-semibold transition-colors"
              >
                取消
              </button>
              <button 
                onClick={handleSave} 
                disabled={loading} 
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
              >
                {loading ? '保存中...' : '确认修改'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
