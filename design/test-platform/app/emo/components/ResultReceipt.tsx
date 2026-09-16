'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as htmlToImage from 'html-to-image';
import { generateSignature } from '../../../lib/security';
import { generateQrCodeSvg, buildShareUrl, generateShareCopy, copyImageAndTextToClipboard, copyToClipboard, syncCopyText, isMobileDevice, isWeChatEnvironment } from '../utils/share';
import { getEmoTheme } from '../utils/emo-themes';

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

// 本地设备缓存协议定义（支持一码全通与多画像隔离）
interface EmoCacheStorage {
  unlocked: boolean;
  lastVerifiedCode?: string;
  profiles: Record<string, any>;
}

export default function ResultReceipt({ result, onRestart, forcedUnlock }: ResultReceiptProps) {
  const router = useRouter();
  const [isUnlocked, setIsUnlocked] = useState(forcedUnlock || false);
  const [unlockedData, setUnlockedData] = useState<any>(null);
  const [unlockCode, setUnlockCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSilentFetching, setIsSilentFetching] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [danmakuConfig, setDanmakuConfig] = useState({ speed: 50, opacity: 70, content: {} as Record<string, string[]>, pv: 12544 });
  const [qrSvg, setQrSvg] = useState<string>('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  // 情绪画像专属个性化视觉主题
  const theme = getEmoTheme(result?.key);

  // 缓存与凭证内存引用
  const lastCodeRef = useRef<string>('');
  const profilesRef = useRef<Record<string, any>>({});

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

  // 已激活设备自动静默补拉新画像切片
  const silentFetchProfile = async (targetKey: string, codeToUse: string) => {
    if (!targetKey || isSilentFetching) return;
    setIsSilentFetching(true);
    try {
      const payload = JSON.stringify({
        code: (codeToUse || 'CODE-JIE').trim(),
        deviceId: typeof window !== 'undefined' ? localStorage.getItem('deviceId') || 'unknown' : 'unknown',
        testId: 'emotional-friction',
        recordId: result?.recordId || 'emotional-friction',
        resultKey: targetKey
      });
      const timestamp = Date.now();
      const sign = await generateSignature(payload, timestamp);
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-timestamp': timestamp.toString(),
          'x-sign': sign
        },
        body: payload
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const newProfile = data.unlockedData || data.result;
          setUnlockedData(newProfile);
          setIsUnlocked(true);

          if (typeof window !== 'undefined') {
            profilesRef.current[targetKey] = newProfile;
            const updatedStorage: EmoCacheStorage = {
              unlocked: true,
              lastVerifiedCode: codeToUse || lastCodeRef.current || '',
              profiles: profilesRef.current
            };
            localStorage.setItem('verified_emotional-friction', JSON.stringify(updatedStorage));
            if (result?.recordId) {
              localStorage.setItem(`verified_${result.recordId}`, 'true');
            }
          }
        }
      }
    } catch (err) {
      console.error('静默补拉新画像切片失败:', err);
    } finally {
      setIsSilentFetching(false);
    }
  };

  // 设备级激活态检查与多画像独立隔离缓存加载
  useEffect(() => {
    if (typeof window === 'undefined' || !result?.key) return;

    let deviceUnlocked = false;
    let savedCode = '';
    let localProfiles: Record<string, any> = {};

    const cached = localStorage.getItem('verified_emotional-friction');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.unlocked) {
          deviceUnlocked = true;
          savedCode = parsed.lastVerifiedCode || '';
          if (parsed.profiles && typeof parsed.profiles === 'object') {
            localProfiles = { ...parsed.profiles };
          }
          // 平滑迁移旧版扁平缓存结构
          if (parsed.data && parsed.data.key) {
            localProfiles[parsed.data.key] = parsed.data;
          }
        }
      } catch (e) {
        if (cached === 'true') {
          deviceUnlocked = true;
        }
      }
    }

    if (result?.recordId && localStorage.getItem(`verified_${result.recordId}`) === 'true') {
      deviceUnlocked = true;
    }

    if (savedCode) lastCodeRef.current = savedCode;
    profilesRef.current = localProfiles;

    if (deviceUnlocked) {
      setIsUnlocked(true);
      // 精确读取当前画像隔离切片
      if (localProfiles[result.key]) {
        setUnlockedData(localProfiles[result.key]);
      } else {
        // 当前画像无缓存：置空防止旧画像文案残留
        setUnlockedData(null);
        // 发起静默补拉
        silentFetchProfile(result.key, savedCode);
      }
    } else {
      setIsUnlocked(false);
      setUnlockedData(null);
    }
  }, [result?.key, result?.recordId]);

  const handleVerify = async () => {
    setVerifyError('');
    if (unlockCode.trim().length === 0) {
      setVerifyError('请输入有效的激活码');
      return;
    }
    
    setIsVerifying(true);
    try {
      // 生成签名，防止直接请求绕过浏览器验证
      const payload = JSON.stringify({
        code: unlockCode.trim(),
        deviceId: typeof window !== 'undefined' ? localStorage.getItem('deviceId') || 'unknown' : 'unknown',
        testId: 'emotional-friction',
        recordId: result?.recordId || 'emotional-friction',
        resultKey: result?.key
      });
      const timestamp = Date.now();
      const sign = await generateSignature(payload, timestamp);
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-timestamp': timestamp.toString(),
          'x-sign': sign
        },
        body: payload
      });
      
      if (!res.ok) {
         const text = await res.text();
         throw new Error(text || res.statusText);
      }

      const data = await res.json();
      
      if (data.success) {
        setIsUnlocked(true);
        const unlocked = data.unlockedData || data.result;
        setUnlockedData(unlocked);
        setIsVerifying(false);
        document.getElementById('modal-unlock')?.classList.add('hidden');

        const trimmedCode = unlockCode.trim();
        lastCodeRef.current = trimmedCode;
        if (result?.key && unlocked) {
          profilesRef.current[result.key] = unlocked;
        }

        if (typeof window !== 'undefined') {
          // 精准写入当前画像独立槽位
          const storage: EmoCacheStorage = {
            unlocked: true,
            lastVerifiedCode: trimmedCode,
            profiles: profilesRef.current
          };
          localStorage.setItem('verified_emotional-friction', JSON.stringify(storage));
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

  // 严格画像一致性渲染守卫：只有当已解锁且数据key与当前result.key严格一致时才判定有效
  const activeUnlocked = Boolean(
    isUnlocked &&
    unlockedData &&
    (unlockedData.key === result?.key || unlockedData.id === result?.id || unlockedData.title === result?.title)
  );
  const activeData = activeUnlocked ? unlockedData : null;

  // 预生成纯前端矢量 SVG 二维码（零网络请求、零 CORS 污染）
  useEffect(() => {
    if (!result) return;
    const shareUrl = buildShareUrl(result, activeUnlocked);
    if (shareUrl) {
      generateQrCodeSvg(shareUrl).then((svg) => {
        if (svg) setQrSvg(svg);
      });
    }
  }, [result?.key, result?.title, result?.totalFriction, activeUnlocked]);

  const receiptRef = useRef<HTMLDivElement>(null);
  const handleSave = () => {
    if (!activeUnlocked) {
      document.getElementById('modal-unlock')?.classList.remove('hidden');
      return;
    }

    if (!receiptRef.current) return;

    // 【手机端权限核心】：在用户点击手势有效的第一毫秒同步将文案写入剪贴板！
    // 杜绝因 setTimeout 或异步截屏耗时导致移动端操作系统判定手势过期而清空剪贴板
    const shareUrl = buildShareUrl(result, activeUnlocked);
    const shareCopy = generateShareCopy(result, shareUrl);
    syncCopyText(shareCopy);

    const saveBtn = document.getElementById('save-text');
    if (saveBtn) saveBtn.innerText = '正在生成并打包...';
    
    // 激活截屏模式，无痕注入纯前端二维码
    setIsGeneratingImage(true);

    setTimeout(() => {
      const node = receiptRef.current;
      if (!node) {
        setIsGeneratingImage(false);
        return;
      }
      htmlToImage.toPng(node, { 
        quality: 1, 
        pixelRatio: 3,
        backgroundColor: theme.paperHex,
        cacheBust: true,
        style: {
          transform: 'scale(1)',
          margin: '0'
        }
      })
        .then(async (dataUrl) => {
          const isMobile = isMobileDevice() || isWeChatEnvironment();

          if (isMobile) {
            // 移动端/微信端：呼出长图保存浮层，指引长按保存或发送给朋友，文案在第一拍已稳健写入剪贴板
            setPreviewImage(dataUrl);
            setToastMessage('长图已就绪！文案已复制');
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
            
            // 普通手机浏览器顺带尝试触发系统文件下载
            try {
              const link = document.createElement('a');
              link.download = `深度情绪内耗明细小票_${Date.now()}.png`;
              link.href = dataUrl;
              link.click();
            } catch (e) {}
          } else {
            // PC 电脑端：触发高清小票文件下载，并写入富文本图文剪贴板
            const link = document.createElement('a');
            link.download = `深度情绪内耗明细小票_${Date.now()}.png`;
            link.href = dataUrl;
            link.click();

            await copyImageAndTextToClipboard(dataUrl, shareCopy);

            setToastMessage('账单已保存！分享文案已复制');
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3500);
          }

          if (saveBtn) saveBtn.innerText = isMobile ? '已生成长图！文案已复制' : '账单已保存！文案已复制';
          setIsGeneratingImage(false);
          setTimeout(() => {
             if (saveBtn) saveBtn.innerText = '分享我的情绪账单';
          }, 3000);
        })
        .catch((err) => {
          console.error('保存账单图片生成失败:', err);
          if (saveBtn) saveBtn.innerText = '保存失败，请重试';
          setIsGeneratingImage(false);
        });
    }, 180);
  };

  const currentDanmakuList = danmakuConfig.content[result.key] && danmakuConfig.content[result.key].length > 0 
                               ? danmakuConfig.content[result.key] 
                               : ((result as any).danmaku || []);

  return (
    <main id="view-result" className="flex-1 flex flex-col w-full max-w-md mx-auto relative h-[100dvh] pt-[max(12px,env(safe-area-inset-top))] z-10">
        <DanmakuOverlay 
          danmakuList={currentDanmakuList} 
          isHidden={isGeneratingImage} 
          speedPct={danmakuConfig.speed} 
          opacityPct={danmakuConfig.opacity} 
        />
        <div className="flex-1 overflow-y-auto px-2.5 sm:px-4 hide-scrollbar flex flex-col items-center pb-32 relative z-10">

            <div ref={receiptRef} className="pr-1 pb-1 sm:pr-1.5 sm:pb-1.5 w-full max-w-[310px] xs:max-w-[325px] sm:max-w-[335px] mx-auto flex flex-col items-center relative z-20 mb-4 mt-1 sm:mt-2">
                <div id="poster-container" className={`w-full flex flex-col relative z-20 pt-0 ${theme.outerContainer}`}>
                <div className="receipt-top shrink-0"></div>
                <div className={`receipt-paper px-3 py-3.5 sm:px-4 sm:py-4 flex-1 flex flex-col relative overflow-hidden ${theme.paperBg}`}>
                    {/* 画像专属防伪出纳印戳 */}
                    <div className={`absolute top-3 right-2.5 transform ${theme.stamp.rotate || 'rotate-12'} border-2 ${theme.stamp.border} px-2 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider pointer-events-none opacity-90 shadow-sm flex flex-col items-center leading-none z-30`}>
                        <span>{theme.stamp.title}</span>
                        <span className="text-[10px] my-0.5 border-t border-b border-current w-full text-center py-0.5 font-sans font-bold">{theme.stamp.sub}</span>
                        <span className="text-[7.5px]">{theme.stamp.taxCode}</span>
                    </div>

                    <div className="text-center font-mono mb-3 shrink-0">
                        <div className="text-[9px] text-gray-400 uppercase tracking-widest mb-0.5">=== THERMAL CHECKOUT ===</div>
                        <h2 className={`text-lg sm:text-xl font-black mb-0.5 tracking-widest ${theme.textMain}`}>情绪消费结账单</h2>
                        <p className={`text-[10px] uppercase font-bold ${theme.textSecondary}`}>--- EMOTIONAL RECEIPT ---</p>
                        <div className={`text-[11px] mt-1.5 font-bold py-0.5 inline-block px-2.5 ${theme.headerNotice}`} id="rank-text">
                           你是第 {danmakuConfig.pv} 个结账完成的顾客
                        </div>
                        <p className={`text-[9px] mt-1 ${theme.textSecondary}`} id="receipt-date">NO. {danmakuConfig.pv} // {new Date().toLocaleDateString('zh-CN', {year:'numeric', month:'2-digit', day:'2-digit'}).replace(/\//g, '-')}</p>
                    </div>
                    <div className={`${theme.divider} my-2`}></div>
                    
                    <div className="text-center mb-3 mt-1">
                        <div className={`text-xs font-bold mb-1 ${theme.textSecondary}`}>鉴定结果</div>
                        <div className={`text-lg sm:text-xl font-black py-1.5 px-3.5 inline-block transform -rotate-1 tracking-wide ${theme.titleBadge} whitespace-nowrap`} id="res-title">
                            {result.title}
                        </div>
                    </div>
                    <div className="flex flex-wrap justify-center gap-1.5 mb-3" id="res-tags">
                        {result.tags.split(',').map(tag => (
                          <span key={tag} className={`text-[9px] px-2 py-0.5 font-bold ${theme.tagBadge} whitespace-nowrap`}>{tag}</span>
                        ))}
                    </div>
                    <div className={`${theme.dashedDivider} mb-2.5`}></div>
                    
                    {/* 专属高光勋章：核心正向天赋击败社交货币 */}
                    <div className={`mb-2.5 font-mono p-2 ${theme.medalCard}`}>
                        <div className={`py-1 px-2.5 text-[9.5px] sm:text-[10px] font-mono tracking-tight text-center font-bold shadow-sm whitespace-nowrap overflow-hidden text-ellipsis ${theme.medalBadge}`}>
                            ★ {result.overallText || `击败 ${result.overallRank ?? Math.max(1, Math.min(99, Math.floor((result.totalFriction || 0) / 300)))}% 脆皮人类`}
                        </div>
                    </div>
                    
                    <div className={`${theme.divider} my-2.5`}></div>
                    
                    <div className="text-center font-mono mb-2.5 shrink-0">
                        <h2 className={`text-sm sm:text-base font-black mb-0.5 tracking-wider ${theme.textMain}`}>深度评估报告</h2>
                        <p className={`text-[9px] uppercase font-bold ${theme.textSecondary}`}>--- ANALYSIS ---</p>
                    </div>
                    
                    <div className={`space-y-2 mb-3.5 font-mono p-2 sm:p-2.5 ${theme.quoteBox}`}>
                        <div className="flex justify-between items-center mb-0.5 gap-1.5">
                            <p className={`text-[9px] font-mono font-bold ${theme.textSecondary} whitespace-nowrap shrink-0`}>常模击败排位 (NORM.RANK)</p>
                            <span className={`text-[8px] font-mono ${theme.textSecondary} whitespace-nowrap shrink-0`}>PERCENTILES</span>
                        </div>
                        {[
                          { label: '情绪敏感 (Sen)', pct: result.rankSen ?? result.senPct ?? ((result.sen || 0) / 57) * 100, id: 'sen' },
                          { label: '精神反刍 (Rum)', pct: result.rankRum ?? result.rumPct ?? ((result.rum || 0) / 77) * 100, id: 'rum' },
                          { label: '讨好倾向 (Pls)', pct: result.rankPls ?? result.plsPct ?? ((result.pls || 0) / 44) * 100, id: 'pls' },
                          { label: '边界防卫 (Bnd)', pct: result.rankBnd ?? result.bndPct ?? ((result.bnd || 0) / 80) * 100, id: 'bnd' },
                          { label: '回避隔离 (Avd)', pct: result.rankAvd ?? Math.min(99, Math.max(5, (result.rankBnd || 50) * 0.9 + 5)), id: 'avd' },
                          { label: '自我苛责 (Blm)', pct: result.rankBlm ?? Math.min(99, Math.max(5, (result.rankRum || 50) * 0.85 + (result.rankPls || 50) * 0.15)), id: 'blm' }
                        ].map((dim) => {
                          const numVal = typeof dim.pct === 'number' ? dim.pct : parseFloat(dim.pct) || 10;
                          const displayPct = numVal.toFixed(1);
                          const pStr = displayPct + '%';
                          return (
                            <div key={dim.id} className="flex flex-col gap-0.5">
                                <div className="flex justify-between items-center text-[9px] sm:text-[9.5px] uppercase font-mono leading-none">
                                    <span className={`shrink-0 font-bold ${theme.textMain}`}>{dim.label}</span>
                                    <span id={`score-${dim.id}`} className={`font-bold ${theme.textMain} shrink-0 tracking-tight`}>超越 {displayPct}% 脆皮人类</span>
                                </div>
                                <div className={theme.barTrack}>
                                    <div id={`bar-${dim.id}`} className={`h-full ${theme.barGradient} transition-all duration-1000`} style={{width: pStr}}></div>
                                </div>
                            </div>
                          );
                        })}
                    </div>
                    
                    {/* 1. 深度心理侧写（黄金诱饵前段展示，引出卡喉钩子） */}
                    <div className="text-left mb-3">
                        <div className={`text-[9px] px-1.5 py-0.5 font-mono inline-block mb-1 font-bold ${theme.quoteBadge}`}>
                            ▶ 深度心理侧写 PROFILING
                        </div>
                        <div id="res-desc" className={`text-xs leading-relaxed font-bold p-2.5 ${theme.quoteBox}`}>
                            {activeUnlocked ? (
                                (activeData?.description || result.description)
                            ) : (
                                <div>
                                    <span>
                                        {(() => {
                                          const desc = result.description || '';
                                          const sentences = desc.split(/([。！？\n])/);
                                          let excerpt = '';
                                          for (let i = 0; i < sentences.length; i += 2) {
                                            const s = sentences[i] + (sentences[i + 1] || '');
                                            if ((excerpt + s).length <= 55 || !excerpt) {
                                              excerpt += s;
                                            } else {
                                              break;
                                            }
                                          }
                                          return excerpt || desc.slice(0, 48);
                                        })()}
                                    </span>
                                    <span className="text-gray-400 select-none">……</span>
                                    <div 
                                      onClick={() => {
                                        if (isUnlocked) {
                                          silentFetchProfile(result.key, lastCodeRef.current);
                                        } else {
                                          document.getElementById('modal-unlock')?.classList.remove('hidden');
                                        }
                                      }}
                                      className="mt-2 text-[10px] bg-amber-50 text-amber-900 border border-dashed border-amber-600 px-2 py-1 font-bold flex items-center justify-between cursor-pointer hover:bg-amber-100 transition-colors"
                                    >
                                        <span className="flex items-center gap-1">
                                            <span>{isUnlocked ? '🔄' : '🔒'}</span>
                                            <span>{isUnlocked ? (isSilentFetching ? '[ 正在同步当前画像专属全景解码... ]' : '[ 点击同步当前画像专属全景解码 ]') : '[ 核心心智软肋与防御机制已封存 ]'}</span>
                                        </span>
                                        <span className="text-[9px] text-amber-700 underline shrink-0 font-mono">{isUnlocked ? '同步解码 ▶' : '解锁查看 ▶'}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 后 70% 深度硬核干货区域：心智金句、破防场景、人际能量、年化账单、退税处方（服务端真遮罩） */}
                    <div className="relative mt-2">
                        {!activeUnlocked && (
                            <div id="unlock-overlay" className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/80 backdrop-blur-md p-4 rounded text-center">
                                {isUnlocked ? (
                                    <div className="bg-black text-white p-3.5 mb-3 border-2 border-black shadow-[4px_4px_0px_#000] max-w-[280px] flex flex-col items-center">
                                        <div className="w-5 h-5 border-2 border-yellow-300 border-t-transparent rounded-full animate-spin mb-2"></div>
                                        <p className="text-[10px] font-mono font-bold tracking-widest uppercase text-yellow-300">一码全通 · 设备权益已生效</p>
                                        <p className="text-xs font-bold mt-1 leading-snug">正在为您同步「{result.title}」专属深度全景报告...</p>
                                        <button 
                                          onClick={() => silentFetchProfile(result.key, lastCodeRef.current)} 
                                          className="mt-2.5 text-[9px] text-gray-300 underline hover:text-white font-mono cursor-pointer"
                                        >
                                          未自动加载？点击手动同步
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="bg-black text-white p-3 mb-3 border-2 border-black shadow-[4px_4px_0px_#000] max-w-[280px]">
                                            <p className="text-[10px] font-mono font-bold tracking-widest uppercase text-yellow-300">⚠ 高危预警 · 核心处方封存</p>
                                            <p className="text-xs font-bold mt-1 leading-snug">检测到您的核心指标突破安全阈值，心智金句 · 破防场景 · 专属退税处方已加密封存</p>
                                        </div>
                                        <button 
                                          onClick={() => document.getElementById('modal-unlock')?.classList.remove('hidden')} 
                                          id="btn-show-unlock" 
                                          className="bg-black text-white px-5 py-2.5 font-black text-xs border-2 border-black shadow-[4px_4px_0px_#222] hover:translate-y-0.5 hover:shadow-none transition-all active:scale-95 cursor-pointer"
                                        >
                                            🔓 输入卡密立即解锁全景报告
                                        </button>
                                        <p className="text-[10px] text-gray-500 font-bold mt-2">小红书官方认证 · 一人一案专属定制</p>
                                    </>
                                )}
                            </div>
                        )}

                        {!activeUnlocked ? (
                            /* 未解锁状态：渲染高质感骨架屏，物理上完全不挂载任何真实文本内容，彻底封死 F12 删遮罩白嫖与旧画像污染 */
                            <div className="space-y-3 pointer-events-none select-none filter blur-[1.5px] opacity-70">
                                {/* 骨架 0: 核心心智金句 */}
                                <div className="text-left font-mono">
                                    <div className="text-[9px] bg-black text-white px-1.5 py-0.5 inline-block mb-1 font-bold">
                                        ▶ 核心心智金句 QUOTE
                                    </div>
                                    <div className="border-l-4 border-black pl-3 py-2 bg-gray-50 border-r border-t border-b border-gray-200">
                                        <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                                    </div>
                                </div>

                                {/* 骨架 1: 破防场景 */}
                                <div className="text-left font-mono">
                                    <div className="text-[9px] bg-black text-white px-1.5 py-0.5 inline-block mb-1 font-bold">
                                        ▶ 高频破防场景 TOP 3 SCENARIOS
                                    </div>
                                    <div className="space-y-2 border-2 border-black p-2.5 bg-[#faf9f6]">
                                        <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
                                        <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                                        <div className="h-4 bg-gray-200 rounded w-4/5 animate-pulse"></div>
                                    </div>
                                </div>
                                {/* 骨架 2: 能量吸血鬼 */}
                                <div className="text-left font-mono">
                                    <div className="text-[9px] bg-red-600 text-white px-1.5 py-0.5 inline-block mb-1 font-bold">
                                        ▶ 警惕你的能量吸血鬼 VAMPIRES
                                    </div>
                                    <div className="border-2 border-red-600 bg-red-50/60 p-2.5 space-y-1.5">
                                        <div className="h-4 bg-red-200/70 rounded w-11/12 animate-pulse"></div>
                                        <div className="h-4 bg-red-200/70 rounded w-3/4 animate-pulse"></div>
                                    </div>
                                </div>
                                {/* 骨架 3: 天生能量充电桩 */}
                                <div className="text-left font-mono">
                                    <div className="text-[9px] bg-emerald-700 text-white px-1.5 py-0.5 inline-block mb-1 font-bold">
                                        ▶ 天生能量充电桩 BEST MATCH
                                    </div>
                                    <div className="border-2 border-emerald-700 bg-emerald-50/60 p-2.5 space-y-1.5">
                                        <div className="h-4 bg-emerald-200/70 rounded w-full animate-pulse"></div>
                                        <div className="h-4 bg-emerald-200/70 rounded w-4/5 animate-pulse"></div>
                                    </div>
                                </div>
                                {/* 骨架 4: 年化账单 */}
                                <div className="text-left font-mono">
                                    <div className="text-[9px] bg-black text-white px-1.5 py-0.5 inline-block mb-1 font-bold">
                                        ▶ 隐性损耗年化账单 ANNUAL COSTS
                                    </div>
                                    <div className="border-2 border-black p-2.5 bg-white space-y-2">
                                        <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
                                        <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                                    </div>
                                </div>
                                {/* 骨架 5: 退税处方 */}
                                <div className="text-left font-mono">
                                    <div className="text-[9px] bg-emerald-700 text-white px-1.5 py-0.5 inline-block mb-1 font-bold">
                                        ▶ 专属情绪退税处方 PRESCRIPTION
                                    </div>
                                    <div className="border-2 border-emerald-700 bg-emerald-50/60 p-2.5 space-y-2">
                                        <div className="h-4 bg-emerald-200/70 rounded w-full animate-pulse"></div>
                                        <div className="h-4 bg-emerald-200/70 rounded w-5/6 animate-pulse"></div>
                                        <div className="h-4 bg-emerald-200/70 rounded w-4/5 animate-pulse"></div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* 已解锁状态：平滑挂载由严格守卫匹配的真实付费深度切片 */
                            <div className="transition-all duration-700 ease-in-out">
                                {/* 0. 核心心智金句 QUOTE */}
                                {(activeData?.quote || (activeUnlocked && result.quote)) && (
                                    <div className="text-left font-mono mb-3">
                                        <div className={`text-[9px] px-1.5 py-0.5 inline-block mb-1 font-bold ${theme.quoteBadge}`}>
                                            ▶ 核心心智金句 QUOTE
                                        </div>
                                        <div id="res-quote" className={`text-xs leading-relaxed font-bold border-l-4 pl-3 py-2 italic ${theme.quoteBox}`}>
                                            “{activeData?.quote || result.quote}”
                                        </div>
                                    </div>
                                )}

                                {/* 2. 高频破防场景 TOP 3 */}
                                {((activeData?.scenarios || (activeUnlocked && result.scenarios)) && (activeData?.scenarios || result.scenarios).length > 0) && (
                                    <div className="text-left font-mono mb-3">
                                        <div className={`text-[9px] px-1.5 py-0.5 inline-block mb-1 font-bold ${theme.quoteBadge}`}>
                                            ▶ 高频破防场景 TOP 3 SCENARIOS
                                        </div>
                                        <div className={`space-y-1.5 p-2.5 ${theme.quoteBox}`}>
                                            {(activeData?.scenarios || result.scenarios).map((scene: string, idx: number) => (
                                                <div key={idx} className={`flex items-start gap-1.5 text-xs font-bold leading-relaxed ${theme.textMain} border-b border-dashed border-gray-300 pb-1.5 last:border-none last:pb-0`}>
                                                    <span className={`shrink-0 text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-mono mt-0.5 ${theme.titleBadge}`}>{idx + 1}</span>
                                                    <span>{scene}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* 3. 能量吸血鬼克星 与 天生能量充电桩 */}
                                {(activeData?.vampires || (activeUnlocked && result.vampires)) && (
                                    <div className="text-left font-mono mb-2.5">
                                        <div className="text-[9px] bg-red-600 text-white px-1.5 py-0.5 inline-block mb-1 font-bold">
                                            ▶ 警惕你的能量吸血鬼 VAMPIRES
                                        </div>
                                        <div className="text-xs font-bold leading-relaxed border-2 border-red-600 bg-red-50/60 p-2.5 text-red-950 shadow-[2.5px_2.5px_0px_#dc2626]">
                                            {activeData?.vampires || result.vampires}
                                        </div>
                                    </div>
                                )}

                                {(activeData?.bestMatch || (activeUnlocked && (result.bestMatch || (result as any).soulmate))) && (
                                    <div className="text-left font-mono mb-3">
                                        <div className="text-[9px] bg-emerald-700 text-white px-1.5 py-0.5 inline-block mb-1 font-bold">
                                            ▶ 天生能量充电桩 BEST MATCH
                                        </div>
                                        <div className="text-xs font-bold leading-relaxed border-2 border-emerald-700 bg-emerald-50/60 p-2.5 text-emerald-950 shadow-[2.5px_2.5px_0px_#047857]">
                                            {activeData?.bestMatch || result.bestMatch || (result as any).soulmate}
                                        </div>
                                    </div>
                                )}

                                {/* 4. 隐性内耗年化账单 */}
                                {((activeData?.hiddenCosts || (activeUnlocked && result.hiddenCosts)) && (activeData?.hiddenCosts || result.hiddenCosts).length > 0) && (
                                    <div className="text-left font-mono mb-3">
                                        <div className={`text-[9px] px-1.5 py-0.5 inline-block mb-1 font-bold ${theme.quoteBadge}`}>
                                            ▶ 隐性损耗年化账单 ANNUAL COSTS
                                        </div>
                                        <div className={`p-2.5 space-y-1.5 ${theme.quoteBox}`}>
                                            {(activeData?.hiddenCosts || result.hiddenCosts).map((cost: string, idx: number) => (
                                                <div key={idx} className={`flex items-start gap-1.5 text-xs font-bold ${theme.textMain}`}>
                                                    <span className="text-red-500 font-mono shrink-0">[-]</span>
                                                    <span>{cost}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* 5. 专属情绪退税处方 */}
                                {((activeData?.adviceList || (activeUnlocked && result.adviceList)) && (activeData?.adviceList || result.adviceList).length > 0) && (
                                    <div className="text-left font-mono mb-3">
                                        <div className="text-[9px] bg-emerald-700 text-white px-1.5 py-0.5 inline-block mb-1 font-bold">
                                            ▶ 专属情绪退税处方 PRESCRIPTION
                                        </div>
                                        <div className="text-xs leading-relaxed font-bold border-2 border-emerald-700 bg-emerald-50/60 p-2.5 shadow-[2.5px_2.5px_0px_#047857]">
                                            <ul className="space-y-1.5">
                                                {(activeData?.adviceList || result.adviceList).map((adv: string, idx: number) => (
                                                    <li key={idx} className="flex items-start gap-1.5 text-emerald-950">
                                                        <span className="text-emerald-600 shrink-0 font-bold">✔</span>
                                                        <span>{adv}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    
                    <div className={`mt-4 pt-4 ${theme.dashedDivider}`}>
                        <div className={`text-center text-[10px] font-mono mb-2 ${theme.textSecondary}`}>--- ANALYSIS END ---</div>
                        <p className={`text-[10px] font-bold tracking-tighter text-center ${theme.textSecondary}`}>*本报告最终解释权归本人的小世界所有</p>
                    </div>

                    {/* 截屏瞬间动态挂载纯前端矢量二维码：常态网页完全隐藏，绝不破坏小票极简美感 */}
                    {isGeneratingImage && (
                        <div id="receipt-qrcode-container" className={`mt-4 pt-3 ${theme.dashedDivider} flex flex-col items-center justify-center text-center animate-fadeIn`}>
                            <div className={`p-1.5 inline-block mb-1.5 ${theme.quoteBox}`}>
                                {qrSvg ? (
                                    <div 
                                      className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                                      dangerouslySetInnerHTML={{ __html: qrSvg }}
                                    />
                                ) : (
                                    <div className={`w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center text-[10px] font-mono ${theme.titleBadge}`}>
                                      安安心灵便利店
                                    </div>
                                )}
                            </div>
                            <div className="font-mono">
                                <div className={`text-[10px] font-black tracking-wider uppercase ${theme.textMain}`}>
                                    [ 扫码开始测试 · 测测你的内耗账单 ]
                                </div>
                                <p className={`text-[8.5px] font-bold mt-0.5 tracking-tight ${theme.textSecondary}`}>
                                    长按扫码立即测算 · 查收你的专属情绪消费结账单
                                </p>
                            </div>
                        </div>
                    )}
                    
                    <div className={`absolute top-64 right-[-10px] rotate-[15deg] text-4xl font-black opacity-15 border-4 p-2 uppercase pointer-events-none ${theme.stamp.border}`}>VERIFIED</div>
                </div>
                <div className="receipt-bottom shrink-0"></div>
            </div>
        </div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#f4f4f4] via-[#f4f4f4]/95 to-transparent pt-10 flex flex-col gap-3 z-50 pointer-events-auto">
            <button onClick={handleSave} id="btn-save" className="brutalist-btn !py-3 w-full max-w-[340px] mx-auto bg-black text-white border-2 border-black font-black hover:bg-gray-800 transition-all shadow-[4px_4px_0px_#000] active:translate-y-1 active:shadow-none flex items-center justify-center cursor-pointer">
                <span id="save-icon" className="mr-2"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg></span>
                <span id="save-text">分享我的情绪账单</span>
            </button>
            <div className="flex justify-center items-center gap-6 mt-1 mb-2 font-mono font-bold w-full max-w-[340px] mx-auto text-center">
                <button onClick={onRestart} id="btn-restart" className="text-xs text-gray-500 hover:text-black underline underline-offset-4 decoration-gray-400 transition-colors min-h-[44px] inline-flex items-center justify-center cursor-pointer touch-manipulation active:scale-95 px-3">[ 重新打印 ]</button>
                <button 
                  type="button"
                  onClick={() => window.location.href = '/'} 
                  id="btn-more" 
                  className="text-xs text-gray-500 hover:text-black underline underline-offset-4 decoration-gray-400 transition-colors min-h-[44px] inline-flex items-center justify-center cursor-pointer touch-manipulation active:scale-95 px-3"
                >
                  [ 返回测试大厅 ]
                </button>
            </div>
        </div>
        
        <div id="modal-unlock" className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-sans hidden">
            <div id="modal-unlock-content" className="bg-white border-4 border-black w-full max-w-sm p-6 relative shadow-[8px_8px_0px_#000] scale-95">
                <button onClick={() => document.getElementById('modal-unlock')?.classList.add('hidden')} id="btn-close-unlock" className="absolute top-4 right-4 text-black hover:scale-110 transition-transform font-bold border-2 border-black w-10 h-10 min-h-[44px] flex items-center justify-center bg-[#f4f4f4] touch-manipulation">X</button>
                <h3 className="text-xl font-bold mb-4 tracking-wider text-black">验证激活码</h3>
                <p className="text-sm text-gray-600 mb-6 leading-relaxed">感谢对原创心血的认可。为了维持优质的内容产出与服务器运作，本次测算结果请认准小红书唯一官方发布账号：<strong>安安</strong>。</p>
                <input value={unlockCode} onChange={(e) => setUnlockCode(e.target.value)} maxLength={20} id="input-verify" type="text" placeholder="请输入你在小红书收到的激活码 (至多20字)" className="w-full border-2 border-black p-3 mb-2 outline-none focus:bg-yellow-50 font-bold bg-white text-black placeholder-gray-400 truncate" />
                {verifyError && (
                  <div className="flex flex-col gap-2 mb-4 mt-2">
                    <p className="text-red-600 font-bold text-xs text-center">{verifyError}</p>
                    <button 
                      onClick={() => window.open('https://xhslink.com/m/Atwtf3Cy6FR', '_blank')} 
                      className="w-full bg-white text-black font-bold p-2 text-xs border-2 border-black hover:bg-black hover:text-white transition-all"
                    >
                       前往安安店铺
                    </button>
                  </div>
                )}
                <button onClick={handleVerify} disabled={isVerifying} id="btn-verify" className="w-full min-h-[44px] bg-black text-white font-bold p-3 border-2 border-black active:translate-y-1 transition-transform disabled:opacity-50 touch-manipulation cursor-pointer flex items-center justify-center">
                   {isVerifying ? '验证中...' : '提交验证'}
                </button>
            </div>
        </div>
        {/* 双重正向反馈 Toast 提示框 */}
        {showToast && (
            <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[170] flex items-center gap-2 bg-black text-white px-5 py-3 border-2 border-black shadow-[4px_4px_0px_#222] text-xs sm:text-sm font-black tracking-wide animate-bounce">
                <span className="text-yellow-300 font-mono text-base font-black">✔</span>
                <span>{toastMessage}</span>
            </div>
        )}

        {/* 移动端/微信端专属：长图保存与图文交付弹窗 */}
        {previewImage && (
          <div className="fixed inset-0 z-[160] bg-black/85 backdrop-blur-md flex flex-col items-center justify-between p-3 sm:p-4 font-sans animate-fadeIn">
            {/* 顶部标题与关闭按钮 */}
            <div className="w-full max-w-sm flex items-center justify-between py-2 border-b border-white/20 shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-yellow-400 rounded-full animate-ping"></span>
                <span className="text-white font-black text-xs sm:text-sm tracking-wide">账单长图已就绪</span>
              </div>
              <button 
                onClick={() => setPreviewImage(null)} 
                className="text-white hover:text-yellow-300 font-mono font-black text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 border border-white/30 rounded cursor-pointer touch-manipulation active:scale-95 transition-all"
              >
                ✕ 关闭
              </button>
            </div>

            {/* 中间图片核心交互区：长图展示，支持长按保存到相册或发送给微信朋友 */}
            <div className="flex-1 w-full max-w-sm overflow-y-auto my-2.5 flex flex-col items-center hide-scrollbar rounded shadow-[0_8px_30px_rgb(0,0,0,0.5)]">
              {/* 强视觉长按指引条 */}
              <div className="bg-yellow-300 text-black text-[11px] sm:text-xs font-black py-2 px-3 w-full text-center border-2 border-black sticky top-0 z-10 shadow-sm flex items-center justify-center gap-1.5">
                <span>👇</span>
                <span>请「长按下方图片」保存到相册或发给朋友</span>
              </div>
              <div className="p-1 bg-white border-2 border-t-0 border-black w-full flex justify-center">
                <img 
                  src={previewImage} 
                  alt="深度情绪内耗测试账单长图" 
                  className="w-full max-w-[320px] h-auto object-contain block select-none pointer-events-auto shadow-md"
                  style={{ touchAction: 'auto', WebkitTouchCallout: 'default' }}
                />
              </div>
            </div>

            {/* 底部贴心指引卡片 */}
            <div className="w-full max-w-sm bg-white border-2 border-black p-3 shadow-[4px_4px_0px_#000] flex flex-col gap-2 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-black text-black">
                  <span className="text-emerald-600 text-sm font-black">✔</span>
                  <span>分享文案已成功复制</span>
                </div>
                <button 
                  onClick={() => {
                    const shareUrl = buildShareUrl(result, activeUnlocked);
                    const shareCopy = generateShareCopy(result, shareUrl);
                    syncCopyText(shareCopy);
                    setToastMessage('文案已重新复制！');
                    setShowToast(true);
                    setTimeout(() => setShowToast(false), 2000);
                  }}
                  className="text-[10px] text-gray-500 underline font-mono hover:text-black cursor-pointer"
                >
                  [ 重新复制文案 ]
                </button>
              </div>
              <p className="text-[10px] text-gray-600 font-bold leading-tight">
                💡 去微信发朋友圈或聊天时：长按输入框「粘贴」文案，再从相册选择刚保存的账单长图即可！
              </p>
              <button 
                onClick={() => setPreviewImage(null)}
                className="w-full bg-black text-white font-black text-xs py-2.5 border-2 border-black shadow-[2px_2px_0px_#444] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer touch-manipulation"
              >
                我知道了 · 返回测试
              </button>
            </div>
          </div>
        )}
    </main>
  );
}
