'use client';

import { useState, useRef, useEffect } from 'react';
import { results } from '../lib/data';
import * as htmlToImage from 'html-to-image';

const DanmakuOverlay = ({ danmakuList, isHidden, speedPct, opacityPct }: { danmakuList: string[], isHidden: boolean, speedPct: number, opacityPct: number }) => {
  if (isHidden || !danmakuList || danmakuList.length === 0) return null;

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" style={{ opacity: opacityPct / 100 }}>
      {danmakuList.map((text, i) => {
        const durationBase = 10 + Math.random() * 6;
        const duration = (durationBase * 50) / speedPct; // 50% speed is the baseline 10s-16s
        return (
          <div 
            key={i} 
            className="animate-danmaku whitespace-nowrap text-base font-bold text-black bg-white px-4 py-1 rounded-full shadow-[2px_2px_0px_#000] border-2 border-black inline-block absolute"
            style={{ 
              top: `${15 + (i * 12)}%`,
              animationDuration: `${duration}s`,
              animationDelay: `${Math.random() * 2}s`,
              animationIterationCount: 'infinite'
            }}
          >
            {text}
          </div>
        );
      })}
    </div>
  );
};

interface ResultReceiptProps {
  result: any;
  onRestart: () => void;
  forcedUnlock?: boolean;
}

