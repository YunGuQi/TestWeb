'use client';

import { useState } from 'react';
import { useAdminStore } from '../../../lib/store/admin-store';

export default function QuestionsClient({ initialQuestions }: { initialQuestions: any[] }) {
  const { isUnlocked } = useAdminStore();
  const [questions, setQuestions] = useState(initialQuestions);
  const [editQ, setEditQ] = useState<{ show: boolean, id: number, text: string }>({ show: false, id: 0, text: '' });
  const [editOpt, setEditOpt] = useState<{ show: boolean, id: number, text: string, scores: any }>({ show: false, id: 0, text: '', scores: {} });
  const [loading, setLoading] = useState(false);

  const saveQuestion = async () => {
    if (!editQ.text.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/questions/${editQ.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: editQ.text })
      });
      const data = await res.json();
      if (data.success) {
        setQuestions(questions.map(q => q.id === editQ.id ? { ...q, text: editQ.text } : q));
        setEditQ({ show: false, id: 0, text: '' });
      } else {
        alert(data.error);
      }
    } catch(e) {}
    setLoading(false);
  };

  const saveOption = async () => {
    if (!editOpt.text.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/options/${editOpt.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: editOpt.text, scores: editOpt.scores })
      });
      const data = await res.json();
      if (data.success) {
        setQuestions(questions.map(q => ({
          ...q,
          options: q.options.map((opt: any) => opt.id === editOpt.id ? { ...opt, text: editOpt.text, scores: JSON.stringify(editOpt.scores) } : opt)
        })));
        setEditOpt({ show: false, id: 0, text: '', scores: {} });
      } else {
        alert(data.error);
      }
    } catch(e) {}
    setLoading(false);
  };

  return (
    <div className="text-[#37352F]">
      <div className="flex items-center gap-2 mb-8">
        <h1 className="text-[32px] font-bold text-[#37352F]">题库与分数管理 (CMS)</h1>
      </div>

      <div className="space-y-6">
        {questions.map((q) => (
          <div key={q.id} className="bg-white border border-[#EBEBEB] p-6 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-bold flex items-start gap-3">
                <span className="text-[#9F9E9B] font-mono mt-0.5">Q{q.order}</span>
                <span className="text-[#37352F] leading-snug">{isUnlocked ? q.text : '敏感题目内容已隐藏...'}</span>
              </h2>
              {isUnlocked && (
                <button 
                  onClick={() => setEditQ({ show: true, id: q.id, text: q.text })}
                  className="shrink-0 text-xs font-medium text-[#787774] hover:text-[#37352F] bg-[#F7F6F3] hover:bg-[#EBEBEB] transition-colors px-3 py-1.5 rounded-lg border border-[#EBEBEB]"
                >
                  编辑题目
                </button>
              )}
            </div>
            
            <div className="mt-4 space-y-3">
              {q.options.map((opt: any) => (
                <div key={opt.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 bg-[#FDFBF7] p-3.5 rounded-xl border border-[#EBEBEB] hover:border-[#D9D9D9] transition-colors">
                  <span className="font-medium text-[#37352F] text-sm leading-relaxed w-full sm:w-auto flex-1 sm:mr-4">{isUnlocked ? opt.text : '选项内容已隐藏...'}</span>
                  <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-[#EBEBEB]/60">
                    <span className="font-mono text-xs text-[#787774] bg-white border border-[#EBEBEB] px-2.5 py-1 rounded-lg shadow-sm break-all max-w-[240px] sm:max-w-md overflow-x-auto">
                      {isUnlocked ? opt.scores : '***'}
                    </span>
                    {isUnlocked && (
                      <button 
                        onClick={() => setEditOpt({ show: true, id: opt.id, text: opt.text, scores: JSON.parse(opt.scores) })}
                        className="shrink-0 text-xs font-medium text-[#787774] hover:text-[#37352F] bg-white hover:bg-[#F7F6F3] transition-colors px-3 py-1.5 rounded-lg border border-[#EBEBEB] shadow-sm cursor-pointer"
                      >
                        修改
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {editQ.show && (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity">
          <div className="bg-white p-6 rounded-2xl border border-[#EBEBEB] shadow-[0_8px_30px_rgb(0,0,0,0.12)] max-w-lg w-full">
            <h3 className="text-lg font-bold mb-4 text-[#37352F] flex items-center gap-2">
              <span>📝</span> 修改题目
            </h3>
            <textarea 
              value={editQ.text} 
              onChange={e => setEditQ({ ...editQ, text: e.target.value })}
              className="w-full border border-[#EBEBEB] p-3 rounded-lg h-28 mb-6 font-medium text-[#37352F] outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
            ></textarea>
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditQ({ show: false, id: 0, text: '' })} className="px-4 py-2 bg-white border border-[#EBEBEB] text-[#787774] hover:bg-[#F7F6F3] rounded-lg text-sm font-semibold transition-colors">取消</button>
              <button onClick={saveQuestion} disabled={loading} className="px-4 py-2 bg-[#37352F] hover:bg-black text-white rounded-lg text-sm font-semibold transition-colors shadow-sm">{loading ? '保存中...' : '确认保存'}</button>
            </div>
          </div>
        </div>
      )}

      {editOpt.show && (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity">
          <div className="bg-white p-6 rounded-2xl border border-[#EBEBEB] shadow-[0_8px_30px_rgb(0,0,0,0.12)] max-w-lg w-full">
            <h3 className="text-lg font-bold mb-5 text-[#37352F] flex items-center gap-2">
              <span>⚙️</span> 修改选项与分数
            </h3>
            <div className="mb-5">
              <label className="block text-sm font-semibold text-[#787774] mb-2">选项文案</label>
              <textarea 
                value={editOpt.text} 
                onChange={e => setEditOpt({ ...editOpt, text: e.target.value })}
                className="w-full border border-[#EBEBEB] p-3 rounded-lg h-20 font-medium text-[#37352F] outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
              ></textarea>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              {Object.keys(editOpt.scores).map(key => {
                if (key === 'billName') return null;
                return (
                  <label key={key} className="flex flex-col text-sm font-semibold text-[#787774]">
                    <span className="mb-1">{key} 分数</span>
                    <input 
                      type="number" 
                      value={editOpt.scores[key]} 
                      onChange={e => setEditOpt({ ...editOpt, scores: { ...editOpt.scores, [key]: parseInt(e.target.value) || 0 } })}
                      className="border border-[#EBEBEB] p-2 rounded-lg text-center text-[#37352F] outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                  </label>
                )
              })}
              <label className="flex flex-col text-sm font-semibold text-[#787774] col-span-2 mt-2">
                <span className="mb-1">账单名称 (billName)</span>
                <input 
                  type="text" 
                  value={editOpt.scores.billName || ''} 
                  onChange={e => setEditOpt({ ...editOpt, scores: { ...editOpt.scores, billName: e.target.value } })}
                  className="border border-[#EBEBEB] p-2 px-3 rounded-lg text-[#37352F] outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditOpt({ show: false, id: 0, text: '', scores: {} })} className="px-4 py-2 bg-white border border-[#EBEBEB] text-[#787774] hover:bg-[#F7F6F3] rounded-lg text-sm font-semibold transition-colors">取消</button>
              <button onClick={saveOption} disabled={loading} className="px-4 py-2 bg-[#37352F] hover:bg-black text-white rounded-lg text-sm font-semibold transition-colors shadow-sm">{loading ? '保存中...' : '确认保存'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
