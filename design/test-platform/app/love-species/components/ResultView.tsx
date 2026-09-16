'use client';

import { useEffect, useState, useRef } from 'react';
import { toPng } from 'html-to-image';
import { generateSignature } from '../../../lib/security';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllSpecies, getSpeciesSynergy, SpeciesSummary, SpeciesSynergyResult } from '../../../lib/love-species-client';
import { 
  generateLoveSpeciesQrCodeSvg, 
  buildLoveSpeciesShareUrl, 
  generateLoveSpeciesShareCopy, 
  getLoveSpeciesShareOrigin,
  syncCopyText, 
  copyImageAndTextToClipboard, 
  isMobileDevice, 
  isWeChatEnvironment 
} from '../utils/share';

interface ResultViewProps {
  result: any;
  userInfo: { nickname: string; status: 'single' | 'relationship' };
  onRestart: () => void;
}

const getMBTI = (key: string) => {
  if (!key || key.length !== 4) return "UNKNOWN";
  const char1 = key[1] === 'E' ? 'E' : 'I'; // Expressive/Hidden -> E/I
  const char2 = key[3] === 'I' ? 'N' : 'S'; // Idealistic/Realistic -> N/S
  const char3 = key[2] === 'S' ? 'F' : 'T'; // Sensitive/Carefree -> F/T
  const char4 = key[0] === 'A' ? 'J' : 'P'; // Anxious/Dismissive -> J/P
  return char1 + char2 + char3 + char4;
};

const HIGHLIGHT_TRAIT_MAP: Record<string, string> = {
  '边界感': '绝对独立结界',
  '野性值': '绝不吃PUA的野生自洽',
  '表达欲': '坦荡真诚的情感直球',
  '粘人度': '全天候高浓度偏爱',
  '神经质': '超敏情感直觉雷达',
  '关注点': '极致灵魂共鸣追求'
};

// Minimalist Brutalist Hexagon Radar Chart (6 Dimensions) - Light Mode Adapted
function RadarChart({ data, themeColor }: { data: {label: string; value: number; isHighlight?: boolean}[], themeColor: string }) {
  if (!data || data.length < 3) return null;
  const size = 320; 
  const center = size / 2; // 160
  const radius = 88; 

  const getRadarPoint = (pct: number, index: number, total: number) => {
    const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
    const r = (Math.min(100, Math.max(10, pct)) / 100) * radius;
    return {
      x: center + Math.cos(angle) * r,
      y: center + Math.sin(angle) * r
    };
  };

  const getLabelPoint = (index: number, total: number) => {
    const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
    const labelRadius = radius + 15; 
    return {
      x: center + Math.cos(angle) * labelRadius,
      y: center + Math.sin(angle) * labelRadius,
      cos: Math.cos(angle),
      sin: Math.sin(angle)
    };
  };

  const points = data.map((d, i) => {
    const p = getRadarPoint(d.value, i, data.length);
    return `${p.x},${p.y}`;
  }).join(' ');

  const highlightItem = data.find(d => d.isHighlight) || [...data].sort((a, b) => b.value - a.value)[0];

  return (
    <div className="relative w-full flex flex-col items-center py-2">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background Grids */}
        {[0.33, 0.66, 1].map((scale, i) => {
          const bgPoints = data.map((_, idx) => {
            const p = getRadarPoint(100 * scale, idx, data.length);
            return `${p.x},${p.y}`;
          }).join(' ');
          return (
            <polygon 
              key={i} 
              points={bgPoints} 
              fill="none" 
              stroke="#121212" 
              strokeWidth="1.5" 
              strokeOpacity={scale === 1 ? "0.3" : "0.1"}
              strokeDasharray={scale === 1 ? "none" : "3,3"}
            />
          );
        })}
        {/* Connecting Lines */}
        {data.map((_, i) => {
          const p = getRadarPoint(100, i, data.length);
          return (
            <line 
              key={i} 
              x1={center} 
              y1={center} 
              x2={p.x} 
              y2={p.y} 
              stroke="#121212" 
              strokeWidth="1" 
              strokeOpacity="0.1" 
            />
          );
        })}
        {/* Data Polygon */}
        <polygon 
          points={points} 
          fill={themeColor} 
          fillOpacity="0.18"
          stroke={themeColor} 
          strokeWidth="3" 
          strokeLinejoin="round"
        />
        {/* Data Points & Labels */}
        {data.map((d, i) => {
          const p = getRadarPoint(d.value, i, data.length);
          const lp = getLabelPoint(i, data.length);
          const isHigh = d.isHighlight || (highlightItem && highlightItem.label === d.label);

          // 自适应文字对齐与紧凑排版
          let textAnchor: "start" | "end" | "middle" = "middle";
          let labelX = lp.x;
          let labelY = lp.y - 5;
          let valueY = lp.y + 7;

          if (lp.cos > 0.25) {
            textAnchor = "start";
            labelX += 1;
          } else if (lp.cos < -0.25) {
            textAnchor = "end";
            labelX -= 1;
          }

          if (lp.sin < -0.7) {
            // 正上方（边界感）
            labelY = lp.y - 7;
            valueY = lp.y + 5;
          } else if (lp.sin > 0.7) {
            // 正下方（关注点）
            labelY = lp.y + 4;
            valueY = lp.y + 16;
          }

          return (
            <g key={i}>
              <circle 
                cx={p.x} 
                cy={p.y} 
                r={isHigh ? "5" : "3.5"} 
                fill={isHigh ? "#C2185B" : themeColor} 
                stroke="#fff" 
                strokeWidth="1.5" 
              />
              <text 
                x={labelX} 
                y={labelY} 
                fontSize="10.5" 
                fill="#121212" 
                textAnchor={textAnchor} 
                alignmentBaseline="middle"
                className="font-black typewriter tracking-wider"
              >
                {d.label}
              </text>
              <text 
                x={labelX} 
                y={valueY} 
                fontSize="9.5" 
                fill={isHigh ? "#C2185B" : "#555555"} 
                textAnchor={textAnchor} 
                alignmentBaseline="middle"
                className="font-black typewriter"
              >
                {d.value.toFixed(1)}%
              </text>
            </g>
          );
        })}
      </svg>
      {highlightItem && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 -mt-3 bg-white border-2 border-[#121212] shadow-[2px_2px_0px_rgba(0,0,0,1)] text-[10px] font-black typewriter z-20">
          <span className="text-[#C2185B]">★ 恋爱高光</span>
          <span className="text-[#121212]">{HIGHLIGHT_TRAIT_MAP[highlightItem.label] || highlightItem.label}</span>
          <span className="text-[#666]">(击败全网</span>
          <span style={{ color: themeColor }}>{highlightItem.value.toFixed(1)}%</span>
          <span className="text-[#666]">恋爱人群)</span>
        </div>
      )}
    </div>
  );
}

const THEME_COLORS = [
  '#d97736', '#5a7184', '#8c6b5d', '#4b8b8b', 
  '#9b6b9e', '#b25d6b', '#6b8e6b', '#7d6552', 
  '#b89354', '#636b77', '#59618c', '#7b9fb5', 
  '#c4a162', '#384b66', '#8b8c62', '#8c9096'
];

