'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface HomeProps {
  onStartTest: (nickname: string, status: 'independent' | 'confused') => void;
  onRestoreHistory: (recordResult: any) => void;
}

export default function Home({ onStartTest, onRestoreHistory }: HomeProps) {
  const router = useRouter();
  const [showHistory, setShowHistory] = useState(false);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [participantCount, setParticipantCount] = useState(0);

  useEffect(() => {
    const updateCount = () => setParticipantCount(Math.floor(Math.random() * 100) + 1);
    updateCount();
    const timer = setInterval(updateCount, 3000);
    
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = 'dev-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
      localStorage.setItem('deviceId', deviceId);
    }
    
    // Fetch history from local first
    try {
      const localStr = localStorage.getItem('quiz_history');
      if (localStr) {
        const localData = JSON.parse(localStr).filter((r: any) => r.testId === 'family-origin');
        setHistoryRecords(localData);
      }
    } catch(e) {}

    // Fetch history from DB (if available)
    fetch(`/api/history?deviceId=${deviceId}&testId=family-origin&t=${Date.now()}`)
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
      
    return () => clearInterval(timer);
  }, []);

  const handleStart = () => {
    // 极致降低启动摩擦力
    onStartTest('主角', 'independent');
  };

  return (
    <main className="flex-1 flex flex-col justify-center items-center w-full min-h-[100dvh] p-4 relative text-[#121212] overflow-hidden bg-transparent font-sans">

      <div className="max-w-md w-full bg-[#FDFBF7] p-8 md:p-12 shadow-[12px_12px_0px_0px_rgba(230,57,70,1)] border-4 border-[#121212] relative z-10 transition-transform duration-500 animate-fade-in-up">
        
        {/* 场记板顶部标签 */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#121212] text-white px-5 py-1.5 flex items-center gap-3 shadow-sm whitespace-nowrap">
          <span className="w-2 h-2 rounded-full bg-[#E63946] animate-pulse"></span>
          <span className="text-[10px] md:text-xs font-bold tracking-[0.4em] font-mono uppercase">绝密剧本</span>
        </div>
        
        {/* 标题 - Brutalism / Editorial 排版 */}
        <h1 className="text-4xl md:text-5xl font-black mt-6 mb-2 text-[#121212] leading-[1.1] tracking-tight text-center">
          大女主<br/>
          <span className="text-[#E63946] italic font-serif tracking-normal mt-2 block">觉醒测试</span>
        </h1>
        
        {/* 分割线 */}
        <div className="w-full h-[2px] bg-[#121212] my-8 relative flex items-center justify-center">
           <div className="bg-[#FDFBF7] px-4 text-[10px] font-mono tracking-widest text-[#121212]/60 uppercase">原生家庭引力侦测</div>
        </div>
        
        {/* 极简高对比正文 */}
        <p className="text-sm md:text-[15px] leading-relaxed text-[#333333] mb-10 text-justify font-medium">
          真正的独立，不仅仅是经济的自由，更是能够彻底摆脱“原生家庭”的心理引力，把人生的笔杆子夺回来，不再重复老套的奉献或牺牲剧情。<br/><br/>
          花 <span className="font-bold text-white bg-[#E63946] px-1.5 py-0.5 mx-0.5">3 分钟</span>完成这 15 道戳心的灵魂拷问，测算你的 <span className="font-bold border-b-2 border-[#121212] pb-0.5">核心独立指数</span> 与隐藏觉醒天赋。
        </p>

        <button 
          onClick={handleStart}
          className="group relative w-full bg-[#121212] text-white text-lg font-black py-4 px-6 tracking-[0.25em] overflow-hidden transition-all hover:bg-[#E63946] active:scale-[0.98]"
        >
          <div className="absolute inset-0 w-full h-full border border-white/20 scale-[0.95] group-hover:scale-100 transition-transform duration-300"></div>
          <span className="relative z-10 flex items-center justify-center gap-3">
            开机 // ACTION <span className="font-mono font-normal opacity-50 text-sm">→</span>
          </span>
        </button>
        
        <div className="flex items-center justify-center gap-2 text-[11px] text-[#666] font-mono mt-6 mb-6 tracking-wider uppercase">
          [ <span className="font-bold text-[#121212]">{participantCount.toLocaleString()}</span> 位觉醒者已入局 ]
        </div>

        <div className="flex flex-col items-center gap-3 border-t-2 border-dashed border-[#121212]/20 pt-6">
            <div className="flex items-center justify-center gap-6 font-bold text-xs uppercase font-mono tracking-widest">
                <button onClick={() => setShowHistory(true)} className="text-[#121212]/70 hover:text-[#E63946] transition-colors underline underline-offset-4 decoration-2 decoration-[#121212]/20 hover:decoration-[#E63946] px-2 py-1">
                  历史档案
                </button>
                <button 
                  type="button"
                  onClick={() => window.location.href = 'https://xhslink.com/m/Atwtf3Cy6FR'} 
                  className="text-[#121212]/70 hover:text-[#E63946] transition-colors underline underline-offset-4 decoration-2 decoration-[#121212]/20 hover:decoration-[#E63946] px-2 py-1"
                >
                  访问安安的剧本库
                </button>
            </div>
        </div>
      </div>

      {/* 历史记录浮层 - 档案库风格 */}
      {showHistory && (
          <div className="fixed inset-0 z-50 bg-[#121212]/90 backdrop-blur-md flex flex-col justify-end sm:justify-center sm:items-center">
              <div className="bg-[#FDFBF7] text-[#121212] border-t-4 border-[#E63946] sm:border-4 p-6 pb-[max(32px,env(safe-area-inset-bottom))] w-full max-w-lg mx-auto h-[70vh] sm:h-auto sm:max-h-[80vh] flex flex-col relative animate-fade-in-up sm:shadow-[16px_16px_0px_0px_rgba(230,57,70,1)]">
                  
                  <button onClick={() => setShowHistory(false)} className="absolute top-4 right-4 w-10 h-10 border-2 border-[#121212] flex items-center justify-center font-black text-[#121212] hover:bg-[#E63946] hover:text-white hover:border-[#E63946] transition-colors">✕</button>
                  
                  <h2 className="text-2xl font-black mb-6 tracking-widest border-b-2 border-[#121212] pb-4 uppercase">
                    Archive // <span className="text-[#E63946]">档案室</span>
                  </h2>
                  
                  <div className="flex-1 overflow-y-auto pr-2 mb-6 hide-scrollbar space-y-4">
                      {historyRecords.length === 0 ? (
                        <div className="text-[#121212]/50 text-sm mt-8 text-center tracking-widest font-mono uppercase bg-[#121212]/5 py-12 border-2 border-dashed border-[#121212]/20">
                          // No records found //
                        </div>
                      ) : (
                        [...historyRecords].map((record, index) => {
                          const id = record.id;
                          const recordResult = record.result;
                          
                          return (
                            <button 
                              key={record.recordId || id || index}
                              onClick={() => {
                                if (!recordResult) {
                                  alert('无数据，请重新测算。');
                                  return;
                                }
                                onRestoreHistory({ ...recordResult, recordId: id });
                              }}
                              className="group w-full text-left p-5 bg-white border-2 border-[#121212] hover:border-[#E63946] transition-all flex items-center justify-between hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(230,57,70,1)]"
                            >
                                <div>
                                    <div className="text-[10px] text-[#121212]/50 font-mono mb-2 font-bold uppercase tracking-widest flex items-center gap-2">
                                      <span className="w-1.5 h-1.5 bg-[#121212] block"></span>
                                      ID: {id ? id.toString().padStart(6, '0') : '000001'}
                                    </div>
                                    <div className="font-black text-[#121212] tracking-widest text-lg group-hover:text-[#E63946] transition-colors">
                                      {recordResult?.title || '人生剧本大纲'}
                                    </div>
                                </div>
                                <div className="text-xs font-bold font-mono bg-[#121212] text-white px-3 py-2 uppercase tracking-widest group-hover:bg-[#E63946] transition-colors">
                                  Load
                                </div>
                              </button>
                          );
                        })
                      )}
                  </div>
                  <button onClick={() => setShowHistory(false)} className="w-full py-4 border-2 border-[#121212] text-[#121212] font-black tracking-[0.2em] uppercase hover:bg-[#121212] hover:text-white transition-colors shrink-0">
                    Close Archive
                  </button>
              </div>
          </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in-up { animation: fadeInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

    </main>
  );
}
