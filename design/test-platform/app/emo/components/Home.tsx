'use client';

import { useState, useEffect } from 'react';

interface HomeProps {
  onStartTest: () => void;
  onRestoreHistory: (recordResult: any) => void;
}

export default function Home({ onStartTest, onRestoreHistory }: HomeProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [isEntering, setIsEntering] = useState(false);
  const [queueCount, setQueueCount] = useState(42);

  const fetchHistory = (deviceId: string) => {
    fetch(`/api/history?deviceId=${deviceId}&testId=emotional-friction`)
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
          <div className="text-center mb-12 brutalist-card p-8 transform -rotate-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 border-2 border-black font-mono text-xs uppercase tracking-widest font-bold mb-6">
                  <span className="w-2 h-2 bg-black animate-pulse"></span>
                  安安心灵便利店
              </div>
              <h1 className="text-4xl font-black tracking-tighter leading-tight mb-4">深度情绪内耗<br/>消费账单</h1>
              <div className="w-full h-px bg-black my-4"></div>
              <p className="font-mono text-xs text-gray-700 leading-relaxed font-bold">
                  [系统警告]<br/>你的每一次纠结<br/>都在暗中标好了价格
              </p>
              
              <div className="mt-6 text-left border-t border-b border-black py-4 bg-[#f4f4f4] px-4 shadow-[4px_4px_0px_#000] border-2">
                  <p className="text-xs font-bold mb-3 text-black">本次测算将精准扫描你的：</p>
                  <ul className="text-[11px] space-y-2 font-mono list-none text-black font-bold">
                      <li className="flex gap-2"><span className="shrink-0 bg-black text-white px-1">Sen</span> 敏感税：替人承担了多少额外情绪</li>
                      <li className="flex gap-2"><span className="shrink-0 bg-black text-white px-1">Rum</span> 反刍税：深夜你结算了多少后悔账</li>
                      <li className="flex gap-2"><span className="shrink-0 bg-black text-white px-1">Pls</span> 讨好税：花多少精力购买别人满意</li>
                      <li className="flex gap-2"><span className="shrink-0 bg-black text-white px-1">Bnd</span> 边界税：你的原则底线折旧率多高</li>
                  </ul>
                  <p className="text-[10px] font-bold mt-4 pt-2 border-t border-black border-dashed text-gray-600">
                      结账后将为您生成专属【内耗明细小票】，请注意查收。
                  </p>
              </div>

              <div className="mt-4 flex justify-center" id="barcode-container">
                  <svg className="w-full h-8" preserveAspectRatio="none" viewBox="0 0 100 10">
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
                    setTimeout(() => onStartTest(), 150);
                  }}
                  disabled={isEntering}
                  className="brutalist-btn text-xl mb-3 disabled:opacity-80"
              >
                  {isEntering ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin inline-block"></span>
                      正在进入...
                    </span>
                  ) : (
                    <span>拉出结账单开始测算</span>
                  )}
              </button>
              
              <div className="flex items-center justify-center gap-2 text-[10px] text-black/60 font-mono font-bold mb-8 mx-auto px-4 select-none">
                  <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
                  当前排队结账人数：<span>{queueCount}</span> 人
              </div>
              
              <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center justify-center gap-8 font-mono font-bold">
                      <button onClick={() => setShowHistory(true)} className="text-xs text-gray-600 hover:text-black transition-colors underline underline-offset-4">[ 查看历史消费单 ]</button>
                      <a href="/" className="text-xs text-gray-600 hover:text-black transition-colors underline underline-offset-4">[ 探索其他专柜 ]</a>
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
                                onRestoreHistory(recordResult);
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