const getStampText = (key: string) => {
  const map: Record<string, string> = {
    'AESI': '极度粘人',
    'AESR': '护食预警',
    'AECI': '绝对治愈',
    'AECR': '绝对安全',
    'AHSI': '剧毒警告',
    'AHSR': '易碎物品',
    'AHCI': '难以捕捉',
    'AHCR': '绝对靠谱',
    'DESI': '抓伤预警',
    'DESR': '极度扎手',
    'DECI': '难以驯服',
    'DECR': '生人勿近',
    'DHSI': '极度敏感',
    'DHSR': '深渊警告',
    'DHCI': '绝对佛系',
    'DHCR': '绝对高冷'
  };
  return map[key] || '极度危险';
};

// 本地设备缓存协议定义（支持一码全通与多物种隔离）
interface LoveSpeciesCacheStorage {
  unlocked: boolean;
  lastVerifiedCode?: string;
  profiles: Record<string, any>;
}

export default function ResultView({ result: staleResult, userInfo, onRestart }: ResultViewProps) {
  // 基础展示数据：纯消费服务端下发的前 30% 基础脱敏画像数据
  const result = {
    id: staleResult?.id || 1,
    key: staleResult?.key || 'AESI',
    title: staleResult?.title || '噬元橘猫',
    emoji: staleResult?.emoji || '🐱',
    tags: staleResult?.tags || ['#极度粘人', '#直球选手'],
    radar: staleResult?.radar,
    recordId: staleResult?.recordId,
    participantCount: staleResult?.participantCount,
    ...staleResult
  };

  const [show, setShow] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [unlockedData, setUnlockedData] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [unlockCode, setUnlockCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSilentFetching, setIsSilentFetching] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [radarData, setRadarData] = useState<{label: string, value: number, isHighlight?: boolean}[]>([]);
  const [adoptedCount, setAdoptedCount] = useState(0);
  const ticketRef = useRef<HTMLDivElement>(null);

  // 缓存与凭证内存引用
  const lastCodeRef = useRef<string>('');
  const profilesRef = useRef<Record<string, any>>({});

  const allSpeciesList = getAllSpecies();
  const defaultPartnerKey = (() => {
    const rawMatch = (unlockedData?.bestMatch || result?.bestMatch) || '';
    const m = typeof rawMatch === 'string' ? rawMatch.match(/\(([A-Z]{4})\)/) : null;
    return m ? m[1] : (allSpeciesList.find(s => s.key !== result?.key)?.key || 'AHCR');
  })();
  const [partnerKey, setPartnerKey] = useState<string>(defaultPartnerKey);
  const [copyToast, setCopyToast] = useState<string | null>(null);

  // 动态契合度合盘数据
  const synergyData: SpeciesSynergyResult = getSpeciesSynergy(result?.key || 'AESI', partnerKey);

  const [saveBtnText, setSaveBtnText] = useState('分享我的恋爱物种');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [qrSvg, setQrSvg] = useState<string>('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // 预生成纯前端矢量 SVG 二维码（零外部网络请求、零 CORS 跨域污染）
  useEffect(() => {
    if (!result) return;
    const shareUrl = buildLoveSpeciesShareUrl(result);
    if (shareUrl) {
      generateLoveSpeciesQrCodeSvg(shareUrl).then((svg) => {
        if (svg) setQrSvg(svg);
      });
    }
  }, [result?.key, result?.id, result?.title]);

  const handleCopyCoupleInvite = () => {
    const origin = getLoveSpeciesShareOrigin();
    const inviteText = `【恋爱物种特工档案 · 伴侣互测】\n我刚测出我的恋爱物种是「${synergyData.mySpecies.emoji} ${synergyData.mySpecies.title}」！\n如果你的物种是「${synergyData.partnerSpecies.emoji} ${synergyData.partnerSpecies.title}」，我们的默契契合度高达 ${synergyData.score}%（${synergyData.tierTitle}）！\n快来测测你到底是什么物种，看看咱俩是不是天作之合👉 ${origin}/love-species`;
    
    // 第一毫秒强同步写入剪贴板
    syncCopyText(inviteText);
    setCopyToast('🐾 已复制查岗暗号！发给TA或发小红书艾特对象吧～');
    setTimeout(() => setCopyToast(null), 3000);
  };

  // 已激活设备自动静默补拉新物种深度切片
  const silentFetchProfile = async (targetKey: string, codeToUse: string) => {
    if (!targetKey || isSilentFetching) return;
    setIsSilentFetching(true);
    try {
      const payload = JSON.stringify({
        code: (codeToUse || 'CODE-JIE').trim(),
        deviceId: typeof window !== 'undefined' ? localStorage.getItem('deviceId') || 'unknown' : 'unknown',
        recordId: result?.recordId || 'love-species',
        testId: 'love-species',
        resultKey: targetKey,
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
        const newProfile = data.unlockedData || data.result;
        setUnlockedData(newProfile);
        setIsUnlocked(true);

        if (typeof window !== 'undefined') {
          profilesRef.current[targetKey] = newProfile;
          const updatedStorage: LoveSpeciesCacheStorage = {
            unlocked: true,
            lastVerifiedCode: codeToUse || lastCodeRef.current || '',
            profiles: profilesRef.current
          };
          localStorage.setItem('verified_love-species', JSON.stringify(updatedStorage));
        }
      }
    } catch (err) {
      console.error('恋爱物种静默补拉画像失败:', err);
    } finally {
      setIsSilentFetching(false);
    }
  };

  useEffect(() => {
    setAdoptedCount(result?.participantCount || Math.floor(Math.random() * 80000) + 12000);
    
    if (typeof window !== 'undefined' && result?.key) {
      let deviceUnlocked = false;
      let savedCode = '';
      let localProfiles: Record<string, any> = {};

      const cached = localStorage.getItem('verified_love-species');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.unlocked) {
            deviceUnlocked = true;
            savedCode = parsed.lastVerifiedCode || '';
            if (parsed.profiles && typeof parsed.profiles === 'object') {
              localProfiles = { ...parsed.profiles };
            }
            // 平滑兼容迁移旧版单物种结构
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

      if (savedCode) lastCodeRef.current = savedCode;
      profilesRef.current = localProfiles;

      if (deviceUnlocked) {
        setIsUnlocked(true);
        if (localProfiles[result.key]) {
          setUnlockedData(localProfiles[result.key]);
        } else {
          // 当前物种无独立缓存：先置空，决不使用旧物种数据
          setUnlockedData(null);
          silentFetchProfile(result.key, savedCode);
        }
      } else {
        setIsUnlocked(false);
        setUnlockedData(null);
      }
    }

    const timer = setTimeout(() => setShow(true), 100);
    
    if (result?.radar) {
      if (Array.isArray(result.radar.chart) && result.radar.chart.length >= 6) {
        setRadarData(result.radar.chart);
      } else {
        const dist = result.radar.boundary || result.radar.distance || 60;
        const expr = result.radar.expression || 60;
        const core = result.radar.neuroticism || result.radar.core || 60;
        const focs = result.radar.focus || 60;
        const cling = result.radar.clinginess || Math.round(((100 - dist) + expr) / 2);
        const wild = result.radar.wildness || Math.round((core + (100 - focs)) / 2);

        const fallbackChart = [
          { label: '边界感', value: Number(dist.toFixed ? dist.toFixed(1) : dist) },
          { label: '表达欲', value: Number(expr.toFixed ? expr.toFixed(1) : expr) },
          { label: '神经质', value: Number(core.toFixed ? core.toFixed(1) : core) },
          { label: '关注点', value: Number(focs.toFixed ? focs.toFixed(1) : focs) },
          { label: '粘人度', value: Number(cling.toFixed ? cling.toFixed(1) : cling) },
          { label: '野性值', value: Number(wild.toFixed ? wild.toFixed(1) : wild) }
        ];
        setRadarData(fallbackChart);
      }
    }
    return () => clearTimeout(timer);
  }, [result?.key, userInfo?.nickname]);

  if (!result) return null;
  const currentTheme = THEME_COLORS[(result.id - 1) % 16] || '#d97736';

  const handleVerify = async () => {
    setVerifyError('');
    if (!unlockCode.trim()) {
      setVerifyError('INVALID CODE');
      return;
    }
    
    setIsVerifying(true);
    try {
      const payload = JSON.stringify({
        code: unlockCode.trim(),
        deviceId: typeof window !== 'undefined' ? localStorage.getItem('deviceId') || 'unknown' : 'unknown',
        recordId: result?.recordId || 'love-species',
        testId: 'love-species',
        resultKey: result?.key,
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
        const unlocked = data.unlockedData || data.result;
        setIsUnlocked(true);
        setUnlockedData(unlocked);
        setShowModal(false);

        const trimmedCode = unlockCode.trim();
        lastCodeRef.current = trimmedCode;
        if (result?.key && unlocked) {
          profilesRef.current[result.key] = unlocked;
        }

        if (typeof window !== 'undefined') {
          const storage: LoveSpeciesCacheStorage = {
            unlocked: true,
            lastVerifiedCode: trimmedCode,
            profiles: profilesRef.current
          };
          localStorage.setItem('verified_love-species', JSON.stringify(storage));
        }
      } else {
        setVerifyError(data.error || 'UNAUTHORIZED');
      }
    } catch(e) {
      setVerifyError('NETWORK ERROR');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSave = () => {
    if (!isUnlocked) {
      setShowModal(true);
      return;
    }
    if (!ticketRef.current) return;

    // 【手机端权限核心】：在用户点击手势有效的第一毫秒同步将文案写入剪贴板！
    // 杜绝因 setTimeout 或异步截屏耗时导致移动端操作系统判定手势过期而清空剪贴板并报错
    const shareUrl = buildLoveSpeciesShareUrl(result);
    const shareCopy = generateLoveSpeciesShareCopy(result, userInfo, shareUrl);
    syncCopyText(shareCopy);

    setSaveBtnText('正在生成特工长图...');
    setIsGeneratingImage(true);

    setTimeout(() => {
      const node = ticketRef.current;
      if (!node) {
        setIsGeneratingImage(false);
        setSaveBtnText('分享我的恋爱物种');
        return;
      }

      toPng(node, { 
        quality: 1, 
        pixelRatio: 3,
        backgroundColor: '#FDFBF7',
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
            setToastMessage('特工档案已就绪！查岗文案已复制');
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);

            // 普通手机浏览器顺带尝试触发系统文件下载
            try {
              const link = document.createElement('a');
              link.download = `恋爱物种特工档案_${result.title}_${userInfo.nickname || 'X'}.png`;
              link.href = dataUrl;
              link.click();
            } catch (e) {}
          } else {
            // PC 电脑端：触发高清特工档案文件下载，并写入富文本图文剪贴板
            const link = document.createElement('a');
            link.download = `恋爱物种特工档案_${result.title}_${userInfo.nickname || 'X'}.png`;
            link.href = dataUrl;
            link.click();

            await copyImageAndTextToClipboard(dataUrl, shareCopy);

            setToastMessage('特工档案已保存！分享文案已复制');
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3500);
          }

          setSaveBtnText(isMobile ? '长图已就绪！文案已复制' : '档案已保存！文案已复制');
          setIsGeneratingImage(false);
          setTimeout(() => {
            setSaveBtnText('分享我的恋爱物种');
          }, 3000);
        })
        .catch((err) => {
          console.error('保存特工档案图片生成失败:', err);
          setSaveBtnText('保存失败，请重试');
          setIsGeneratingImage(false);
          setTimeout(() => {
            setSaveBtnText('分享我的恋爱物种');
          }, 3000);
        });
    }, 180);
  };

  return (
    <div className="flex-1 flex flex-col items-center w-full min-h-[100dvh] pt-10 pb-[max(140px,env(safe-area-inset-bottom))] px-4 relative overflow-y-auto overflow-hidden bg-[#e8e6e1]">
      
      {/* 查岗暗号复制成功提示 */}
      <AnimatePresence>
        {copyToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-5 left-1/2 transform -translate-x-1/2 z-[200] px-4 py-2 bg-[#121212] text-white border-2 border-[#C2185B] shadow-[4px_4px_0px_rgba(194,24,91,1)] text-[11px] font-black typewriter tracking-wider text-center max-w-xs pointer-events-none"
          >
            {copyToast}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        ref={ticketRef}
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
        className="w-full max-w-sm flex flex-col mb-8 relative z-10 bg-[#FDFBF7] border-4 border-[#121212] overflow-hidden"
      >
        {/* Header Region - Dark Theme to blend with the generated dark-background image */}
        <div className="relative w-full h-[220px] flex flex-col border-b-4 border-[#121212] bg-[#121212]">
          {/* Background Image & Gradient Mask strictly in the header */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <img 
              src={`/images/love-species/${result.key}.bmp`} 
              alt="background" 
              className="w-full h-full object-cover object-right transform scale-125 origin-right"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            {/* Dark gradient from left to right */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#121212] via-[#121212]/90 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/30 to-transparent opacity-90" />
          </div>

          <div className="relative z-10 px-5 pb-5 pt-2 flex flex-col h-full justify-end">
            <div className="relative flex flex-col items-start w-full">
              <div className="text-[11px] typewriter font-bold text-[#fdfbf7]/70 tracking-widest drop-shadow-md mb-6">
                [ 经鉴定，您的亲密关系变种为 ]
              </div>
              
              <h1 
                className="text-[2.2rem] sm:text-4xl font-black uppercase tracking-tighter leading-tight drop-shadow-lg text-white mb-5 whitespace-nowrap" 
                style={{ color: currentTheme, textShadow: '0 4px 15px rgba(0,0,0,0.9)' }}
              >
                {result.title}
              </h1>
              
              <div className="w-full flex justify-start items-center mb-6">
                <span className="typewriter text-[11px] font-bold text-[#fdfbf7] border border-[#fdfbf7]/50 px-3 py-1 backdrop-blur-sm bg-black/40 shadow-[0_0_8px_rgba(255,255,255,0.15)] tracking-widest whitespace-nowrap">
                  MBTI: {getMBTI(result.key)}
                </span>
              </div>
              
              <div className="text-[9px] font-bold typewriter tracking-widest text-[#fdfbf7]/80 whitespace-nowrap">
                您是第 <span style={{ color: currentTheme }} className="text-[10px]">{adoptedCount.toLocaleString()}</span> 位解锁该档案的特工
              </div>

              {/* Red Stamp Overlay */}
              <div className="absolute bottom-1 right-0 z-20 pointer-events-none opacity-90 transform translate-x-2">
                <div 
                  className="stamp-border transform rotate-[-15deg] text-sm px-2 py-1 bg-transparent border-2 font-black typewriter tracking-widest shadow-xl whitespace-nowrap"
                  style={{ color: currentTheme, borderColor: currentTheme, textShadow: '0 0 10px currentColor', boxShadow: `inset 0 0 10px ${currentTheme}40, 0 0 10px ${currentTheme}40` }}
                >
                  {getStampText(result.key)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Foreground Content - Bright Theme Body */}
        <div className="w-full relative z-10 px-5 pt-6 pb-8 text-[#121212] bg-[url('/grid.svg')] bg-center">
          {/* Tint background with theme color */}
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: currentTheme, opacity: 0.12 }}></div>
          
          {/* Tags */}
          <div className="relative flex flex-wrap justify-center gap-2 mb-2 z-10">
            {result.tags?.map((tag: string, idx: number) => (
              <span key={idx} className="text-[10px] font-bold typewriter border-2 border-[#121212] px-3 py-1 text-[#121212] bg-white shadow-[2px_2px_0px_rgba(0,0,0,1)] rounded-sm whitespace-nowrap">
                🐾 {tag}
              </span>
            ))}
          </div>

          {/* Radar Chart Section */}
          <div className="relative -mt-2 -mb-2 z-10">
            <RadarChart data={radarData} themeColor={currentTheme} />
          </div>

          {/* Detailed Report Region */}
          <div className="relative flex flex-col w-full">
            {!isUnlocked && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#FDFBF7]/85 backdrop-blur-sm border-t-2 border-[#121212] pt-4 rounded-b-xl overflow-hidden mt-2 px-4">
                <div className="w-14 h-14 border-4 border-[#121212] rounded-full flex items-center justify-center text-2xl mb-3 text-[#121212] bg-white shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                  🔒
                </div>
                <h3 className="text-sm font-black text-[#121212] typewriter mb-2 uppercase tracking-widest whitespace-nowrap">绝密机能特工档案已加密</h3>
                <div className="text-[10px] text-[#121212]/80 mb-4 text-left max-w-xs typewriter leading-relaxed font-bold bg-white/70 p-3 border border-[#121212]/15 shadow-xs">
                  <p className="mb-1 text-[#C2185B] font-black">解锁该物种专属深度档案包含：</p>
                  <p>• 深度依恋安全感黑洞与防御面具剖析</p>
                  <p>• 恋爱破防三大高发名场面（具象还原）</p>
                  <p>• 情绪电量损耗账单 & 恋爱脑中毒指数</p>
                  <p>• 伴侣精准顺毛必修课 + 自我脱敏止损解药</p>
                  <p>• 🐾 情侣双物种基因合盘（天生饲养员/死敌测算与微剧本）</p>
                </div>
                <button 
                  onClick={() => setShowModal(true)} 
                  className="archive-btn px-7 py-3 font-black typewriter uppercase tracking-widest text-xs border-2 border-[#121212] bg-[#121212] text-white hover:bg-[#C2185B] hover:border-[#C2185B] transition-colors shadow-[4px_4px_0px_rgba(194,24,91,1)] active:translate-y-0.5 whitespace-nowrap cursor-pointer"
                >
                  [ 申请查阅权限 · 立即解锁 ]
                </button>
                <span className="text-[8.5px] text-[#121212]/60 typewriter font-medium mt-2.5 text-center px-4">
                  ※ 虚拟数字化知识服务，授权码核销发货后不支持退款
                </span>
              </div>
            )}

            <div className="space-y-6 flex-1 pb-4">
              {isUnlocked ? (
                (() => {
                  const activeData = (unlockedData && unlockedData.key === result?.key) 
                    ? { ...result, ...unlockedData } 
                    : result;
                  return (
                    <>
                      {/* 切片 01: 原生性情与深层依恋机制 */}
                      <div className="border-l-[4px] pl-3 py-1 bg-white border border-[#121212]/10 shadow-[2px_2px_0px_rgba(0,0,0,0.05)] p-3.5 rounded-sm" style={{ borderLeftColor: currentTheme }}>
                        <div className="flex items-center justify-between mb-1.5 gap-1.5">
                          <h3 className="text-[11px] typewriter font-black tracking-widest text-[#121212] uppercase flex items-center gap-1.5 whitespace-nowrap shrink-0">
                            <span style={{ color: currentTheme }}>:: 01</span> 原生性情与深层依恋
                          </h3>
                          <span className="text-[9px] typewriter font-bold px-1.5 py-0.5 bg-[#121212]/5 text-[#121212]/70 border border-[#121212]/20 whitespace-nowrap shrink-0">ATTACHMENT</span>
                        </div>
                        <p className="text-[11px] font-medium leading-relaxed text-[#121212]/85 text-justify whitespace-pre-wrap">{activeData.description}</p>
                        {activeData.behavior && (
                          <div className="mt-2.5 pt-2 border-t border-[#121212]/10 text-[10px] text-[#121212]/75 leading-relaxed font-mono whitespace-pre-wrap bg-[#f9f8f5] p-2 rounded-xs">
                            {activeData.behavior}
                          </div>
                        )}
                      </div>

                      {/* 切片 02: 恋爱破防高发名场面 TOP 3 */}
                      {activeData.breakdownScenes && activeData.breakdownScenes.length > 0 && (
                        <div className="border-l-[4px] pl-3 py-1 bg-white border border-[#121212]/10 shadow-[2px_2px_0px_rgba(0,0,0,0.05)] p-3.5 rounded-sm border-l-[#C2185B]">
                          <div className="flex items-center justify-between mb-2 gap-1.5">
                            <h3 className="text-[11px] typewriter font-black tracking-widest text-[#C2185B] uppercase flex items-center gap-1.5 whitespace-nowrap shrink-0">
                              <span>:: 02</span> 恋爱破防高发名场面 TOP 3
                            </h3>
                            <span className="text-[9px] typewriter font-bold px-1.5 py-0.5 bg-[#C2185B]/10 text-[#C2185B] border border-[#C2185B]/30 whitespace-nowrap shrink-0">HIGH RISK</span>
                          </div>
                          <div className="flex flex-col gap-2">
                            {activeData.breakdownScenes.map((scene: string, sIdx: number) => (
                              <div key={sIdx} className="text-[11px] font-medium leading-relaxed text-[#121212]/80 bg-[#fff5f7] border border-[#C2185B]/20 p-2.5 rounded-xs">
                                <span className="font-bold text-[#C2185B] mr-1">#{sIdx + 1}</span>
                                {scene}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 切片 03: 亲密关系隐性损耗账单 */}
                      {activeData.hiddenCost && (
                        <div className="border-l-[4px] pl-3 py-1 bg-white border border-[#121212]/10 shadow-[2px_2px_0px_rgba(0,0,0,0.05)] p-3.5 rounded-sm" style={{ borderLeftColor: currentTheme }}>
                          <div className="flex items-center justify-between mb-2 gap-1.5">
                            <h3 className="text-[11px] typewriter font-black tracking-widest text-[#121212] uppercase flex items-center gap-1.5 whitespace-nowrap shrink-0">
                              <span style={{ color: currentTheme }}>:: 03</span> 亲密关系隐性损耗账单
                            </h3>
                            <span className="text-[9px] typewriter font-bold px-1.5 py-0.5 bg-[#121212]/5 text-[#121212]/70 border border-[#121212]/20 whitespace-nowrap shrink-0">ENERGY INVOICE</span>
                          </div>
                          <div className="grid grid-cols-1 gap-2 pt-1">
                            <div className="flex items-center justify-between p-2 bg-[#f8f7f4] border border-[#121212]/10 rounded-xs">
                              <span className="text-[10px] typewriter font-bold text-[#121212]/70">内耗摩擦等级</span>
                              <span className="text-[11px] typewriter font-black text-[#C2185B]">{activeData.hiddenCost.frictionLevel}</span>
                            </div>
                            <div className="p-2 bg-[#f8f7f4] border border-[#121212]/10 rounded-xs flex flex-col gap-1">
                              <span className="text-[10px] typewriter font-bold text-[#121212]/70">情绪电量年化损耗</span>
                              <span className="text-[11px] font-medium text-[#121212]/85">{activeData.hiddenCost.batteryDrain}</span>
                            </div>
                            <div className="p-2 bg-[#f8f7f4] border border-[#121212]/10 rounded-xs flex flex-col gap-1">
                              <span className="text-[10px] typewriter font-bold text-[#121212]/70">恋爱脑中毒指数</span>
                              <span className="text-[11px] font-medium text-[#121212]/85">{activeData.hiddenCost.toxicIndex}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 切片 04: 高阶双向驯养与脱敏手册 */}
                      <div className="border-l-[4px] pl-3 py-1 bg-white border border-[#121212]/10 shadow-[2px_2px_0px_rgba(0,0,0,0.05)] p-3.5 rounded-sm" style={{ borderLeftColor: currentTheme }}>
                        <div className="flex items-center justify-between mb-2 gap-1.5">
                          <h3 className="text-[11px] typewriter font-black tracking-widest text-[#121212] uppercase flex items-center gap-1.5 whitespace-nowrap shrink-0">
                            <span style={{ color: currentTheme }}>:: 04</span> 高阶双向驯养与自愈手册
                          </h3>
                          <span className="text-[9px] typewriter font-bold px-1.5 py-0.5 bg-[#121212]/5 text-[#121212]/70 border border-[#121212]/20 whitespace-nowrap shrink-0">GUIDE & ANTIDOTE</span>
                        </div>
                        <div className="space-y-2.5">
                          <div className="bg-[#fef9f5] border border-[#d97736]/30 p-2.5 rounded-xs">
                            <span className="text-[10px] typewriter font-black text-[#d97736] tracking-wider block mb-1">🐾 伴侣顺毛必修课</span>
                            <p className="text-[11px] font-medium leading-relaxed text-[#121212]/85">{activeData.careGuide}</p>
                          </div>
                          <div className="bg-[#fff5f5] border border-[#d9534f]/30 p-2.5 rounded-xs">
                            <span className="text-[10px] typewriter font-black text-[#d9534f] tracking-wider block mb-1">⚡ 饲养绝对禁忌</span>
                            <p className="text-[11px] font-medium leading-relaxed text-[#121212]/85">{activeData.redFlag}</p>
                          </div>
                          {activeData.selfCureGuide && activeData.selfCureGuide.length > 0 && (
                            <div className="bg-[#f4f7f5] border border-[#4b8b8b]/30 p-2.5 rounded-xs">
                              <span className="text-[10px] typewriter font-black text-[#4b8b8b] tracking-wider block mb-1">💊 自我脱敏止损解药</span>
                              <div className="flex flex-col gap-1.5 mt-1">
                                {activeData.selfCureGuide.map((cure: string, cIdx: number) => (
                                  <p key={cIdx} className="text-[11px] font-medium leading-relaxed text-[#121212]/85">• {cure}</p>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 切片 05: 情侣双物种基因合盘 (COUPLE SYNERGY) - 深度融合绝佳饲养员与天生死敌 */}
                      {(() => {
                        const rawBest = activeData.bestMatch || result.bestMatch || '';
                        const bestKeyMatch = rawBest.match(/\(([A-Z]{4})\)/);
                        const bestKey = bestKeyMatch ? bestKeyMatch[1] : '';
                        const bestTitle = rawBest.replace(/\(([A-Z]{4})\)/, (m: string, p1: string) => `(${getMBTI(p1)})`);

                        const rawToxic = activeData.toxicMatch || result.toxicMatch || '';
                        const toxicKeyMatch = rawToxic.match(/\(([A-Z]{4})\)/);
                        const toxicKey = toxicKeyMatch ? toxicKeyMatch[1] : '';
                        const toxicTitle = rawToxic.replace(/\(([A-Z]{4})\)/, (m: string, p1: string) => `(${getMBTI(p1)})`);

                        return (
                          <div className="border-2 border-[#121212] bg-white p-3.5 relative shadow-[3px_3px_0px_rgba(0,0,0,1)] flex flex-col gap-3 mt-1">
                            <div className="flex items-center justify-between border-b-2 border-[#121212] pb-2 gap-1.5">
                              <div className="flex items-center gap-1.5 whitespace-nowrap shrink-0">
                                <span className="text-sm">🐾</span>
                                <h3 className="text-[11px] typewriter font-black tracking-widest text-[#121212] uppercase">
                                  :: 05 情侣双物种基因合盘
                                </h3>
                              </div>
                              <span className="text-[9px] typewriter font-bold px-1.5 py-0.5 bg-[#C2185B]/10 text-[#C2185B] border border-[#C2185B]/30 whitespace-nowrap shrink-0">
                                COUPLE SYNERGY
                              </span>
                            </div>

                            {/* 官方极性推荐伴侣快速切换胶囊 */}
                            <div className="flex flex-col gap-1.5">
                              <span className="text-[10px] font-black typewriter text-[#121212]">
                                官方极性档案匹配（点击快速切换）：
                              </span>
                              <div className="grid grid-cols-2 gap-2">
                                {bestKey && (
                                  <button
                                    type="button"
                                    onClick={() => setPartnerKey(bestKey)}
                                    className={`p-2 border-2 text-left flex flex-col gap-0.5 transition-all cursor-pointer rounded-xs ${
                                      partnerKey === bestKey 
                                        ? 'border-[#121212] bg-[#f0f7f5] shadow-[2px_2px_0px_rgba(0,0,0,1)]' 
                                        : 'border-[#121212]/20 bg-white hover:border-[#121212]/50'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="text-[9px] typewriter font-black text-[#4b8b8b] flex items-center gap-1">
                                        🕊️ 绝佳饲养员
                                      </span>
                                      {partnerKey === bestKey && (
                                        <span className="text-[8px] font-bold px-1 bg-[#4b8b8b] text-white rounded-xs scale-90">已选</span>
                                      )}
                                    </div>
                                    <span className="text-[10px] font-black text-[#121212] truncate">
                                      {bestTitle}
                                    </span>
                                  </button>
                                )}

                                {toxicKey && (
                                  <button
                                    type="button"
                                    onClick={() => setPartnerKey(toxicKey)}
                                    className={`p-2 border-2 text-left flex flex-col gap-0.5 transition-all cursor-pointer rounded-xs ${
                                      partnerKey === toxicKey 
                                        ? 'border-[#121212] bg-[#fff5f7] shadow-[2px_2px_0px_rgba(194,24,91,1)]' 
                                        : 'border-[#121212]/20 bg-white hover:border-[#121212]/50'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="text-[9px] typewriter font-black text-[#C2185B] flex items-center gap-1">
                                        🐍 天生死敌
                                      </span>
                                      {partnerKey === toxicKey && (
                                        <span className="text-[8px] font-bold px-1 bg-[#C2185B] text-white rounded-xs scale-90">已选</span>
                                      )}
                                    </div>
                                    <span className="text-[10px] font-black text-[#121212] truncate">
                                      {toxicTitle}
                                    </span>
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* 伴侣物种自由切换器 */}
                            <div className="flex flex-col gap-1.5 bg-[#fbf9f5] border border-[#121212]/15 p-2.5 rounded-xs">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black typewriter text-[#121212]">
                                  或自由选择另一半物种进行合盘：
                                </span>
                                <span className="text-[9px] font-bold text-[#C2185B] typewriter">
                                  {partnerKey === bestKey ? '★ 官方绝配' : partnerKey === toxicKey ? '⚠️ 官方克星' : synergyData.relationType === 'soulmate' ? '★ 天生绝配' : synergyData.relationType === 'toxic' ? '⚠️ 相爱相杀' : '✨ 专属合盘'}
                                </span>
                              </div>
                              <select 
                                value={partnerKey}
                                onChange={(e) => setPartnerKey(e.target.value)}
                                className="w-full bg-white border-2 border-[#121212] py-2 px-2.5 text-[11px] font-black typewriter text-[#121212] shadow-[2px_2px_0px_rgba(0,0,0,1)] outline-none cursor-pointer focus:border-[#C2185B]"
                              >
                                {allSpeciesList.map(s => (
                                  <option key={s.key} value={s.key}>
                                    {s.emoji} {s.title} ({s.mbti}) - {s.tags[0]}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* 官方生态位特写解析（如果选中的是绝配或死敌） */}
                            {partnerKey === bestKey && (
                              <div className="bg-[#f0f7f5] border-2 border-[#4b8b8b]/40 p-3 rounded-xs shadow-[2px_2px_0px_rgba(75,139,139,0.3)]">
                                <div className="flex items-center gap-1 mb-1">
                                  <span className="text-xs">🕊️</span>
                                  <span className="text-[10px] font-black text-[#4b8b8b] typewriter tracking-wider">
                                    绝佳饲养员官方定论 (SOULMATE)
                                  </span>
                                </div>
                                <p className="text-[10.5px] font-medium leading-relaxed text-[#121212]/85 text-justify">
                                  {activeData.bestMatchReason || result.bestMatchReason}
                                </p>
                              </div>
                            )}

                            {partnerKey === toxicKey && (
                              <div className="bg-[#fff5f7] border-2 border-[#C2185B]/40 p-3 rounded-xs shadow-[2px_2px_0px_rgba(194,24,91,0.3)]">
                                <div className="flex items-center gap-1 mb-1">
                                  <span className="text-xs">🐍</span>
                                  <span className="text-[10px] font-black text-[#C2185B] typewriter tracking-wider">
                                    天生死敌官方定论 (TOXIC MATCH)
                                  </span>
                                </div>
                                <p className="text-[10.5px] font-medium leading-relaxed text-[#121212]/85 text-justify">
                                  {activeData.toxicMatchReason || result.toxicMatchReason}
                                </p>
                              </div>
                            )}

                            {/* 双物种基因碰撞展示看板 */}
                            <div className="bg-gradient-to-br from-[#fbf9f5] to-[#f2eee9] border-2 border-[#121212] p-3 flex flex-col gap-2.5 relative overflow-hidden">
                              {/* 顶栏双物种徽章碰撞 */}
                              <div className="flex items-center justify-between gap-2">
                                {/* 我方物种 */}
                                <div className="flex-1 bg-white border-2 border-[#121212] p-2 flex flex-col items-center text-center shadow-[2px_2px_0px_rgba(0,0,0,0.8)]">
                                  <span className="text-2xl mb-0.5">{synergyData.mySpecies.emoji}</span>
                                  <span className="text-[10px] font-black text-[#121212] truncate max-w-full">{synergyData.mySpecies.title}</span>
                                  <span className="text-[8px] font-mono text-[#666]">{synergyData.mySpecies.mbti} · 我</span>
                                </div>

                                {/* 契合度环形分数 */}
                                <div className="flex flex-col items-center justify-center px-1">
                                  <span className="text-[8.5px] font-black text-[#C2185B] typewriter tracking-tighter">契合指数</span>
                                  <div className="text-xl font-black text-[#C2185B] font-mono tracking-tight my-0.5">
                                    {synergyData.score}%
                                  </div>
                                  <span className="text-[7.5px] font-bold px-1.5 py-0.2 bg-[#C2185B] text-white rounded-xs scale-90">
                                    {synergyData.relationType === 'soulmate' ? '天作之合' : synergyData.relationType === 'toxic' ? '修罗拉扯' : '步调互补'}
                                  </span>
                                </div>

                                {/* 伴侣物种 */}
                                <div className="flex-1 bg-white border-2 border-[#121212] p-2 flex flex-col items-center text-center shadow-[2px_2px_0px_rgba(0,0,0,0.8)]">
                                  <span className="text-2xl mb-0.5">{synergyData.partnerSpecies.emoji}</span>
                                  <span className="text-[10px] font-black text-[#121212] truncate max-w-full">{synergyData.partnerSpecies.title}</span>
                                  <span className="text-[8px] font-mono text-[#666]">{synergyData.partnerSpecies.mbti} · TA</span>
                                </div>
                              </div>

                              {/* 评级标签 */}
                              <div className="bg-white border border-[#121212]/20 p-2 text-center rounded-xs">
                                <span className="text-[11px] font-black typewriter text-[#121212] block mb-0.5">
                                  {synergyData.tierTitle}
                                </span>
                                <span className="text-[9.5px] font-medium text-[#121212]/75">
                                  {synergyData.synergyTone}
                                </span>
                              </div>

                              {/* 日常微镜头 */}
                              <div className="bg-white/95 border border-[#121212]/15 p-2.5 rounded-xs">
                                <div className="flex items-center gap-1 mb-1">
                                  <span className="text-xs">🎬</span>
                                  <span className="text-[10px] font-black text-[#121212] typewriter tracking-wider">日常相处微镜头</span>
                                </div>
                                <p className="text-[10.5px] font-medium leading-relaxed text-[#121212]/85 text-justify">
                                  {synergyData.interactionScene}
                                </p>
                              </div>

                              {/* 高甜默契瞬间 */}
                              <div className="bg-[#fff9fa] border border-[#C2185B]/25 p-2.5 rounded-xs">
                                <div className="flex items-center gap-1 mb-1">
                                  <span className="text-xs">🍬</span>
                                  <span className="text-[10px] font-black text-[#C2185B] typewriter tracking-wider">高甜默契瞬间</span>
                                </div>
                                <p className="text-[10.5px] font-medium leading-relaxed text-[#121212]/85 text-justify">
                                  {synergyData.sweetMoment}
                                </p>
                              </div>

                              {/* 相处雷区 */}
                              <div className="bg-[#fffdf5] border border-amber-400/40 p-2.5 rounded-xs">
                                <div className="flex items-center gap-1 mb-1">
                                  <span className="text-xs">⚠️</span>
                                  <span className="text-[10px] font-black text-amber-700 typewriter tracking-wider">相处雷区避坑指南</span>
                                </div>
                                <p className="text-[10.5px] font-medium leading-relaxed text-[#121212]/85 text-justify">
                                  {synergyData.dangerNotice}
                                </p>
                              </div>

                              {/* 通关密码 */}
                              <div className="bg-[#f2f7f5] border border-[#4b8b8b]/30 p-2 text-center rounded-xs">
                                <span className="text-[9.5px] font-black text-[#4b8b8b] typewriter">
                                  🔑 通关密码：{synergyData.secretCode}
                                </span>
                              </div>

                              {/* 查岗裂变互测按钮 */}
                              <button
                                type="button"
                                onClick={handleCopyCoupleInvite}
                                className="w-full mt-1 py-2.5 bg-[#121212] text-white text-[10px] font-black typewriter tracking-widest uppercase hover:bg-[#C2185B] active:scale-[0.98] transition-all shadow-[2px_2px_0px_rgba(194,24,91,1)] flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <span>🐾 复制查岗暗号 · 发给TA测测</span>
                              </button>
                            </div>
                          </div>
                        );
                      })()}
                    </>
                  );
                })()
              ) : (
                /* 未解锁时的诱饵排版 */
                <div className="space-y-4 opacity-25 select-none pointer-events-none filter blur-[3px]">
                  <div className="border-l-[4px] pl-3 py-1 bg-white border border-[#121212]/10 p-3" style={{ borderLeftColor: currentTheme }}>
                    <h3 className="text-[11px] font-black text-[#121212] mb-1.5 uppercase">:: 01 原生性情与深层依恋</h3>
                    <p className="text-[11px] text-[#121212]/80">你在感情中拥有极具辨识度的依恋模式与防御机制，隐藏着独特的安全感黑洞...</p>
                  </div>
                  <div className="border-l-[4px] pl-3 py-1 bg-white border border-[#121212]/10 p-3" style={{ borderLeftColor: currentTheme }}>
                    <h3 className="text-[11px] font-black text-[#121212] mb-1.5 uppercase">:: 02 恋爱破防高发名场面 TOP 3</h3>
                    <p className="text-[11px] text-[#121212]/80">高敏内耗场景、查岗微表情推敲、断崖式冷淡破防名场面全面还原...</p>
                  </div>
                  <div className="border-l-[4px] pl-3 py-1 bg-white border border-[#121212]/10 p-3" style={{ borderLeftColor: currentTheme }}>
                    <h3 className="text-[11px] font-black text-[#121212] mb-1.5 uppercase">:: 03 隐性损耗账单与饲养手册</h3>
                    <div className="h-16 bg-gray-200 rounded"></div>
                  </div>
                  <div className="border-l-[4px] pl-3 py-1 bg-white border border-[#121212]/10 p-3" style={{ borderLeftColor: currentTheme }}>
                    <h3 className="text-[11px] font-black text-[#121212] mb-1.5 uppercase">:: 04 高阶双向驯养与自愈手册</h3>
                    <p className="text-[11px] text-[#121212]/80">伴侣精准顺毛必修课与自我脱敏止损解药全面解锁...</p>
                  </div>
                  <div className="border-l-[4px] pl-3 py-1 bg-white border border-[#121212]/10 p-3" style={{ borderLeftColor: currentTheme }}>
                    <h3 className="text-[11px] font-black text-[#121212] mb-1.5 uppercase">:: 05 情侣双物种基因合盘 · 查岗互测</h3>
                    <p className="text-[11px] text-[#121212]/80">支持全量16×16物种契合度即时测算、绝配与死敌速配、高甜微剧本与查岗暗号...</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* 合规说明与千帆正版防伪印章 */}
            <div className="mt-5 pt-3 border-t-2 border-dashed border-[#121212]/30 flex flex-col gap-2 relative">
              {/* 复古红色防伪钢印 */}
              <div className="absolute right-2 -top-10 pointer-events-none transform -rotate-12 select-none z-10">
                <div className="w-[78px] h-[78px] rounded-full border-2 border-dashed border-[#C2185B] flex items-center justify-center p-0.5 bg-[#FDFBF7]/80 backdrop-blur-[1px] shadow-xs">
                  <div className="w-[68px] h-[68px] rounded-full border border-[#C2185B] flex flex-col items-center justify-center text-[#C2185B]">
                    <span className="text-[6px] font-black tracking-widest uppercase">QIANFAN OFFICIAL</span>
                    <span className="text-[9.5px] font-black tracking-tighter my-0.5">千帆正版</span>
                    <span className="text-[7.5px] font-bold tracking-wider">绝密特工档案</span>
                    <span className="text-[5.5px] font-mono tracking-tight opacity-85 mt-0.5">AUTH-CERTIFIED</span>
                  </div>
                </div>
              </div>

              {/* 官方合规防退款声明 */}
              <div className="text-[8.5px] text-[#121212]/60 leading-relaxed font-mono pr-20">
                <p>※ 合规须知：本测评为虚拟数字化知识服务，卡密授权码一经核销发货即生效交付，不支持退款。</p>
              </div>

              {/* Footer Receipt Code */}
              <div className="flex items-center justify-between pt-2 border-t border-[#121212]/15">
                <div className="flex flex-col gap-0.5">
                  <span className="typewriter text-[9px] font-black text-[#121212] tracking-wider">恋爱物种观测所 · 亲密关系基因实验室 签发</span>
                  <span className="typewriter text-[8px] font-bold text-[#121212]/50">DOC_SERIES: LS-{result?.key || 'SPEC'}-{new Date().toISOString().split('T')[0].replace(/-/g, '')}</span>
                </div>
                <div className="flex flex-col items-end opacity-50">
                  <span className="text-[8px] font-bold text-[#121212] tracking-widest">仅供娱乐参考</span>
                  <span className="text-[7px] font-medium text-[#121212] tracking-wider mt-0.5">FOR ENTERTAINMENT ONLY</span>
                </div>
              </div>

              {/* 截屏瞬间动态挂载纯前端矢量二维码：常态网页完全隐藏，绝不破坏特工机密档案硬核质感 */}
              {isGeneratingImage && (
                <div id="love-species-qrcode-container" className="mt-4 pt-3 border-t-2 border-dashed border-[#121212] flex flex-col items-center justify-center text-center animate-fadeIn w-full">
                  <div className="bg-white border-2 border-[#121212] p-2 shadow-[3px_3px_0px_#121212] inline-block mb-2">
                    {qrSvg ? (
                      <div 
                        className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                        dangerouslySetInnerHTML={{ __html: qrSvg }}
                      />
                    ) : (
                      <div className="w-24 h-24 sm:w-28 sm:h-28 bg-[#121212] flex items-center justify-center text-white text-[10px] font-bold typewriter">
                        恋爱物种观测所
                      </div>
                    )}
                  </div>
                  <div className="typewriter">
                    <div className="text-[10px] font-black tracking-wider uppercase text-[#121212]">
                      [ 扫码鉴定 · 测测你的恋爱物种与伴侣契合度 ]
                    </div>
                    <p className="text-[8.5px] text-[#121212]/70 font-bold mt-0.5 tracking-tight">
                      长按扫码立即测算 · 查收你的专属亲密关系变种档案
                    </p>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </motion.div>

      {/* Action Buttons Fixed Overlay */}
      <div className={`fixed bottom-0 left-0 right-0 p-4 pb-6 bg-gradient-to-t from-[#e8e6e1] via-[#e8e6e1]/90 to-transparent flex flex-col gap-3 z-50 transition-all duration-700 delay-300 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="flex gap-3 w-full max-w-sm mx-auto">
          <button 
              onClick={onRestart}
              className="flex-1 py-4 bg-white border-2 border-[#121212] text-[#121212] text-[10px] font-black uppercase tracking-widest hover:bg-[#f4f4f4] active:scale-[0.98] transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)]"
          >
              重新提交鉴定
          </button>
          <button 
              onClick={handleSave}
              disabled={isGeneratingImage}
              className="flex-[1.5] py-4 bg-[#121212] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#C2185B] active:translate-y-1 transition-all shadow-[4px_4px_0px_rgba(194,24,91,1)] active:shadow-none disabled:opacity-60 cursor-pointer"
          >
              {saveBtnText}
          </button>
        </div>
        <button 
            type="button"
            onClick={() => window.location.href = '/'} 
            className="w-full max-w-sm mx-auto min-h-[44px] py-1 bg-transparent text-[#121212]/50 text-center text-[10px] font-bold uppercase tracking-widest hover:text-[#121212] transition-colors touch-manipulation cursor-pointer flex items-center justify-center underline underline-offset-4"
        >
            返回恋爱测算大厅
        </button>
      </div>
      
      {/* Paywall Verification Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#121212]/80 backdrop-blur-md p-4"
          >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-[#FDFBF7] border-4 border-[#121212] p-8 max-w-sm w-full text-center shadow-[8px_8px_0px_rgba(194,24,91,1)] relative"
              >
                  <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 typewriter text-xl font-bold text-[#121212] hover:text-[#C2185B] transition-colors">[X]</button>
                  
                  <div className="w-14 h-14 border-4 border-[#121212] rounded-full flex items-center justify-center text-2xl mb-4 mx-auto text-[#121212] bg-white shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                    🔑
                  </div>
                  
                  <h3 className="text-lg font-black mb-2 text-[#121212] uppercase typewriter tracking-widest border-b-2 border-[#121212] pb-3">查阅授权验证</h3>
                  <p className="text-[10px] text-[#121212]/70 mb-1.5 px-2 mt-4 typewriter font-bold">请输入授权码以解锁该物种特工的完整档案资料。请通过安安店铺获取。</p>
                  <p className="text-[8.5px] text-[#121212]/55 mb-5 px-2 font-mono leading-tight">※ 虚拟数字化知识服务，授权码一经核销发货即生效交付，不支持退款</p>
                  
                  <input 
                    value={unlockCode} 
                    onChange={(e) => setUnlockCode(e.target.value)} 
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleVerify();
                    }}
                    type="text" 
                    placeholder="输入授权码..." 
                    className="w-full bg-white border-2 border-[#121212] p-4 mb-2 outline-none focus:border-[#C2185B] transition-all font-mono text-center tracking-widest text-[#121212] placeholder:text-[#121212]/30 uppercase font-black" 
                  />
                  
                  {verifyError && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-2 mb-4 mt-2">
                      <p className="text-[#C2185B] font-bold typewriter text-[10px] text-center tracking-widest uppercase">&gt; 错误: {verifyError}</p>
                      <button 
                        onClick={() => window.open('https://xhslink.com/m/Atwtf3Cy6FR', '_blank')} 
                        className="w-full bg-white text-[#121212] font-bold text-[10px] py-3 tracking-widest uppercase hover:bg-[#f4f4f4] transition-all border-2 border-[#121212] shadow-[4px_4px_0px_rgba(18,18,18,1)] active:shadow-none active:translate-y-1"
                      >
                         前往安安店铺
                      </button>
                    </motion.div>
                  )}
                  
                  <button 
                    onClick={handleVerify} 
                    disabled={isVerifying} 
                    className="w-full bg-[#121212] text-white font-black typewriter p-4 tracking-widest uppercase hover:bg-[#C2185B] active:scale-[0.98] transition-all disabled:opacity-50 mt-4 shadow-[4px_4px_0px_rgba(194,24,91,1)]"
                  >
                     {isVerifying ? '校验中...' : '授权访问'}
                  </button>
              </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 顶部硬核 Toast 浮动提示 */}
      {showToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[170] bg-[#121212] text-white border-2 border-[#C2185B] px-4 py-2.5 shadow-[4px_4px_0px_#C2185B] flex items-center gap-2 text-xs font-black typewriter tracking-wide animate-bounce">
          <span className="text-[#FFE600] font-mono text-sm font-bold">✔</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 移动端/微信端专属：长图保存与图文交付弹窗 */}
      {previewImage && (
        <div className="fixed inset-0 z-[160] bg-[#121212]/90 backdrop-blur-md flex flex-col items-center justify-between p-3 sm:p-4 font-sans animate-fadeIn">
          {/* 顶部标题与关闭按钮 */}
          <div className="w-full max-w-sm flex items-center justify-between py-2 border-b border-white/20 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-[#C2185B] rounded-full animate-ping"></span>
              <span className="text-white font-black text-xs sm:text-sm tracking-wider uppercase typewriter">
                特工档案长图已就绪
              </span>
            </div>
            <button 
              onClick={() => setPreviewImage(null)} 
              className="text-white hover:text-white font-mono font-black text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 border border-white/30 rounded cursor-pointer touch-manipulation active:scale-95 transition-all"
            >
              ✕ 关闭
            </button>
          </div>

          {/* 中间图片核心交互区：长图展示，支持长按保存到相册或发送给微信朋友 */}
          <div className="flex-1 w-full max-w-sm overflow-y-auto my-2.5 flex flex-col items-center hide-scrollbar rounded shadow-[0_8px_30px_rgba(0,0,0,0.8)]">
            {/* 强视觉长按指引条 */}
            <div className="bg-[#FFE600] text-[#121212] text-[11px] sm:text-xs font-black py-2.5 px-3 w-full text-center border-2 border-[#121212] sticky top-0 z-10 shadow-sm flex items-center justify-center gap-1.5 typewriter">
              <span>👇</span>
              <span>请「长按下方图片」保存到相册或发给朋友</span>
            </div>
            <div className="p-1 bg-[#FDFBF7] border-2 border-t-0 border-[#121212] w-full flex justify-center">
              <img 
                src={previewImage} 
                alt="恋爱物种专属特工档案长图" 
                className="w-full max-w-[320px] h-auto object-contain block select-none pointer-events-auto shadow-md"
                style={{ touchAction: 'auto', WebkitTouchCallout: 'default' }}
              />
            </div>
          </div>

          {/* 底部贴心指引卡片 */}
          <div className="w-full max-w-sm bg-[#FDFBF7] border-4 border-[#121212] p-3.5 shadow-[6px_6px_0px_#121212] flex flex-col gap-2 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-black text-[#121212]">
                <span className="text-emerald-600 text-sm font-black">✔</span>
                <span>查岗种草文案已复制</span>
              </div>
              <button 
                onClick={() => {
                  const shareUrl = buildLoveSpeciesShareUrl(result);
                  const shareCopy = generateLoveSpeciesShareCopy(result, userInfo, shareUrl);
                  syncCopyText(shareCopy);
                  setToastMessage('文案已重新复制！');
                  setShowToast(true);
                  setTimeout(() => setShowToast(false), 2000);
                }}
                className="text-[10px] text-[#C2185B] underline font-bold typewriter hover:text-[#121212] cursor-pointer"
              >
                [ 重新复制文案 ]
              </button>
            </div>
            <p className="text-[10px] text-[#121212]/70 font-bold leading-tight typewriter">
              💡 去微信发朋友圈或聊天时：长按输入框「粘贴」文案，再从相册选择刚保存的特工长图即可！
            </p>
            <button 
              onClick={() => setPreviewImage(null)} 
              className="w-full bg-[#121212] text-white font-black text-xs py-3 border-2 border-[#121212] shadow-[3px_3px_0px_rgba(194,24,91,1)] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer touch-manipulation uppercase typewriter"
            >
              我知道了 · 返回档案
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
