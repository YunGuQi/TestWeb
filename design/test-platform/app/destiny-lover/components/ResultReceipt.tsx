'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toPng } from 'html-to-image';
import { generateSignature } from '../../../lib/security';
import {
  generateDestinyQrCodeSvg,
  buildDestinyShareUrl,
  generateDestinyShareCopy,
  copyImageAndTextToClipboard,
  syncCopyText,
  isMobileDevice,
  isWeChatEnvironment
} from '../utils/share';

interface ResultReceiptProps {
  result: any;
  userInfo: { nickname: string; status: 'single' | 'dating' };
  onRestart: () => void;
}

// 智能结构化解析长文案，消除拥挤感并提取模块
function parseDescription(desc: string) {
  if (!desc) return { intro: '', nature: '', guide: '', warning: '' };
  
  const natureIdx = desc.indexOf('【性格透视】');
  const guideIdx = desc.indexOf('【恋爱指南】');
  const warningIdx = desc.indexOf('【避雷建议】');

  let intro = desc;
  let nature = '';
  let guide = '';
  let warning = '';

  if (natureIdx !== -1) {
    intro = desc.substring(0, natureIdx).trim();
    const rest1 = desc.substring(natureIdx + 6);
    
    if (guideIdx !== -1) {
      const guideInRest = rest1.indexOf('【恋爱指南】');
      nature = rest1.substring(0, guideInRest).trim();
      const rest2 = rest1.substring(guideInRest + 6);
      
      if (warningIdx !== -1) {
        const warningInRest = rest2.indexOf('【避雷建议】');
        guide = rest2.substring(0, warningInRest).trim();
        warning = rest2.substring(warningInRest + 6).trim();
      } else {
        guide = rest2.trim();
      }
    } else if (warningIdx !== -1) {
      const warningInRest = rest1.indexOf('【避雷建议】');
      nature = rest1.substring(0, warningInRest).trim();
      warning = rest1.substring(warningInRest + 6).trim();
    } else {
      nature = rest1.trim();
    }
  }

  return { intro, nature, guide, warning };
}

// 16 大画像专属新中式电影感情绪高光配色方案
interface ProfileTheme {
  primary: string;
  gradient: string;
  tagBorder: string;
  tagText: string;
  glow: string;
  badgeBg: string;
  badgeBorder: string;
  numColor: string;
  subColor: string;
}

const DEFAULT_THEME: ProfileTheme = {
  primary: "#E5C158",
  gradient: "linear-gradient(135deg, #FFFFFF 15%, #F5E5B8 55%, #D4AF37 100%)",
  tagBorder: "rgba(229, 193, 88, 0.6)",
  tagText: "#F5E5B8",
  glow: "0 2px 14px rgba(212, 175, 55, 0.45)",
  badgeBg: "rgba(20, 15, 18, 0.75)",
  badgeBorder: "rgba(229, 193, 88, 0.35)",
  numColor: "#F5E5B8",
  subColor: "rgba(245, 235, 220, 0.9)"
};

