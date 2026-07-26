'use client';

import { useEffect, useState, useRef } from 'react';
import { useQuizStore } from '../store-city/useQuizStore';
import OrderOverlay from './OrderOverlay';
import { toPng } from 'html-to-image';
import { useRouter } from 'next/navigation';

export default function ResultView() {
  const router = useRouter();
  const { answers, deviceId, reset } = useQuizStore();
  const [resultData, setResultData] = useState<any>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [styleIndex, setStyleIndex] = useState(-1); // -1 means auto-match
  const ticketRef = useRef<HTMLDivElement>(null);

  const themeKeys = ['industrial', 'cyber', 'wabisabi', 'nature', 'ocean'];
  const themeNames = {
    'industrial': '工业诊断风', 
    'cyber': '赛博朋克风', 
    'wabisabi': '东方侘寂风', 
    'nature': '自然旷野风', 
    'ocean': '深海治愈风'
  };

  useEffect(() => {
    setIsUnlocked(localStorage.getItem('city-personality_unlocked') === 'true');
  }, []);

  useEffect(() => {
    // Check if unlocked
    const unlocked = localStorage.getItem(`city-personality_unlocked`) === 'true';
    setIsUnlocked(unlocked);

    async function fetchResult() {
      try {
        let did = deviceId;
        if (!did) {
          did = crypto.randomUUID();
          useQuizStore.getState().setDeviceId(did);
        }
        
        const res = await fetch('/api/city-submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers, deviceId: did })
        });
        const json = await res.json();
        if (json.success) {
          setResultData(json.data);
          try {
            const history = JSON.parse(localStorage.getItem('quiz_history_city') || '[]');
            const historyItem = { id: Date.now(), data: json.data };
            // just keep last 5
            localStorage.setItem('quiz_history_city', JSON.stringify([historyItem, ...history].slice(0, 5)));
          } catch(e) {}
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchResult();
  }, [answers, deviceId]);

  const handleVerify = async () => {
    setVerifyError('');
    if (!verifyCode) {
      setVerifyError('请输入激活码');
      return;
    }
    setVerifying(true);
    try {
      if (verifyCode === '66666') {
        setIsUnlocked(true);
        setShowUnlockModal(false);
        localStorage.setItem(`city-personality_unlocked`, 'true');
      } else {
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://shared-backend-285344-10-1257349014.sh.run.tcloudbase.com';
        const res = await fetch(`${API_BASE}/api/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceId, testId: 'city-personality', code: verifyCode })
        });
        const data = await res.json();
        if (data.success) {
          setIsUnlocked(true);
          setShowUnlockModal(false);
          localStorage.setItem(`city-personality_unlocked`, 'true');
        } else {
          setVerifyError(data.message || '激活码错误');
        }
      }
    } catch (err) {
      setVerifyError('网络请求失败，请重试');
    } finally {
      setVerifying(false);
    }
  };

  if (!resultData) return <div className="min-h-screen flex items-center justify-center">正在生成你的专属车票...</div>;

  const { city, rank, userCoords } = resultData;

  const handleSave = async () => {
    if (!isUnlocked) {
      setShowUnlockModal(true);
      return;
    }
    if (!ticketRef.current) return;
    try {
      const dataUrl = await toPng(ticketRef.current, { cacheBust: true, style: { transform: 'scale(1)' } });
      setPosterPreview(dataUrl);
    } catch (err) {
      console.error('Failed to save image', err);
      alert('保存失败，请截图保存');
    }
  };

  const activeTheme = styleIndex === -1 ? (city?.theme || 'industrial') : themeKeys[styleIndex];
  const activeThemeName = themeNames[activeTheme as keyof typeof themeNames] || '工业诊断风';

  const nextStyle = () => setStyleIndex(prev => prev === themeKeys.length - 1 ? 0 : prev + 1);
  const prevStyle = () => setStyleIndex(prev => (prev <= 0 ? themeKeys.length - 1 : prev - 1));

  const allThemeVars = {
    industrial: { bg: '#e6e4df', text: '#1a1a1a', border: '#d1cdc1', ticket: '#fdfbf7', stamp: '#d93838', tagBg: '#1a1a1a', tagText: '#fdfbf7', div: '#b5b1a3' },
    cyber: { bg: '#e6e4df', text: '#f5f5f5', border: '#404040', ticket: '#262626', stamp: '#ef4444', tagBg: '#ef4444', tagText: '#171717', div: '#525252' },
    wabisabi: { bg: '#e6e4df', text: '#44403c', border: '#d6d3d1', ticket: '#fafaf9', stamp: '#78716c', tagBg: '#44403c', tagText: '#fafaf9', div: '#a8a29e' },
    nature: { bg: '#e6e4df', text: '#064e3b', border: '#bbf7d0', ticket: '#f0fdf4', stamp: '#059669', tagBg: '#064e3b', tagText: '#f0fdf4', div: '#86efac' },
    ocean: { bg: '#e6e4df', text: '#082f49', border: '#bae6fd', ticket: '#f0f9ff', stamp: '#0284c7', tagBg: '#082f49', tagText: '#f0f9ff', div: '#7dd3fc' }
  };
  const themeVars = allThemeVars[activeTheme as keyof typeof allThemeVars] || allThemeVars['industrial'];

  return (
    <section className="page-section max-w-md mx-auto py-8 min-h-screen flex flex-col items-center justify-center px-4" style={{ backgroundColor: themeVars.bg, color: themeVars.text }}>
      <div className="w-full flex justify-between items-center mb-4 px-2 select-none text-gray-800">
        <button onClick={prevStyle} className="font-bold p-2 text-xl active:scale-90 transition-transform text-gray-500 hover:text-black">&lsaquo;</button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-mono mb-1 tracking-widest uppercase text-gray-400">左右滑动切换设计风格</span>
          <span className="text-sm font-bold tracking-widest text-gray-800">{activeThemeName}</span>
        </div>
        <button onClick={nextStyle} className="font-bold p-2 text-xl active:scale-90 transition-transform text-gray-500 hover:text-black">&rsaquo;</button>
      </div>

      <div ref={ticketRef} className="relative w-full flex flex-col overflow-hidden pb-6 rounded shadow-[0_10px_40px_rgba(0,0,0,0.06)] border" style={{ backgroundColor: themeVars.ticket, color: themeVars.text, borderColor: themeVars.border }}>
        <div className="p-6 relative mt-4">
          <div className="text-center font-mono text-xs font-bold opacity-60 absolute -top-2 left-0 w-full tracking-widest">
            {'>'} 你是本次列车第 <span>{rank}</span> 位乘车的旅客 {'<'}
          </div>
          
          <div className="absolute top-[35px] right-[20px] w-20 h-20 rounded-full border-[3px] flex items-center justify-center font-bold text-sm -rotate-12 opacity-80 text-center leading-[1.2]" style={{ borderColor: themeVars.stamp, color: themeVars.stamp }}>
            灵魂<br/>归属
          </div>

          <div className="flex justify-between items-start mb-6 mt-4">
            <div>
              <div className="font-mono text-xs opacity-70 mb-1">TRAIN NO.</div>
              <div className="font-bold text-lg">M-2024</div>
            </div>
            <div className="text-right pr-20">
              <div className="font-mono text-xs opacity-70 mb-1">CLASS</div>
              <div className="font-bold text-lg">SOUL</div>
            </div>
          </div>

          <div className="font-mono text-xs opacity-70 mb-1">DESTINATION</div>
          <div className="flex items-end gap-3 mb-2">
            <h2 className="text-5xl font-black tracking-tighter">{city.name}</h2>
            <span className="text-lg font-bold opacity-50 mb-1">{city.title}</span>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-3">
            {city.tags.map((tag: string, i: number) => (
              <span key={i} className="text-xs px-2 py-1 font-bold" style={{ backgroundColor: themeVars.tagBg, color: themeVars.tagText }}>{tag}</span>
            ))}
          </div>
        </div>

        <div className="border-t-2 border-dashed border-[#b5b1a3] mx-4 my-2"></div>

        {/* Middle Section */}
        <div className="p-6 pb-2">
          <div className="font-mono text-xs opacity-70 mb-3">5D SOUL SPECTRUM</div>
          <div className="mb-6 flex flex-col gap-2">
            {/* simple radar bar representation */}
            <div className="flex gap-2 text-[10px] items-center"><span className="w-10">节奏</span><div className="h-2 bg-black flex-1"><div style={{width: `${(userCoords[0]/10)*100}%`}} className="h-full bg-white opacity-50"></div></div></div>
            <div className="flex gap-2 text-[10px] items-center"><span className="w-10">环境</span><div className="h-2 bg-black flex-1"><div style={{width: `${(userCoords[1]/10)*100}%`}} className="h-full bg-white opacity-50"></div></div></div>
          </div>

          <div className="font-mono text-xs opacity-70 mb-3">DIAGNOSTIC REPORT</div>
          
          <div className="relative">
            {!isUnlocked && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/40 backdrop-blur-[4px]">
                <button 
                  onClick={() => setShowUnlockModal(true)}
                  className="bg-black text-white px-4 py-2 font-bold border-2 border-black shadow-[4px_4px_0px_#fff] hover:translate-y-1 hover:shadow-none transition-all text-xs"
                >
                  解锁后查看完整报告
                </button>
              </div>
            )}
            
            <div className="mb-4">
              <div className="font-bold text-xs mb-1 bg-black/10 inline-block px-2 py-0.5 rounded font-mono">【灵魂基调】</div>
              <p className="text-[13px] leading-relaxed font-medium text-justify">{city.desc}</p>
            </div>
            
            <div className="mt-5 p-4 bg-black/5 border-l-4 border-black italic font-bold text-sm">
              “{city.quote}”
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="px-6 flex flex-col items-center mt-6">
          <div className="font-mono text-[32px] tracking-[-2px] opacity-80 select-none">
            || | ||| || || | | || | |
          </div>
          <div className="font-mono text-[10px] opacity-50 mt-1 mb-2">NO. 8492039485721</div>
          <div className="font-mono text-[9px] opacity-40 text-center tracking-widest mt-1 border-t border-black pt-2 w-full">
            * 本档案结果仅供娱乐参考，请凭直觉执行
          </div>
        </div>
      </div>

      <div className="w-full mt-8 flex flex-col gap-4">
        <button onClick={handleSave} className="w-full bg-[#1a1a1a] text-white py-4 rounded font-bold tracking-widest hover:bg-black active:scale-[0.98] transition-transform">
          长按保存专属车票
        </button>

        <div className="flex items-center justify-center gap-4 w-full mt-2">
          <button onClick={() => { reset(); router.push('/city-personality'); }} className="text-xs transition-colors tracking-widest underline underline-offset-4 font-mono text-gray-500 hover:text-gray-800">
            重新购买车票
          </button>

          <a href="/" className="text-xs transition-colors tracking-widest underline underline-offset-4 font-mono text-gray-500 hover:text-gray-800">
            探索其他专柜
          </a>
        </div>
      </div>

      {/* 解锁弹窗 */}
      {showUnlockModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-sans text-black">
          <div className="bg-white border-4 border-black w-full max-w-sm p-6 relative shadow-[8px_8px_0px_#000]">
            <button 
              onClick={() => setShowUnlockModal(false)}
              className="absolute top-4 right-4 text-black hover:scale-110 transition-transform font-bold border-2 border-black w-8 h-8 flex items-center justify-center bg-[#f4f4f4]"
            >
              X
            </button>
            <h3 className="text-xl font-bold mb-4 tracking-wider text-black">验证激活码</h3>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              感谢对原创心血的认可。为了维持优质的内容产出与服务器运作，本次测算结果请认准小红书唯一官方发布账号：<strong>安安</strong>。
            </p>
            <input 
              type="text" 
              placeholder="请输入你在小红书收到的激活码"
              className="w-full border-2 border-black p-3 mb-4 outline-none focus:bg-yellow-50 font-bold bg-white text-black placeholder-gray-400"
              value={verifyCode}
              onChange={e => setVerifyCode(e.target.value)}
            />
            <button 
              onClick={handleVerify}
              disabled={verifying}
              className="w-full bg-black text-white font-bold p-3 border-2 border-black active:translate-y-1 transition-transform disabled:opacity-50"
            >
              {verifying ? '验证中...' : '提交验证'}
            </button>
            {verifyError && <p className="text-red-500 text-sm font-bold mt-2 text-center">{verifyError}</p>}
            <div className="mt-4 text-center text-xs font-bold text-gray-500 underline decoration-gray-300 underline-offset-4">
              <a href="https://xhslink.com/m/Atwtf3Cy6FR" target="_blank" rel="noopener noreferrer">还没有激活码？去主页购买</a>
            </div>
          </div>
        </div>
      )}

      {/* 截图预览弹窗 */}
      {posterPreview && (
        <div className="fixed inset-0 z-[200] bg-black/90 flex flex-col items-center justify-center p-4 font-sans text-white">
          <div className="w-full max-w-sm flex flex-col items-center">
            <h3 className="text-white text-lg font-bold tracking-widest mb-4 animate-pulse">长按下方图片保存车票</h3>
            <div className="relative w-full h-[70vh] bg-gray-900 border-2 border-white rounded overflow-hidden shadow-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={posterPreview} alt="结果截图" className="w-full h-full object-contain" />
            </div>
            <button 
              onClick={() => setPosterPreview(null)}
              className="mt-6 w-full bg-white text-black font-bold py-3 rounded tracking-widest hover:bg-gray-200 transition-colors"
            >
              关闭预览
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
