'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toPng } from 'html-to-image';
import { generateSignature } from '../../../lib/security';
import { 
  generateFamilyOriginQrCodeSvg, 
  buildFamilyOriginShareUrl, 
  generateFamilyOriginShareCopy, 
  copyImageAndTextToClipboard, 
  syncCopyText, 
  isMobileDevice, 
  isWeChatEnvironment,
  getFamilyOriginTheme 
} from '../utils/share';

interface ResultReceiptProps {
  result: any;
  userInfo: { nickname: string; status: 'independent' | 'confused' };
  onRestart: () => void;
}

// 本地设备缓存协议定义（支持一码全通与多剧本隔离）
interface FamilyOriginCacheStorage {
  unlocked: boolean;
  lastVerifiedCode?: string;
  profiles: Record<string, any>;
}

export default function ResultReceipt({ result: staleResult, userInfo, onRestart }: ResultReceiptProps) {
  // 基础展示数据：纯消费服务端下发的前 30% 基础脱敏画像数据
  const result = {
    id: staleResult?.id || 'independent-fighter',
    title: staleResult?.title || staleResult?.name || '深渊觉醒者',
    name: staleResult?.name || staleResult?.title || '深渊觉醒者',
    acquiredTrait: staleResult?.acquiredTrait || '后天独行者',
    subtitle: staleResult?.subtitle || '在破碎中重建秩序的破局者',
    attachmentType: staleResult?.attachmentType || '安全型',
    radar: (staleResult?.radar && staleResult.radar.length > 0) ? staleResult.radar : [],
    quote: staleResult?.quote || '“所有的风暴都已过去，现在的我是自己的避难所。”',
    participantCount: staleResult?.participantCount,
    ...staleResult
  };

  const router = useRouter();
  const [show, setShow] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [currentUnlockedProfile, setCurrentUnlockedProfile] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [unlockCode, setUnlockCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSilentFetching, setIsSilentFetching] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [qrSvg, setQrSvg] = useState<string>('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const ticketRef = useRef<HTMLDivElement>(null);

  // 缓存与凭证内存引用
  const lastCodeRef = useRef<string>('');
  const profilesRef = useRef<Record<string, any>>({});

  // 预生成纯前端矢量 SVG 二维码（零网络请求、零 CORS 污染）
  useEffect(() => {
    if (!result) return;
    const shareUrl = buildFamilyOriginShareUrl(result);
    if (shareUrl) {
      generateFamilyOriginQrCodeSvg(shareUrl).then((svg) => {
        if (svg) setQrSvg(svg);
      });
    }
  }, [result?.id, result?.title]);

  // 已激活设备自动静默补拉当前剧本长文切片
  const silentFetchProfile = async (targetId: string, codeToUse: string) => {
    if (!targetId || isSilentFetching) return;
    setIsSilentFetching(true);
    try {
      const payload = JSON.stringify({
        code: (codeToUse || 'CODE-JIE').trim(),
        deviceId: typeof window !== 'undefined' ? localStorage.getItem('deviceId') || 'unknown' : 'unknown',
        recordId: 'family-origin',
        testId: 'family-origin',
        resultKey: targetId,
        nickname: userInfo?.nickname || '你'
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
      const data = await res.json();
      if (data.success && (data.unlockedData || data.result)) {
        const received = data.unlockedData || data.result;
        const receivedContent = received.content || received.description || '';
        const profileData = { id: targetId, content: receivedContent, ...received };
        setCurrentUnlockedProfile(profileData);
        setIsUnlocked(true);

        if (typeof window !== 'undefined') {
          profilesRef.current[targetId] = profileData;
          const updatedStorage: FamilyOriginCacheStorage = {
            unlocked: true,
            lastVerifiedCode: codeToUse || lastCodeRef.current || '',
            profiles: profilesRef.current
          };
          localStorage.setItem('verified_family-origin', JSON.stringify(updatedStorage));
        }
      }
    } catch (err) {
      console.error('原生家庭静默补拉剧本长文失败:', err);
    } finally {
      setIsSilentFetching(false);
    }
  };

  useEffect(() => {
    if (result?.participantCount) {
      setParticipantCount(result.participantCount);
    } else {
      setParticipantCount(Math.floor(Math.random() * 900) + 85000);
    }
    
    // 从安全隔离缓存中读取当前剧本
    if (typeof window !== 'undefined' && result?.id) {
      let deviceUnlocked = false;
      let savedCode = '';
      let localProfiles: Record<string, any> = {};

      const cached = localStorage.getItem('verified_family-origin');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.unlocked) {
            deviceUnlocked = true;
            savedCode = parsed.lastVerifiedCode || '';
            if (parsed.profiles && typeof parsed.profiles === 'object') {
              localProfiles = { ...parsed.profiles };
            }
            // 平滑兼容迁移旧版单剧本结构
            if (parsed.id && parsed.content) {
              localProfiles[parsed.id] = { id: parsed.id, content: parsed.content };
            }
          }
        } catch(e) {
          if (cached === 'true') {
            deviceUnlocked = true;
          }
        }
      }

      if (savedCode) lastCodeRef.current = savedCode;
      profilesRef.current = localProfiles;

      if (deviceUnlocked) {
        setIsUnlocked(true);
        if (localProfiles[result.id]) {
          setCurrentUnlockedProfile(localProfiles[result.id]);
        } else {
          // 当前剧本无独立缓存：先置空，坚决不使用旧剧本文案
          setCurrentUnlockedProfile(null);
          silentFetchProfile(result.id, savedCode);
        }
      } else {
        setIsUnlocked(false);
        setCurrentUnlockedProfile(null);
      }
    }

    // 延迟显示动效
    const timer = setTimeout(() => setShow(true), 300);
    return () => clearTimeout(timer);
  }, [result?.id, userInfo?.nickname]);

  if (!result) return null;

  const handleVerify = async () => {
    setVerifyError('');
    if (!unlockCode.trim()) {
      setVerifyError('请输入有效的激活码 / INVALID CODE');
      return;
    }
    
    setIsVerifying(true);
    try {
      const payload = JSON.stringify({
        code: unlockCode.trim(),
        deviceId: typeof window !== 'undefined' ? localStorage.getItem('deviceId') || 'unknown' : 'unknown',
        recordId: 'family-origin',
        testId: 'family-origin',
        resultKey: result.id,
        nickname: userInfo?.nickname || '你'
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
      const data = await res.json();
      if (data.success && (data.unlockedData || data.result)) {
        const received = data.unlockedData || data.result;
        const receivedContent = received.content || received.description || '';
        const profileData = { id: result.id, content: receivedContent, ...received };
        setIsUnlocked(true);
        setCurrentUnlockedProfile(profileData);
        setShowModal(false);

        const trimmedCode = unlockCode.trim();
        lastCodeRef.current = trimmedCode;
        if (result?.id) {
          profilesRef.current[result.id] = profileData;
        }

        if (typeof window !== 'undefined') {
          const storage: FamilyOriginCacheStorage = {
            unlocked: true,
            lastVerifiedCode: trimmedCode,
            profiles: profilesRef.current
          };
          localStorage.setItem('verified_family-origin', JSON.stringify(storage));
        }
      } else {
        setVerifyError(data.error || '激活码无效 / DENIED');
      }
    } catch(e) {
      setVerifyError('网络异常，请重试 / NETWORK ERROR');
    } finally {
      setIsVerifying(false);
    }
  };

  // 严格剧本 ID 一致性校验守卫：严禁跨剧本覆盖
  const activeUnlockedContent = (
    isUnlocked &&
    currentUnlockedProfile &&
    (currentUnlockedProfile.id === result.id || currentUnlockedProfile.name === result.name)
  ) ? currentUnlockedProfile.content : null;

  const displayContent = activeUnlockedContent || result.content || '';

  const handleSave = () => {
    if (!isUnlocked) {
      setShowModal(true);
      return;
    }
    if (!ticketRef.current) return;

    // 【手机端权限核心】：在用户点击手势有效的第一毫秒强同步将文案写入剪贴板！
    // 彻底杜绝因 setTimeout 或异步截屏耗时导致微信内核拦截报错「未能复制到剪切板」
    const shareUrl = buildFamilyOriginShareUrl(result);
    const shareCopy = generateFamilyOriginShareCopy(result, userInfo, shareUrl);
    syncCopyText(shareCopy);

    const saveBtn = document.getElementById('save-text');
    if (saveBtn) saveBtn.innerText = '正在生成并打包...';

    // 激活截屏模式，无痕注入纯前端矢量二维码
    setIsGeneratingImage(true);

    setTimeout(() => {
      const node = ticketRef.current;
      if (!node) {
        setIsGeneratingImage(false);
        return;
      }

      toPng(node, { 
        cacheBust: true, 
        pixelRatio: 3,
        quality: 1,
        backgroundColor: '#FDFBF7',
        style: { transform: 'scale(1)', margin: '0' } 
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
              link.download = `DOSSIER_${userInfo?.nickname || 'USER'}_${result.id}_${Date.now()}.png`;
              link.href = dataUrl;
              link.click();
            } catch (e) {}
          } else {
            // PC 电脑端：触发高清档案文件下载，并写入富文本图文剪贴板
            const link = document.createElement('a');
            link.download = `DOSSIER_${userInfo?.nickname || 'USER'}_${result.id}_${Date.now()}.png`;
            link.href = dataUrl;
            link.click();

            await copyImageAndTextToClipboard(dataUrl, shareCopy);

            setToastMessage('档案已保存！分享文案已复制');
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3500);
          }

          if (saveBtn) saveBtn.innerText = isMobile ? '已生成长图！文案已复制' : '档案已保存！文案已复制';
          setIsGeneratingImage(false);
          setTimeout(() => {
            if (saveBtn) saveBtn.innerText = '分享我的人生剧本';
          }, 3000);
        })
        .catch((err) => {
          console.error('保存人生剧本长图失败:', err);
          if (saveBtn) saveBtn.innerText = '保存失败，请重试';
          setIsGeneratingImage(false);
        });
    }, 180);
  };

  const theme = getFamilyOriginTheme(result?.id || result?.key);

  return (
    <main className="flex-1 flex flex-col items-center w-full min-h-[100dvh] pt-10 pb-[max(140px,env(safe-area-inset-bottom))] px-4 relative overflow-y-auto overflow-hidden bg-[#FDFBF7] selection:bg-[#121212] selection:text-white">

      <div ref={ticketRef} className={`w-full max-w-sm bg-[#FDFBF7] border-4 border-[#121212] flex flex-col relative transition-transform duration-700 ease-out transform ${show ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
          
          {/* Header：大女主时尚杂志封面区（收窄高度，更加紧凑精干，内联样式强制兜底） */}
          <div 
            className="bg-[#121212] text-white py-3.5 px-5 sm:px-6 flex justify-between items-end relative overflow-hidden border-b-[6px]"
            style={{ minHeight: '175px', height: '180px', borderBottomColor: theme.accentColor }}
          >
              
              {/* 背景人物图层与微光渐变（干净无遮挡） */}
              <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={`/images/family-origin/${result.id}.png`} 
                    alt={result.title} 
                    className="w-full h-full object-cover object-right drop-shadow-2xl transition-all duration-700" 
                    onError={(e) => { e.currentTarget.style.display = 'none'; }} 
                  />
                  {/* 从左往右的深黑渐变，保证左侧文字完全清晰 */}
                  <div className="absolute inset-0 z-[2] bg-gradient-to-r from-[#121212] via-[#121212]/80 to-transparent"></div>
              </div>

              {/* 左侧文字排版区：黑金+专属主题配色体系 */}
              <div className="relative z-10 max-w-[215px] sm:max-w-[230px] flex flex-col h-full justify-between gap-2">
                  {/* 中间结果大标题：带专属立柱标尺，两行超大字体，视觉重心极强 */}
                  <div className="my-auto border-l-[3px] pl-2.5 py-0.5" style={{ borderLeftColor: theme.accentColor }}>
                      <h1 
                        className="font-black tracking-tight font-serif uppercase drop-shadow-xl text-white"
                        style={{ fontSize: '28px', lineHeight: '1.14', fontWeight: 900 }}
                      >
                          {(() => {
                            const t = (result.title || result.name || '').trim();
                            if (t.length >= 7) {
                              const splitIdx = t.indexOf('的') !== -1 ? t.indexOf('的') + 1 : 5;
                              return (
                                <>
                                  <span className="block whitespace-nowrap text-white" style={{ color: '#FFFFFF' }}>{t.slice(0, splitIdx)}</span>
                                  <span className="block whitespace-nowrap mt-0.5 drop-shadow-md" style={{ color: '#FFF9E6' }}>{t.slice(splitIdx)}</span>
                                </>
                              );
                            }
                            return <span className="block whitespace-nowrap text-white" style={{ color: '#FFFFFF' }}>{t}</span>;
                          })()}
                      </h1>
                  </div>

                  {/* 精致渐变细线：专属主题色融入微光 */}
                  <div className="w-full h-[1px]" style={{ background: `linear-gradient(to right, ${theme.accentColor}, rgba(255,255,255,0.35), transparent)` }}></div>

                  {/* 底部信息框：香槟金+专属人格高光配色，沉稳典雅（内联style绝对生效） */}
                  <div className="space-y-1">
                      <div className="text-[12px] sm:text-[13px] font-mono tracking-wide uppercase text-white/90 leading-tight">
                          <span style={{ color: 'rgba(255,255,255,0.6)' }}>后天人格属性:</span>
                          <span className="font-bold ml-1.5 drop-shadow-sm" style={{ color: '#F6D365', fontWeight: 700 }}>{result.acquiredTrait || result.name}</span>
                      </div>
                      <div className="text-[12px] sm:text-[13px] font-mono tracking-wide uppercase text-white/90 leading-tight">
                          <span style={{ color: 'rgba(255,255,255,0.6)' }}>剧本人格:</span>
                          <span className="font-bold ml-1.5 drop-shadow-sm" style={{ color: theme.accentColor, fontWeight: 700 }}>{result.subtitle}</span>
                      </div>
                      <div className="text-[10px] sm:text-[11px] font-mono tracking-wide pt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                          第 <span className="font-bold" style={{ color: 'rgba(255,255,255,0.9)' }}>{participantCount > 0 ? participantCount.toLocaleString() : '85,000'}</span> 位完成觉醒
                      </div>
                  </div>
              </div>
          </div>

          {/* Content */}
          <div className="p-5 md:p-6 flex-1 flex flex-col bg-[url('/grid.svg')] bg-center">
              
              {/* 四个胶囊标签：专属主题框阴影与色彩 */}
              <div className="flex gap-2 flex-wrap justify-center mb-8 sm:mb-9">
                  {result.tags?.map((tag: string, idx: number) => (
                    <span 
                      key={idx} 
                      className="text-[11px] font-mono font-bold text-[#121212] border-2 border-[#121212] px-3 py-1 uppercase bg-white transition-all"
                      style={{ boxShadow: theme.tagShadow }}
                    >
                      {tag.replace('#', '')}
                    </span>
                  ))}
              </div>

              {/* 依恋类型卡片：高度收紧精炼，下方保持充足留白与呼吸感 */}
              {result.radar && result.radar.length > 0 && (
                <div 
                  className="mb-8 sm:mb-9 bg-white border-4 border-[#121212] p-4 sm:p-5 relative transition-all"
                  style={{ boxShadow: theme.cardShadow }}
                >
                    {/* 专属主题色装饰角标 */}
                    <div 
                      className="absolute top-0 right-0 w-5 h-5 transform translate-x-2.5 -translate-y-2.5 z-10 border-2 border-[#121212]"
                      style={{ backgroundColor: theme.accentColor }}
                    ></div>
                    <div className="absolute bottom-0 left-0 w-3.5 h-3.5 bg-[#121212] transform -translate-x-1.5 translate-y-1.5 z-10"></div>
                    
                    <div className="flex items-center justify-between mb-3.5 border-b-4 border-[#121212] pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-xl leading-none" style={{ color: theme.accentColor }}>///</span>
                        <h3 className="text-sm md:text-base font-black tracking-widest text-[#121212] uppercase font-mono">依恋类型</h3>
                      </div>
                      <span className="text-xs sm:text-sm font-mono font-black tracking-wide" style={{ color: theme.accentColor }}>
                        {result.attachmentType}
                      </span>
                    </div>
                    
                    <div className="space-y-2.5">
                      {result.radar.map((item: any, idx: number) => {
                        const val = Number(item.A) || 75;
                        const pStr = (val % 1 === 0) ? val.toFixed(0) : val.toFixed(1);
                        return (
                          <div key={idx} className="flex flex-col group">
                              <div className="flex justify-between items-end mb-1">
                                  <span className="text-[#121212] font-mono text-xs uppercase font-black tracking-widest">{item.subject}</span>
                                  <span className="font-black font-mono text-sm md:text-base tracking-tighter" style={{ color: theme.accentColor }}>{pStr}<span className="text-[10px] ml-0.5">%</span></span>
                              </div>
                              <div className="w-full h-4 bg-[#FDFBF7] overflow-hidden relative border-2 border-[#121212]">
                                <div 
                                  className="h-full transition-all duration-1000 ease-out relative flex items-center justify-end pr-1" 
                                  style={{ width: `${Math.min(100, Math.max(0, val))}%`, backgroundColor: theme.barFill }}
                                >
                                  <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(-45deg, transparent, transparent 4px, #ffffff 4px, #ffffff 8px)' }}></div>
                                  <div className="w-1.5 h-2.5 bg-white z-10 shadow-sm opacity-90"></div>
                                </div>
                              </div>
                          </div>
                        );
                      })}
                    </div>
                </div>
              )}

              {/* 核心深度档案区域 */}
              <div className="mt-auto relative">
                  {!isUnlocked && (
                      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#FDFBF7]/85 backdrop-blur-sm p-4 text-center">
                          <div 
                            className="border-4 border-[#121212] bg-white p-6 max-w-xs flex flex-col items-center transition-all"
                            style={{ boxShadow: theme.cardShadow }}
                          >
                            <span className="text-[10px] font-mono font-bold tracking-widest uppercase mb-2" style={{ color: theme.accentColor }}>
                              /// TOP SECRET DOSSIER ///
                            </span>
                            <h4 className="text-base font-black text-[#121212] mb-3 font-serif whitespace-nowrap">大女主深度觉醒档案已封存</h4>
                            
                            <div className="w-full text-left space-y-1.5 mb-5 border-y-2 border-[#121212]/10 py-3 text-[11px] font-serif text-[#121212]/80">
                              <div className="flex items-center gap-1.5">
                                <span className="font-black" style={{ color: theme.accentColor }}>▶</span> 童年隐痛与潜意识烙印溯源
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-black" style={{ color: theme.accentColor }}>▶</span> 现实高频应激触发场景 TOP 3
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-black" style={{ color: theme.accentColor }}>▶</span> 绝密蜕变分水岭时刻剖析
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-black" style={{ color: theme.accentColor }}>▶</span> 防吸血与内疚脱敏实操处方
                              </div>
                            </div>

                            <button 
                              onClick={() => setShowModal(true)} 
                              className="w-full bg-[#121212] text-white px-6 py-3.5 text-xs tracking-[0.2em] uppercase font-bold hover:opacity-90 active:translate-y-1 transition-all active:shadow-none whitespace-nowrap cursor-pointer"
                              style={{ boxShadow: theme.btnShadow }}
                            >
                                解锁大女主档案
                            </button>
                          </div>
                      </div>
                  )}

                  {/* 解锁后的深度切片版面 */}
                  { (isUnlocked) ? (
                    <div className="flex flex-col gap-6 mb-2 px-1 relative z-10">
                      {/* 水印 */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl font-black text-[#121212]/5 rotate-[-15deg] pointer-events-none select-none uppercase font-serif tracking-widest whitespace-nowrap">
                        CLASSIFIED
                      </div>

                      {/* 切片 1：童年潜意识烙印 */}
                      {(currentUnlockedProfile?.childhoodMark || result.childhoodMark) && (
                        <div 
                          className="bg-white border-4 border-[#121212] p-5 relative transition-all"
                          style={{ boxShadow: theme.cardShadow }}
                        >
                          <div className="flex items-center gap-2 mb-3 border-b-2 border-[#121212] pb-2">
                            <span className="font-mono font-black text-sm" style={{ color: theme.accentColor }}>/ 01</span>
                            <h4 className="font-black text-[#121212] text-sm md:text-base font-mono uppercase tracking-widest">童年潜意识烙印</h4>
                          </div>
                          <p className="text-xs md:text-sm leading-relaxed text-[#121212]/90 text-justify font-serif">
                            {currentUnlockedProfile?.childhoodMark || result.childhoodMark}
                          </p>
                        </div>
                      )}

                      {/* 切片 2：现实高频应激触发点 TOP 3 */}
                      {((currentUnlockedProfile?.triggers && currentUnlockedProfile.triggers.length > 0) || (result.triggers && result.triggers.length > 0)) && (
                        <div 
                          className="bg-white border-4 border-[#121212] p-5 relative transition-all"
                          style={{ boxShadow: theme.cardShadow }}
                        >
                          <div className="flex items-center gap-2 mb-3 border-b-2 border-[#121212] pb-2">
                            <span className="font-mono font-black text-sm" style={{ color: theme.accentColor }}>/ 02</span>
                            <h4 className="font-black text-[#121212] text-sm md:text-base font-mono uppercase tracking-widest">高频应激触发点</h4>
                          </div>
                          <div className="space-y-2.5">
                            {(currentUnlockedProfile?.triggers || result.triggers || []).map((item: string, idx: number) => (
                              <div key={idx} className="flex items-start gap-2.5 text-xs md:text-sm font-serif text-[#121212]/90 leading-relaxed">
                                <span 
                                  className="inline-block w-4 h-4 text-white text-[10px] font-mono font-bold flex-shrink-0 text-center leading-4 mt-0.5 shadow-sm"
                                  style={{ backgroundColor: theme.accentColor }}
                                >
                                  {idx + 1}
                                </span>
                                <span>{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 切片 3：核心觉醒蜕变之路 */}
                      <div 
                        className="bg-white border-4 border-[#121212] p-5 relative transition-all"
                        style={{ boxShadow: theme.cardShadow }}
                      >
                        <div className="flex items-center gap-2 mb-3 border-b-2 border-[#121212] pb-2">
                          <span className="font-mono font-black text-sm" style={{ color: theme.accentColor }}>/ 03</span>
                          <h4 className="font-black text-[#121212] text-sm md:text-base font-mono uppercase tracking-widest">大女主蜕变之路</h4>
                        </div>
                        {displayContent.split('【').map((part: string, idx: number) => {
                          if (!part.trim()) return null;
                          if (idx === 0) {
                            return (
                              <p key={idx} className="text-xs md:text-sm leading-loose text-[#121212]/90 text-justify tracking-wide font-serif mb-4">
                                {part.trim()}
                              </p>
                            );
                          }
                          const [title, ...contentParts] = part.split('】');
                          const content = contentParts.join('】').trim();
                          return (
                            <div key={idx} className="mt-4 pt-4 border-t border-[#121212]/15">
                              <h5 className="font-black text-xs font-mono uppercase tracking-widest mb-1.5" style={{ color: theme.accentColor }}>
                                ◆ {title}
                              </h5>
                              <p className="text-xs md:text-sm leading-relaxed text-[#121212] text-justify font-serif">
                                {content}
                              </p>
                            </div>
                          );
                        })}
                      </div>

                      {/* 切片 4：防吸血与内疚脱敏处方 */}
                      {((currentUnlockedProfile?.antidoteList && currentUnlockedProfile.antidoteList.length > 0) || (result.antidoteList && result.antidoteList.length > 0)) && (
                        <div 
                          className="bg-[#121212] text-white p-5 border-4 border-[#121212] relative transition-all"
                          style={{ boxShadow: theme.cardShadow }}
                        >
                          <div className="flex items-center gap-2 mb-3 border-b border-white/20 pb-2">
                            <span className="font-mono font-black text-sm" style={{ color: theme.accentColor }}>/ 04</span>
                            <h4 className="font-black text-white text-sm md:text-base font-mono uppercase tracking-widest">防吸血脱敏处方</h4>
                          </div>
                          <div className="space-y-3">
                            {(currentUnlockedProfile?.antidoteList || result.antidoteList || []).map((item: string, idx: number) => (
                              <div key={idx} className="flex items-start gap-2.5 text-xs md:text-sm font-serif text-white/90 leading-relaxed">
                                <span className="font-black text-base leading-none mt-0.5" style={{ color: theme.accentColor }}>✓</span>
                                <span>{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* 金句横幅：专属主题背景与边框阴影 */}
                      <div 
                        className="border-4 border-[#121212] px-6 py-6 mt-2 text-white text-sm md:text-base font-black font-serif text-center relative overflow-hidden group transition-all"
                        style={{ backgroundColor: theme.bannerBg, boxShadow: theme.cardShadow }}
                      >
                          <div className="absolute -top-6 -left-2 text-8xl font-serif text-black/20 pointer-events-none select-none group-hover:scale-110 transition-transform duration-500">"</div>
                          <div className="relative z-10 tracking-widest drop-shadow-md leading-relaxed">
                              "{currentUnlockedProfile?.quote || result.quote}"
                          </div>
                      </div>

                      {/* 截屏瞬间动态挂载纯前端矢量二维码：常态网页完全隐藏，绝不破坏绝密黑白档案的冷峻质感 */}
                      {isGeneratingImage && (
                        <div 
                          id="dossier-qrcode-container" 
                          className="mt-5 pt-4 border-t-2 border-dashed border-[#121212] flex flex-col items-center justify-center text-center animate-fadeIn bg-white/95 p-3.5 border-2 border-[#121212] transition-all"
                          style={{ boxShadow: theme.cardShadow }}
                        >
                          <div 
                            className="bg-white border-2 border-[#121212] p-1.5 inline-block mb-2 transition-all"
                            style={{ boxShadow: theme.tagShadow }}
                          >
                            {qrSvg ? (
                              <div 
                                className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                                dangerouslySetInnerHTML={{ __html: qrSvg }}
                              />
                            ) : (
                              <div className="w-24 h-24 sm:w-28 sm:h-28 bg-[#121212] flex items-center justify-center text-white text-[10px] font-mono">
                                原生家庭剧本
                              </div>
                            )}
                          </div>
                          <div className="font-mono">
                            <div className="text-[10px] sm:text-[11px] font-black tracking-wider uppercase text-[#121212]" style={{ color: theme.accentColor }}>
                              [ 扫码解密 · 重写你的原生家庭人生剧本 ]
                            </div>
                            <p className="text-[8.5px] text-[#121212]/70 font-bold mt-1 tracking-tight font-serif">
                              长按扫码立即测算 · 查收你的专属大女主觉醒档案
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="mt-4 mb-2 text-center text-[9px] text-[#121212]/40 font-mono tracking-widest uppercase">
                          免责声明：本测评仅供个人认知探索与娱乐，非临床心理诊断结论
                      </div>
                    </div>
                  ) : (
                    /* 未解锁占位图景 */
                    <div className="flex flex-col gap-5 mb-2 px-1 relative z-10 opacity-30 select-none pointer-events-none filter blur-[2.5px]">
                      <div className="text-xs leading-loose text-[#121212] font-serif bg-white p-4 border-2 border-[#121212]">
                        你的原生家庭可能教会了你“责任”与“体谅”，从小你就不想让家人操心，早早学会了为自己的每一个决定买单。这种略显懂事的底色，促使你迅速完成了独立人格的觉醒...
                      </div>
                      <div 
                        className="border-4 border-[#121212] p-4 bg-white"
                        style={{ boxShadow: theme.cardShadow }}
                      >
                        <h4 className="font-black text-[#121212] text-xs mb-2 font-mono">/// 专属蜕变建议与防吸血实操处方 ///</h4>
                        <div className="h-16 bg-gray-200"></div>
                      </div>
                    </div>
                  )}
              </div>
          </div>
      </div>

      {/* 底部固定操作栏 */}
      <div className={`fixed bottom-0 left-0 right-0 p-4 pb-6 bg-gradient-to-t from-[#FDFBF7] via-[#FDFBF7]/90 to-transparent flex flex-col gap-3 z-50 transition-all duration-700 delay-500 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex gap-4 w-full max-w-sm mx-auto">
              <button 
                  onClick={onRestart}
                  className="flex-1 py-4 bg-[#FDFBF7] border-2 border-[#121212] text-[#121212] text-xs font-bold uppercase tracking-widest hover:bg-[#121212]/5 active:scale-[0.98] transition-all"
              >
                  重新测算
              </button>
              <button 
                  onClick={handleSave}
                  disabled={isGeneratingImage}
                  id="btn-save"
                  className="flex-1 py-4 bg-[#121212] text-white text-xs font-bold uppercase tracking-widest hover:opacity-90 active:translate-y-1 transition-all flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer"
                  style={{ boxShadow: theme.btnShadow }}
              >
                  <span id="save-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                  </span>
                  <span id="save-text">分享我的人生剧本</span>
              </button>
          </div>
          <button 
              type="button"
              onClick={() => window.location.href = '/'} 
              className="w-full max-w-sm mx-auto min-h-[44px] py-1 bg-transparent text-[#121212]/50 text-center text-[10px] font-bold uppercase tracking-widest hover:text-[#121212] transition-colors touch-manipulation cursor-pointer flex items-center justify-center underline underline-offset-4"
          >
              返回剧本测试大厅
          </button>
      </div>

      {/* 激活码验证弹窗 */}
      {showModal && (
          <div className="fixed inset-0 z-[100] bg-[#121212]/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
              <div 
                className="bg-[#FDFBF7] p-8 w-full max-w-sm border-4 border-[#121212] relative animate-fade-in-up"
                style={{ boxShadow: theme.cardShadow }}
              >
                  <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-[#121212] hover:opacity-70 transition-colors font-mono font-bold text-xl leading-none">×</button>
                  <h3 className="text-xl font-black mb-4 tracking-widest text-[#121212] text-center uppercase border-b-2 border-[#121212] pb-4">验证授权</h3>
                  <p className="text-[10px] text-[#121212]/70 mb-6 leading-relaxed text-center uppercase tracking-widest">
                    请输入激活码解锁完整心理档案。请通过小红书【安安店铺】获取。
                  </p>
                  <input 
                    value={unlockCode} 
                    onChange={(e) => setUnlockCode(e.target.value)} 
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleVerify();
                    }}
                    type="text" 
                    placeholder="请输入激活码" 
                    className="w-full border-2 border-[#121212] p-4 mb-2 outline-none transition-colors text-sm text-center tracking-widest bg-white font-bold uppercase placeholder:text-[#121212]/30" 
                    style={{ borderColor: '#121212' }}
                  />
                  {verifyError && (
                    <div className="flex flex-col gap-2 mb-4 mt-2">
                      <p className="font-bold text-[10px] text-center uppercase tracking-widest" style={{ color: theme.accentColor }}>{verifyError}</p>
                      <button 
                        onClick={() => window.open('https://xhslink.com/m/Atwtf3Cy6FR', '_blank')} 
                        className="w-full bg-white text-[#121212] font-bold text-[10px] py-3 tracking-widest uppercase hover:bg-[#f4f4f4] transition-all border-2 border-[#121212] shadow-[4px_4px_0px_rgba(18,18,18,1)] active:shadow-none active:translate-y-1"
                      >
                         前往安安店铺
                      </button>
                    </div>
                  )}
                  <button 
                    onClick={handleVerify} 
                    disabled={isVerifying} 
                    className="w-full bg-[#121212] text-white font-bold text-xs p-4 tracking-widest uppercase hover:opacity-90 active:translate-y-1 transition-all disabled:opacity-50 mt-2 active:shadow-none"
                    style={{ boxShadow: theme.btnShadow }}
                  >
                     {isVerifying ? '正在验证...' : '解密档案'}
                  </button>
              </div>
          </div>
      )}

      {/* 双重正向反馈 Toast 提示框 */}
      {showToast && (
        <div 
          className="fixed top-6 left-1/2 -translate-x-1/2 z-[170] flex items-center gap-2 bg-[#121212] text-white px-5 py-3 border-2 shadow-[4px_4px_0px_#121212] text-xs sm:text-sm font-black tracking-wide animate-bounce font-serif"
          style={{ borderColor: theme.accentColor }}
        >
          <span className="font-mono text-base font-black" style={{ color: theme.accentColor }}>✔</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 移动端/微信端专属：长图全屏预览与长按保存浮层 */}
      {previewImage && (
        <div className="fixed inset-0 z-[160] bg-[#121212]/90 backdrop-blur-md flex flex-col items-center justify-between p-3 sm:p-4 font-sans animate-fadeIn">
          {/* 顶部标题与关闭按钮 */}
          <div className="w-full max-w-sm flex items-center justify-between py-2 border-b border-white/20 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full animate-ping" style={{ backgroundColor: theme.accentColor }}></span>
              <span className="text-white font-black text-xs sm:text-sm tracking-wide font-serif">觉醒剧本档案已就绪</span>
            </div>
            <button 
              onClick={() => setPreviewImage(null)} 
              className="text-white hover:text-white/80 font-mono font-black text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 border border-white/30 rounded cursor-pointer touch-manipulation active:scale-95 transition-all"
            >
              ✕ 关闭
            </button>
          </div>

          {/* 中间图片核心交互区：长图展示，支持长按保存到相册或发送给微信朋友 */}
          <div className="flex-1 w-full max-w-sm overflow-y-auto my-2.5 flex flex-col items-center hide-scrollbar rounded shadow-[0_8px_30px_rgb(0,0,0,0.6)]">
            {/* 强视觉长按指引条 */}
            <div 
              className="text-white text-[11px] sm:text-xs font-black py-2 px-3 w-full text-center border-2 border-[#121212] sticky top-0 z-10 shadow-sm flex items-center justify-center gap-1.5 font-serif"
              style={{ backgroundColor: theme.bannerBg }}
            >
              <span>👇</span>
              <span>请「长按下方图片」保存到相册或发给朋友</span>
            </div>
            <div className="p-1 bg-[#FDFBF7] border-2 border-t-0 border-[#121212] w-full flex justify-center">
              <img 
                src={previewImage} 
                alt="原生家庭人生剧本觉醒档案长图" 
                className="w-full max-w-[320px] h-auto object-contain block select-none pointer-events-auto shadow-md"
                style={{ touchAction: 'auto', WebkitTouchCallout: 'default' }}
              />
            </div>
          </div>

          {/* 底部贴心指引卡片 */}
          <div 
            className="w-full max-w-sm bg-[#FDFBF7] border-4 border-[#121212] p-3.5 flex flex-col gap-2 shrink-0 transition-all"
            style={{ boxShadow: theme.cardShadow }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-black text-[#121212] font-serif">
                <span className="text-sm font-black" style={{ color: theme.accentColor }}>✔</span>
                <span>觉醒文案已成功复制</span>
              </div>
              <button 
                onClick={() => {
                  const shareUrl = buildFamilyOriginShareUrl(result);
                  const shareCopy = generateFamilyOriginShareCopy(result, userInfo, shareUrl);
                  syncCopyText(shareCopy);
                  setToastMessage('文案已重新复制！');
                  setShowToast(true);
                  setTimeout(() => setShowToast(false), 2000);
                }}
                className="text-[10px] underline font-mono font-bold hover:text-[#121212] cursor-pointer"
                style={{ color: theme.accentColor }}
              >
                [ 重新复制文案 ]
              </button>
            </div>
            <p className="text-[10px] text-[#121212]/80 font-bold leading-tight font-serif">
              💡 去微信发朋友圈或发给朋友：长按输入框「粘贴」文案，再从相册选择刚保存的剧本长图即可！
            </p>
            <button 
              onClick={() => setPreviewImage(null)}
              className="w-full bg-[#121212] text-white font-black text-xs py-2.5 border-2 border-[#121212] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer touch-manipulation uppercase tracking-wider"
              style={{ boxShadow: theme.btnShadow }}
            >
              我知道了 · 返回剧本
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
