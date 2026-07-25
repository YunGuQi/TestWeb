'use client';

import { useState, useEffect } from 'react';

interface TestEngineProps {
  onBack: () => void;
  onFinish: (answers: Record<string, any>) => void;
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
    const newAnswers = { ...answers, [qId]: opt };
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
          answers
        })
      });
      const data = await res.json();
      if (data.success) {
        onFinish(answers);
      } else {
        alert('提交失败');
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
    <main id="view-test" className="flex-1 flex flex-col max-w-md mx-auto w-full p-4 relative text-sm sm:text-base z-10 min-h-[100dvh]">
        <div className="flex items-center justify-between mb-8 py-4 border-b border-gray-300">
            <button onClick={() => setShowExitModal(true)} id="btn-exit-test" className="p-2 -ml-2 text-gray-600 hover:text-black transition-colors flex items-center gap-1 font-bold text-xs cursor-pointer relative z-50">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
                返回首页
            </button>
            <div className="text-gray-500 tracking-widest text-xs font-mono" id="progress-text">PROCESS: {currentIndex + 1} / {questions.length}</div>
        </div>

        <div className="w-full h-1 bg-gray-200 mb-8 overflow-hidden relative">
            <div id="progress-bar" className="h-full bg-black transition-all duration-300" style={{ width: `${progressPercent}%` }}></div>
            <div className="absolute top-0 bottom-0 left-0 w-12 bg-black/10 animate-scan" style={{ filter: 'blur(4px)' }}></div>
        </div>

        <div id="question-container" className="flex-1 flex flex-col">
            <h2 className="text-xl md:text-2xl font-bold mb-8 leading-relaxed">
                <span className="text-black mr-2" id="q-num">Q{currentIndex + 1}.</span>
                <span id="q-title">{currentQ.text}</span>
            </h2>
            <div id="options-container" className="space-y-4">
                {currentQ.options.map((opt) => {
                  const isSelected = answers[currentQ.id]?.id === opt.id;
                  return (
                    <button 
                      key={opt.id} 
                      onClick={() => handleSelect(currentQ.id, opt)}
                      className={`option-btn ${isSelected ? 'selected' : ''}`}
                    >
                      {opt.text}
                    </button>
                  );
                })}
            </div>
            
            {currentIndex > 0 && !isFinished && (
              <div className="mt-8 text-center" id="undo-container">
                  <button onClick={handleUndo} id="btn-undo" className="text-xs text-gray-500 hover:text-black underline underline-offset-4 decoration-gray-400 transition-colors">[ 撤回上一条计费 ]</button>
              </div>
            )}
        </div>
        
        {isFinished && (
            <div id="submit-container" className="mt-8">
                 <button onClick={handleSubmit} id="btn-submit" className="brutalist-btn mt-8">
                    <span className="flex justify-center items-center" id="submit-text">[ 打印账单 ]</span>
                </button>
            </div>
        )}

        {showExitModal && (
            <div id="modal-exit" className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <div id="modal-exit-content" className="bg-white border-4 border-black p-6 max-w-sm w-full text-center shadow-[8px_8px_0px_#000]">
                    <h3 className="text-lg font-bold text-black mb-2">确定要离开吗？</h3>
                    <p className="text-gray-500 text-sm mb-6">当前答题进度将不会被保存。</p>
                    <div className="flex gap-4">
                        <button onClick={() => setShowExitModal(false)} id="btn-cancel-exit" className="flex-1 py-3 bg-gray-800 text-white font-bold hover:bg-gray-700 transition-colors">继续答题</button>
                        <button onClick={onBack} id="btn-confirm-exit" className="flex-1 py-3 bg-red-600 text-white font-bold hover:bg-red-700 transition-colors">确认离开</button>
                    </div>
                </div>
            </div>
        )}
    </main>
  );
}
