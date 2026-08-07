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

  return (
    <main id="view-home" className="relative w-full max-w-lg mx-auto min-h-[100dvh] flex flex-col pt-[max(24px,env(safe-area-inset-top))] pb-[max(100px,env(safe-area-inset-bottom))] px-5 justify-center z-10">
      <div id="home-content" className="w-full">
          <div className="text-center mb-10 brutalist-card p-6 sm:p-8 transform -rotate-1 border-4 border-black bg-[#fefdfb] shadow-[8px_8px_0px_#000] relative overflow-hidden">
              {/* 热敏纸小票顶部锯齿装饰 */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-[radial-gradient(circle_at_10px_-5px,#000_10px,transparent_11px)] bg-[length:20px_20px] opacity-10 pointer-events-none" />
              
              <div className="inline-flex items-center gap-2 px-3 py-1 border-2 border-black font-mono text-xs uppercase tracking-widest font-bold mb-4 bg-[#f4f4f4] shadow-[2px_2px_0px_#000]">
                  <span className="w-2 h-2 bg-red-600 animate-pulse"></span>
                  安安心灵便利店 // ANAN STORE
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tighter leading-tight mb-2 text-black">深度情绪内耗<br/>消费账单</h1>
              <div className="font-mono text-[11px] text-gray-500 tracking-widest mb-4">--- EMOTIONAL FRICTION RECEIPT ---</div>
              
              <div className="w-full border-t-2 border-dashed border-black my-4"></div>
              
              {/* 深度情绪内耗主题海报大图 */}
              <div className="relative mb-5 mx-auto overflow-hidden border-2 border-black shadow-[4px_4px_0px_#000] max-h-[220px] md:max-h-[250px] bg-[#f0eff5] group">
                <img 
                  src="/images/emo-test-cover.png" 
                  alt="深度情绪内耗·精神大体检海报" 
                  className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-mono font-bold px-2 py-0.5 border border-black shadow">
                  LOW BATTERY
                </div>
              </div>
              
              <p className="font-mono text-xs text-gray-800 leading-relaxed font-bold bg-yellow-100/70 py-2 px-3 border border-black inline-block mb-6">
                  [系统警告] 你的每一次纠结，都在暗中标好了价格
              </p>
              
              {/* 收银预估项目清单 */}
              <div className="mt-2 text-left border-2 border-black p-4 bg-white shadow-[4px_4px_0px_#000] font-mono">
                  <div className="flex justify-between border-b-2 border-black pb-2 mb-3 font-black tracking-widest text-[11px] text-black">
                      <span>ITEM / 预估消费税目</span>
                      <span>EST. / 状态</span>
                  </div>
                  <div className="space-y-2.5 text-[11px] font-bold text-gray-900">
                      <div className="flex items-center w-full">
                          <span className="flex items-center gap-1.5 shrink-0">
                              <span className="bg-black text-white px-1 py-0.5 text-[10px] shrink-0">Sen</span>
                              <span className="whitespace-nowrap">敏感税 (替人情绪买单)</span>
                          </span>
                          <span className="flex-1 mx-2 border-b-[2px] border-dotted border-gray-400 mt-2 mb-1"></span>
                          <span className="font-mono text-gray-500 shrink-0 whitespace-nowrap">[PENDING]</span>
                      </div>
                      <div className="flex items-center w-full">
                          <span className="flex items-center gap-1.5 shrink-0">
                              <span className="bg-black text-white px-1 py-0.5 text-[10px] shrink-0">Rum</span>
                              <span className="whitespace-nowrap">反刍税 (深夜后悔内耗)</span>
                          </span>
                          <span className="flex-1 mx-2 border-b-[2px] border-dotted border-gray-400 mt-2 mb-1"></span>
                          <span className="font-mono text-gray-500 shrink-0 whitespace-nowrap">[PENDING]</span>
                      </div>
                      <div className="flex items-center w-full">
                          <span className="flex items-center gap-1.5 shrink-0">
                              <span className="bg-black text-white px-1 py-0.5 text-[10px] shrink-0">Pls</span>
                              <span className="whitespace-nowrap">讨好税 (高额认可支出)</span>
                          </span>
                          <span className="flex-1 mx-2 border-b-[2px] border-dotted border-gray-400 mt-2 mb-1"></span>
                          <span className="font-mono text-gray-500 shrink-0 whitespace-nowrap">[PENDING]</span>
                      </div>
                      <div className="flex items-center w-full">
                          <span className="flex items-center gap-1.5 shrink-0">
                              <span className="bg-black text-white px-1 py-0.5 text-[10px] shrink-0">Bnd</span>
                              <span className="whitespace-nowrap">边界税 (原则底线折旧)</span>
                          </span>
                          <span className="flex-1 mx-2 border-b-[2px] border-dotted border-gray-400 mt-2 mb-1"></span>
                          <span className="font-mono text-gray-500 shrink-0 whitespace-nowrap">[PENDING]</span>
                      </div>
                  </div>
                  <div className="border-t-2 border-dashed border-black mt-4 pt-2 text-[10px] font-bold text-gray-500 flex justify-between items-center">
                      <span>* REGISTER: ANAN-EMO-2024</span>
                      <span className="bg-red-600 text-white px-1.5 py-0.5">UNPAID / 待结账</span>
                  </div>
              </div>

              <div className="mt-6 flex justify-center" id="barcode-container">
                  <svg className="w-full h-8 opacity-80" preserveAspectRatio="none" viewBox="0 0 100 10">
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

          <div className="mt-auto w-full mb-8">
              <button
                  onClick={() => {
                    setIsEntering(true);
                    setTimeout(() => onStartTest(), 180);
                  }}
                  disabled={isEntering}
                  className="w-full bg-black text-white font-black py-4 px-6 border-4 border-black text-lg sm:text-xl shadow-[6px_6px_0px_#fff] hover:translate-y-1 active:translate-y-2 active:shadow-none transition-all disabled:opacity-80 tracking-wider flex items-center justify-center gap-2"
              >
                  {isEntering ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"></span>
                      <span>收银机出单打印中... [PRINTING]</span>
                    </span>
                  ) : (
                    <span>拉出结账单 · 开始测算 [START] &rarr;</span>
                  )}
              </button>
              
              <div className="flex items-center justify-center gap-2 text-[10px] text-black/60 font-mono font-bold mb-8 mx-auto px-4 select-none">
                  <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
                  当前排队结账人数：<span>{queueCount}</span> 人
              </div>
              
              <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center justify-center gap-4 font-mono font-bold">
                      <button onClick={() => setShowHistory(true)} className="text-xs text-gray-600 hover:text-black transition-colors underline underline-offset-4 min-h-[44px] inline-flex items-center justify-center cursor-pointer touch-manipulation active:scale-95 px-3">[ 查看历史消费单 ]</button>
                      <button 
                        type="button"
                        onClick={() => window.location.href = 'https://xhslink.com/m/Atwtf3Cy6FR'} 
                        className="text-xs text-gray-600 hover:text-black transition-colors underline underline-offset-4 min-h-[44px] inline-flex items-center justify-center cursor-pointer touch-manipulation active:scale-95 px-3"
                      >
                        [ 探索其他专柜 ]
                      </button>
                  </div>
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
