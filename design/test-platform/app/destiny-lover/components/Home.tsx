'use client';

import { useState, useEffect } from 'react';

interface HomeProps {
  onStartTest: (nickname: string, status: 'single' | 'dating') => void;
  onRestoreHistory: (recordResult: any) => void;
}

export default function Home({ onStartTest, onRestoreHistory }: HomeProps) {
  const [nickname, setNickname] = useState('');
  const [status, setStatus] = useState<'single' | 'dating'>('single');
  const [showForm, setShowForm] = useState(false);
  
  const [showHistory, setShowHistory] = useState(false);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [participantCount, setParticipantCount] = useState(0);

  useEffect(() => {
    setParticipantCount(Math.floor(Math.random() * 101));
    
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = 'dev-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
      localStorage.setItem('deviceId', deviceId);
    }
    
    // Fetch history from local first
    try {
      const localStr = localStorage.getItem('quiz_history');
      if (localStr) {
        const localData = JSON.parse(localStr).filter((r: any) => r.testId === 'destiny-lover');
        setHistoryRecords(localData);
      }
    } catch(e) {}

    // Fetch history from DB (if available)
    fetch(`/api/history?deviceId=${deviceId}&testId=destiny-lover&t=${Date.now()}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.history && data.history.length > 0) {
          // Merge avoiding duplicates
          setHistoryRecords(prev => {
            const merged = [...prev];
            data.history.forEach((h: any) => {
              if (!merged.find(m => m.recordId === h.id)) {
                merged.push({ ...h, recordId: h.id });
              }
            });
            return merged;
          });
        }
      })
      .catch(e => console.warn('History fetch failed:', e));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      alert('请先填入您的称呼哦');
      return;
    }
    onStartTest(nickname.trim(), status);
  };

  return (
    <main className="flex-1 flex flex-col justify-center items-center w-full min-h-[100dvh] p-4 relative text-[#2C2825] bg-[#F4F1EA]">
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#1F1B18 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
      
      {!showForm ? (
        <div className="max-w-md w-full bg-[#FAF8F5] p-8 shadow-xl border border-[#D9D0C1] rounded-sm relative z-10 text-center animate-fade-in-up">
          <div className="w-16 h-16 border-2 border-[#B93A32] rounded-full flex items-center justify-center mx-auto mb-6 opacity-80">
            <span className="text-[#B93A32] text-sm font-bold tracking-widest leading-tight text-center">月老<br/>办事处</span>
          </div>
          
          <h1 className="text-2xl md:text-3xl font-bold mb-4 tracking-wider">解密你的命定恋人档案</h1>
          
          <p className="text-sm md:text-base leading-relaxed text-[#5A524A] mb-8 text-justify">
            你是否曾在夜里幻想过那个“对的人”究竟是什么模样？TA 是像你一样喜欢安静，还是能带你探索世界？是你的避风港，还是并肩作战的战友？<br/><br/>
            不管你现在是单身还是恋爱中，月老办事处的姻缘簿上早已记录了那份命中注定的羁绊。花 3 分钟完成这份灵魂问卷，解锁专属于你的【红娘档案卡】。
          </p>

          <button 
            onClick={() => setShowForm(true)}
            className="w-full bg-[#B93A32] text-white font-medium py-3 px-6 rounded-sm tracking-widest hover:bg-[#A32626] transition-colors shadow-md mb-3"
          >
            翻开姻缘簿
          </button>
          
          <div className="flex items-center justify-center gap-2 text-[11px] text-[#8A8075] font-sans mb-6">
            <div className="w-1.5 h-1.5 bg-[#B93A32] rounded-full animate-pulse"></div>
            已有 <span className="font-bold">{participantCount > 0 ? participantCount : '...'}</span> 人解密了红娘档案
          </div>

          <div className="flex flex-col items-center gap-3">
              <div className="flex items-center justify-center gap-6 font-medium">
                  <button onClick={() => setShowHistory(true)} className="text-xs text-[#5A524A] hover:text-[#B93A32] transition-colors underline underline-offset-4 tracking-widest">[ 查看历史档案 ]</button>
                  <a href="/design/common/lobby.html" className="text-xs text-[#5A524A] hover:text-[#B93A32] transition-colors underline underline-offset-4 tracking-widest">[ 探索其他测试 ]</a>
              </div>
          </div>
        </div>
      ) : (
        <div className="max-w-md w-full bg-[#FAF8F5] p-8 shadow-xl border border-[#D9D0C1] rounded-sm relative z-10 animate-fade-in">
          <h2 className="text-xl font-bold text-center mb-6 tracking-widest border-b border-[#D9D0C1] pb-4">身份录入</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-[#5A524A] mb-2 tracking-wider">您希望我们如何称呼您？</label>
              <input 
                type="text" 
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="请输入昵称/称呼" 
                className="w-full px-4 py-3 bg-white border border-[#D9D0C1] focus:outline-none focus:border-[#B93A32] transition-colors placeholder-[#A8A096]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[#5A524A] mb-2 tracking-wider">您当前的情感状态是？</label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStatus('single')}
                  className={`flex-1 py-3 border ${status === 'single' ? 'bg-[#F4F1EA] border-[#B93A32] text-[#B93A32]' : 'bg-white border-[#D9D0C1] text-[#7A7268]'} transition-colors font-medium`}
                >
                  我是单身
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('dating')}
                  className={`flex-1 py-3 border ${status === 'dating' ? 'bg-[#F4F1EA] border-[#B93A32] text-[#B93A32]' : 'bg-white border-[#D9D0C1] text-[#7A7268]'} transition-colors font-medium`}
                >
                  恋爱中
                </button>
              </div>
            </div>

            <div className="pt-4 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-transparent border border-[#5A524A] text-[#5A524A] font-medium py-3 px-6 rounded-sm tracking-widest hover:bg-[#E8E2D5] transition-colors"
                >
                  返回
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-[#B93A32] text-white font-medium py-3 px-6 rounded-sm tracking-widest hover:bg-[#A32626] transition-colors shadow-md"
                >
                  开始测算
                </button>
            </div>
          </form>
        </div>
      )}

      {showHistory && (
          <div className="fixed inset-0 z-50 bg-[#1F1B18]/80 backdrop-blur-sm flex flex-col justify-end">
              <div className="bg-[#FAF8F5] text-[#2C2825] border-t border-[#D9D0C1] p-6 pb-[max(32px,env(safe-area-inset-bottom))] w-full max-w-lg mx-auto h-[60vh] flex flex-col relative animate-fade-in-up">
                  <button onClick={() => setShowHistory(false)} className="absolute top-4 right-4 w-8 h-8 border border-[#D9D0C1] flex items-center justify-center font-bold text-[#8A8075] hover:text-[#B93A32] hover:border-[#B93A32] transition-colors">X</button>
                  <h2 className="text-xl font-bold mb-6 tracking-widest border-b border-[#D9D0C1] pb-4">历史红娘档案</h2>
                  <div className="flex-1 overflow-y-auto pr-2 mb-6 hide-scrollbar space-y-3">
                      {historyRecords.length === 0 ? (
                        <div className="text-[#8A8075] text-sm mt-4 text-center tracking-widest">姻缘簿上暂无您的记录哦~</div>
                      ) : (
                        [...historyRecords].map((record, index) => {
                          const id = record.id;
                          const recordResult = record.result;
                          
                          return (
                            <button 
                              key={id + index}
                              onClick={() => {
                                if (!recordResult) {
                                  alert('无数据，请重新测算。');
                                  return;
                                }
                                onRestoreHistory({ ...recordResult, recordId: id });
                              }}
                              className="w-full text-left p-4 bg-white border border-[#D9D0C1] hover:border-[#B93A32] transition-colors flex items-center justify-between"
                            >
                                <div>
                                    <div className="text-xs text-[#8A8075] font-sans mb-1">NO. {id ? id.toString().padStart(3, '0') : '001'}</div>
                                    <div className="font-bold text-[#B93A32] tracking-wider">{recordResult?.title || '命定恋人测算'}</div>
                                </div>
                                <div className="text-xs text-[#8A8075] border border-[#E8E2D5] px-2 py-1">回顾 &gt;</div>
                              </button>
                          );
                        })
                      )}
                  </div>
                  <button onClick={() => setShowHistory(false)} className="w-full py-3 border border-[#5A524A] text-[#5A524A] text-sm tracking-widest hover:bg-[#E8E2D5] transition-colors shrink-0">合上姻缘簿</button>
              </div>
          </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in-up { animation: fadeInUp 0.6s ease-out forwards; }
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </main>
  );
}
