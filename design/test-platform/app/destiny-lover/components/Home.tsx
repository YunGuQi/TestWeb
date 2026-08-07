'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface HomeProps {
  onStartTest: (nickname: string, status: 'single' | 'dating') => void;
  onRestoreHistory: (recordResult: any) => void;
}

export default function Home({ onStartTest, onRestoreHistory }: HomeProps) {
  const router = useRouter();
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
    <main className="flex-1 flex flex-col justify-center items-center w-full min-h-[100dvh] p-4 relative text-[#2C2825] overflow-hidden bg-transparent">



      {!showForm ? (
        <div className="max-w-md w-full bg-[#FAF8F5] p-8 md:p-10 shadow-[0_28px_70px_rgba(44,40,37,0.12),0_2px_6px_rgba(0,0,0,0.04)] border-2 border-[#D9D0C1] rounded-sm relative z-10 text-center animate-fade-in-up">
          {/* 古典朱砂官印契约头部 */}
          <div className="inline-block border-2 border-[#B93A32] px-4 py-1.5 mb-5 opacity-90 shadow-[0_4px_20px_rgba(185,58,50,0.2)]">
            <span className="text-[#B93A32] text-xs font-bold tracking-[0.3em] font-serif uppercase">· 月老办事处 · 红娘档案簿 ·</span>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-black mb-3 tracking-widest text-[#2C2825] leading-tight">
            解密你的<span className="text-[#B93A32] block md:inline mt-1 md:mt-0">命定恋人</span>
          </h1>
          
          <div className="w-12 h-0.5 bg-[#B93A32]/40 mx-auto my-4"></div>
          
          {/* 命定恋人二次元主题封面大图（无字底图 + 前端超清矢量叠字架构） */}
          <div className="relative mb-6 mx-auto overflow-hidden rounded-md border-2 border-[#B93A32]/80 shadow-[0_12px_32px_rgba(185,58,50,0.15)] max-h-[260px] md:max-h-[300px] bg-[#1C1715] group">
            <img 
              src="/images/destiny-lover-cover.png" 
              alt="月老办事处·命定恋人海报" 
              className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
            />
            
            {/* 顶部招牌 —— 前端高精度矢量中文字体渲染，终结 AI 模糊与错别字 */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#8A231C]/90 via-[#B93A32] to-[#8A231C]/90 text-[#FFE9BE] border border-[#FFD384]/60 px-4 py-1 rounded-full shadow-lg backdrop-blur-[2px] flex items-center gap-1.5 z-10">
              <span className="text-[10px] text-[#FFD384]">★</span>
              <span className="text-xs md:text-sm font-black tracking-[0.2em] font-serif drop-shadow">命 定 恋 人</span>
              <span className="text-[10px] text-[#FFD384]">★</span>
            </div>

            {/* 四方看点标签卡 —— 极致清晰、像素级锐利的四大评价维度 */}
            <div className="absolute top-10 left-2 bg-[#FAF8F5]/95 border border-[#B93A32]/60 px-2.5 py-1 rounded shadow-md backdrop-blur-sm transform -rotate-2 hover:scale-105 transition-transform">
              <div className="text-[10px] font-bold text-[#B93A32] tracking-wider font-sans">【灵魂共振】</div>
              <div className="text-[9px] text-[#4A423A] scale-95 origin-left">秒懂你的奇奇怪怪</div>
            </div>

            <div className="absolute top-10 right-2 bg-[#FAF8F5]/95 border border-[#B93A32]/60 px-2.5 py-1 rounded shadow-md backdrop-blur-sm transform rotate-2 hover:scale-105 transition-transform text-right">
              <div className="text-[10px] font-bold text-[#B93A32] tracking-wider font-sans">【强导 vs 护宠】</div>
              <div className="text-[9px] text-[#4A423A] scale-95 origin-right">专属甜宠或被爆改</div>
            </div>

            <div className="absolute bottom-9 left-2 bg-[#FAF8F5]/95 border border-[#B93A32]/60 px-2.5 py-1 rounded shadow-md backdrop-blur-sm transform rotate-1 hover:scale-105 transition-transform">
              <div className="text-[10px] font-bold text-[#B93A32] tracking-wider font-sans">【粘人平衡仪】</div>
              <div className="text-[9px] text-[#4A423A] scale-95 origin-left">24小时贴贴vs独立空间</div>
            </div>

            <div className="absolute bottom-9 right-2 bg-[#FAF8F5]/95 border border-[#B93A32]/60 px-2.5 py-1 rounded shadow-md backdrop-blur-sm transform -rotate-1 hover:scale-105 transition-transform text-right">
              <div className="text-[10px] font-bold text-[#B93A32] tracking-wider font-sans">【仪式烟火气】</div>
              <div className="text-[9px] text-[#4A423A] scale-95 origin-right">偶像剧浪漫与吃香喝辣</div>
            </div>

            {/* 底部浮层与官方认证勋章 */}
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-6 pb-2 flex items-center justify-between px-3 z-10">
              <span className="text-white/90 text-[10px] font-bold tracking-widest bg-[#B93A32]/90 px-2.5 py-0.5 rounded-sm border border-white/20">
                🏷️ 月老办事处认证
              </span>
              <span className="text-[#FFE9BE] text-[10px] font-bold tracking-wider font-mono">
                ✨ 2026 OFFICIAL TEST
              </span>
            </div>
          </div>
          
          <p className="text-sm md:text-base leading-relaxed text-[#4A423A] mb-8 text-justify font-normal">
            你是否曾在夜里幻想过那个“对的人”究竟是什么模样？TA 是像你一样喜欢安静，还是能带你探索世界？是你的避风港，还是并肩作战的战友？<br/><br/>
            花 <span className="font-bold text-[#B93A32]">3 分钟</span>完成这份灵魂问卷，解锁月老姻缘簿上早已注定的一对一专属【红娘档案卡】。
          </p>

          <button 
            onClick={() => setShowForm(true)}
            className="w-full bg-[#B93A32] text-white text-lg font-bold py-4 px-6 rounded-sm tracking-[0.25em] hover:bg-[#A32626] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B93A32]/40 transition-all shadow-[0_8px_25px_rgba(185,58,50,0.3)] mb-4"
          >
            翻开姻缘簿
          </button>
          
          <div className="flex items-center justify-center gap-2 text-xs text-[#7A7065] font-sans mb-6">
            <div className="w-2 h-2 bg-[#B93A32] rounded-full animate-pulse"></div>
            已有 <span className="font-mono font-bold text-[#2C2825]">{participantCount > 0 ? participantCount : '...'}</span> 人解密了红娘档案
          </div>

          <div className="flex flex-col items-center gap-3">
              <div className="flex items-center justify-center gap-4 font-medium">
                  <button onClick={() => setShowHistory(true)} className="text-xs text-[#5A524A] hover:text-[#B93A32] focus-visible:underline transition-colors underline underline-offset-4 tracking-widest min-h-[44px] inline-flex items-center justify-center cursor-pointer touch-manipulation active:scale-95 px-3">[ 查看历史档案 ]</button>
                  <button 
                    type="button"
                    onClick={() => router.push('/')} 
                    className="text-xs text-[#5A524A] hover:text-[#B93A32] focus-visible:underline transition-colors underline underline-offset-4 tracking-widest min-h-[44px] inline-flex items-center justify-center cursor-pointer touch-manipulation active:scale-95 px-3"
                  >
                    [ 探索其他测试 ]
                  </button>
              </div>
          </div>
        </div>
      ) : (
        <div className="max-w-md w-full bg-[#FAF8F5] p-8 md:p-10 shadow-[0_24px_60px_rgba(44,40,37,0.08),0_1px_3px_rgba(0,0,0,0.03)] border border-[#D9D0C1]/80 rounded-sm relative z-10 animate-fade-in">
          <h2 className="text-xl font-bold text-center mb-6 tracking-widest border-b border-[#D9D0C1] pb-4">身份录入</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-[#5A524A] mb-2 tracking-wider">您希望我们如何称呼您？</label>
              <input 
                type="text" 
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="请输入昵称/称呼 (至多15字符)" 
                maxLength={15}
                className="w-full px-4 py-3 bg-white border border-[#D9D0C1] focus:outline-none focus:border-[#B93A32] focus:ring-1 focus:ring-[#B93A32] transition-all placeholder-[#A8A096] truncate"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[#5A524A] mb-2 tracking-wider">您当前的情感状态是？</label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStatus('single')}
                  className={`flex-1 min-h-[44px] py-3 border ${status === 'single' ? 'bg-[#F4F1EA] border-[#B93A32] text-[#B93A32] shadow-sm' : 'bg-white border-[#D9D0C1] text-[#7A7268] hover:border-[#B93A32]/40'} active:scale-[0.99] transition-all font-medium touch-manipulation cursor-pointer`}
                >
                  我是单身
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('dating')}
                  className={`flex-1 min-h-[44px] py-3 border ${status === 'dating' ? 'bg-[#F4F1EA] border-[#B93A32] text-[#B93A32] shadow-sm' : 'bg-white border-[#D9D0C1] text-[#7A7268] hover:border-[#B93A32]/40'} active:scale-[0.99] transition-all font-medium touch-manipulation cursor-pointer`}
                >
                  恋爱中
                </button>
              </div>
            </div>

            <div className="pt-4 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-transparent border border-[#5A524A] text-[#5A524A] font-medium py-3 px-6 rounded-sm tracking-widest hover:bg-[#E8E2D5] active:scale-[0.99] transition-all"
                >
                  返回
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-[#B93A32] text-white font-medium py-3 px-6 rounded-sm tracking-widest hover:bg-[#A32626] active:scale-[0.99] transition-all shadow-md"
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
        /* 月影大环缓慢旋转，带来神秘感流动 */
        @keyframes moonRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        /* 红线从左到右流动，象征月老红线牵引 */
        @keyframes redlineFlow {
          0%   { transform: translateX(-100%); opacity: 0; }
          20%  { opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateX(200%); opacity: 0; }
        }
        .animate-fade-in-up { animation: fadeInUp 0.6s ease-out forwards; }
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        /* 月影环动画 — 顺时针慢转 */
        .destiny-moon-ring {
          animation: moonRotate 80s linear infinite;
          transform-origin: center center;
        }
        /* 外圈 — 逆时针慢转 */
        .destiny-moon-ring-2 {
          animation: moonRotate 120s linear infinite reverse;
          transform-origin: center center;
        }
        /* 红线流动 */
        .destiny-redline {
          width: 50%;
          animation: redlineFlow 5s ease-in-out infinite;
        }
      `}} />

    </main>
  );
}
