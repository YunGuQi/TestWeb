'use client'

import { useRef, useState, useEffect } from 'react'
import * as htmlToImage from 'html-to-image'
import { Download, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default function ResultClient({ record, config, allConfigs, scores: propScores }: { record: any, config: any, allConfigs: any[], scores?: any }) {
  const [isSaving, setIsSaving] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [unlocked, setUnlocked] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [verifyCode, setVerifyCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [verifyError, setVerifyError] = useState('')
  const [posterPreview, setPosterPreview] = useState<string | null>(null)
  const [displayRank, setDisplayRank] = useState(10000 + record.id)
  const posterRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (localStorage.getItem('emotional-friction_unlocked') === 'true') {
      setUnlocked(true)
    }
    try {
      const params = new URLSearchParams(window.location.search)
      const rank = params.get('rank')
      if (rank) setDisplayRank(Number(rank))
    } catch(e) {}
  }, [])

  let bills: {name: string, amount: number}[] = []
  try {
    const parsed = JSON.parse(record.billsJson || '[]')
    bills = parsed.map((b: any) => {
      if (typeof b === 'string') return { name: b, amount: 15 }
      return b
    })
  } catch(e) {}

  const scores = propScores || record.scores || {
    sen: record.senTotal,
    rum: record.rumTotal,
    pls: record.plsTotal,
    bnd: record.bndTotal
  }
  const maxScore = Math.max(scores.sen, scores.rum, scores.pls, scores.bnd) || 1

  const savePoster = async () => {
    if (!unlocked) {
      setShowModal(true)
      return
    }
    setIsSaving(true)
    if (!posterRef.current) {
      setIsSaving(false)
      return
    }
    try {
      const node = posterRef.current;
      const width = node.offsetWidth;
      const height = node.offsetHeight;
      const dataUrl = await htmlToImage.toJpeg(node, { 
        quality: 0.95, 
        pixelRatio: 2,
        cacheBust: true,
        width: width,
        height: height,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
          width: width + 'px',
          height: height + 'px'
        }
      })
      setPosterPreview(dataUrl)
    } catch (err) {
      console.error('Save failed', err)
      alert('保存失败，请重试')
    } finally {
      setIsSaving(false)
    }
  }

  const handleVerify = async () => {
    setVerifyError('')
    if (!verifyCode) {
      setVerifyError('请输入激活码')
      return
    }
    setVerifying(true)
    try {
      let did = localStorage.getItem('deviceId')
      if (!did) { did = crypto.randomUUID(); localStorage.setItem('deviceId', did) }

      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://shared-backend-285344-10-1257349014.sh.run.tcloudbase.com';
      const res = await fetch(`${API_BASE}/api/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: verifyCode, deviceId: did, testId: 'emotional-friction' })
      })
      const data = await res.json()
      if (data.success) {
        setUnlocked(true)
        setShowModal(false)
        localStorage.setItem('emotional-friction_unlocked', 'true')
      } else {
        setVerifyError(data.message || '激活码错误')
      }
    } catch (err) {
      setVerifyError('网络错误，请稍后重试')
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col w-full max-w-md mx-auto relative font-mono h-[100dvh] pt-[max(12px,env(safe-area-inset-top))] pb-[max(130px,env(safe-area-inset-bottom))]">
      
      {/* 页面主干：可滚动区域 */}
      <div className="flex-1 overflow-y-auto px-4 hide-scrollbar flex flex-col items-center">
        
        {/* 排队结账完成序号 */}
        <div className="text-center text-white/80 text-xs font-bold py-2 mb-2 w-full max-w-[340px]">
           你是第 {displayRank} 个结账完成的顾客
        </div>

        {/* 单页长图截图区开始 */}
        <div ref={posterRef} className="w-full max-w-[340px] flex flex-col bg-[#1c1c1e] receipt-container relative z-0 mb-8">
          <div className="receipt-top shrink-0"></div>
          <div className="receipt-paper px-6 py-4 flex-1 flex flex-col relative overflow-hidden">
            
            {/* 1. 消费结账单 */}
            <div className="text-center font-mono mb-4 shrink-0">
              <h2 className="text-2xl font-black mb-1 tracking-widest text-black">消费结账单</h2>
              <p className="text-xs uppercase font-bold text-gray-600">--- EMOTIONAL RECEIPT ---</p>
              <p className="text-xs text-gray-500 mt-1">NO. {displayRank} // {new Date().toLocaleDateString()}</p>
            </div>

            <div className="border-b-4 border-black my-2"></div>

            <div className="text-center mb-6 mt-4">
              <div className="text-sm font-bold text-gray-600 mb-1">鉴定结果</div>
              <div className="text-2xl font-black bg-black text-white py-2 px-4 inline-block transform -rotate-1">
                {config.title}
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {config.tags.split(',').map((tag: string, i: number) => (
                <span key={i} className="text-[10px] bg-black text-white px-2 py-1 font-bold">
                  {tag}
                </span>
              ))}
            </div>

            <div className="border-b-2 border-dashed border-gray-400 mb-6"></div>

            {/* 消费明细单 */}
            <div className="mb-6 font-mono text-xs text-black border-t-2 border-b-2 border-black py-4">
              <div className="flex justify-between items-end pb-2 border-b-2 border-black font-bold">
                <span className="text-sm">TOTAL FRICTION (总内耗)</span>
                <span className="text-lg">{scores.sen + scores.rum + scores.pls + scores.bnd}</span>
              </div>
              
              <button 
                onClick={() => setShowDetails(!showDetails)}
                className="w-full text-center py-2 text-[10px] text-gray-500 hover:bg-gray-100 transition-colors mt-2 border border-dashed border-gray-300"
              >
                {showDetails ? '[- 收起消费明细]' : '[+ 展开消费明细]'}
              </button>

              {showDetails && (
                <div className="space-y-3 mt-4 pt-2">
                  <div className="text-[10px] text-gray-500 mb-2">ITEM ................................. AMOUNT</div>
                  {bills.length > 0 ? bills.map((bill, i) => (
                    <div key={i} className="flex justify-between items-end border-b border-gray-300 border-dotted pb-1">
                      <span className="truncate pr-2">{bill.name}</span>
                      <span className="shrink-0 font-bold">+{bill.amount}</span>
                    </div>
                  )) : (
                    <div className="text-gray-400 italic text-center">No details available</div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 text-center">
               <svg className="w-full h-10 mb-2" preserveAspectRatio="none" viewBox="0 0 100 10">
                {Array.from({ length: 40 }).map((_, i) => {
                  const rand1 = (Math.sin(i * 12.9898) * 43758.5453) % 1;
                  const rand2 = (Math.sin(i * 78.233) * 43758.5453) % 1;
                  const r1 = Math.abs(rand1);
                  const r2 = Math.abs(rand2);
                  const width = r1 > 0.5 ? 2 : (r1 > 0.2 ? 4 : 1);
                  const x = i * 2.5;
                  if (r2 > 0.2) return <rect key={i} x={`${x}%`} y="0" width={`${width}%`} height="100%" fill="#000" />
                  return null
                })}
              </svg>
              <p className="text-[10px] text-gray-500 font-bold tracking-tighter">
                击败了 {(70 + (record.id * 13) % 25) + parseFloat(((record.id * 7.1) % 1).toFixed(2))}% 的测试者
              </p>
            </div>

            <div className="border-b-4 border-black my-8"></div>

            {/* 2. 深度解析报告 */}
            <div className="text-center font-mono mb-4 shrink-0">
              <h2 className="text-xl font-black mb-1 tracking-widest text-black">深度评估报告</h2>
              <p className="text-xs uppercase font-bold text-gray-600">--- ANALYSIS ---</p>
            </div>

            <div className="space-y-3 mb-6 font-bold text-black border-2 border-black p-4 bg-[#f4f4f4] shadow-[4px_4px_0px_#000]">
              <p className="text-[10px] font-mono text-gray-500 mb-1">DIMENSION SCORES</p>
              {[
                { label: '敏感 (Sen)', score: scores.sen },
                { label: '反刍 (Rum)', score: scores.rum },
                { label: '讨好 (Pls)', score: scores.pls },
                { label: '边界 (Bnd)', score: scores.bnd },
              ].map(dim => {
                let p = maxScore > 0 ? (dim.score / maxScore) * 100 : 10;
                if (p < 10) p = 10;
                if (p > 99) p = 99;
                const hash = ((dim.score * 13.5 + record.id * 7.3) % 1) * 0.99;
                const pStr = (Math.floor(p) + hash).toFixed(2) + '%';
                return (
                  <div key={dim.label} className="flex flex-col gap-1">
                    <div className="flex justify-between text-[10px] uppercase"><span>{dim.label}</span><span>{pStr}</span></div>
                    <div className="w-full h-2 border-2 border-black bg-white"><div className="h-full bg-gradient-to-r from-gray-900 to-gray-400" style={{width: pStr}}></div></div>
                  </div>
                );
              })}
            </div>

            {/* 短评和深度内容，受防白嫖锁控制 */}
            <div className="relative">
              {!unlocked && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/40 backdrop-blur-[6px]">
                  <button 
                    onClick={() => setShowModal(true)}
                    className="bg-black text-white px-6 py-3 font-bold border-2 border-black shadow-[4px_4px_0px_#fff] hover:translate-y-1 hover:shadow-none transition-all"
                  >
                    解锁后查看完整内容
                  </button>
                </div>
              )}

              <div className="text-[13px] text-left leading-relaxed font-bold border-2 border-black p-4 bg-white mb-4 shadow-[4px_4px_0px_#000]">
                {config.desc}
              </div>

              <div className="text-left font-mono mb-4">
                  <div className="text-[10px] bg-black text-white px-2 py-0.5 inline-block mb-1">▶ 核心金句 QUOTE</div>
                  <div className="text-xs leading-relaxed font-bold border-l-2 border-black pl-2 italic">
                    "{config.quote}"
                  </div>
              </div>

              <div className="text-left font-mono mb-8">
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

            <div className="mt-8 pt-8 border-t-2 border-black border-dashed">
              <div className="text-center text-[10px] text-gray-500 font-mono mb-4">
                --- ANALYSIS END ---
              </div>
              <p className="text-[10px] text-gray-500 font-bold tracking-tighter text-center">
                *本报告最终解释权归本人的小世界所有
              </p>
            </div>

            {/* 印章 */}
            <div className="absolute top-64 right-[-10px] rotate-[15deg] text-4xl font-black text-black/10 border-4 border-black/10 p-2 uppercase pointer-events-none">
              VERIFIED
            </div>
          </div>
          <div className="receipt-bottom shrink-0"></div>
        </div>
        {/* 单页长图截图区结束 */}

      </div>

      {/* 底部操作区 (Fixed, 不会被截图) */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-[#1c1c1e] border-t-2 border-white/10 flex flex-col gap-3 z-50">
        
        <button 
          onClick={savePoster}
          disabled={isSaving}
          className="brutalist-btn disabled:opacity-50 !py-3 w-full max-w-[340px] mx-auto"
        >
          {isSaving ? <RefreshCw className="animate-spin mr-2" size={18} /> : <Download size={18} className="mr-2" />}
          {isSaving ? 'GENERATING...' : '保存账单截图'}
        </button>

        <div className="flex justify-center gap-4 mt-1 mb-2 font-mono font-bold w-full max-w-[340px] mx-auto">
          <Link href="/emotional-friction" className="text-xs text-gray-400 hover:text-white tracking-widest underline underline-offset-4 decoration-gray-700 transition-colors">
            重新打印
          </Link>
          <Link href="/hub" className="text-xs text-gray-400 hover:text-white tracking-widest underline underline-offset-4 decoration-gray-700 transition-colors">
            探索其他专柜
          </Link>
        </div>
      </div>

      {/* 验证弹窗 */}
      {showModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
          <div className="bg-white border-4 border-black w-full max-w-sm p-6 relative shadow-[8px_8px_0px_#000]">
            <button 
              onClick={() => setShowModal(false)}
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

      {/* 生成截图预览弹窗 */}
      {posterPreview && (
        <div className="fixed inset-0 z-[200] bg-black/90 flex flex-col items-center justify-center p-4 font-sans">
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
    </div>
  )
}