const THEME_MAP: Record<string, ProfileTheme> = {
  "炽热破风者": {
    primary: "#FF5252",
    gradient: "linear-gradient(135deg, #FFF0F0 10%, #FF8A80 50%, #FF5252 100%)",
    tagBorder: "rgba(255, 82, 82, 0.6)",
    tagText: "#FF8A80",
    glow: "0 2px 14px rgba(255, 82, 82, 0.5)",
    badgeBg: "rgba(30, 10, 12, 0.75)",
    badgeBorder: "rgba(255, 82, 82, 0.35)",
    numColor: "#FF8A80",
    subColor: "rgba(255, 230, 230, 0.9)"
  },
  "铁腕执棋人": {
    primary: "#E5C158",
    gradient: "linear-gradient(135deg, #FFFFFF 15%, #F5E5B8 55%, #D4AF37 100%)",
    tagBorder: "rgba(229, 193, 88, 0.6)",
    tagText: "#F5E5B8",
    glow: "0 2px 14px rgba(212, 175, 55, 0.45)",
    badgeBg: "rgba(18, 20, 28, 0.75)",
    badgeBorder: "rgba(229, 193, 88, 0.35)",
    numColor: "#F5E5B8",
    subColor: "rgba(245, 235, 220, 0.9)"
  },
  "傲娇护短狂魔": {
    primary: "#FF7043",
    gradient: "linear-gradient(135deg, #FFF5EE 10%, #FFAB91 50%, #FF7043 100%)",
    tagBorder: "rgba(255, 112, 67, 0.6)",
    tagText: "#FFAB91",
    glow: "0 2px 14px rgba(255, 112, 67, 0.45)",
    badgeBg: "rgba(30, 15, 12, 0.75)",
    badgeBorder: "rgba(255, 112, 67, 0.35)",
    numColor: "#FFAB91",
    subColor: "rgba(255, 235, 225, 0.9)"
  },
  "生活规划家": {
    primary: "#90CAF9",
    gradient: "linear-gradient(135deg, #FFFFFF 15%, #E3F2FD 50%, #90CAF9 100%)",
    tagBorder: "rgba(144, 202, 249, 0.6)",
    tagText: "#BBDEFB",
    glow: "0 2px 14px rgba(144, 202, 249, 0.45)",
    badgeBg: "rgba(15, 20, 26, 0.75)",
    badgeBorder: "rgba(144, 202, 249, 0.35)",
    numColor: "#BBDEFB",
    subColor: "rgba(230, 240, 250, 0.9)"
  },
  "浪漫策动者": {
    primary: "#CE93D8",
    gradient: "linear-gradient(135deg, #FAF5FF 10%, #E1BEE7 50%, #BA68C8 100%)",
    tagBorder: "rgba(206, 147, 216, 0.6)",
    tagText: "#E1BEE7",
    glow: "0 2px 14px rgba(186, 104, 200, 0.45)",
    badgeBg: "rgba(24, 12, 30, 0.75)",
    badgeBorder: "rgba(206, 147, 216, 0.35)",
    numColor: "#E1BEE7",
    subColor: "rgba(245, 230, 250, 0.9)"
  },
  "顶峰并肩者": {
    primary: "#FFD54F",
    gradient: "linear-gradient(135deg, #FFFDE7 10%, #FFE082 50%, #FFB300 100%)",
    tagBorder: "rgba(255, 213, 79, 0.6)",
    tagText: "#FFE082",
    glow: "0 2px 14px rgba(255, 179, 0, 0.45)",
    badgeBg: "rgba(26, 22, 14, 0.75)",
    badgeBorder: "rgba(255, 213, 79, 0.35)",
    numColor: "#FFE082",
    subColor: "rgba(255, 248, 225, 0.9)"
  },
  "清冷隐世策士": {
    primary: "#80CBC4",
    gradient: "linear-gradient(135deg, #F0FDF4 10%, #B2DFDB 50%, #4DB6AC 100%)",
    tagBorder: "rgba(128, 203, 196, 0.6)",
    tagText: "#B2DFDB",
    glow: "0 2px 14px rgba(77, 182, 172, 0.45)",
    badgeBg: "rgba(12, 22, 20, 0.75)",
    badgeBorder: "rgba(128, 203, 196, 0.35)",
    numColor: "#B2DFDB",
    subColor: "rgba(235, 248, 245, 0.9)"
  },
  "人间主心骨": {
    primary: "#FFCC80",
    gradient: "linear-gradient(135deg, #FFF8E7 10%, #FFE0B2 50%, #FFA726 100%)",
    tagBorder: "rgba(255, 204, 128, 0.6)",
    tagText: "#FFE0B2",
    glow: "0 2px 14px rgba(255, 167, 38, 0.45)",
    badgeBg: "rgba(28, 20, 12, 0.75)",
    badgeBorder: "rgba(255, 204, 128, 0.35)",
    numColor: "#FFE0B2",
    subColor: "rgba(255, 245, 230, 0.9)"
  },
  "破冰直球手": {
    primary: "#FFA726",
    gradient: "linear-gradient(135deg, #FFF9E6 10%, #FFCC80 50%, #FF9800 100%)",
    tagBorder: "rgba(255, 167, 38, 0.6)",
    tagText: "#FFE082",
    glow: "0 2px 14px rgba(255, 152, 0, 0.45)",
    badgeBg: "rgba(30, 20, 10, 0.75)",
    badgeBorder: "rgba(255, 167, 38, 0.35)",
    numColor: "#FFCC80",
    subColor: "rgba(255, 245, 225, 0.9)"
  },
  "硬核守护骑士": {
    primary: "#D7CCC8",
    gradient: "linear-gradient(135deg, #FFFFFF 15%, #EFEBE9 50%, #BCAAA4 100%)",
    tagBorder: "rgba(215, 204, 200, 0.6)",
    tagText: "#D7CCC8",
    glow: "0 2px 14px rgba(188, 170, 164, 0.45)",
    badgeBg: "rgba(24, 20, 18, 0.75)",
    badgeBorder: "rgba(215, 204, 200, 0.35)",
    numColor: "#EFEBE9",
    subColor: "rgba(245, 240, 238, 0.9)"
  },
  "温柔白月光": {
    primary: "#A5D6A7",
    gradient: "linear-gradient(135deg, #F1F8E9 10%, #C8E6C9 50%, #81C784 100%)",
    tagBorder: "rgba(165, 214, 167, 0.6)",
    tagText: "#C8E6C9",
    glow: "0 2px 14px rgba(129, 199, 132, 0.45)",
    badgeBg: "rgba(14, 24, 16, 0.75)",
    badgeBorder: "rgba(165, 214, 167, 0.35)",
    numColor: "#C8E6C9",
    subColor: "rgba(235, 250, 238, 0.9)"
  },
  "烟火守护者": {
    primary: "#FFAB91",
    gradient: "linear-gradient(135deg, #FBE9E7 10%, #FFCCBC 50%, #FF8A65 100%)",
    tagBorder: "rgba(255, 171, 145, 0.6)",
    tagText: "#FFCCBC",
    glow: "0 2px 14px rgba(255, 138, 101, 0.45)",
    badgeBg: "rgba(30, 16, 12, 0.75)",
    badgeBorder: "rgba(255, 171, 145, 0.35)",
    numColor: "#FFCCBC",
    subColor: "rgba(255, 240, 235, 0.9)"
  },
  "随性漫游诗人": {
    primary: "#80DEEA",
    gradient: "linear-gradient(135deg, #E0F7FA 10%, #B2EBF2 50%, #4DD0E1 100%)",
    tagBorder: "rgba(128, 222, 234, 0.6)",
    tagText: "#B2EBF2",
    glow: "0 2px 14px rgba(77, 208, 225, 0.45)",
    badgeBg: "rgba(10, 22, 26, 0.75)",
    badgeBorder: "rgba(128, 222, 234, 0.35)",
    numColor: "#B2EBF2",
    subColor: "rgba(230, 250, 252, 0.9)"
  },
  "温柔托举者": {
    primary: "#7DD3FC",
    gradient: "linear-gradient(135deg, #F0F9FF 10%, #BAE6FD 50%, #38BDF8 100%)",
    tagBorder: "rgba(125, 211, 252, 0.6)",
    tagText: "#BAE6FD",
    glow: "0 2px 14px rgba(56, 189, 248, 0.45)",
    badgeBg: "rgba(10, 20, 30, 0.75)",
    badgeBorder: "rgba(125, 211, 252, 0.35)",
    numColor: "#BAE6FD",
    subColor: "rgba(230, 245, 255, 0.9)"
  },
  "灵魂知音": {
    primary: "#F48FB1",
    gradient: "linear-gradient(135deg, #FFF1F2 10%, #F8BBD0 50%, #EC407A 100%)",
    tagBorder: "rgba(244, 143, 177, 0.6)",
    tagText: "#F8BBD0",
    glow: "0 2px 14px rgba(236, 64, 122, 0.45)",
    badgeBg: "rgba(28, 12, 20, 0.75)",
    badgeBorder: "rgba(244, 143, 177, 0.35)",
    numColor: "#F8BBD0",
    subColor: "rgba(255, 235, 242, 0.9)"
  },
  "终身避风港": {
    primary: "#6EE7B7",
    gradient: "linear-gradient(135deg, #F0FDF4 10%, #A7F3D0 50%, #34D399 100%)",
    tagBorder: "rgba(110, 231, 183, 0.6)",
    tagText: "#A7F3D0",
    glow: "0 2px 14px rgba(52, 211, 153, 0.45)",
    badgeBg: "rgba(10, 24, 18, 0.75)",
    badgeBorder: "rgba(110, 231, 183, 0.35)",
    numColor: "#A7F3D0",
    subColor: "rgba(230, 250, 240, 0.9)"
  }
};

