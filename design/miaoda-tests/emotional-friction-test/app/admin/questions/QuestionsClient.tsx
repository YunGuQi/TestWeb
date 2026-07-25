'use client';

import { useState } from 'react';

export default function QuestionsClient({ initialQuestions }: { initialQuestions: any[] }) {
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
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">题库与分数管理 (CMS)</h1>
      </div>

      <div className="space-y-6">
        {questions.map((q) => (
          <div key={q.id} className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_#000]">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-bold">
                <span className="text-gray-400 mr-2">Q{q.order}</span>
                {q.text}
              </h2>
              <button 
                onClick={() => setEditQ({ show: true, id: q.id, text: q.text })}
                className="text-sm text-indigo-600 font-bold hover:underline"
              >
                编辑题目
              </button>
            </div>
            
            <div className="pl-6 space-y-2">
              {q.options.map((opt: any) => (
                <div key={opt.id} className="flex justify-between text-sm items-center bg-gray-50 p-2 border">
                  <span className="font-medium">{opt.text}</span>
                  <div className="flex gap-4 items-center">
                    <span className="font-mono text-xs bg-yellow-100 px-2 py-1">
                      {opt.scores}
                    </span>
                    <button 
                      onClick={() => setEditOpt({ show: true, id: opt.id, text: opt.text, scores: JSON.parse(opt.scores) })}
                      className="text-gray-500 hover:text-black font-bold"
                    >
                      修改选项与分数
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {editQ.show && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white p-6 border-4 border-black shadow-[8px_8px_0px_#000] max-w-lg w-full">
            <h3 className="text-lg font-bold mb-4">修改题目</h3>
            <textarea 
              value={editQ.text} 
              onChange={e => setEditQ({ ...editQ, text: e.target.value })}
              className="w-full border-2 border-black p-2 h-24 mb-4 font-bold"
            ></textarea>
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditQ({ show: false, id: 0, text: '' })} className="px-4 py-2 bg-gray-200 border-2 border-black font-bold">取消</button>
              <button onClick={saveQuestion} disabled={loading} className="px-4 py-2 bg-black text-white font-bold border-2 border-black">{loading ? '保存中...' : '确认保存'}</button>
            </div>
          </div>
        </div>
      )}

      {editOpt.show && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white p-6 border-4 border-black shadow-[8px_8px_0px_#000] max-w-lg w-full">
            <h3 className="text-lg font-bold mb-4">修改选项与分数</h3>
            <div className="mb-4">
              <label className="block text-sm font-bold mb-1">选项文案</label>
              <textarea 
                value={editOpt.text} 
                onChange={e => setEditOpt({ ...editOpt, text: e.target.value })}
                className="w-full border-2 border-black p-2 h-16 font-bold"
              ></textarea>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              {Object.keys(editOpt.scores).map(key => {
                if (key === 'billName') return null;
                return (
                  <label key={key} className="flex flex-col text-sm font-bold">
                    {key} 分数:
                    <input 
                      type="number" 
                      value={editOpt.scores[key]} 
                      onChange={e => setEditOpt({ ...editOpt, scores: { ...editOpt.scores, [key]: parseInt(e.target.value) || 0 } })}
                      className="border-2 border-black p-1 text-center"
                    />
                  </label>
                )
              })}
              <label className="flex flex-col text-sm font-bold col-span-2">
                账单名称 (billName):
                <input 
                  type="text" 
                  value={editOpt.scores.billName || ''} 
                  onChange={e => setEditOpt({ ...editOpt, scores: { ...editOpt.scores, billName: e.target.value } })}
                  className="border-2 border-black p-1 pl-2"
                />
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditOpt({ show: false, id: 0, text: '', scores: {} })} className="px-4 py-2 bg-gray-200 border-2 border-black font-bold">取消</button>
              <button onClick={saveOption} disabled={loading} className="px-4 py-2 bg-black text-white font-bold border-2 border-black">{loading ? '保存中...' : '确认保存'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
