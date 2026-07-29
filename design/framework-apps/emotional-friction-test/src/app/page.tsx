import Link from "next/link";
import { ArrowRight, Sparkles, BrainCircuit } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white font-sans flex flex-col items-center py-20 px-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center p-3 bg-white/5 rounded-2xl mb-6 ring-1 ring-white/10">
            <Sparkles className="w-8 h-8 text-pink-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            高阶心理测算中心
          </h1>
          <p className="text-lg text-zinc-400 max-w-lg mx-auto">
            探索自我，疗愈关系。选择一个测算开始您的体验。
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Emotional Friction Test */}
          <Link
            href="/emotional-friction"
            className="group relative overflow-hidden rounded-3xl bg-zinc-900 border border-zinc-800 p-8 transition-all hover:border-zinc-600 hover:shadow-2xl hover:shadow-purple-500/10 flex flex-col items-start"
          >
            <div className="mb-6 inline-flex items-center justify-center p-3 bg-purple-500/10 rounded-xl">
              <BrainCircuit className="w-6 h-6 text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-white group-hover:text-purple-300 transition-colors">
              深度情绪内耗测算
            </h2>
            <p className="text-zinc-400 mb-8 leading-relaxed flex-1">
              基于专业量表，深度分析你的敏感度、反刍思维与讨好倾向，生成专属的情绪账单。
            </p>
            <div className="flex items-center text-sm font-bold text-white mt-auto group-hover:translate-x-2 transition-transform duration-300">
              开始测算 <ArrowRight className="w-4 h-4 ml-2" />
            </div>
          </Link>

          {/* Destined Lover Test */}
          <Link
            href="/destined-lover"
            className="group relative overflow-hidden rounded-3xl bg-zinc-900 border border-zinc-800 p-8 transition-all hover:border-zinc-600 hover:shadow-2xl hover:shadow-pink-500/10 flex flex-col items-start"
          >
            <div className="mb-6 inline-flex items-center justify-center p-3 bg-pink-500/10 rounded-xl">
              <Sparkles className="w-6 h-6 text-pink-400" />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-white group-hover:text-pink-300 transition-colors">
              命定恋人测算
            </h2>
            <p className="text-zinc-400 mb-8 leading-relaxed flex-1">
              通过20道精选问题，测出你的MBTI人格变体，解锁专属的高阶命定恋人档案。
            </p>
            <div className="flex items-center text-sm font-bold text-white mt-auto group-hover:translate-x-2 transition-transform duration-300">
              开始测算 <ArrowRight className="w-4 h-4 ml-2" />
            </div>
          </Link>

          {/* City Personality Test */}
          <Link
            href="/city-personality"
            className="group relative overflow-hidden rounded-3xl bg-zinc-900 border border-zinc-800 p-8 transition-all hover:border-zinc-600 hover:shadow-2xl hover:shadow-blue-500/10 flex flex-col items-start md:col-span-2"
          >
            <div className="mb-6 inline-flex items-center justify-center p-3 bg-blue-500/10 rounded-xl">
              <span className="text-xl">🏙️</span>
            </div>
            <h2 className="text-2xl font-bold mb-3 text-white group-hover:text-blue-300 transition-colors">
              性格城市匹配测试
            </h2>
            <p className="text-zinc-400 mb-8 leading-relaxed flex-1">
              基于5维灵魂光谱，深度匹配你与全国34个省级行政区的契合度，获取你的专属单程车票。
            </p>
            <div className="flex items-center text-sm font-bold text-white mt-auto group-hover:translate-x-2 transition-transform duration-300">
              开始测算 <ArrowRight className="w-4 h-4 ml-2" />
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}
