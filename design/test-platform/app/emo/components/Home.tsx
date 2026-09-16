'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface HomeProps {
  onStartTest: () => void;
  onRestoreHistory: (recordResult: any) => void;
}

export default function Home({ onStartTest, onRestoreHistory }: HomeProps) {
  const router = useRouter();
  const [showHistory, setShowHistory] = useState(false);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [isEntering, setIsEntering] = useState(false);
  const [queueCount, setQueueCount] = useState(42);

  const fetchHistory = (deviceId: string) => {
    fetch(`/api/history?deviceId=${deviceId}&testId=emotional-friction&t=${Date.now()}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.history) {
          setHistoryRecords(data.history);
        }
      })
      .catch(e => console.error(e));
  };

  useEffect(() => {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = 'dev-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
      localStorage.setItem('deviceId', deviceId);
    }
    fetchHistory(deviceId);

    const intervalId = setInterval(() => {
      setQueueCount(Math.floor(Math.random() * 101));
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (showHistory) {
      const deviceId = localStorage.getItem('deviceId') || '';
      fetchHistory(deviceId);
    }
  }, [showHistory]);


  return (
    <main id="view-home" className="relative w-full max-w-lg mx-auto min-h-[100dvh] flex flex-col pt-[max(12px,env(safe-area-inset-top))] pb-[max(36px,env(safe-area-inset-bottom))] px-3.5 sm:px-5 z-10 overflow-y-auto">
      <div id="home-content" className="w-full py-2 sm:py-6 flex flex-col items-center flex-1 justify-between">
          <div className="w-full text-center mb-4 sm:mb-8 brutalist-card p-3.5 sm:p-6 transform -rotate-1 border-4 border-black bg-[#fefdfb] shadow-[4px_4px_0px_#000] sm:shadow-[8px_8px_0px_#000] relative overflow-hidden">
              {/* 热敏纸小票顶部锯齿装饰 */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-[radial-gradient(circle_at_10px_-5px,#000_10px,transparent_11px)] bg-[length:20px_20px] opacity-10 pointer-events-none" />
              
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 border-2 border-black font-mono text-[11px] uppercase tracking-widest font-bold mb-3 bg-[#f4f4f4] shadow-[2px_2px_0px_#000]">
                  <span className="w-2 h-2 bg-red-600 animate-pulse"></span>
                  安安心灵便利店 // ANAN STORE
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tighter leading-tight mb-1 sm:mb-2 text-black">深度情绪内耗<br/>消费账单</h1>
              <div className="font-mono text-[10px] sm:text-[11px] text-gray-500 tracking-widest mb-3">--- EMOTIONAL FRICTION RECEIPT ---</div>
              
              <div className="w-full border-t-2 border-dashed border-black my-2.5 sm:my-3"></div>
              
              <p className="font-mono text-[11px] sm:text-xs text-gray-800 leading-relaxed font-bold bg-yellow-100/70 py-1.5 px-2.5 border border-black inline-block mb-3 sm:mb-4">
                  [系统警告] 你的每一次纠结，都在暗中标好了价格
              </p>
              
              {/* 收银预估项目清单 */}
              <div className="mt-1 text-left border-2 border-black p-3 sm:p-4 bg-white shadow-[3px_3px_0px_#000] sm:shadow-[4px_4px_0px_#000] font-mono">
                  <div className="flex justify-between border-b-2 border-black pb-1.5 mb-2 font-black tracking-widest text-[10.5px] sm:text-[11px] text-black">
                      <span>ITEM / 预估消费税目</span>
                      <span>EST. / 状态</span>
                  </div>
                  <div className="space-y-1.5 text-[10px] sm:text-[11px] font-bold text-gray-900">
                      <div className="flex items-center w-full">
                          <span className="flex items-center gap-1.5 shrink-0">
                              <span className="bg-black text-white px-1 py-0.2 text-[9px] shrink-0 font-mono">Sen</span>
                              <span className="whitespace-nowrap">情绪敏感税 (外界微澜捕获)</span>
                          </span>
                          <span className="flex-1 mx-1.5 border-b-[2px] border-dotted border-gray-400 mt-2 mb-1"></span>
                          <span className="font-mono text-gray-500 shrink-0 whitespace-nowrap text-[9.5px]">[PENDING]</span>
                      </div>
                      <div className="flex items-center w-full">
                          <span className="flex items-center gap-1.5 shrink-0">
                              <span className="bg-black text-white px-1 py-0.2 text-[9px] shrink-0 font-mono">Rum</span>
                              <span className="whitespace-nowrap">精神反刍税 (深夜脑内推演)</span>
                          </span>
                          <span className="flex-1 mx-1.5 border-b-[2px] border-dotted border-gray-400 mt-2 mb-1"></span>
                          <span className="font-mono text-gray-500 shrink-0 whitespace-nowrap text-[9.5px]">[PENDING]</span>
                      </div>
                      <div className="flex items-center w-full">
                          <span className="flex items-center gap-1.5 shrink-0">
                              <span className="bg-black text-white px-1 py-0.2 text-[9px] shrink-0 font-mono">Pls</span>
                              <span className="whitespace-nowrap">讨好倾向税 (高额认可支出)</span>
                          </span>
                          <span className="flex-1 mx-1.5 border-b-[2px] border-dotted border-gray-400 mt-2 mb-1"></span>
                          <span className="font-mono text-gray-500 shrink-0 whitespace-nowrap text-[9.5px]">[PENDING]</span>
                      </div>
                      <div className="flex items-center w-full">
                          <span className="flex items-center gap-1.5 shrink-0">
                              <span className="bg-black text-white px-1 py-0.2 text-[9px] shrink-0 font-mono">Bnd</span>
                              <span className="whitespace-nowrap">边界防卫税 (原则底线折旧)</span>
                          </span>
                          <span className="flex-1 mx-1.5 border-b-[2px] border-dotted border-gray-400 mt-2 mb-1"></span>
                          <span className="font-mono text-gray-500 shrink-0 whitespace-nowrap text-[9.5px]">[PENDING]</span>
                      </div>
                      <div className="flex items-center w-full">
                          <span className="flex items-center gap-1.5 shrink-0">
                              <span className="bg-black text-white px-1 py-0.2 text-[9px] shrink-0 font-mono">Avd</span>
                              <span className="whitespace-nowrap">回避隔离税 (战术装死断联)</span>
                          </span>
                          <span className="flex-1 mx-1.5 border-b-[2px] border-dotted border-gray-400 mt-2 mb-1"></span>
                          <span className="font-mono text-gray-500 shrink-0 whitespace-nowrap text-[9.5px]">[PENDING]</span>
                      </div>
                      <div className="flex items-center w-full">
                          <span className="flex items-center gap-1.5 shrink-0">
                              <span className="bg-black text-white px-1 py-0.2 text-[9px] shrink-0 font-mono">Blm</span>
                              <span className="whitespace-nowrap">自我苛责税 (完美主义罚金)</span>
                          </span>
                          <span className="flex-1 mx-1.5 border-b-[2px] border-dotted border-gray-400 mt-2 mb-1"></span>
                          <span className="font-mono text-gray-500 shrink-0 whitespace-nowrap text-[9.5px]">[PENDING]</span>
                      </div>
                  </div>
                  <div className="border-t-2 border-dashed border-black mt-3 pt-1.5 text-[9.5px] font-bold text-gray-500 flex justify-between items-center">
                      <span>* REGISTER: ANAN-EMO-2024</span>
                      <span className="bg-red-600 text-white px-1.5 py-0.5">UNPAID / 待结账</span>
                  </div>
              </div>

              <div className="mt-3.5 sm:mt-5 flex justify-center" id="barcode-container">
                  <svg className="w-full h-6 sm:h-8 opacity-80" preserveAspectRatio="none" viewBox="0 0 100 10">
                      {[...Array(40)].map((_, i) => {
                          const r1 = Math.abs((Math.sin(i * 12.9898) * 43758.5453) % 1);
                          const r2 = Math.abs((Math.sin(i * 78.233) * 43758.5453) % 1);
                          if (r2 > 0.2) {
                              const w = r1 > 0.5 ? 2 : (r1 > 0.2 ? 4 : 1);
                              return <rect key={i} x={`${i * 2.5}%`} y="0" width={`${w}%`} height="100%" fill="currentColor"></rect>;
                          }
                          return null;
                      })}
                  </svg>
              </div>
          </div>

          <div className="w-full mt-2 mb-2 flex flex-col items-center">
              <button
                  id="btn-start"
                  onClick={() => {
                    setIsEntering(true);
                    setTimeout(() => onStartTest(), 180);
                  }}
                  disabled={isEntering}
                  className="w-full bg-black text-white font-black py-3.5 sm:py-4 px-4 sm:px-6 border-4 border-black text-base sm:text-xl shadow-[4px_4px_0px_#fff] sm:shadow-[6px_6px_0px_#fff] hover:translate-y-0.5 active:translate-y-1 active:shadow-none transition-all disabled:opacity-80 tracking-wider flex items-center justify-center gap-2 cursor-pointer touch-manipulation"
              >
                  {isEntering ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"></span>
                      <span>收银机出单打印中... [PRINTING]</span>
                    </span>
                  ) : (
                    <span>拉出结账单 · 开始测算 &rarr;</span>
                  )}
              </button>
              
              <div className="flex items-center justify-center gap-2 text-[10px] text-black/60 font-mono font-bold mb-2.5 mt-3 mx-auto px-4 select-none">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                  当前排队结账人数：<span>{queueCount}</span> 人
              </div>
              
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 font-mono font-bold w-full pb-4">
                  <button onClick={() => setShowHistory(true)} className="text-[11px] sm:text-xs text-gray-600 hover:text-black transition-colors underline underline-offset-4 min-h-[38px] inline-flex items-center justify-center cursor-pointer touch-manipulation active:scale-95 px-2 sm:px-3 whitespace-nowrap shrink-0">[ 查看历史消费单 ]</button>
                  <button 
                    type="button"
                    onClick={() => window.location.href = 'https://xhslink.com/m/Atwtf3Cy6FR'} 
                    className="text-[11px] sm:text-xs text-gray-600 hover:text-black transition-colors underline underline-offset-4 min-h-[38px] inline-flex items-center justify-center cursor-pointer touch-manipulation active:scale-95 px-2 sm:px-3 whitespace-nowrap shrink-0"
                  >
                    [ 前往安安的特卖专柜 ]
                  </button>
              </div>
          </div>
      </div>

      {showHistory && (
          <div id="modal-history" className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end">
              <div id="modal-history-content" className="bg-[#f4f4f5] text-black border-t-4 border-black p-6 pb-[max(32px,env(safe-area-inset-bottom))] w-full max-w-lg mx-auto h-[60vh] flex flex-col relative animate-slide-up">
                  <button onClick={() => setShowHistory(false)} id="btn-close-history" className="absolute top-4 right-4 w-10 h-10 border-2 border-black flex items-center justify-center font-bold active:translate-y-1 bg-white shadow-[2px_2px_0px_#000] active:shadow-none transition-all">X</button>
                  <h2 className="text-2xl font-black mb-6">历史消费单</h2>
                  <div id="history-list-container" className="flex-1 overflow-y-auto pr-2 mb-6 hide-scrollbar">
                      {historyRecords.length === 0 ? (
                        <div className="text-gray-500 text-sm mt-4 italic font-bold">暂无消费记录。</div>
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
                              className="w-full text-left p-4 bg-white border-2 border-black shadow-[4px_4px_0px_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0px_#000] transition-all flex items-center justify-between mb-3"
                            >
                                <div>
                                    <div className="text-xs text-gray-500 font-mono mb-1">RECEIPT {id ? id.toString().slice(-6) : '---'}</div>
                                    <div className="font-bold text-sm">{recordResult?.title || '深度情绪内耗测算'}</div>
                                </div>
                                <div className="font-mono text-xs text-black border border-black px-2 py-1">查看 &gt;</div>
                              </button>
                          );
                        })
                      )}
                  </div>
                  <button onClick={() => setShowHistory(false)} id="btn-close-history-bottom" className="brutalist-btn !py-3 shrink-0">关闭抽屉</button>
              </div>
          </div>
      )}
    </main>
  );
}
