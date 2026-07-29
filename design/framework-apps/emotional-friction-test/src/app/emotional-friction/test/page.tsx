'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Loader2 } from 'lucide-react'

type Option = {
  id: string
  text: string
}

type Question = {
  id: string
  text: string
  order: number
  options: Option[]
}

export default function TestPage() {
  const router = useRouter()
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({}) // questionId -> optionId
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showExitModal, setShowExitModal] = useState(false)
  const [transitioning, setTransitioning] = useState(false)
  useEffect(() => {
    fetch('/api/questions')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setQuestions(data)
        } else {
          console.error('API Error:', data)
          setQuestions([])
        }
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })

    // 防丢拦截
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  const handleSelect = (optionId: string) => {
    if (transitioning) return
    const q = questions[currentIndex]
    setAnswers(prev => ({ ...prev, [q.id]: optionId }))

    if (currentIndex < questions.length - 1) {
      setTransitioning(true)
      setCurrentIndex(prev => prev + 1)
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const optionIds = Object.values(answers)
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionIds })
      })
      const data = await res.json()
      
      if (data.recordId) {
        // Also increment global backend count
        let globalRank = 0;
        try {
          let did = localStorage.getItem('deviceId')
          if (!did) { did = crypto.randomUUID(); localStorage.setItem('deviceId', did) }
          const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://shared-backend-285344-10-1257349014.sh.run.tcloudbase.com';
          const rankRes = await fetch(`${API_BASE}/api/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ testId: 'emotional-friction', deviceId: did })
          });
          const rankData = await rankRes.json();
          if (rankData.current_rank) {
            globalRank = rankData.current_rank;
          }
        } catch (e) { console.error('Global submit failed', e) }

        // Save to history
        try {
          const history = JSON.parse(localStorage.getItem('quiz_history_emotional') || '[]')
          if (!history.includes(data.recordId)) {
            history.push(data.recordId)
            localStorage.setItem('quiz_history_emotional', JSON.stringify(history))
          }
        } catch(e) {}
        
        const nextUrl = globalRank > 0 ? `/emotional-friction/result/${data.recordId}?rank=${globalRank}` : `/emotional-friction/result/${data.recordId}`
        router.push(nextUrl)
      } else {
        alert('提交失败')
        setSubmitting(false)
      }
    } catch (e) {
      console.error(e)
      setSubmitting(false)
    }
  }

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    } else {
      setShowExitModal(true)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center font-mono">
        <Loader2 className="animate-spin mr-2" /> DATA LOADING...
      </div>
    )
  }

  if (questions.length === 0) {
    return <div className="p-8 text-center">题库为空，请联系管理员。</div>
  }

  const currentQ = questions[currentIndex]
  const progress = ((currentIndex + 1) / questions.length) * 100

  return (
    <main className="flex-1 flex flex-col max-w-md mx-auto w-full p-4 relative font-mono text-sm sm:text-base">

      {/* 顶部导航与进度 */}
      <div className="flex items-center justify-between mb-8 py-4 border-b border-gray-800">
        <button 
          onClick={() => setShowExitModal(true)} 
          className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors flex items-center gap-1 font-bold text-xs cursor-pointer relative z-50"
        >
          <ArrowLeft size={16} /> 返回首页
        </button>
        <div className="text-gray-500 tracking-widest text-xs">
          PROCESS: {currentIndex + 1} / {questions.length}
        </div>
      </div>

      {/* 进度条扫描线 UI */}
      <div className="w-full h-1 bg-gray-900 mb-8 overflow-hidden relative">
        <motion.div 
          className="h-full bg-brand"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
        {/* 扫描线动画 */}
        <div className="absolute top-0 bottom-0 left-0 w-12 bg-white/20 animate-[scan_2s_ease-in-out_infinite]" style={{ filter: 'blur(4px)' }}></div>
      </div>

      {/* 题目展示区 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          onAnimationComplete={() => setTransitioning(false)}
          className="flex-1 flex flex-col"
        >
          <h2 className="text-xl md:text-2xl font-bold mb-8 leading-relaxed">
            <span className="text-brand mr-2">Q{currentIndex + 1}.</span>
            {currentQ.text}
          </h2>

          <div className="space-y-4">
            {currentQ.options.map(opt => {
              const isSelected = answers[currentQ.id] === opt.id
              return (
                <button
                  key={opt.id}
                  onClick={() => handleSelect(opt.id)}
                  className={`option-btn ${isSelected ? 'selected' : ''}`}
                >
                  <div className="relative z-10 flex gap-3 font-bold">
                    <span className="shrink-0">
                      {isSelected ? '[x]' : '[ ]'}
                    </span>
                    <span>{opt.text}</span>
                  </div>
                </button>
              )
            })}
          </div>

          {currentIndex > 0 && (
            <div className="mt-8 text-center">
              <button 
                onClick={handleBack}
                className="text-xs text-gray-500 hover:text-white underline underline-offset-4 decoration-gray-700 transition-colors"
              >
                [ 撤回上一条计费 ]
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* 提交按钮 (仅在最后一题显示) */}
      {currentIndex === questions.length - 1 && Object.keys(answers).length === questions.length && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8"
        >
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="brutalist-btn mt-8"
          >
            <span className="flex justify-center items-center">
              {submitting ? <Loader2 className="animate-spin mr-2" size={18}/> : null}
              {submitting ? '账单打印中...' : '[ 打印账单 ]'}
            </span>
          </button>
        </motion.div>
      )}

      {/* 退出确认弹窗 */}
      <AnimatePresence>
        {showExitModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-gray-900 border border-gray-800 p-6 max-w-sm w-full text-center"
            >
              <h3 className="text-lg font-bold text-white mb-2">确定要离开吗？</h3>
              <p className="text-gray-400 text-sm mb-6">当前答题进度将不会被保存。</p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowExitModal(false)}
                  className="flex-1 py-3 bg-gray-800 text-white font-bold hover:bg-gray-700 transition-colors"
                >
                  继续答题
                </button>
                <button 
                  onClick={() => router.push('/emotional-friction')}
                  className="flex-1 py-3 bg-red-600 text-white font-bold hover:bg-red-700 transition-colors"
                >
                  确认离开
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </main>
  )
}