export default function ResultReceipt({ result, onRestart, forcedUnlock }: ResultReceiptProps) {
  const [isUnlocked, setIsUnlocked] = useState(forcedUnlock || false);
  const [unlockCode, setUnlockCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [danmakuConfig, setDanmakuConfig] = useState({ speed: 50, opacity: 70, content: {} as Record<string, string[]>, pv: 12544 });

  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data) {
          setDanmakuConfig({
            speed: res.data.danmakuSpeed ?? 50,
            opacity: res.data.danmakuOpacity ?? 70,
            content: res.data.danmakuContent || {},
            pv: res.data.pv || 12544
          });
        }
      })
      .catch(e => console.error(e));
  }, []);

  // 结果已由后端全权计算得出

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (localStorage.getItem(`verified_emotional-friction`) === 'true' || (result?.recordId && localStorage.getItem(`verified_${result.recordId}`))) {
        setIsUnlocked(true);
      }
    }
  }, [result?.recordId]);

  const handleVerify = async () => {
    setVerifyError('');
    if (unlockCode.trim().length === 0) {
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
          recordId: 'emotional-friction'
        })
      });
      
      if (!res.ok) {
         const text = await res.text();
         throw new Error(text || res.statusText);
      }

      const data = await res.json();
      
      if (data.success) {
        setIsUnlocked(true);
        setIsVerifying(false);
        document.getElementById('modal-unlock')?.classList.add('hidden');
        if (typeof window !== 'undefined') {
          localStorage.setItem('verified_emotional-friction', 'true');
          if (result?.recordId) {
            localStorage.setItem(`verified_${result.recordId}`, 'true');
          }
        }
      } else {
        setVerifyError(data.error || '激活码无效或已达上限，请重新输入');
        setIsVerifying(false);
      }
    } catch(err: any) {
      console.error(err);
      setVerifyError('网络请求失败或服务器异常: ' + err.message);
      setIsVerifying(false);
    }
  };

  const receiptRef = useRef<HTMLDivElement>(null);
  const handleSave = () => {
    if (!isUnlocked) {
      document.getElementById('modal-unlock')?.classList.remove('hidden');
      return;
    }

    if (!receiptRef.current) return;
    const saveBtn = document.getElementById('save-text');
    if (saveBtn) saveBtn.innerText = '正在生成...';
    
    setIsGeneratingImage(true);

    setTimeout(() => {
      const node = receiptRef.current;
      const width = node.offsetWidth;
      const height = node.offsetHeight;
      htmlToImage.toJpeg(node, { 
        quality: 1, 
        pixelRatio: window.devicePixelRatio ? window.devicePixelRatio * 2 : 2,
        backgroundColor: '#fdfdfd',
        cacheBust: true,
        style: {
          transform: 'scale(1)',
          margin: '0'
        }
      })
        .then((dataUrl) => {
          const link = document.createElement('a');
          link.download = `深度情绪内耗账单_${Date.now()}.jpg`;
          link.href = dataUrl;
          link.click();
          if (saveBtn) saveBtn.innerText = '保存成功！';
          setIsGeneratingImage(false);
          setTimeout(() => {
             if (saveBtn) saveBtn.innerText = '保存账单截图';
          }, 2000);
        })
        .catch((err) => {
          console.error('oops, something went wrong!', err);
          if (saveBtn) saveBtn.innerText = '保存失败，请重试';
          setIsGeneratingImage(false);
        });
    }, 100);
  };

  const currentDanmakuList = danmakuConfig.content[result.key] && danmakuConfig.content[result.key].length > 0 
                               ? danmakuConfig.content[result.key] 
                               : ((result as any).danmaku || []);

  return (
    <main id="view-result" className="flex-1 flex flex-col w-full max-w-md mx-auto relative h-[100dvh] pt-[max(12px,env(safe-area-inset-top))] pb-[max(130px,env(safe-area-inset-bottom))] z-10">
        <DanmakuOverlay 
          danmakuList={currentDanmakuList} 
          isHidden={isGeneratingImage} 
          speedPct={danmakuConfig.speed} 
          opacityPct={danmakuConfig.opacity} 
        />
        <div className="flex-1 overflow-y-auto px-4 hide-scrollbar flex flex-col items-center pb-8 relative z-10">

            <div ref={receiptRef} className="pr-2 pb-2 w-full max-w-[380px] mx-auto flex flex-col items-center relative z-20 mb-4 mt-2">
                <div id="poster-container" className="w-full flex flex-col relative z-20 pt-0 bg-black border-2 border-black shadow-[8px_8px_0px_#000]">
                <div className="receipt-top shrink-0"></div>
                <div className="receipt-paper px-6 py-4 flex-1 flex flex-col relative overflow-hidden">
                    <div className="text-center font-mono mb-4 shrink-0">
                        <h2 className="text-2xl font-black mb-1 tracking-widest text-black">消费结账单</h2>
                        <p className="text-xs uppercase font-bold text-gray-600">--- EMOTIONAL RECEIPT ---</p>
                        <div className="text-xs text-black mt-2 font-bold bg-gray-100 py-1 inline-block px-3 border border-dashed border-gray-400" id="rank-text">
                           你是第 {danmakuConfig.pv} 个结账完成的顾客
                        </div>
                        <p className="text-[10px] text-gray-500 mt-2" id="receipt-date">NO. {danmakuConfig.pv} // {new Date().toLocaleDateString('zh-CN', {year:'numeric', month:'2-digit', day:'2-digit'}).replace(/\//g, '-')}</p>
                    </div>
                    <div className="border-b-4 border-black my-2"></div>
                    
                    <div className="text-center mb-4 mt-2">
                        <div className="text-sm font-bold text-gray-600 mb-1">鉴定结果</div>
                        <div className="text-2xl font-black bg-black text-white py-2 px-4 inline-block transform -rotate-1" id="res-title">
                            {result.title}
                        </div>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2 mb-4" id="res-tags">
                        {result.tags.split(',').map(tag => (
                          <span key={tag} className="text-[10px] bg-black text-white px-2 py-1 font-bold">{tag}</span>
                        ))}
                    </div>
                    <div className="border-b-2 border-dashed border-gray-400 mb-4"></div>
                    
                    <div className="mb-4 font-mono text-xs text-black border-t-2 border-b-2 border-black py-3">
                        <div className="flex justify-between items-end pb-2 border-b-2 border-black font-bold gap-2">
                            <span className="text-xs whitespace-nowrap leading-none">TOTAL FRICTION (总内耗)</span>
                            <span className="text-lg whitespace-nowrap leading-none" id="res-total">¥ {Math.floor(result.totalFriction / 10).toLocaleString()}</span>
                        </div>
                        <button 
                          onClick={() => setIsDetailsExpanded(!isDetailsExpanded)} 
                          id="btn-toggle-details" 
                          className="w-full text-center py-2 text-[10px] text-gray-500 hover:bg-gray-100 transition-colors mt-2 border border-dashed border-gray-300"
                        >
                            {isDetailsExpanded ? '[- 收起消费明细]' : '[+ 展开消费明细]'}
                        </button>
                        {isDetailsExpanded && (
                          <div id="details-container" className="space-y-3 mt-4 pt-2">
                              <div className="text-[10px] text-gray-500 mb-2">ITEM ................................. AMOUNT</div>
                              <div id="details-list" className="flex flex-col gap-3">
                                {(result.billItems || []).map((item: any, i: number) => (
                                  <div key={i} className="flex justify-between items-center"><span className="truncate pr-2">{item.name}</span><span className="shrink-0">¥ {Math.floor(item.cost / 10).toLocaleString()}</span></div>
                                ))}
                                {(!result.billItems || result.billItems.length === 0) && <div className="text-xs text-gray-500 italic">暂无消费明细</div>}
                              </div>
                          </div>
                        )}
                    </div>
                    
                    <div className="mt-3 pt-3 text-center">
                        <div id="barcode-bottom">
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
                        <p className="text-[10px] text-gray-500 font-bold tracking-tighter mt-2" id="beat-text">击败了 {Math.max(1, Math.min(99, Math.floor(result.totalFriction / 300)))}% 的测试者</p>
                    </div>
                    
                    <div className="border-b-4 border-black my-4"></div>
                    
                    <div className="text-center font-mono mb-3 shrink-0">
                        <h2 className="text-xl font-black mb-1 tracking-widest text-black">深度评估报告</h2>
                        <p className="text-xs uppercase font-bold text-gray-600">--- ANALYSIS ---</p>
                    </div>
                    
                    <div className="space-y-2 mb-4 font-bold text-black border-2 border-black p-3 bg-[#f4f4f4] shadow-[4px_4px_0px_#000]">
                        <p className="text-[10px] font-mono text-gray-500 mb-1">DIMENSION SCORES</p>
                        {[
                          { label: '敏感 (Sen)', score: result.sen, id: 'sen' },
                          { label: '反刍 (Rum)', score: result.rum, id: 'rum' },
                          { label: '讨好 (Pls)', score: result.pls, id: 'pls' },
                          { label: '边界 (Bnd)', score: result.bnd, id: 'bnd' }
                        ].map((dim, i) => {
                          let p = result.maxScore > 0 ? (dim.score / result.maxScore) * 100 : 10;
                          if (p < 10) p = 10;
                          if (p > 99) p = 99;
                          const hash = ((dim.score * 13.5 + i * 7.3) % 1) * 0.99;
                          const pStr = (Math.floor(p) + hash).toFixed(2) + '%';
                          return (
                            <div key={dim.id} className="flex flex-col gap-1">
                                <div className="flex justify-between text-[10px] uppercase"><span>{dim.label}</span><span id={`score-${dim.id}`}>{pStr}</span></div>
                                <div className="w-full h-2 border-2 border-black bg-white"><div id={`bar-${dim.id}`} className="h-full bg-gradient-to-r from-gray-900 to-gray-400 transition-all duration-1000" style={{width: pStr}}></div></div>
                            </div>
                          );
                        })}
                    </div>
                    
                    <div className="relative">
                        {!isUnlocked && (
                            <div id="unlock-overlay" className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/40 backdrop-blur-sm">
                                <button 
                                  onClick={() => document.getElementById('modal-unlock')?.classList.remove('hidden')} 
                                  id="btn-show-unlock" 
                                  className="bg-black text-white px-6 py-3 font-bold border-2 border-black shadow-[4px_4px_0px_#fff] hover:translate-y-1 hover:shadow-none transition-all"
                                >
                                    解锁后查看完整内容
                                </button>
                            </div>
                        )}
                        <div id="res-desc" className="text-[13px] text-left leading-relaxed font-bold border-2 border-black p-3 bg-white mb-3 shadow-[4px_4px_0px_#000]">
                            {result.description}
                        </div>
                        <div className="text-left font-mono mb-3">
                            <div className="text-[10px] bg-black text-white px-2 py-0.5 inline-block mb-1">▶ 核心金句 QUOTE</div>
                            <div id="res-quote" className="text-xs leading-relaxed font-bold border-l-2 border-black pl-2 italic">
                                {result.quote}
                            </div>
                        </div>
                        <div className="text-left font-mono mb-4">
                            <div className="text-[10px] bg-black text-white px-2 py-0.5 inline-block mb-1">▶ 破局建议 ADVICE</div>
                            <div className="text-xs leading-relaxed font-bold border-l-2 border-black pl-2">
                                <ul className="list-disc pl-4 space-y-1">
                                    <li>尝试在小事上直接拒绝别人。</li>
                                    <li>设立睡前“断电时间”，禁止复盘当天。</li>
                                    <li>把关注点转移到“我现在舒不舒服”。</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t-2 border-black border-dashed">
                        <div className="text-center text-[10px] text-gray-500 font-mono mb-4">--- ANALYSIS END ---</div>
                        <p className="text-[10px] text-gray-500 font-bold tracking-tighter text-center">*本报告最终解释权归本人的小世界所有</p>
                    </div>
                    
                    <div className="absolute top-64 right-[-10px] rotate-[15deg] text-4xl font-black text-black/10 border-4 border-black/10 p-2 uppercase pointer-events-none">VERIFIED</div>
                </div>
                <div className="receipt-bottom shrink-0"></div>
            </div>
        </div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-[#1c1c1e] border-t-2 border-white/10 flex flex-col gap-3 z-50">
            <button onClick={handleSave} id="btn-save" className="brutalist-btn !py-3 w-full max-w-[340px] mx-auto">
                <span id="save-icon" className="mr-2"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg></span>
                <span id="save-text">保存账单截图</span>
            </button>
            <div className="flex justify-center gap-6 mt-1 mb-2 font-mono font-bold w-full max-w-[340px] mx-auto">
                <button onClick={onRestart} id="btn-restart" className="text-xs text-gray-400 hover:text-white underline underline-offset-4 decoration-gray-700 transition-colors">[ 重新打印 ]</button>
                <a href="/" className="text-xs text-gray-400 hover:text-white underline underline-offset-4 decoration-gray-700 transition-colors">[ 查看更多专柜 ]</a>
            </div>
        </div>
        
        <div id="modal-unlock" className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-sans hidden">
            <div id="modal-unlock-content" className="bg-white border-4 border-black w-full max-w-sm p-6 relative shadow-[8px_8px_0px_#000] scale-95">
                <button onClick={() => document.getElementById('modal-unlock')?.classList.add('hidden')} id="btn-close-unlock" className="absolute top-4 right-4 text-black hover:scale-110 transition-transform font-bold border-2 border-black w-8 h-8 flex items-center justify-center bg-[#f4f4f4]">X</button>
                <h3 className="text-xl font-bold mb-4 tracking-wider text-black">验证激活码</h3>
                <p className="text-sm text-gray-600 mb-6 leading-relaxed">感谢对原创心血的认可。为了维持优质的内容产出与服务器运作，本次测算结果请认准小红书唯一官方发布账号：<strong>安安</strong>。</p>
                <input value={unlockCode} onChange={(e) => setUnlockCode(e.target.value)} id="input-verify" type="text" placeholder="请输入你在小红书收到的激活码" className="w-full border-2 border-black p-3 mb-2 outline-none focus:bg-yellow-50 font-bold bg-white text-black placeholder-gray-400" />
                {verifyError && <p className="text-red-600 font-bold text-xs mb-4">{verifyError}</p>}
                <button onClick={handleVerify} disabled={isVerifying} id="btn-verify" className="w-full bg-black text-white font-bold p-3 border-2 border-black active:translate-y-1 transition-transform disabled:opacity-50">
                   {isVerifying ? '验证中...' : '提交验证'}
                </button>
            </div>
        </div>
    </main>
  );
}
