'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, X } from 'lucide-react'

export default function Home() {
  const [peopleCount, setPeopleCount] = useState(0) // Initialize in useEffect to avoid hydration mismatch if using random
  const [showHistory, setShowHistory] = useState(false)
  const [historyIds, setHistoryIds] = useState<number[]>([])
  const [clickCount, setClickCount] = useState(0)
  
  useEffect(() => {
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3002';
    fetch(`${API_BASE}/api/stats?testId=emotional-friction`)
      .then(res => res.json())
      .then(data => {
        if (data.total) setPeopleCount(data.total)
      })
      .catch(err => console.error('Failed to fetch stats', err))
  }, [])

  const openHistory = () => {
    try {
      const history = JSON.parse(localStorage.getItem('quiz_history_emotional') || '[]')
      setHistoryIds(history.reverse()) // newest first
    } catch(e) {}
    setShowHistory(true)
  }

  return (
    <main className="relative w-full max-w-lg mx-auto min-h-[100dvh] flex flex-col pt-[max(24px,env(safe-area-inset-top))] pb-[max(100px,env(safe-area-inset-bottom))] px-5 justify-center font-mono">
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full"
      >
        <div className="text-center mb-12 brutalist-card p-8 transform -rotate-2">
          {/* Eyebrow Tag */}
          <div className="inline-flex items-center gap-2 px-3 py-1 border-2 border-black font-mono text-xs uppercase tracking-widest font-bold mb-6">
            <span className="w-2 h-2 bg-black animate-pulse"></span>
            安安心灵便利店
          </div>
          
          <h1 className="text-4xl font-black tracking-tighter leading-tight mb-4">
            深度情绪内耗<br/>消费账单
          </h1>
          
          <div className="w-full h-px bg-black my-4"></div>
          
          <p className="font-mono text-xs text-gray-700 leading-relaxed font-bold">
            [系统警告]<br/>你的每一次纠结<br/>都在暗中标好了价格
          </p>

          {/* 测试维度介绍 */}
          <div className="mt-6 text-left border-t border-b border-black py-4 bg-[#f4f4f4] px-4 shadow-[4px_4px_0px_#000] border-2">
            <p className="text-xs font-bold mb-3 text-black">本次测算将精准扫描你的：</p>
            <ul className="text-[11px] space-y-2 font-mono list-none text-black font-bold">
              <li className="flex gap-2"><span className="shrink-0 bg-black text-white px-1">Sen</span> 敏感税：替人承担了多少额外情绪</li>
              <li className="flex gap-2"><span className="shrink-0 bg-black text-white px-1">Rum</span> 反刍税：深夜你结算了多少后悔账</li>
              <li className="flex gap-2"><span className="shrink-0 bg-black text-white px-1">Pls</span> 讨好税：花多少精力购买别人满意</li>
              <li className="flex gap-2"><span className="shrink-0 bg-black text-white px-1">Bnd</span> 边界税：你的原则底线折旧率多高</li>
            </ul>
            <p className="text-[10px] font-bold mt-4 pt-2 border-t border-black border-dashed text-gray-600">
              结账后将为您生成专属【内耗明细小票】，请注意查收。
            </p>
          </div>

          <div className="mt-4 flex justify-center">
            {/* Fake Barcode - Deterministic for SSR */}
            <svg className="w-full h-8" preserveAspectRatio="none" viewBox="0 0 100 10">
              {Array.from({ length: 40 }).map((_, i) => {
                const rand1 = (Math.sin(i * 12.9898) * 43758.5453) % 1;
                const rand2 = (Math.sin(i * 78.233) * 43758.5453) % 1;
                const r1 = Math.abs(rand1);
                const r2 = Math.abs(rand2);
                
                const width = r1 > 0.5 ? 2 : (r1 > 0.2 ? 4 : 1);
                const x = i * 2.5;
                if (r2 > 0.2) {
                  return <rect key={i} x={`${x}%`} y="0" width={`${width}%`} height="100%" fill="currentColor" />
                }
                return null
              })}
            </svg>
          </div>
        </div>

        <div className="mt-auto w-full mb-8">
          <Link href="/emotional-friction/test" className="block mb-3">
            <motion.button 
              className="brutalist-btn text-xl"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span>拉出结账单开始测算</span>
            </motion.button>
          </Link>
          
          {/* 排队人数紧贴在开始测试按钮下方 */}
          {peopleCount > 0 && (
            <div 
              onClick={() => {
                setClickCount(prev => {
                  const next = prev + 1
                  if (next >= 5) {
                    localStorage.clear()
                    alert('[ 系统调试 ] 缓存已清除，应用已重启')
                    window.location.reload()
                    return 0
                  }
                  return next
                })
              }}
              className="flex items-center justify-center gap-2 text-[10px] text-white/60 font-mono font-bold mb-8 mx-auto px-4 cursor-pointer select-none"
            >
              <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
              当前排队结账人数：{peopleCount.toLocaleString()} 人
            </div>
          )}
          
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center justify-center gap-4 w-full font-mono font-bold">
              <button onClick={openHistory} className="text-xs text-gray-400 hover:text-white transition-colors tracking-widest underline underline-offset-4">
                查看历史消费单
              </button>
              <Link href="/hub" className="text-xs text-gray-400 hover:text-white transition-colors tracking-widest underline underline-offset-4">
                探索其他专柜
              </Link>
            </div>
          </div>
        </div>
      </motion.div>

      {/* History Modal */}
      <AnimatePresence>
        {showHistory && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end"
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-[#f4f4f5] text-black border-t-4 border-black p-6 pb-[max(32px,env(safe-area-inset-bottom))] w-full max-w-lg mx-auto h-[60vh] flex flex-col relative"
            >
              <button 
                onClick={() => setShowHistory(false)}
                className="absolute top-4 right-4 w-10 h-10 border-2 border-black flex items-center justify-center font-bold active:translate-y-1 bg-white shadow-[2px_2px_0px_#000] active:shadow-none transition-all"
              >
                <X size={20} />
              </button>
              
              <h2 className="text-2xl font-black mb-6">历史消费单</h2>
              
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-6 hide-scrollbar">
                {historyIds.length === 0 ? (
                  <div className="text-gray-500 text-sm mt-4 italic font-bold">
                    暂无消费记录。
                  </div>
                ) : (
                  historyIds.map((id, index) => (
                    <Link 
                      key={id} 
                      href={`/emotional-friction/result/${id}`}
                      className="block p-4 bg-white border-2 border-black shadow-[4px_4px_0px_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0px_#000] transition-all flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-bold text-gray-500 mb-1">NO. {10000 + id}</div>
                        <div className="font-bold">情绪账单报告</div>
                      </div>
                      <ArrowRight size={20} />
                    </Link>
                  ))
                )}
              </div>
              
              <button onClick={() => setShowHistory(false)} className="brutalist-btn !py-3 shrink-0">
                关闭抽屉
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
