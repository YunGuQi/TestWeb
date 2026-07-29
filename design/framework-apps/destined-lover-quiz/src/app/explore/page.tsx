"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink, Sparkles, Lock } from "lucide-react";

// 测评矩阵数据（精选展示）
const TESTS = [
  {
    id: "love-species-test",
    title: "恋爱物种领养中心",
    subtitle: "依恋类型 × 心理防御机制测试",
    tags: ["恋爱", "情感"],
    developed: true,
    url: "http://localhost:5500/common/love-species-test/index.html",
    emoji: "🐾",
    gradient: "from-orange-500/20 to-pink-500/20",
    accent: "text-orange-400",
    border: "border-orange-500/20",
  },
  {
    id: "attachment-manual-test",
    title: "恋爱依恋说明书",
    subtitle: "生成你的出厂型号与顺毛指南",
    tags: ["恋爱", "趣味", "关系"],
    developed: true,
    url: "http://localhost:5500/common/attachment-manual-test/index.html",
    emoji: "📋",
    gradient: "from-blue-500/20 to-purple-500/20",
    accent: "text-blue-400",
    border: "border-blue-500/20",
  },
  {
    id: "city-matching-test",
    title: "性格城市匹配测试",
    subtitle: "哪座城市是你的灵魂归属？",
    tags: ["生活", "趣味"],
    developed: true,
    url: "http://localhost:5500/common/city-matching-test/index.html",
    emoji: "🏙️",
    gradient: "from-cyan-500/20 to-teal-500/20",
    accent: "text-cyan-400",
    border: "border-cyan-500/20",
  },
  {
    id: "emotional-friction-test",
    title: "深度情绪内耗测试",
    subtitle: "测一测你的精神内耗程度",
    tags: ["心理健康", "专业"],
    developed: true,
    url: "http://localhost:5500/common/emotional-friction-test/index.html",
    emoji: "🧠",
    gradient: "from-violet-500/20 to-purple-500/20",
    accent: "text-violet-400",
    border: "border-violet-500/20",
  },
  {
    id: "mbti-crystal-test",
    title: "平行宇宙航线测算",
    subtitle: "领取你的专属灵魂登机牌",
    tags: ["人格", "MBTI"],
    developed: true,
    url: "http://localhost:5500/common/mbti-crystal-test/index.html",
    emoji: "🚀",
    gradient: "from-indigo-500/20 to-blue-500/20",
    accent: "text-indigo-400",
    border: "border-indigo-500/20",
  },
  {
    id: "five-elements-city-test",
    title: "五行本命城市测算",
    subtitle: "勘探地气，寻找你的命定之城",
    tags: ["玄学", "趣味"],
    developed: true,
    url: "http://localhost:5500/common/five-elements-city-test/index.html",
    emoji: "🌿",
    gradient: "from-green-500/20 to-emerald-500/20",
    accent: "text-green-400",
    border: "border-green-500/20",
  },
  {
    id: "mbti_love",
    title: "MBTI 恋爱理想型测试",
    subtitle: "谁才是你的灵魂伴侣？",
    tags: ["恋爱", "MBTI"],
    developed: false,
    emoji: "💫",
    gradient: "from-zinc-500/10 to-zinc-500/10",
    accent: "text-zinc-500",
    border: "border-zinc-700/20",
  },
  {
    id: "childhood",
    title: "童年创伤测试",
    subtitle: "疗愈内在小孩的第一步",
    tags: ["疗愈", "成长"],
    developed: false,
    emoji: "🌱",
    gradient: "from-zinc-500/10 to-zinc-500/10",
    accent: "text-zinc-500",
    border: "border-zinc-700/20",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export default function ExplorePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-20 bg-zinc-950/80 backdrop-blur-lg border-b border-zinc-800/50">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center bg-white/5 rounded-full hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-base font-bold">探索更多心理测评</h1>
            <p className="text-xs text-zinc-500">高阶恋人心理档案局 · 全系列</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 bg-pink-500/10 text-pink-400 px-3 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">{TESTS.filter(t => t.developed).length} 款上线</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-16">
        {/* Banner */}
        <div className="mb-6 p-5 bg-gradient-to-br from-pink-500/10 to-purple-500/10 border border-pink-500/10 rounded-2xl">
          <p className="text-sm text-zinc-300 leading-relaxed">
            每个测试都是一扇窗，帮你看见更真实的自己。
            选一个你最好奇的，开始探索吧 👇
          </p>
        </div>

        {/* 测评网格 */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-3"
        >
          {TESTS.map((test) => (
            <motion.div key={test.id} variants={item}>
              <button
                disabled={!test.developed}
                onClick={() => test.url && window.open(test.url, '_blank')}
                className={`w-full text-left p-4 rounded-2xl border bg-gradient-to-br ${test.gradient} ${test.border} border transition-all duration-200 relative overflow-hidden group ${
                  test.developed
                    ? "hover:scale-[1.01] hover:shadow-lg active:scale-[0.99] cursor-pointer"
                    : "opacity-50 cursor-not-allowed"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl shrink-0">{test.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-white text-sm leading-tight">{test.title}</h3>
                      {!test.developed && <Lock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />}
                      {test.developed && (
                        <ExternalLink className="w-3.5 h-3.5 text-zinc-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                    <p className="text-zinc-400 text-xs leading-relaxed">{test.subtitle}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {test.tags.map(tag => (
                        <span
                          key={tag}
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full bg-black/30 ${test.accent}`}
                        >
                          {tag}
                        </span>
                      ))}
                      {!test.developed && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-500">
                          即将上线
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            </motion.div>
          ))}
        </motion.div>
      </main>
    </div>
  );
}
