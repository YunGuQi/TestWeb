'use client';

import { useEffect, useState } from 'react';

interface ResultReceiptProps {
  result: any;
  userInfo: { nickname: string; status: 'single' | 'dating' };
  onRestart: () => void;
}

export default function ResultReceipt({ result, userInfo, onRestart }: ResultReceiptProps) {
  const [show, setShow] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [unlockCode, setUnlockCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  useEffect(() => {
    setParticipantCount(Math.floor(Math.random() * 500) + 120);
    if (typeof window !== 'undefined') {
      if (localStorage.getItem(`verified_destiny-lover`) === 'true') {
        setIsUnlocked(true);
      }
    }
    // 延迟显示以实现玉牌浮现的动效
    const timer = setTimeout(() => setShow(true), 300);
    return () => clearTimeout(timer);
  }, []);

  if (!result) return null;

  const handleVerify = async () => {
    setVerifyError('');
    if (!unlockCode.trim()) {
      setVerifyError('请输入有效的激活码');
      return;
    }
    
    setIsVerifying(true);
    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: unlockCode.trim(),
          deviceId: typeof window !== 'undefined' ? localStorage.getItem('deviceId') || 'unknown' : 'unknown',
          recordId: 'destiny-lover'
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsUnlocked(true);
        setShowModal(false);
        if (typeof window !== 'undefined') {
          localStorage.setItem('verified_destiny-lover', 'true');
        }
      } else {
        setVerifyError(data.error || '激活码无效');
      }
    } catch(e) {
      setVerifyError('网络异常，请重试');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSave = () => {
    if (!isUnlocked) {
      setShowModal(true);
      return;
    }
    alert('请截图保存您的专属红娘档案');
  };

  return (
    <main className="flex-1 flex flex-col justify-center items-center w-full min-h-[100dvh] p-4 bg-[#FAFAFA] font-serif relative overflow-y-auto pb-24">
      {/* 背景国风纹理 */}
      <div className="fixed top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#8A2B2B 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
      
      <div className={`w-full max-w-sm bg-white border border-[#E0E0E0] shadow-[0_20px_50px_rgba(0,0,0,0.05)] flex flex-col relative rounded-t-sm rounded-b-sm transition-all duration-1000 ease-out transform ${show ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
          
          {/* Header */}
          <div className="bg-[#8A2B2B] text-white p-6 flex justify-between items-end relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/3"></div>
              <div className="relative z-10">
                  <div className="text-xs opacity-80 tracking-widest mb-1 font-sans">
                      档案编号：NO. {result.id?.toString().padStart(3, '0') || '001'}
                  </div>
                  <h1 className="text-2xl font-bold tracking-wider mb-1">{result.title}</h1>
                  {result.subtitle && <p className="text-sm opacity-90">{result.subtitle}</p>}
                  
                  <div className="mt-3 inline-block bg-white/20 px-2 py-1 rounded-sm text-[10px] font-sans tracking-widest backdrop-blur-sm border border-white/30">
                      你是第 {participantCount > 0 ? participantCount : '...'} 个解开此姻缘的人
                  </div>
              </div>
              <div className="text-5xl opacity-20 font-bold tracking-widest relative z-10" style={{ writingMode: 'vertical-rl' }}>姻缘</div>
          </div>

          {/* Content */}
          <div className="p-6 flex-1 flex flex-col">
              <h2 className="text-[#555] text-sm tracking-widest mb-6 text-center">「 {userInfo.nickname} 的专属档案 」</h2>
              
              <div className="flex gap-2 flex-wrap justify-center mb-8">
                  {result.tags?.map((tag: string, idx: number) => (
                    <span key={idx} className="text-xs text-[#8A2B2B] border border-[#8A2B2B] px-3 py-1 rounded-full">
                      {tag.replace('#', '')}
                    </span>
                  ))}
              </div>

              {/* 雷达数据展示 */}
              {result.radar && result.radar.length > 0 && (
                <div className="space-y-4 mb-8 px-2">
                    {result.radar.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-sm border-b border-[#F0F0F0] pb-2">
                          <span className="text-[#888] tracking-widest">{item.label}</span>
                          <div className="flex items-center gap-3">
                              <div className="w-24 h-1 bg-[#F5F5F5] overflow-hidden">
                                {(() => {
                                  const pStr = (item.value + ((idx * 17) % 99) * 0.01).toFixed(2);
                                  return (
                                    <div className="h-full bg-gradient-to-r from-[#8A2B2B] to-[#D99A9A]" style={{ width: `${pStr}%` }}></div>
                                  );
                                })()}
                              </div>
                              {(() => {
                                  const pStr = (item.value + ((idx * 17) % 99) * 0.01).toFixed(2);
                                  return (
                                    <span className="font-medium text-[#333] w-12 text-right font-sans">{pStr}%</span>
                                  );
                              })()}
                          </div>
                      </div>
                    ))}
                </div>
              )}

              <div className="mt-auto relative">
                  {!isUnlocked && (
                      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm">
                          <button 
                            onClick={() => setShowModal(true)} 
                            className="bg-[#8A2B2B] text-white px-6 py-2 rounded-sm text-sm tracking-widest hover:bg-[#A32626] transition-colors shadow-md"
                          >
                              解锁后查看完整解析
                          </button>
                      </div>
                  )}
                  <p className="text-sm leading-loose text-[#444] mb-6 text-justify">
                      {result.description}
                  </p>
                  <div className="bg-[#F9F9F9] p-4 text-[#8A2B2B] text-sm italic border-l-2 border-[#8A2B2B]">
                      {result.quote}
                  </div>
              </div>
          </div>
      </div>

      {/* 底部操作栏 */}
      <div className={`fixed bottom-6 left-0 w-full px-4 flex justify-center gap-4 transition-all duration-700 delay-500 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="max-w-sm w-full flex flex-col gap-3">
              <div className="flex gap-4">
                  <button 
                      onClick={onRestart}
                      className="flex-1 py-3 bg-white border border-[#8A2B2B] text-[#8A2B2B] text-sm font-medium tracking-widest hover:bg-[#F9F9F9] transition-colors shadow-lg"
                  >
                      重新结缘
                  </button>
                  <button 
                      onClick={handleSave}
                      className="flex-1 py-3 bg-[#8A2B2B] text-white text-sm font-medium tracking-widest hover:bg-[#A32626] transition-colors shadow-lg"
                  >
                      保存档案卡
                  </button>
              </div>
              <a 
                  href="/"
                  className="w-full py-3 bg-[#2C2825] text-white text-center text-sm font-medium tracking-widest hover:bg-[#1F1B18] transition-colors shadow-lg"
              >
                  探索其他测试
              </a>
          </div>
      </div>
      
      {/* 快捷返回大厅 (桌面端辅助) */}
      <a href="/" className="hidden md:block absolute top-4 left-4 text-[#888] text-xs hover:text-[#8A2B2B] transition-colors z-50 tracking-widest">
        返回探索大厅
      </a>

      {showModal && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white p-6 rounded-sm w-full max-w-sm shadow-2xl relative animate-fade-in-up">
                  <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-[#888] hover:text-[#333] transition-colors">X</button>
                  <h3 className="text-xl font-bold mb-4 tracking-widest text-[#8A2B2B] text-center border-b border-[#F0F0F0] pb-3">验证激活码</h3>
                  <p className="text-xs text-[#666] mb-6 leading-relaxed text-center">感谢您的认可。本次测算结果请认准小红书官方发布账号获取激活码，解锁全部内容。</p>
                  <input 
                    value={unlockCode} 
                    onChange={(e) => setUnlockCode(e.target.value)} 
                    type="text" 
                    placeholder="请输入收到的激活码" 
                    className="w-full border border-[#D0D0D0] p-3 mb-2 outline-none focus:border-[#8A2B2B] text-sm text-center tracking-widest bg-[#FDFDFD]" 
                  />
                  {verifyError && <p className="text-[#8A2B2B] font-medium text-xs mb-4 text-center">{verifyError}</p>}
                  <button 
                    onClick={handleVerify} 
                    disabled={isVerifying} 
                    className="w-full bg-[#8A2B2B] text-white font-medium p-3 tracking-widest hover:bg-[#A32626] transition-colors disabled:opacity-50 mt-2"
                  >
                     {isVerifying ? '验证中...' : '提交验证'}
                  </button>
              </div>
          </div>
      )}
    </main>
  );
}
