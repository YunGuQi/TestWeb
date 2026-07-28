'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toPng } from 'html-to-image';

interface ResultReceiptProps {
  result: any;
  userInfo: { nickname: string; status: 'single' | 'dating' };
  onRestart: () => void;
}

export default function ResultReceipt({ result, userInfo, onRestart }: ResultReceiptProps) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [unlockCode, setUnlockCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const ticketRef = useRef<HTMLDivElement>(null);

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

  const handleSave = async () => {
    if (!isUnlocked) {
      setShowModal(true);
      return;
    }
    if (!ticketRef.current) return;
    try {
      const dataUrl = await toPng(ticketRef.current, { cacheBust: true, style: { transform: 'scale(1)' } });
      const link = document.createElement('a');
      link.download = `命定恋人红娘档案_${userInfo.nickname || '我'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to save image', err);
      alert('图片生成失败，请尝试直接截屏保存您的红娘档案');
    }
  };

  return (
    <main className="flex-1 flex flex-col items-center w-full min-h-[100dvh] py-10 px-4 font-serif relative overflow-y-auto overflow-hidden" style={{ backgroundColor: '#EDE6D6' }}>

      {/* === 背景层 1：竖向书卷线条（三页统一） === */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: 'repeating-linear-gradient(90deg, rgba(100,75,55,0.06) 0px, transparent 1px, transparent 36px)',
        backgroundSize: '36px 100%'
      }}/>

      {/* === 背景层 2：朱砂晕染 - 右上角（结果页情绪更浓，稍强） === */}
      <div className="fixed pointer-events-none" style={{
        top: '-100px', right: '-100px',
        width: '500px', height: '500px',
        background: 'radial-gradient(circle, rgba(138,43,43,0.14) 0%, rgba(138,43,43,0.06) 45%, transparent 70%)',
        transform: 'translate3d(0,0,0)',
      }}/>

      {/* === 背景层 3：左下角晕染 === */}
      <div className="fixed pointer-events-none" style={{
        bottom: '-80px', left: '-80px',
        width: '380px', height: '380px',
        background: 'radial-gradient(circle, rgba(138,43,43,0.09) 0%, rgba(138,43,43,0.03) 45%, transparent 70%)',
        transform: 'translate3d(0,0,0)',
      }}/>

      {/* === 背景层 4：点阵底纹（轻于封面，因为内容更多） === */}
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(rgba(138,43,43,0.15) 1px, transparent 1px)', backgroundSize: '24px 24px', opacity: 0.08 }}/>
      

      <div ref={ticketRef} className={`w-full max-w-sm bg-white border-2 border-[#8A2B2B] shadow-[0_32px_80px_rgba(138,43,43,0.18),0_4px_12px_rgba(0,0,0,0.06)] flex flex-col relative rounded-sm transition-all duration-700 ease-out transform ${show ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
          
          {/* Header：古典命盘红联契约区 */}
          <div className="bg-[#8A2B2B] text-white p-7 flex justify-between items-end relative overflow-hidden rounded-t-sm border-b-2 border-[#D99A9A]/30">
              <div className="absolute top-0 right-0 w-44 h-44 bg-white opacity-5 rounded-full -translate-y-1/3 translate-x-1/3 pointer-events-none"></div>
              
              <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-block border border-white/50 px-2 py-0.5 text-[10px] tracking-[0.2em] uppercase font-mono bg-black/10">
                      NO. {result.id?.toString().padStart(3, '0') || '001'}
                    </span>
                    <span className="text-[10px] opacity-75 tracking-widest">· 姻缘簿判词 ·</span>
                  </div>

                  <h1 className="text-3xl font-black tracking-widest mb-1.5 drop-shadow-sm">{result.title}</h1>
                  {result.subtitle && <p className="text-xs opacity-90 tracking-wider font-light">{result.subtitle}</p>}
                  
                  <div className="mt-4 inline-block bg-white/15 px-3 py-1 rounded-sm text-[11px] font-sans tracking-widest backdrop-blur-sm border border-white/40 shadow-inner">
                      你是第 <span className="font-mono font-bold text-white">{participantCount > 0 ? participantCount : '...'}</span> 个解签测算之人
                  </div>
              </div>

              {/* 古典传统契约巨大水印 */}
              <div className="text-6xl opacity-15 font-black tracking-widest relative z-0 select-none pointer-events-none" style={{ writingMode: 'vertical-rl' }}>命定</div>
          </div>

          {/* Content */}
          <div className="p-7 flex-1 flex flex-col">
              <div className="inline-block mx-auto mb-7 px-4 py-1 bg-[#8A2B2B]/5 border-y border-[#8A2B2B]/30 text-[#8A2B2B] text-xs tracking-[0.25em] font-serif text-center">
                「 {userInfo.nickname} · 专属红联档案 」
              </div>
              
              <div className="flex gap-2 flex-wrap justify-center mb-8">
                  {result.tags?.map((tag: string, idx: number) => (
                    <span key={idx} className="text-xs text-[#8A2B2B] border border-[#8A2B2B]/60 bg-[#8A2B2B]/5 px-3 py-1 rounded-full">
                      {tag.replace('#', '')}
                    </span>
                  ))}
              </div>

              {/* 雷达数据展示 */}
              {result.radar && result.radar.length > 0 && (
                <div className="space-y-4 mb-8 px-1">
                    {result.radar.map((item: any, idx: number) => {
                      const pStr = (item.value + ((idx * 17) % 99) * 0.01).toFixed(2);
                      return (
                        <div key={idx} className="flex items-center gap-3 text-sm border-b border-[#F0F0F0] pb-2.5">
                            <span className="text-[#5A524A] tracking-widest w-20 shrink-0 font-serif text-left">{item.label}</span>
                            <div className="flex-1 h-2 bg-[#F5F5F5] overflow-hidden rounded-full relative">
                              <div className="h-full bg-gradient-to-r from-[#8A2B2B] to-[#D99A9A] transition-all duration-700" style={{ width: `${pStr}%` }}></div>
                            </div>
                            <span className="font-bold text-[#2C2825] w-14 text-right font-mono text-xs shrink-0">{pStr}%</span>
                        </div>
                      );
                    })}
                </div>
              )}

              <div className="mt-auto relative">
                  {!isUnlocked && (
                      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm">
                          <button 
                            onClick={() => setShowModal(true)} 
                            className="bg-[#8A2B2B] text-white px-6 py-2.5 rounded-sm text-sm tracking-widest hover:bg-[#A32626] active:scale-[0.99] transition-all shadow-md"
                          >
                              解锁后查看完整解析
                          </button>
                      </div>
                  )}
                  <p className="text-sm leading-loose text-[#444] mb-6 text-justify">
                      {result.description}
                  </p>
                  <div className="bg-[#FAF8F5] p-4 text-[#8A2B2B] text-sm italic border-l-2 border-[#8A2B2B] rounded-r-sm">
                      {result.quote}
                  </div>
              </div>
          </div>
      </div>

      {/* 底部操作栏（紧随卡片下方常规页面流，绝不遮盖、截图时不包含） */}
      <div className={`w-full max-w-sm mt-8 flex flex-col gap-3 transition-all duration-700 delay-500 z-10 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex gap-4">
              <button 
                  onClick={onRestart}
                  className="flex-1 py-3.5 bg-white border border-[#8A2B2B] text-[#8A2B2B] text-sm font-medium tracking-widest hover:bg-[#FAF8F5] active:scale-[0.99] transition-all shadow-md rounded-sm"
              >
                  重新结缘
              </button>
              <button 
                  onClick={handleSave}
                  className="flex-1 py-3.5 bg-[#8A2B2B] text-white text-sm font-medium tracking-widest hover:bg-[#A32626] active:scale-[0.99] transition-all shadow-md rounded-sm"
              >
                  保存档案卡
              </button>
          </div>
          <button 
              type="button"
              onClick={() => router.push('/')}
              className="w-full min-h-[44px] py-3.5 bg-[#2C2825] text-white text-center text-sm font-medium tracking-widest hover:bg-[#1F1B18] active:scale-[0.99] transition-all shadow-md rounded-sm touch-manipulation cursor-pointer flex items-center justify-center"
          >
              探索其他测试
          </button>
      </div>
      
      {/* 快捷返回大厅 */}
      <button 
        type="button"
        onClick={() => router.push('/')} 
        className="absolute top-4 left-4 text-[#888] text-xs hover:text-[#8A2B2B] focus-visible:underline transition-colors z-50 tracking-widest min-h-[44px] px-3 flex items-center cursor-pointer touch-manipulation"
      >
        [ 返回探索大厅 ]
      </button>

      {showModal && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white p-6 rounded-sm w-full max-w-sm shadow-2xl relative animate-fade-in-up border border-[#D9D0C1]">
                  <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-[#888] hover:text-[#333] transition-colors">X</button>
                  <h3 className="text-xl font-bold mb-4 tracking-widest text-[#8A2B2B] text-center border-b border-[#F0F0F0] pb-3">验证激活码</h3>
                  <p className="text-xs text-[#666] mb-6 leading-relaxed text-center">感谢您的认可。本次测算结果请认准小红书官方发布账号获取激活码，解锁全部内容。</p>
                  <input 
                    value={unlockCode} 
                    onChange={(e) => setUnlockCode(e.target.value)} 
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleVerify();
                    }}
                    type="text" 
                    placeholder="请输入收到的激活码 (按回车确认)" 
                    className="w-full border border-[#D0D0D0] p-3 mb-2 outline-none focus:border-[#8A2B2B] focus:ring-1 focus:ring-[#8A2B2B] transition-all text-sm text-center tracking-widest bg-[#FAF8F5]" 
                  />
                  {verifyError && <p className="text-[#8A2B2B] font-medium text-xs mb-4 text-center">{verifyError}</p>}
                  <button 
                    onClick={handleVerify} 
                    disabled={isVerifying} 
                    className="w-full bg-[#8A2B2B] text-white font-medium p-3 tracking-widest hover:bg-[#A32626] active:scale-[0.99] transition-all disabled:opacity-50 mt-2 rounded-sm shadow-sm"
                  >
                     {isVerifying ? '验证中...' : '提交验证'}
                  </button>
              </div>
          </div>
      )}
    </main>
  );
}
