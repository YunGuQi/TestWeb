'use client';

import { useState, useEffect } from 'react';
import { generateSignature } from '../../../lib/security';

interface TestEngineProps {
  userInfo: { nickname: string; status: 'single' | 'dating' };
  onBack: () => void;
  onFinish: (result: any) => void;
}

// 各维度背景色（深化，更有古典韵味）
const bgColors = [
  '#EDE6D6', // 0-4 (L/G) - 古卷米黄
  '#E8D8CE', // 5-9 (D/S) - 桃花粉瓷
  '#DDE4DA', // 10-14 (A/C) - 青瓷绿
  '#E4DDD3'  // 15-19 (R/P) - 暖砚灰
];

export default function TestEngine({ userInfo, onBack, onFinish }: TestEngineProps) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [showExitModal, setShowExitModal] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  
  // 动效状态
  const [isSwiping, setIsSwiping] = useState(false);

  useEffect(() => {
    fetch('/api/questions?testId=destiny-lover')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.questions) {
          setQuestions(data.questions);
        }
        setIsFetching(false);
      })
      .catch(err => {
        console.error(err);
        setIsFetching(false);
      });
  }, []);

  const getDimensionIndex = (index: number) => {
    return Math.floor(index / 5);
  };

  const currentBgColor = bgColors[getDimensionIndex(currentIndex)] || bgColors[0];

  if (isFetching) {
    return (
      <main className="flex-1 flex flex-col justify-center items-center h-full relative z-10 p-4 bg-transparent">
         <div className="w-12 h-12 border-4 border-[#B93A32] border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
         <p className="text-[#5A524A] font-serif tracking-widest text-sm">翻开姻缘簿中...</p>
      </main>
    );
  }

  if (questions.length === 0) {
    return <div className="text-center mt-20 font-bold">暂无题目，请联系月老</div>;
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
        }, 300); // 卡片滑出时间
      } else {
        // 最后一题不自动跳转，等待手动点击提交
      }
    }, 400); // 盖章停留时间
  };

  const submitAnswers = async (finalAnswers: any) => {
    setIsLoading(true);
    try {
      // 生成请求签名，防止直接 curl 攻击 API
      const payload = JSON.stringify({
        deviceId: localStorage.getItem('deviceId') || 'unknown',
        answers: finalAnswers,
        testId: 'destiny-lover',
        metadata: userInfo
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
        onFinish({ ...data.result, recordId: data.recordId });
      } else {
        alert('解析失败: ' + (data.error || '天机不可泄露'));
      }
    } catch(e) {
      alert('红线缠绕，网络错误');
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
      }, 300);
    }
  };

  if (isLoading) {
    return (
      <main className="flex-1 flex flex-col justify-center items-center h-full relative z-10 p-4 transition-colors duration-700 bg-transparent">
         <div className="w-16 h-16 border-2 border-[#B93A32] rounded-full flex items-center justify-center mb-6 animate-pulse opacity-80">
            <span className="text-[#B93A32] text-sm font-bold tracking-widest text-center">推演<br/>天机</span>
         </div>
         <p className="text-[#5A524A] font-serif tracking-widest text-sm">正在结绳记事，生成专属档案...</p>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col mx-auto w-full relative z-10 min-h-[100dvh] transition-colors duration-700 ease-in-out overflow-hidden bg-transparent">
        {/* 顶部进度条区 */}
        <div className="w-full max-w-md mx-auto pt-[max(32px,env(safe-area-inset-top))] px-6 pb-6 flex flex-col relative z-20">
            <div className="flex items-center justify-between mb-4">

                <button onClick={() => setShowExitModal(true)} className="text-[#8C847A] hover:text-[#B93A32] transition-colors flex items-center gap-1 font-serif text-sm cursor-pointer tracking-wider">
                    <span className="text-lg leading-none mb-1">←</span> 首页
                </button>
                <div className="text-[#8C847A] tracking-widest text-xs font-serif">
                  {currentIndex + 1} <span className="opacity-50">/</span> {questions.length}
                </div>
            </div>
            
            <div className="w-full h-1 bg-[#E8E2D5] rounded-full overflow-hidden">
                <div className="h-full bg-[#B93A32] transition-all duration-500 ease-out" style={{ width: `${progressPercent}%` }}></div>
            </div>
        </div>

        {/* 答题卡片区 */}
        <div className="flex-1 w-full max-w-md mx-auto flex flex-col justify-center px-6 pb-20 relative z-20 overflow-hidden">
            <div className={`transition-all duration-300 ease-in-out transform ${isSwiping ? '-translate-x-full opacity-0' : 'translate-x-0 opacity-100'}`}>
                {/* 签号引语张力强化 */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="inline-block bg-[#B93A32] text-white text-[10px] font-mono px-2 py-0.5 tracking-widest uppercase">
                    第 {currentIndex + 1} 签
                  </span>
                  <span className="text-xs text-[#7A7065] tracking-[0.2em] font-serif">· 姻缘问簿 · 灵魂循迹</span>
                </div>

                <h2 className="text-2xl md:text-3xl font-black mb-10 leading-snug text-[#2C2825] font-serif text-justify tracking-wide">
                    {currentQ.text}
                </h2>
                
                <div className="space-y-4">
                    {currentQ.options.map((opt: any) => {
                      const isStamped = answers[currentQ.id] === opt.id;
                      return (
                        <button 
                          key={opt.id} 
                          onClick={() => handleSelect(currentQ.id, opt)}
                          className={`w-full relative text-left p-6 border-2 transition-all duration-300 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B93A32]/40 active:scale-[0.99] group ${isStamped ? 'scale-[0.99] border-[#B93A32] bg-[#FAF8F5] shadow-[0_8px_30px_rgba(185,58,50,0.12)]' : 'border-[#D9D0C1] bg-[#FAF8F5]/80 hover:bg-[#FAF8F5] hover:border-[#B93A32]/60 hover:shadow-[0_8px_25px_rgba(44,40,37,0.06)]'}`}
                        >
                          <p className={`text-base md:text-lg leading-relaxed font-serif ${isStamped ? 'text-[#B93A32] font-bold' : 'text-[#4A423A] group-hover:text-[#2C2825]'}`}>
                            {opt.text}
                          </p>
                          
                          {/* 盖章动效 */}
                          {isStamped && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 border-2 border-[#B93A32] text-[#B93A32] text-xs font-bold rounded-full flex items-center justify-center transform rotate-12 animate-stamp shadow-[0_2px_12px_rgba(185,58,50,0.3)] bg-white/90">
                                缘
                            </div>
                          )}
                        </button>
                      );
                    })}
                </div>
            </div>
            
            {currentIndex > 0 && !isFinished && (
              <div className="absolute bottom-6 left-0 w-full text-center">
                  <button onClick={handleUndo} className="text-xs text-[#8C847A] hover:text-[#B93A32] focus-visible:underline transition-colors tracking-widest font-serif border-b border-[#8C847A] hover:border-[#B93A32] pb-1">
                      撤回上一步
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
                      className="w-full max-w-[200px] bg-[#B93A32] text-white py-3.5 rounded-sm font-medium tracking-widest shadow-lg hover:bg-[#A32626] active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B93A32]/40 transition-all"
                  >
                      解签查看结果
                  </button>
              </div>
            )}
        </div>

        {/* 退出弹窗复用逻辑，但改变 UI */}
        {showExitModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1F1B18]/60 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-[#FAF8F5] border border-[#D9D0C1] p-8 max-w-sm w-full text-center shadow-2xl relative">
                    {/* 角落装饰 */}
                    <div className="absolute top-2 left-2 w-2 h-2 border-t border-l border-[#B93A32]"></div>
                    <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-[#B93A32]"></div>
                    <div className="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-[#B93A32]"></div>
                    <div className="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-[#B93A32]"></div>
                    
                    <h3 className="text-xl font-bold text-[#2C2825] mb-3 font-serif">确认要离开吗？</h3>
                    <p className="text-[#8C847A] text-sm mb-8 font-serif">姻缘簿合上后，缘分可能流失（进度不保存）。</p>
                    <div className="flex gap-4">
                        <button onClick={() => setShowExitModal(false)} className="flex-1 py-3 border border-[#D9D0C1] text-[#5A524A] font-medium hover:bg-[#F4F1EA] active:scale-[0.99] transition-all tracking-widest">
                            继续解密
                        </button>
                        <button onClick={onBack} className="flex-1 py-3 bg-[#B93A32] text-white font-medium hover:bg-[#A32626] active:scale-[0.99] transition-all tracking-widest shadow-md">
                            确认离开
                        </button>
                    </div>
                </div>
            </div>
        )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes stamp {
          0% { opacity: 0; transform: translateY(-10px) rotate(12deg) scale(1.5); }
          50% { opacity: 1; transform: translateY(0) rotate(12deg) scale(0.9); }
          100% { opacity: 1; transform: translateY(0) rotate(12deg) scale(1); }
        }
        .animate-stamp { animation: stamp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
      `}} />
    </main>
  );
}
