"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Download, ChevronRight, X, ChevronLeft, RefreshCcw } from "lucide-react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import { archetypes } from "@/data/archetypes";

export default function ResultPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const archetype = archetypes[id];

  const [radarData, setRadarData] = useState<any[]>([]);
  const [visitorCount, setVisitorCount] = useState(0);
  const [randomId, setRandomId] = useState("");

  const [isGenerating, setIsGenerating] = useState(false);
  const [posterDataUrl, setPosterDataUrl] = useState<string | null>(null);
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize radar data and fake visitor count
  useEffect(() => {
    if (!archetype) {
      router.push("/");
      return;
    }
    const fluctuate = (val: number, isMax: boolean) => {
      if (isMax) return val; // keep max value untouched
      const fluctuation = 1 + (Math.random() * 0.2 - 0.1); // +/- 10%
      return Math.min(100, Math.max(10, Math.round(val * fluctuation)));
    };

    const maxVal = Math.max(
      archetype.radar.pragmatic,
      archetype.radar.possessive,
      archetype.radar.romantic,
      archetype.radar.action
    );

    setRadarData([
      { subject: "务实落地", A: fluctuate(archetype.radar.pragmatic, archetype.radar.pragmatic === maxVal), fullMark: 100 },
      { subject: "情绪依赖", A: fluctuate(archetype.radar.possessive, archetype.radar.possessive === maxVal), fullMark: 100 },
      { subject: "浪漫幻想", A: fluctuate(archetype.radar.romantic, archetype.radar.romantic === maxVal), fullMark: 100 },
      { subject: "精神共鸣", A: fluctuate(archetype.radar.action, archetype.radar.action === maxVal), fullMark: 100 },
    ]);

    setVisitorCount(Math.floor(Math.random() * 50000) + 12000);
    setRandomId(Math.floor(Math.random()*900+100).toString());

    try {
      const historyStr = localStorage.getItem("quiz_history") || "[]";
      const history = JSON.parse(historyStr);
      const filtered = history.filter((item: any) => item.id !== id);
      filtered.unshift({
        id,
        title: archetype.title,
        timestamp: Date.now()
      });
      localStorage.setItem("quiz_history", JSON.stringify(filtered.slice(0, 10)));
    } catch (err) {
      console.error("Failed to save history", err);
    }
  }, [archetype, router, id]);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const index = Math.round(scrollLeft / clientWidth);
      setActiveCardIndex(index);
    }
  };

  const scrollToCard = (index: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        left: scrollRef.current.clientWidth * index,
        behavior: 'smooth'
      });
    }
  };

  const captureSpecificCard = async (index: number) => {
    try {
      setIsGenerating(true);
      const { toPng } = await import("html-to-image");
      const targetId = index === 0 ? "card-poster" : "card-analysis";
      const node = document.getElementById(targetId);
      if (!node) return;
      
      const dataUrl = await toPng(node, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: "#09090b", // zinc-950
      });
      setPosterDataUrl(dataUrl);
    } catch (err) {
      console.error("Failed to generate poster:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSavePoster = () => captureSpecificCard(activeCardIndex);

  const handleModalToggle = () => {
    const nextIndex = activeCardIndex === 0 ? 1 : 0;
    scrollToCard(nextIndex); // physically scroll the background
    captureSpecificCard(nextIndex); // capture the new card
  };

  if (!archetype) return null;

  return (
    <div className="h-screen bg-zinc-950 text-white font-sans overflow-hidden flex flex-col items-center relative">
      {/* Background Glow */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-pink-600/10 to-transparent blur-[100px]" />
      </div>

      {/* Phone-width wrapper */}
      <div className="w-full max-w-sm flex flex-col flex-1 min-h-0">

        {/* Top Header / Indicator */}
        <div className="relative z-20 flex items-center justify-between px-4 py-4">
          <button 
            onClick={() => scrollToCard(0)}
            disabled={activeCardIndex === 0}
            className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-full backdrop-blur-md disabled:opacity-20 transition-opacity"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex space-x-2">
            <div className={`w-2 h-2 rounded-full transition-colors ${activeCardIndex === 0 ? "bg-pink-500" : "bg-zinc-700"}`} />
            <div className={`w-2 h-2 rounded-full transition-colors ${activeCardIndex === 1 ? "bg-pink-500" : "bg-zinc-700"}`} />
          </div>
          <button 
            onClick={() => scrollToCard(1)}
            disabled={activeCardIndex === 1}
            className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-full backdrop-blur-md text-pink-400 disabled:opacity-20 transition-opacity"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Main Scroll Area */}
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 min-h-0 overflow-x-auto snap-x snap-mandatory flex items-stretch scroll-smooth no-scrollbar relative z-10 pb-28"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <style dangerouslySetInnerHTML={{__html: `::-webkit-scrollbar { display: none; }`}} />

          {/* Card 1: Poster */}
          <div className="w-full shrink-0 snap-center px-4 py-2 flex flex-col h-full">
          <div 
            id="card-poster"
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden relative shadow-2xl flex flex-col"
          >
            {/* Watermark Stamp */}
            <div className="absolute -top-6 -right-6 pointer-events-none transform rotate-12 opacity-10 font-black text-6xl tracking-tighter text-pink-500 border-4 border-pink-500/20 px-4 py-2 rounded-lg">
              CONFIRMED
            </div>

            <div className="p-8 pb-4 relative z-10">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-zinc-500 font-medium tracking-widest text-sm uppercase">月老高阶档案局</h3>
                <span className="text-xs font-mono text-pink-500/50 bg-pink-500/10 px-2 py-1 rounded">No. {id}-{randomId || "---"}</span>
              </div>
              
              <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 mb-2 mt-4 leading-tight">
                {archetype.title}
              </h1>
              <p className="text-zinc-300 text-lg font-medium mb-6">{archetype.subtitle}</p>

              <div className="flex flex-wrap gap-2">
                {archetype.tags.map((tag) => (
                  <span key={tag} className="px-3 py-1.5 bg-black/40 backdrop-blur-md border border-white/5 rounded-lg text-xs text-pink-300 font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="h-64 w-full relative z-10 -mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="#3f3f46" strokeDasharray="3 3" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: "#a1a1aa", fontSize: 12, fontWeight: 500 }} />
                  <Radar name="Archetype" dataKey="A" stroke="#ec4899" strokeWidth={2} fill="#ec4899" fillOpacity={0.25} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-auto p-6 bg-zinc-950/30 text-center relative z-10">
              <p className="text-sm font-medium text-zinc-300 mb-1">
                你是第 <span className="text-pink-400 font-bold">{visitorCount.toLocaleString()}</span> 个测出该结果的人
              </p>
              <p className="text-[10px] text-zinc-600 uppercase tracking-widest">For Entertainment Purposes Only</p>
            </div>
          </div>
        </div>

        {/* Card 2: Analysis */}
        <div className="w-full shrink-0 snap-center px-4 py-2 flex flex-col h-full">
          <div 
            id="card-analysis"
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden relative shadow-2xl flex flex-col"
          >
            {/* Background Text Watermark */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-5 overflow-hidden">
              <span className="font-black text-9xl tracking-tighter transform -rotate-45 text-white">REPORT</span>
            </div>

            <div className="p-8 flex-1 overflow-y-auto relative z-10 space-y-8 no-scrollbar" style={{ scrollbarWidth: 'none' }}>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">潜意识解析</h2>
                <div className="h-1 w-12 bg-pink-500 rounded-full"></div>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-pink-400 uppercase tracking-widest flex items-center">
                    <span className="w-1.5 h-4 bg-pink-400 mr-2 rounded-sm"></span> 核心成因诊断
                  </h3>
                  <p className="text-zinc-300 text-justify leading-relaxed">
                    {archetype.analysis.split('。').slice(0, 2).join('。') + '。'}
                  </p>
                </div>
                
                <div className="w-full h-px bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800"></div>

                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-pink-400 uppercase tracking-widest flex items-center">
                    <span className="w-1.5 h-4 bg-purple-400 mr-2 rounded-sm"></span> 专属破局建议
                  </h3>
                  <p className="text-zinc-300 text-justify leading-relaxed">
                    {archetype.analysis.split('。').slice(2).join('。')}
                  </p>
                </div>

                <div className="mt-8 pt-6 border-t border-dashed border-zinc-700/50">
                  <h3 className="text-xs text-zinc-500 mb-4 tracking-widest">YOUR QUOTE</h3>
                  <blockquote className="text-xl font-medium text-white italic leading-tight">
                    "{archetype.quote}"
                  </blockquote>
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-zinc-950/30 text-center relative z-10 border-t border-zinc-800">
              <p className="text-xs font-mono text-zinc-500">ID: {id} | 高阶恋人心理档案局</p>
            </div>
          </div>
        </div>

      </div>{/* End scroll area */}

      </div>{/* End phone-width wrapper */}

      {/* Bottom Action Area */}
      <div className="fixed bottom-0 left-0 w-full p-4 pb-8 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent z-30 pointer-events-none flex items-end justify-center">
        <div className="w-full max-w-sm flex justify-center gap-3 pointer-events-auto">
          <button 
            onClick={() => router.push('/')}
            className="flex-1 bg-zinc-800 text-zinc-300 font-bold py-4 rounded-2xl shadow-xl flex items-center justify-center space-x-2 hover:bg-zinc-700 active:scale-95 transition-all"
          >
            <RefreshCcw className="w-5 h-5" />
            <span>重新建档</span>
          </button>

          <button 
            onClick={handleSavePoster}
            disabled={isGenerating}
            className="flex-[2] bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold py-4 rounded-2xl shadow-[0_0_20px_rgba(236,72,153,0.3)] flex items-center justify-center space-x-2 active:scale-95 transition-all disabled:opacity-50"
          >
            {isGenerating ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            <span>{isGenerating ? "生成中..." : "保存专属档案"}</span>
          </button>
        </div>
      </div>

      {/* Fullscreen Poster Modal */}
      <AnimatePresence>
        {posterDataUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 p-6"
          >
            <div className="absolute top-6 w-full px-6 flex justify-between items-center z-10">
              <span className="text-pink-400 font-medium text-sm">长按保存到相册</span>
              <button 
                onClick={() => setPosterDataUrl(null)}
                className="p-2 bg-white/10 rounded-full text-white backdrop-blur-md"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="w-full max-w-sm relative mt-8 flex flex-col items-center">
              <div className="relative w-full">
                <img 
                  src={posterDataUrl} 
                  alt="Your Result Poster" 
                  className="w-full h-auto rounded-2xl shadow-2xl border border-zinc-800"
                />
                
                {/* Modal Internal Navigation */}
                <button 
                  onClick={handleModalToggle}
                  className="absolute top-1/2 -left-4 -translate-y-1/2 w-10 h-10 bg-black/50 border border-white/10 backdrop-blur-xl rounded-full flex items-center justify-center text-white/70 hover:text-white"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button 
                  onClick={handleModalToggle}
                  className="absolute top-1/2 -right-4 -translate-y-1/2 w-10 h-10 bg-black/50 border border-white/10 backdrop-blur-xl rounded-full flex items-center justify-center text-white/70 hover:text-white"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-8 flex gap-2">
                <div className={`w-2 h-2 rounded-full ${activeCardIndex === 0 ? "bg-white" : "bg-white/20"}`} />
                <div className={`w-2 h-2 rounded-full ${activeCardIndex === 1 ? "bg-white" : "bg-white/20"}`} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
