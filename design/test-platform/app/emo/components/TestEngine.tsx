'use client';

import { useState, useEffect } from 'react';

interface TestEngineProps {
  onBack: () => void;
  onFinish: (result: any) => void;
}

export default function TestEngine({ onBack, onFinish }: TestEngineProps) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [showExitModal, setShowExitModal] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    fetch('/api/questions')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setQuestions(data.questions);
        }
        setIsFetching(false);
      })
      .catch(err => {
        console.error(err);
        setIsFetching(false);
      });
  }, []);

  if (isFetching) {
    return (
      <main className="flex-1 flex flex-col justify-center items-center h-full relative z-10 p-4">
         <div className="bg-white border-4 border-black p-8 max-w-sm w-full shadow-[8px_8px_0px_#000] text-center">
            <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h2 className="text-xl font-black mb-2 tracking-widest">正在生成你的账单</h2>
            <p className="text-xs text-gray-600 font-bold font-mono">系统扫描情绪成分中... 请稍候</p>
         </div>
      </main>
    );
  }

  if (questions.length === 0) {
    return <div className="text-center mt-20 font-bold">暂无题目，请在后台添加</div>;
  }

  const currentQ = questions[currentIndex];
  const progressPercent = ((currentIndex + 1) / questions.length) * 100;

  const handleSelect = (qId: string, opt: any) => {
    const newAnswers = { ...answers, [qId]: opt.id };
    setAnswers(newAnswers);

    if (currentIndex < questions.length - 1) {
      setTimeout(() => setCurrentIndex(currentIndex + 1), 200);
    } else {
      setIsFinished(true);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: localStorage.getItem('deviceId') || 'unknown',
          answers,
          testId: 'emotional-friction'
        })
      });
      const data = await res.json();
      if (data.success && data.result) {
        onFinish({ ...data.result, recordId: data.recordId });
      } else {
        alert('提交失败: ' + (data.error || '未知原因'));
      }
    } catch(e) {
      alert('网络错误');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUndo = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (isLoading) {
    return (
      <main className="flex-1 flex flex-col justify-center items-center h-full relative z-10 p-4">
         <div className="bg-white border-4 border-black p-8 max-w-sm w-full shadow-[8px_8px_0px_#000] text-center">
            <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h2 className="text-xl font-black mb-2 tracking-widest">正在结算您的账单</h2>
            <p className="text-xs text-gray-600 font-bold">PLEASE WAIT...</p>
         </div>
      </main>
    );
  }

  return (
    <main id="view-test" className="flex-1 flex flex-col max-w-md mx-auto w-full p-4 sm:p-6 relative text-sm sm:text-base z-10 min-h-[100dvh]">
        <div className="flex items-center justify-between mb-6 py-4 border-b-2 border-black">
            <button onClick={() => setShowExitModal(true)} id="btn-exit-test" className="p-2 -ml-2 text-gray-600 hover:text-black transition-colors flex items-center gap-1.5 font-black text-xs cursor-pointer relative z-50 uppercase tracking-wider">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
                <span>暂停收银/返回</span>
            </button>
            <div className="bg-black text-white px-2.5 py-1 text-[11px] font-mono font-bold tracking-wider" id="progress-text">
                [ ITEM {currentIndex + 1} OF {questions.length} ]
            </div>
        </div>

        {/* 收银扫描进度指示器 */}
        <div className="w-full mb-6 font-mono text-[10px] text-gray-500 uppercase tracking-widest flex justify-between items-center">
            <span>REGISTER STATUS: SCANNING</span>
            <span className="text-red-600 font-bold animate-pulse">&bull; PENDING CHARGE</span>
        </div>

        <div className="w-full h-2 bg-gray-200 border-2 border-black mb-8 overflow-hidden relative shadow-inner">
            <div id="progress-bar" className="h-full bg-red-600 transition-all duration-300" style={{ width: `${progressPercent}%` }}></div>
            <div className="absolute top-0 bottom-0 left-0 w-12 bg-white/30 animate-scan" style={{ filter: 'blur(2px)' }}></div>
        </div>

        <div id="question-container" className="flex-1 flex flex-col">
            <div className="bg-white border-4 border-black p-5 shadow-[6px_6px_0px_#000] mb-6 relative">
                <div className="font-mono text-[10px] text-gray-400 uppercase tracking-widest mb-1">--- CHARGE ITEM #{currentIndex + 1} ---</div>
                <h2 className="text-lg sm:text-xl font-black mb-1 leading-relaxed text-black">
                    <span className="text-red-600 mr-2 font-mono" id="q-num">Q{currentIndex + 1}.</span>
                    <span id="q-title">{currentQ.text}</span>
                </h2>
            </div>

            <div id="options-container" className="space-y-4">
                {currentQ.options.map((opt) => {
                  const isSelected = answers[currentQ.id]?.toString() === opt.id.toString();
                  return (
                    <button 
                      key={opt.id} 
                      onClick={() => handleSelect(currentQ.id, opt)}
                      className={`w-full text-left p-4 sm:p-5 border-4 border-black font-bold text-sm sm:text-base transition-all relative overflow-hidden flex items-center justify-between group ${
                        isSelected 
                          ? 'bg-black text-white translate-x-1 shadow-none' 
                          : 'bg-white text-black shadow-[6px_6px_0px_#000] hover:-translate-y-0.5 hover:shadow-[8px_8px_0px_#000] active:translate-y-1 active:shadow-none'
                      }`}
                    >
                      <span className="flex-1 pr-3 leading-relaxed">{opt.text}</span>
                      {isSelected && (
                        <span className="shrink-0 font-mono text-[10px] bg-red-600 text-white font-black px-2.5 py-1 uppercase tracking-wider border border-white animate-bounce shadow-sm">
                          [ + CHARGED / 已计入 ]
                        </span>
                      )}
                    </button>
                  );
                })}
            </div>
            
            {currentIndex > 0 && !isFinished && (
              <div className="mt-8 text-center" id="undo-container">
                  <button onClick={handleUndo} id="btn-undo" className="text-xs font-mono text-gray-500 hover:text-black underline underline-offset-4 decoration-gray-400 transition-colors font-bold">[ &larr; 撤回上一条计费项 / UNDO ]</button>
              </div>
            )}
        </div>
        
        {isFinished && (
            <div id="submit-container" className="mt-8">
                 <button onClick={handleSubmit} id="btn-submit" className="w-full bg-red-600 text-white font-black py-4 px-6 border-4 border-black text-lg shadow-[6px_6px_0px_#000] hover:bg-red-700 active:translate-y-1 transition-all tracking-wider">
                    <span className="flex justify-center items-center gap-2" id="submit-text">
                        <span>&rarr;</span>
                        <span>[ 立即打印消费结账凭单 ]</span>
                    </span>
                </button>
            </div>
        )}

        {showExitModal && (
            <div id="modal-exit" className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <div id="modal-exit-content" className="bg-white border-4 border-black p-6 max-w-sm w-full text-center shadow-[8px_8px_0px_#000]">
                    <h3 className="text-lg font-bold text-black mb-2">暂停收银清算吗？</h3>
                    <p className="text-gray-500 text-sm mb-6">当前选择的计费项将不会被保存至最终收据。</p>
                    <div className="flex gap-4">
                        <button onClick={() => setShowExitModal(false)} id="btn-cancel-exit" className="flex-1 py-3 bg-gray-800 text-white font-bold hover:bg-gray-700 transition-colors">继续计费</button>
                        <button onClick={onBack} id="btn-confirm-exit" className="flex-1 py-3 bg-red-600 text-white font-bold hover:bg-red-700 transition-colors">暂停并返回</button>
                    </div>
                </div>
            </div>
        )}
    </main>
  );
}
