'use client';

import { useState, useEffect } from 'react';
import { generateSignature } from '../../../lib/security';
import { Turnstile } from '@marsidev/react-turnstile';

interface TestEngineProps {
  userInfo: { nickname: string; status: 'independent' | 'confused' };
  onBack: () => void;
  onFinish: (result: any) => void;
}

export default function TestEngine({ userInfo, onBack, onFinish }: TestEngineProps) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [showExitModal, setShowExitModal] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  // 动效状态
  const [isSwiping, setIsSwiping] = useState(false);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        await fetch('/api/init-test?testId=family-origin');
        const timestamp = Date.now();
        const sign = await generateSignature("GET_QUESTIONS", timestamp);
        const res = await fetch('/api/questions?testId=family-origin', {
          headers: {
            'x-timestamp': timestamp.toString(),
            'x-sign': sign
          }
        });
        const data = await res.json();
        if (data.success && data.questions) {
          setQuestions(data.questions);
        } else {
          setFetchError(data.error || '接口请求被拒绝，请同步您的设备时间后刷新重试');
        }
        setIsFetching(false);
      } catch (err) {
        console.error(err);
        setFetchError('网络连接断开，请检查网络后刷新重试');
        setIsFetching(false);
      }
    };
    fetchQuestions();
  }, []);

  if (isFetching) {
    return (
      <main className="flex-1 flex flex-col justify-center items-center h-full relative z-10 p-4 bg-[#FDFBF7]">
         <div className="w-12 h-12 border-[3px] border-[#121212] border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
         <p className="text-[#121212] font-mono tracking-widest text-xs uppercase">剧本载入中...</p>
      </main>
    );
  }

  if (fetchError) {
    return (
      <main className="flex-1 flex flex-col justify-center items-center h-full relative z-10 p-4 bg-[#FDFBF7]">
         <div className="text-center font-bold font-mono text-[#E53935] mb-4 text-sm">{fetchError}</div>
         <button onClick={() => window.location.reload()} className="border-2 border-[#121212] px-6 py-2 text-xs font-mono font-bold hover:bg-[#121212] hover:text-white transition-colors">重新加载</button>
      </main>
    );
  }

  if (questions.length === 0) {
    return <div className="text-center mt-20 font-bold font-mono">NO DATA FOUND (题库为空)</div>;
  }

  const currentQ = questions[currentIndex];
  const progressPercent = ((currentIndex + 1) / questions.length) * 100;

  const handleSelect = (qId: string, opt: any) => {
    if (isSwiping) return; // 防连点
    
    const newAnswers = { ...answers, [qId]: opt.id };
    setAnswers(newAnswers);
    
    // 延迟更新和滑动 (展示盖章动效)
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setIsSwiping(true);
        setTimeout(() => {
          setCurrentIndex(currentIndex + 1);
          setIsSwiping(false);
        }, 150); // 硬切快滑动时间
      } else {
        // 最后一题不自动跳转，等待手动点击提交
      }
    }, 350); // 盖章停留时间
  };

  const submitAnswers = async (finalAnswers: any) => {
    setIsLoading(true);
    try {
      const payload = JSON.stringify({
        deviceId: localStorage.getItem('deviceId') || 'unknown',
        answers: finalAnswers,
        testId: 'family-origin',
        metadata: userInfo,
        turnstileToken: turnstileToken
      });
      const timestamp = Date.now();
      const sign = await generateSignature(payload, timestamp);
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-timestamp': timestamp.toString(),
          'x-sign': sign
        },
        body: payload
      });
      const data = await res.json();
      if (data.success && data.result) {
        onFinish({ ...data.result, recordId: data.recordId, participantCount: data.participantCount });
      } else {
        setIsFinished(false);
        alert('解析失败: ' + (data.error || '解析失败，请重试'));
      }
    } catch(e) {
      setIsFinished(false);
      alert('连接中断，网络波动');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUndo = () => {
    if (currentIndex > 0 && !isSwiping) {
      setIsSwiping(true);
      setTimeout(() => {
        setCurrentIndex(currentIndex - 1);
        setIsSwiping(false);
      }, 150);
    }
  };

  if (isLoading) {
    return (
      <main className="flex-1 flex flex-col justify-center items-center h-full relative z-10 p-4 transition-colors duration-300 bg-[#121212]">
         <div className="w-16 h-16 border-2 border-white rounded-none flex items-center justify-center mb-6 animate-pulse opacity-90 relative overflow-hidden">
            <div className="absolute inset-0 bg-[#E53935] transform scale-y-0 origin-bottom animate-[fill_1.5s_ease-in-out_infinite]"></div>
            <span className="text-white text-xs font-mono font-bold tracking-widest text-center relative z-10">解析中</span>
         </div>
         <p className="text-white/60 font-mono tracking-widest text-xs uppercase">正在生成原生档案...</p>
         <style dangerouslySetInnerHTML={{__html: `
            @keyframes fill {
              0% { transform: scaleY(0); }
              50% { transform: scaleY(1); }
              100% { transform: scaleY(0); transform-origin: top; }
            }
         `}} />
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col mx-auto w-full relative z-10 min-h-[100dvh] bg-[#FDFBF7] transition-colors duration-300 ease-in-out overflow-hidden selection:bg-[#E53935] selection:text-white">
        {/* 顶部进度条区 */}
        <div className="w-full max-w-md mx-auto pt-[max(32px,env(safe-area-inset-top))] px-6 pb-4 flex flex-col relative z-20">
            <div className="flex items-center justify-between mb-6 border-b-2 border-[#121212] pb-4">
                <button onClick={() => setShowExitModal(true)} className="text-[#121212] hover:text-[#E53935] transition-colors flex items-center gap-2 font-mono text-xs font-bold tracking-widest uppercase">
                    <span className="text-lg leading-none -mt-0.5">←</span> 中止测试
                </button>
                <div className="text-[#121212] tracking-widest text-xs font-mono font-bold">
                  {String(currentIndex + 1).padStart(2, '0')} <span className="opacity-30">/</span> {String(questions.length).padStart(2, '0')}
                </div>
            </div>
            
            <div className="w-full h-1.5 bg-[#E0DDD6] overflow-hidden">
                <div className="h-full bg-[#121212] transition-all duration-200 ease-out" style={{ width: `${progressPercent}%` }}></div>
            </div>
        </div>

        {/* 答题卡片区 */}
        <div className="flex-1 w-full max-w-md mx-auto flex flex-col justify-center px-6 pb-20 relative z-20 overflow-hidden">
            <div className={`transition-transform duration-200 ease-out transform ${isSwiping ? '-translate-y-8 opacity-0' : 'translate-y-0 opacity-100'}`}>
                {/* 签号引语张力强化 */}
                <div className="flex items-center gap-3 mb-6">
                  <span className="inline-block bg-[#121212] text-white text-[10px] font-mono px-2.5 py-1 tracking-widest uppercase font-bold shadow-[2px_2px_0px_rgba(229,57,53,1)]">
                    第 {String(currentIndex + 1).padStart(2, '0')} 幕
                  </span>
                  <span className="text-[10px] text-[#121212]/50 tracking-[0.2em] font-mono uppercase font-bold">绝密档案</span>
                </div>

                <h2 className="text-xl md:text-2xl font-black mb-10 leading-snug text-[#121212] font-serif tracking-wide">
                    {currentQ.text}
                </h2>
                
                <div className="space-y-3">
                    {currentQ.options.map((opt: any) => {
                      const isStamped = answers[currentQ.id] === opt.id;
                      return (
                        <button 
                          key={opt.id} 
                          onClick={() => handleSelect(currentQ.id, opt)}
                          className={`w-full relative text-left p-5 border-2 transition-all duration-150 rounded-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#121212]/40 active:scale-[0.98] group overflow-hidden ${isStamped ? 'border-[#121212] bg-[#121212]' : 'border-[#121212]/20 bg-transparent hover:border-[#121212] hover:bg-[#121212]/5'}`}
                        >
                          <p className={`text-base md:text-lg leading-relaxed font-serif relative z-10 transition-colors duration-150 ${isStamped ? 'text-white font-bold' : 'text-[#121212]/80 group-hover:text-[#121212]'}`}>
                            {opt.text}
                          </p>
                          
                          {/* 机密录入动效 */}
                          {isStamped && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 animate-stamp">
                                <div className="w-2 h-2 rounded-full bg-[#E53935] animate-pulse"></div>
                                <span className="text-white text-[10px] font-mono font-bold tracking-widest uppercase opacity-90">已收录</span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                </div>
            </div>
            
            {currentIndex > 0 && !isFinished && (
              <div className="absolute bottom-6 left-0 w-full text-center">
                  <button onClick={handleUndo} className="text-[10px] text-[#121212]/50 hover:text-[#121212] focus-visible:underline transition-colors tracking-widest font-mono font-bold uppercase pb-1">
                      [ 撤回重演 ]
                  </button>
              </div>
            )}

            {/* 最后一题提交按钮 */}
            {currentIndex === questions.length - 1 && answers[currentQ.id] && !isFinished && (
              <div className="absolute bottom-16 left-0 w-full flex justify-center px-6 animate-fade-in-up">
                  <button 
                      onClick={() => {
                        setIsFinished(true);
                        submitAnswers(answers);
                      }}
                      className="w-full bg-[#E53935] text-white py-4 font-mono font-bold text-sm tracking-[0.2em] uppercase hover:bg-[#D32F2F] active:translate-y-1 transition-all shadow-[4px_4px_0px_rgba(18,18,18,1)] active:shadow-none focus:outline-none"
                  >
                      生成人生档案
                  </button>
              </div>
            )}
        </div>

        {/* 退出弹窗 */}
        {showExitModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#121212]/80 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-[#FDFBF7] border-4 border-[#121212] p-8 max-w-sm w-full text-center shadow-[12px_12px_0px_rgba(229,57,53,1)] relative">
                    <h3 className="text-2xl font-black text-[#121212] mb-2 font-serif uppercase tracking-widest">确认中止？</h3>
                    <p className="text-[#121212]/70 text-xs mb-8 font-mono tracking-wider uppercase">当前进度将不会保存。</p>
                    <div className="flex flex-col gap-3">
                        <button onClick={onBack} className="w-full py-3.5 bg-[#121212] text-white font-mono font-bold text-xs hover:bg-[#2A2A2A] active:scale-[0.98] transition-all tracking-widest uppercase border-2 border-[#121212]">
                            放弃测试
                        </button>
                        <button onClick={() => setShowExitModal(false)} className="w-full py-3.5 bg-transparent border-2 border-[#121212] text-[#121212] font-mono font-bold text-xs hover:bg-[#121212]/5 active:scale-[0.98] transition-all tracking-widest uppercase">
                            继续答题
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* 全局隐式人机验证组件 */}
        <div className="h-0 overflow-hidden opacity-0 pointer-events-none">
          <Turnstile 
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
            onSuccess={(token) => setTurnstileToken(token)}
          />
        </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes stamp {
          0% { opacity: 0; transform: translateY(-50%) translateX(10px); }
          100% { opacity: 1; transform: translateY(-50%) translateX(0); }
        }
        .animate-stamp { animation: stamp 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
      `}} />
    </main>
  );
}
