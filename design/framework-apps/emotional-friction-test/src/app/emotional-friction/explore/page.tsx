'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

const TESTS = [
  { id: '1', title: '深度情绪内耗测算', status: 'ACTIVE', link: '/' },
  { id: '2', title: '命定恋人类型鉴定', status: 'COMING SOON', link: '#' },
  { id: '3', title: '职场生存边界测试', status: 'COMING SOON', link: '#' },
  { id: '4', title: '金钱潜意识分析', status: 'COMING SOON', link: '#' },
]

export default function ExplorePage() {
  const router = useRouter()

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  return (
    <main className="flex-1 flex flex-col w-full max-w-md mx-auto p-4 font-mono">
      <div className="flex items-center mb-8 py-4 border-b border-gray-800">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="ml-4 text-sm tracking-widest font-bold">
          ALL TESTS [MATRIX]
        </div>
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-4"
      >
        {TESTS.map(test => (
          <motion.div key={test.id} variants={item}>
            <Link 
              href={test.link}
              className={`block p-6 border transition-all ${
                test.status === 'ACTIVE' 
                  ? 'border-gray-500 hover:border-brand bg-gray-900/50 hover:bg-brand/10' 
                  : 'border-gray-800 bg-gray-900/20 opacity-50 cursor-not-allowed'
              }`}
              onClick={(e) => {
                if (test.status !== 'ACTIVE') e.preventDefault()
              }}
            >
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold">{test.title}</h2>
                <span className={`text-[10px] px-2 py-1 ${
                  test.status === 'ACTIVE' ? 'bg-brand text-white' : 'bg-gray-800 text-gray-400'
                }`}>
                  {test.status}
                </span>
              </div>
              <div className="text-xs text-gray-500 font-mono">
                ID: TS-{test.id.padStart(4, '0')} // TYPE: PSYCH
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </main>
  )
}