// 中文结果名称对应的纯大写拼音首字母映射表
const PINYIN_INITIALS_MAP: Record<string, string> = {
  "炽热破风者": "CRPFZ",
  "铁腕执棋人": "TWZQR",
  "傲娇护短狂魔": "AJHDKM",
  "生活规划家": "SHGHJ",
  "浪漫策动者": "LMCDZ",
  "顶峰并肩者": "DFBJZ",
  "清冷隐世策士": "QLYSCS",
  "人间主心骨": "RJZXG",
  "破冰直球手": "PBZQS",
  "硬核守护骑士": "YHSHQS",
  "温柔白月光": "WRBYG",
  "烟火守护者": "YHSHZ",
  "随性漫游诗人": "SXMYSR",
  "温柔托举者": "WRTJZ",
  "灵魂知音": "LHZY",
  "终身避风港": "ZSBFG"
};

// 本地设备缓存协议定义（支持一码全通与多画像隔离）
interface DestinyLoverCacheStorage {
  unlocked: boolean;
  lastVerifiedCode?: string;
  profiles: Record<string, any>;
}

export default function ResultReceipt({ result, userInfo, onRestart }: ResultReceiptProps) {
  const currentTheme = THEME_MAP[result?.title] || DEFAULT_THEME;
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [unlockedData, setUnlockedData] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [unlockCode, setUnlockCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSilentFetching, setIsSilentFetching] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const ticketRef = useRef<HTMLDivElement>(null);

  // 移动端长图预览、纯前端SVG二维码与交互状态
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [qrSvg, setQrSvg] = useState<string>('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [saveBtnText, setSaveBtnText] = useState('分享我的命定恋人');

  // 预生成纯前端矢量 SVG 二维码（零外部网络请求、零 CORS 跨域污染）
  useEffect(() => {
    if (!result) return;
    const shareUrl = buildDestinyShareUrl(result);
    if (shareUrl) {
      generateDestinyQrCodeSvg(shareUrl).then((svg) => {
        if (svg) setQrSvg(svg);
      });
    }
  }, [result?.key, result?.id, result?.title]);

  // 缓存与凭证内存引用
  const lastCodeRef = useRef<string>('');
  const profilesRef = useRef<Record<string, any>>({});

  // 已激活设备自动静默补拉新画像切片
  const silentFetchProfile = async (targetKey: string, codeToUse: string) => {
    if (!targetKey || isSilentFetching) return;
    setIsSilentFetching(true);
    try {
      const payload = JSON.stringify({
        code: (codeToUse || 'CODE-JIE').trim(),
        deviceId: typeof window !== 'undefined' ? localStorage.getItem('deviceId') || 'unknown' : 'unknown',
        testId: 'destiny-lover',
        recordId: 'destiny-lover',
        resultKey: targetKey,
        nickname: userInfo?.nickname || '你',
        status: userInfo?.status || 'single'
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
            const updatedStorage: DestinyLoverCacheStorage = {
              unlocked: true,
              lastVerifiedCode: codeToUse || lastCodeRef.current || '',
              profiles: profilesRef.current
            };
            localStorage.setItem('verified_destiny-lover', JSON.stringify(updatedStorage));
          }
        }
      }
    } catch (err) {
      console.error('命定恋人静默补拉画像切片失败:', err);
    } finally {
      setIsSilentFetching(false);
    }
  };

  useEffect(() => {
    setParticipantCount(Math.floor(Math.random() * 500) + 120);

    if (typeof window !== 'undefined' && result?.key) {
      let deviceUnlocked = false;
      let savedCode = '';
      let localProfiles: Record<string, any> = {};

      const cached = localStorage.getItem('verified_destiny-lover');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.unlocked) {
            deviceUnlocked = true;
            savedCode = parsed.lastVerifiedCode || '';
            if (parsed.profiles && typeof parsed.profiles === 'object') {
              localProfiles = { ...parsed.profiles };
            }
            // 平滑兼容迁移旧版扁平缓存结构
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
          // 当前画像无独立缓存：先置空，决不使用旧画像文案
          setUnlockedData(null);
          // 发起静默补拉
          silentFetchProfile(result.key, savedCode);
        }
      } else {
        setIsUnlocked(false);
        setUnlockedData(null);
      }
    }

    // 延迟显示以实现玉牌浮现的动效
    const timer = setTimeout(() => setShow(true), 300);
    return () => clearTimeout(timer);
  }, [result?.key, userInfo?.nickname, userInfo?.status]);

  if (!result) return null;
  const parsedDesc = parseDescription(result.description);

  const handleVerify = async () => {
    setVerifyError('');
    if (!unlockCode.trim()) {
      setVerifyError('请输入有效的激活码');
      return;
    }
    
    setIsVerifying(true);
    try {
      // 生成签名，防止直接请求绕过浏览器验证
      const payload = JSON.stringify({
        code: unlockCode.trim(),
        deviceId: typeof window !== 'undefined' ? localStorage.getItem('deviceId') || 'unknown' : 'unknown',
        testId: 'destiny-lover',
        recordId: 'destiny-lover',
        resultKey: result?.key,
        nickname: userInfo?.nickname || '你',
        status: userInfo?.status || 'single'
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
      if (data.success) {
        setIsUnlocked(true);
        const unlocked = data.unlockedData || data.result;
        setUnlockedData(unlocked);
        setShowModal(false);

        const trimmedCode = unlockCode.trim();
        lastCodeRef.current = trimmedCode;
        if (result?.key && unlocked) {
          profilesRef.current[result.key] = unlocked;
        }

        if (typeof window !== 'undefined') {
          const storage: DestinyLoverCacheStorage = {
            unlocked: true,
            lastVerifiedCode: trimmedCode,
            profiles: profilesRef.current
          };
          localStorage.setItem('verified_destiny-lover', JSON.stringify(storage));
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

  // 严格画像一致性渲染守卫：只有当已解锁且数据 key 与当前 result.key 严格一致时才判定有效
  const activeUnlocked = Boolean(
    isUnlocked &&
    unlockedData &&
    (unlockedData.key === result?.key || unlockedData.title === result?.title)
  );
  const activeData = activeUnlocked ? unlockedData : null;

  const handleSave = () => {
    if (!isUnlocked) {
      setShowModal(true);
      return;
    }
    if (!ticketRef.current) return;

    // 【手机端权限核心】：在用户点击手势有效的第一毫秒同步将文案写入剪贴板！
    // 杜绝因 setTimeout 或异步截屏耗时导致移动端操作系统判定手势过期而清空剪贴板并报错
    const shareUrl = buildDestinyShareUrl(result);
    const shareCopy = generateDestinyShareCopy(result, userInfo, shareUrl);
    syncCopyText(shareCopy);

    setSaveBtnText('正在生成心动长图...');
    setIsGeneratingImage(true);

    setTimeout(() => {
      const node = ticketRef.current;
      if (!node) {
        setIsGeneratingImage(false);
        setSaveBtnText('保存档案卡');
        return;
      }

      toPng(node, { 
        quality: 1, 
        pixelRatio: 3,
        backgroundColor: '#FAF8F5',
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
            setToastMessage('档案长图已就绪！文案已复制');
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);

            // 普通手机浏览器顺带尝试触发系统文件下载
            try {
              const link = document.createElement('a');
              link.download = `命定恋人心动档案_${userInfo.nickname || '我'}_${Date.now()}.png`;
              link.href = dataUrl;
              link.click();
            } catch (e) {}
          } else {
            // PC 电脑端：触发高清小票文件下载，并写入富文本图文剪贴板
            const link = document.createElement('a');
            link.download = `命定恋人心动档案_${userInfo.nickname || '我'}_${Date.now()}.png`;
            link.href = dataUrl;
            link.click();

            await copyImageAndTextToClipboard(dataUrl, shareCopy);

            setToastMessage('档案卡已保存！分享文案已复制');
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3500);
          }

          setSaveBtnText(isMobile ? '长图已就绪！文案已复制' : '长图已保存！文案已复制');
          setIsGeneratingImage(false);
          setTimeout(() => {
            setSaveBtnText('分享我的命定恋人');
          }, 3000);
        })
        .catch((err) => {
          console.error('保存命定档案图片生成失败:', err);
          setSaveBtnText('保存失败，请重试');
          setIsGeneratingImage(false);
          setTimeout(() => {
            setSaveBtnText('分享我的命定恋人');
          }, 3000);
        });
    }, 180);
  };

  return (
    <main className="flex-1 flex flex-col items-center w-full min-h-[100dvh] py-10 px-4 font-serif relative overflow-y-auto overflow-hidden bg-transparent">


      <div ref={ticketRef} className={`w-full max-w-sm bg-white border-2 border-[#8A2B2B] shadow-[0_32px_80px_rgba(138,43,43,0.18),0_4px_12px_rgba(0,0,0,0.06)] flex flex-col relative rounded-sm transition-all duration-700 ease-out transform ${show ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
          
          {/* Header：古典命盘契约区（融入电影感初遇背景插画与水墨暗调渐变） */}
          <div className="bg-[#1C1415] text-white p-7 flex justify-between items-end relative overflow-hidden rounded-t-sm border-b-2 border-[#8A2B2B]/40 min-h-[210px]">
              {/* 电影感初遇背景插画与智能渐变遮罩 */}
              {(() => {
                const pinyinCode = PINYIN_INITIALS_MAP[result.title] || '';
                const fallbackKey = result.key || (result.id ? String(result.id).replace('r_', '') : '') || 'ldar';
                return (
                  <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
                      <img 
                        src={`/images/destiny-lover/${pinyinCode || fallbackKey}.png`} 
                        alt={result.title || "初遇画卷"} 
                        className="w-full h-full object-cover object-right transform scale-110 origin-right transition-all duration-1000"
                        onError={(e) => {
                          const img = e.currentTarget;
                          // 兜底链条：拼音大写 -> 英文 key -> 中文名
                          if (fallbackKey && !img.src.includes(`/${fallbackKey}.png`)) {
                            img.src = `/images/destiny-lover/${fallbackKey}.png`;
                          } else if (result.title && !img.src.includes(encodeURIComponent(result.title))) {
                            img.src = `/images/destiny-lover/${encodeURIComponent(result.title)}.png`;
                          } else {
                            img.style.display = 'none';
                          }
                        }}
                      />
                      {/* 水墨暗夜左向右平滑渐变，确保左侧文字无干扰且极其清晰 */}
                      <div className="absolute inset-0 bg-gradient-to-r from-[#170E0F] via-[#170E0F]/90 via-50% to-transparent" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#170E0F]/80 via-transparent to-black/30" />
                  </div>
                );
              })()}

              <div className="relative z-10 max-w-[72%]">
                  <div className="flex items-center gap-2 mb-2">
                    <span 
                      className="inline-block px-2 py-0.5 text-[10px] tracking-[0.2em] uppercase font-mono backdrop-blur-xs rounded-xs font-bold"
                      style={{ 
                        border: `1px solid ${currentTheme.tagBorder}`, 
                        color: currentTheme.tagText,
                        backgroundColor: 'rgba(0, 0, 0, 0.45)',
                        boxShadow: `0 0 10px ${currentTheme.tagBorder}`
                      }}
                    >
                      NO. {PINYIN_INITIALS_MAP[result.title] || result.id?.toString().replace('r_', '').toUpperCase() || '001'}
                    </span>
                    <span 
                      className="text-[10px] tracking-widest font-serif"
                      style={{ color: currentTheme.tagText, opacity: 0.9 }}
                    >
                      · 潜意识心动印记 ·
                    </span>
                  </div>

                  {/* 电影感流光渐变大标题 */}
                  <h1 
                    className="text-2xl sm:text-3xl font-black tracking-widest mb-1.5 font-serif whitespace-nowrap"
                    style={{
                      backgroundImage: currentTheme.gradient,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      filter: `drop-shadow(${currentTheme.glow})`
                    }}
                  >
                    {result.title}
                  </h1>

                  {result.subtitle && (
                    <p 
                      className="text-xs tracking-wider font-light drop-shadow-xs"
                      style={{ color: currentTheme.subColor }}
                    >
                      {result.subtitle}
                    </p>
                  )}
                  
                  {/* 契合度人数高光卡片 */}
                  <div 
                    className="mt-4 inline-block px-3 py-1.5 rounded-sm text-[11px] font-sans tracking-widest backdrop-blur-md shadow-sm border whitespace-nowrap"
                    style={{ 
                      backgroundColor: currentTheme.badgeBg,
                      borderColor: currentTheme.badgeBorder
                    }}
                  >
                      <span className="text-white/80">你是第 </span>
                      <span 
                        className="font-mono font-bold text-sm tracking-wider"
                        style={{ 
                          color: currentTheme.numColor, 
                          textShadow: `0 0 10px ${currentTheme.tagBorder}` 
                        }}
                      >
                        {participantCount > 0 ? participantCount : '...'}
                      </span>
                      <span className="text-white/80"> 位完成契合度测算之人</span>
                  </div>
              </div>


          </div>

          {/* Content */}
          <div className="p-7 flex-1 flex flex-col">
              <div className="inline-block mx-auto mb-5 px-4 py-1 bg-[#8A2B2B]/5 border-y border-[#8A2B2B]/30 text-[#8A2B2B] text-xs tracking-[0.25em] font-serif text-center whitespace-nowrap">
                「 {userInfo.nickname} · 专属心动档案 」
              </div>
              
              <div className="flex gap-2 flex-wrap justify-center mb-6">
                  {result.tags?.map((tag: string, idx: number) => (
                    <span key={idx} className="text-xs text-[#8A2B2B] border border-[#8A2B2B]/60 bg-[#8A2B2B]/5 px-3 py-1 rounded-full whitespace-nowrap">
                      {tag.replace('#', '')}
                    </span>
                  ))}
              </div>

              {/* 雷达数据展示 */}
              {result.radar && result.radar.length > 0 && (() => {
                const maxRadarVal = Math.max(...result.radar.map((r: any) => Number(r.value) || 0));
                return (
                  <div className="space-y-4 mb-5 px-1">
                      {result.radar.map((item: any, idx: number) => {
                        const valNum = Number(item.value) || 0;
                        const pStr = valNum.toFixed(1);
                        const isHighest = valNum === maxRadarVal;
                        return (
                          <div key={idx} className="flex items-center gap-3 text-sm border-b border-[#F0F0F0] pb-2.5">
                              <div className="w-24 shrink-0 flex items-center gap-1.5 font-serif text-left">
                                <span className="text-[#5A524A] tracking-widest text-xs">{item.label}</span>
                                {isHighest && (
                                  <span className="text-[9px] bg-[#8A2B2B] text-white px-1 py-0.2 rounded-xs font-sans scale-90 origin-left">
                                    高光
                                  </span>
                                )}
                              </div>
                              <div className="flex-1 h-2 bg-[#F5F5F5] overflow-hidden rounded-full relative">
                                <div 
                                  className="h-full bg-gradient-to-r from-[#8A2B2B] to-[#D99A9A] transition-all duration-700" 
                                  style={{ width: `${pStr}%` }}
                                ></div>
                              </div>
                              <span className="font-bold text-[#2C2825] w-14 text-right font-mono text-xs shrink-0">{pStr}%</span>
                          </div>
                        );
                      })}
                  </div>
                );
              })()}

              {/* 核心分栏内容区 */}
              <div className="mt-2 relative flex flex-col gap-6">
                  {/* 分栏一：【灵魂合盘 · 心智共振】 */}
                  {result.synergy && (
                    <div className="bg-[#FAF8F5] border border-[#8A2B2B]/20 rounded-sm p-4 relative overflow-hidden shadow-sm">
                        <div className="flex items-center justify-between border-b border-[#8A2B2B]/15 pb-2.5 mb-3">
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-[#8A2B2B] rotate-45 shrink-0"></span>
                                <h3 className="font-bold text-[#8A2B2B] text-sm tracking-widest">灵魂合盘 · 心智共振</h3>
                            </div>
                            <span className="bg-[#8A2B2B] text-white text-[11px] px-2 py-0.5 rounded-xs font-mono tracking-wider font-bold">
                                {typeof result.synergy.score === 'number' ? Number(result.synergy.score).toFixed(1) : (result.synergy.score || '96.0')}% 契合
                            </span>
                        </div>

                        <div className="flex flex-col gap-2 text-xs">
                            <div className="flex items-center gap-2">
                                <span className="text-[#8A2B2B] font-bold shrink-0 bg-[#8A2B2B]/10 px-1.5 py-0.5 rounded-xs text-[11px]">共振磁场</span>
                                <span className="text-[#4A3E3D] font-medium tracking-wide">{result.synergy.element}</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="text-[#8A2B2B] font-bold shrink-0 bg-[#8A2B2B]/10 px-1.5 py-0.5 rounded-xs text-[11px] mt-0.5">潜意识羁绊</span>
                                <span className="text-[#5C4A4A] italic tracking-wide leading-relaxed font-serif">{result.synergy.karma}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[#8A2B2B] font-bold shrink-0 bg-[#8A2B2B]/10 px-1.5 py-0.5 rounded-xs text-[11px]">契合格局</span>
                                <span className="text-[#2C2825] font-semibold tracking-wide">{result.synergy.matchType}</span>
                            </div>
                        </div>
                    </div>
                  )}

                  {/* 锁扣与遮罩区域开始 */}
                  <div className="relative">
                      {!isUnlocked && (
                          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gradient-to-b from-white/70 via-white/95 to-white p-6 text-center backdrop-blur-[8px] rounded-sm">
                              <div className="w-12 h-12 rounded-full bg-[#8A2B2B]/10 border border-[#8A2B2B]/30 flex items-center justify-center text-[#8A2B2B] mb-3 shadow-inner">
                                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                  </svg>
                              </div>
                              <h4 className="font-bold text-[#8A2B2B] text-sm tracking-widest mb-1.5">命定恋人专属心动档案已封存</h4>
                              <p className="text-[11px] text-[#7A6B69] leading-relaxed mb-4 max-w-[220px]">
                                  TA 的具象外貌穿搭、专属气味、初遇微镜头及相处指南已全部测算就绪。
                              </p>
                              <button 
                                onClick={() => setShowModal(true)} 
                                className="bg-[#8A2B2B] hover:bg-[#A32626] text-white px-6 py-2.5 rounded-sm text-xs font-medium tracking-widest shadow-md active:scale-95 transition-all flex items-center gap-1.5"
                              >
                                  <span>揭封完整心动画像</span>
                                  <span className="text-xs">➔</span>
                              </button>
                          </div>
                      )}

                      <div className={`flex flex-col gap-6 ${!isUnlocked ? 'filter blur-[4px] select-none pointer-events-none opacity-60' : ''}`}>
                          {/* 分栏二：【心性透视 · 潜意识印记】（结构拆解，告别堆叠，恢复米色底与精巧字号） */}
                          {result.description && (
                            <div className="bg-[#FAF8F5] border border-[#8A2B2B]/20 rounded-sm p-4 relative shadow-sm">
                                <div className="flex items-center gap-2 border-b border-[#8A2B2B]/15 pb-2.5 mb-3">
                                    <span className="w-1.5 h-1.5 bg-[#8A2B2B] rotate-45 shrink-0"></span>
                                    <h3 className="font-bold text-[#8A2B2B] text-sm tracking-widest whitespace-nowrap shrink-0">心性透视 · 潜意识印记</h3>
                                </div>

                                {/* 人设核心引言 */}
                                {parsedDesc.intro && (
                                  <div className="bg-white/80 border-l-2 border-[#8A2B2B] p-2.5 rounded-r-xs mb-2.5 text-[11px] leading-relaxed text-[#3D3331]">
                                      {parsedDesc.intro}
                                  </div>
                                )}

                                <div className="space-y-2.5">
                                    {/* 1. 性格透视 */}
                                    {parsedDesc.nature && (
                                      <div className="bg-white/70 p-2.5 rounded-xs border border-[#8A2B2B]/10">
                                          <div className="flex items-center gap-1 text-[#8A2B2B] font-bold text-[11px] mb-1">
                                              <span>🪞</span>
                                              <span>心性镜像：</span>
                                          </div>
                                          <p className="text-[11px] leading-relaxed text-[#5C4A4A] text-justify">
                                              {parsedDesc.nature}
                                          </p>
                                      </div>
                                    )}

                                    {/* 2. 恋爱指南 */}
                                    {parsedDesc.guide && (
                                      <div className="bg-white/70 p-2.5 rounded-xs border border-[#8A2B2B]/10">
                                          <div className="flex items-center gap-1 text-[#8A2B2B] font-bold text-[11px] mb-1">
                                              <span>🧭</span>
                                              <span>恋爱指南：</span>
                                          </div>
                                          <p className="text-[11px] leading-relaxed text-[#5C4A4A] text-justify">
                                              {parsedDesc.guide}
                                          </p>
                                      </div>
                                    )}

                                    {/* 3. 避雷建议 */}
                                    {parsedDesc.warning && (
                                      <div className="bg-white/70 p-2.5 rounded-xs border border-[#8A2B2B]/10">
                                          <div className="flex items-center gap-1 text-[#8A2B2B] font-bold text-[11px] mb-1">
                                              <span>🛡️</span>
                                              <span>相处红线：</span>
                                          </div>
                                          <p className="text-[11px] leading-relaxed text-[#5C4A4A] text-justify">
                                              {parsedDesc.warning}
                                          </p>
                                      </div>
                                    )}

                                    {/* 兜底直接渲染 */}
                                    {!parsedDesc.nature && !parsedDesc.guide && !parsedDesc.warning && (
                                      <p className="text-[11px] leading-relaxed text-[#5C4A4A] text-justify">
                                          {result.description}
                                      </p>
                                    )}
                                </div>
                            </div>
                          )}

                          {/* 分栏三、四、五：核心付费区域（未核销时渲染高质感骨架屏，真物理遮罩，彻底杜绝 F12 审查白嫖） */}
                          {!isUnlocked ? (
                            <div className="space-y-4 select-none pointer-events-none filter blur-[1.5px] opacity-70">
                                {/* 骨架：致命雷区 */}
                                <div className="bg-[#FAF8F5] border border-[#8A2B2B]/20 rounded-sm p-4 shadow-sm space-y-2.5">
                                    <div className="flex items-center gap-2 border-b border-[#8A2B2B]/15 pb-2.5">
                                        <span className="w-1.5 h-1.5 bg-[#8A2B2B] rotate-45 shrink-0"></span>
                                        <h3 className="font-bold text-[#8A2B2B] text-sm tracking-widest">致命雷区 · 相处警示 TOP 3</h3>
                                    </div>
                                    <div className="h-4 bg-[#8A2B2B]/10 rounded w-full animate-pulse"></div>
                                    <div className="h-4 bg-[#8A2B2B]/10 rounded w-5/6 animate-pulse"></div>
                                    <div className="h-4 bg-[#8A2B2B]/10 rounded w-4/5 animate-pulse"></div>
                                </div>

                                {/* 骨架：亲密关系指南 */}
                                <div className="bg-[#FAF8F5] border border-[#8A2B2B]/20 rounded-sm p-4 shadow-sm space-y-2.5">
                                    <div className="flex items-center gap-2 border-b border-[#8A2B2B]/15 pb-2.5">
                                        <span className="w-1.5 h-1.5 bg-[#8A2B2B] rotate-45 shrink-0"></span>
                                        <h3 className="font-bold text-[#8A2B2B] text-sm tracking-widest">亲密关系指南 · 专属相处锦囊</h3>
                                    </div>
                                    <div className="h-4 bg-[#8A2B2B]/10 rounded w-11/12 animate-pulse"></div>
                                    <div className="h-4 bg-[#8A2B2B]/10 rounded w-3/4 animate-pulse"></div>
                                </div>

                                {/* 骨架：初遇微镜头 */}
                                <div className="bg-[#FAF8F5] border border-[#8A2B2B]/20 rounded-sm p-4 shadow-sm space-y-2.5">
                                    <div className="flex items-center gap-2 border-b border-[#8A2B2B]/15 pb-2.5">
                                        <span className="w-1.5 h-1.5 bg-[#8A2B2B] rotate-45 shrink-0"></span>
                                        <h3 className="font-bold text-[#8A2B2B] text-sm tracking-widest">初遇特写 · 见微镜头</h3>
                                    </div>
                                    <div className="h-4 bg-[#8A2B2B]/10 rounded w-full animate-pulse"></div>
                                    <div className="h-4 bg-[#8A2B2B]/10 rounded w-5/6 animate-pulse"></div>
                                </div>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-6 transition-all duration-700 ease-in-out">
                              {/* 分栏三：【相处默契与致命雷区 TOP 3】 */}
                              {(activeData?.redFlags || result.redFlags) && (activeData?.redFlags || result.redFlags).length > 0 && (
                                <div className="bg-[#FAF8F5] border border-[#8A2B2B]/20 rounded-sm p-4 shadow-sm">
                                    <div className="flex items-center gap-2 border-b border-[#8A2B2B]/15 pb-2.5 mb-3">
                                        <span className="w-1.5 h-1.5 bg-[#8A2B2B] rotate-45 shrink-0"></span>
                                        <h3 className="font-bold text-[#8A2B2B] text-sm tracking-widest whitespace-nowrap shrink-0">致命雷区 · 相处警示 TOP 3</h3>
                                    </div>
                                    <div className="space-y-2.5">
                                        {(activeData?.redFlags || result.redFlags).map((flag: string, idx: number) => (
                                          <div key={idx} className="flex items-start gap-2 bg-white/80 p-2.5 rounded-xs border border-[#8A2B2B]/10">
                                              <span className="bg-[#8A2B2B] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 font-mono font-bold">
                                                  {idx + 1}
                                              </span>
                                              <p className="text-[11px] leading-relaxed text-[#5C4A4A] text-justify">
                                                  {flag}
                                              </p>
                                          </div>
                                        ))}
                                    </div>
                                </div>
                              )}

                              {/* 分栏四：【亲密关系指南 · 专属相处锦囊】 */}
                              {(activeData?.loveAdvice || result.loveAdvice) && (
                                <div className="bg-[#FAF8F5] border border-[#8A2B2B]/20 rounded-sm p-4 shadow-sm">
                                    <div className="flex items-center gap-2 border-b border-[#8A2B2B]/15 pb-2.5 mb-3">
                                        <span className="w-1.5 h-1.5 bg-[#8A2B2B] rotate-45 shrink-0"></span>
                                        <h3 className="font-bold text-[#8A2B2B] text-sm tracking-widest whitespace-nowrap shrink-0">亲密关系指南 · 专属相处锦囊</h3>
                                    </div>
                                    <div className="space-y-3 text-xs">
                                        {(activeData?.loveAdvice || result.loveAdvice).single && (
                                          <div className="bg-white/80 p-3 rounded-xs border border-[#8A2B2B]/15">
                                              <div className="flex items-center gap-1.5 text-[#8A2B2B] font-bold text-[11px] mb-1">
                                                  <span>🏮 单身吸引法：</span>
                                              </div>
                                              <p className="text-[11px] leading-relaxed text-[#4A3E3D] text-justify">
                                                  {(activeData?.loveAdvice || result.loveAdvice).single}
                                              </p>
                                          </div>
                                        )}
                                        {(activeData?.loveAdvice || result.loveAdvice).dating && (
                                          <div className="bg-white/80 p-3 rounded-xs border border-[#8A2B2B]/15">
                                              <div className="flex items-center gap-1.5 text-[#8A2B2B] font-bold text-[11px] mb-1">
                                                  <span>🔒 亲密锁心术：</span>
                                              </div>
                                              <p className="text-[11px] leading-relaxed text-[#4A3E3D] text-justify">
                                                  {(activeData?.loveAdvice || result.loveAdvice).dating}
                                              </p>
                                          </div>
                                        )}
                                    </div>
                                </div>
                              )}

                              {/* 分栏五：【初遇特写 · 见微镜头】 */}
                              {(activeData?.firstMeet || result.firstMeet) ? (
                                <div className="bg-[#FAF8F5] border border-[#8A2B2B]/20 rounded-sm p-4 relative shadow-sm">
                                    <div className="flex items-center gap-2 border-b border-[#8A2B2B]/15 pb-2.5 mb-3">
                                        <span className="w-1.5 h-1.5 bg-[#8A2B2B] rotate-45 shrink-0"></span>
                                        <h3 className="font-bold text-[#8A2B2B] text-sm tracking-widest">初遇特写 · 见微镜头</h3>
                                    </div>

                                    <div className="space-y-2.5 text-xs mb-3">
                                        {(activeData?.firstMeet || result.firstMeet).scene && (
                                          <div className="flex items-start gap-2">
                                              <span className="text-[#8A2B2B] font-bold shrink-0 bg-[#8A2B2B]/10 px-1.5 py-0.5 rounded-xs text-[10px]">出没场景</span>
                                              <span className="text-[#4A3E3D] leading-relaxed text-[11px]">{(activeData?.firstMeet || result.firstMeet).scene}</span>
                                          </div>
                                        )}
                                        {(activeData?.firstMeet || result.firstMeet).visual && (
                                          <div className="flex items-start gap-2">
                                              <span className="text-[#8A2B2B] font-bold shrink-0 bg-[#8A2B2B]/10 px-1.5 py-0.5 rounded-xs text-[10px]">穿搭气度</span>
                                              <span className="text-[#4A3E3D] leading-relaxed text-[11px]">{(activeData?.firstMeet || result.firstMeet).visual}</span>
                                          </div>
                                        )}
                                        {(activeData?.firstMeet || result.firstMeet).smell && (
                                          <div className="flex items-start gap-2">
                                              <span className="text-[#8A2B2B] font-bold shrink-0 bg-[#8A2B2B]/10 px-1.5 py-0.5 rounded-xs text-[10px]">专属气味</span>
                                              <span className="text-[#4A3E3D] leading-relaxed text-[11px]">{(activeData?.firstMeet || result.firstMeet).smell}</span>
                                          </div>
                                        )}
                                    </div>

                                    {(activeData?.firstMeet || result.firstMeet).camera && (
                                      <div className="bg-white border-l-2 border-[#8A2B2B] p-3 rounded-r-xs shadow-xs relative">
                                          <div className="text-[10px] text-[#8A2B2B] font-bold tracking-widest mb-1 opacity-80">【初遇特写镜头】</div>
                                          <p className="text-[11px] leading-relaxed text-[#3D3331] text-justify tracking-wide italic">
                                              “{(activeData?.firstMeet || result.firstMeet).camera}”
                                          </p>
                                      </div>
                                    )}
                                </div>
                              ) : null}
                            </div>
                          )}

                          {/* 底部签词与朱砂古印 */}
                          <div className="relative pt-2 pb-1 flex flex-col items-center">
                              <div className="w-full bg-[#8A2B2B]/5 px-4 py-3 text-[#8A2B2B] text-xs font-bold italic border border-[#8A2B2B]/25 rounded-sm text-center shadow-xs">
                                  {result.quote}
                              </div>

                              {/* 免责声明提示 */}
                              <div className="mt-4 text-center">
                                  <p className="text-[10px] text-[#8A2B2B]/60 font-serif tracking-wider">
                                      免责声明：本测评仅供个人认知探索与娱乐，非临床心理诊断结论；
                                  </p>
                              </div>

                              {/* 截屏瞬间动态挂载纯前端矢量二维码：常态网页完全隐藏，绝不破坏玉牌温润美感 */}
                              {isGeneratingImage && (
                                  <div id="destiny-qrcode-container" className="mt-4 pt-3 border-t border-[#8A2B2B]/20 flex flex-col items-center justify-center text-center animate-fadeIn w-full">
                                      <div className="bg-white border border-[#8A2B2B]/30 p-1.5 shadow-sm inline-block mb-1.5 rounded-xs">
                                          {qrSvg ? (
                                              <div 
                                                className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                                                dangerouslySetInnerHTML={{ __html: qrSvg }}
                                              />
                                          ) : (
                                              <div className="w-24 h-24 sm:w-28 sm:h-28 bg-[#8A2B2B] flex items-center justify-center text-white text-[10px] font-serif">
                                                命定恋人
                                              </div>
                                          )}
                                      </div>
                                      <div className="font-serif">
                                          <div className="text-[10px] font-bold tracking-widest text-[#8A2B2B]">
                                              [ 扫码测算 · 契合你灵魂的命定恋人 ]
                                          </div>
                                          <p className="text-[8.5px] text-[#4A3E3D]/80 mt-0.5 tracking-wider">
                                              长按识别二维码 · 查收你的专属新中式心动档案
                                          </p>
                                      </div>
                                  </div>
                              )}
                          </div>
                      </div>
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
                  重新测评
              </button>
              <button 
                  onClick={handleSave}
                  disabled={isGeneratingImage}
                  className="flex-1 py-3.5 bg-[#8A2B2B] text-white text-sm font-medium tracking-widest hover:bg-[#A32626] active:scale-[0.99] transition-all shadow-md rounded-sm cursor-pointer disabled:opacity-70"
              >
                  {saveBtnText}
              </button>
          </div>
          <button 
              type="button"
              onClick={() => window.location.href = '/'} 
              className="w-full min-h-[44px] py-3.5 bg-[#2C2825] text-white text-center text-sm font-medium tracking-widest hover:bg-[#1F1B18] active:scale-[0.99] transition-all shadow-md rounded-sm touch-manipulation cursor-pointer flex items-center justify-center"
          >
              返回测试大厅
          </button>
      </div>
      


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
                  {verifyError && (
                    <div className="flex flex-col gap-2 mb-4 mt-2">
                      <p className="text-[#8A2B2B] font-medium text-xs text-center">{verifyError}</p>
                      <button 
                        onClick={() => window.open('https://xhslink.com/m/Atwtf3Cy6FR', '_blank')} 
                        className="w-full bg-[#FAF8F5] text-[#8A2B2B] font-medium p-2 text-xs tracking-widest border border-[#8A2B2B] hover:bg-[#8A2B2B] hover:text-white transition-all rounded-sm"
                      >
                         前往安安店铺
                      </button>
                    </div>
                  )}
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

      {/* 顶部优雅 Toast 浮动提示 */}
      {showToast && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[170] bg-[#1C1415] text-[#F5E5B8] border border-[#E5C158]/50 px-4 py-2.5 rounded-sm shadow-2xl flex items-center gap-2 text-xs font-serif animate-bounce">
              <span className="text-[#E5C158] font-mono text-sm font-bold">✔</span>
              <span>{toastMessage}</span>
          </div>
      )}

      {/* 移动端/微信端专属：长图保存与图文交付弹窗 */}
      {previewImage && (
          <div className="fixed inset-0 z-[160] bg-black/85 backdrop-blur-md flex flex-col items-center justify-between p-3 sm:p-4 font-serif animate-fadeIn">
              {/* 顶部标题与关闭按钮 */}
              <div className="w-full max-w-sm flex items-center justify-between py-2 border-b border-white/20 shrink-0">
                  <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-[#E5C158] rounded-full animate-ping"></span>
                      <span className="text-white font-bold text-xs sm:text-sm tracking-widest">命定长图已就绪</span>
                  </div>
                  <button 
                    onClick={() => setPreviewImage(null)} 
                    className="text-white hover:text-[#E5C158] font-mono font-bold text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 border border-white/30 rounded-xs cursor-pointer touch-manipulation active:scale-95 transition-all"
                  >
                    ✕ 关闭
                  </button>
              </div>

              {/* 中间图片核心交互区：长图展示，支持长按保存到相册或发送给微信朋友 */}
              <div className="flex-1 w-full max-w-sm overflow-y-auto my-2.5 flex flex-col items-center hide-scrollbar rounded shadow-[0_8px_30px_rgb(0,0,0,0.5)]">
                  {/* 强视觉长按指引条 */}
                  <div className="bg-[#E5C158] text-[#1C1415] text-[11px] sm:text-xs font-bold py-2 px-3 w-full text-center border-2 border-[#8A2B2B] sticky top-0 z-10 shadow-sm flex items-center justify-center gap-1.5">
                      <span>👇</span>
                      <span>请「长按下方图片」保存到相册或发给朋友</span>
                  </div>
                  <div className="p-1 bg-[#FAF8F5] border-2 border-t-0 border-[#8A2B2B] w-full flex justify-center">
                      <img 
                        src={previewImage} 
                        alt="命定恋人专属心动档案长图" 
                        className="w-full max-w-[320px] h-auto object-contain block select-none pointer-events-auto shadow-md"
                        style={{ touchAction: 'auto', WebkitTouchCallout: 'default' }}
                      />
                  </div>
              </div>

              {/* 底部贴心指引卡片 */}
              <div className="w-full max-w-sm bg-[#FAF8F5] border-2 border-[#8A2B2B] p-3 shadow-[4px_4px_0px_#1C1415] flex flex-col gap-2 shrink-0">
                  <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#1C1415]">
                          <span className="text-emerald-700 text-sm font-bold">✔</span>
                          <span>心动文案已成功复制</span>
                      </div>
                      <button 
                        onClick={() => {
                          const shareUrl = buildDestinyShareUrl(result);
                          const shareCopy = generateDestinyShareCopy(result, userInfo, shareUrl);
                          syncCopyText(shareCopy);
                          setToastMessage('文案已重新复制！');
                          setShowToast(true);
                          setTimeout(() => setShowToast(false), 2000);
                        }}
                        className="text-[10px] text-[#8A2B2B] underline font-serif hover:text-[#A32626] cursor-pointer"
                      >
                        [ 重新复制文案 ]
                      </button>
                  </div>
                  <p className="text-[10px] text-[#4A3E3D] font-medium leading-tight">
                      💡 去微信发朋友圈或聊天时：长按输入框「粘贴」文案，再从相册选择刚保存的心动长图即可！
                  </p>
                  <button 
                    onClick={() => setPreviewImage(null)} 
                    className="w-full bg-[#8A2B2B] text-white font-bold text-xs py-2.5 border border-[#8A2B2B] shadow-sm active:translate-y-0.5 transition-all cursor-pointer touch-manipulation rounded-xs"
                  >
                      我知道了 · 返回档案
                  </button>
              </div>
          </div>
      )}
    </main>
  );
}
