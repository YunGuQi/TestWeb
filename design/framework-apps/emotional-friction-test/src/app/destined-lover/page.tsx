"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Users, Heart, ArrowRight, Sparkles, Clock, X, Compass } from "lucide-react";
import { archetypes } from "@/data-dl/archetypes";

interface HistoryItem {
  id: string;
  title: string;
  timestamp: number;
}

export default function LandingPage() {
  const router = useRouter();
  const [onlineUsers, setOnlineUsers] = useState(1342);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // 伪造在线人数动态更新
  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineUsers((prev) => {
        const change = Math.floor(Math.random() * 11) - 5;
        return Math.max(1200, prev + change);
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // 读取本地历史记录
  useEffect(() => {
    try {
      const stored = localStorage.getItem("quiz_history");
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (err) {
      console.error("Failed to read history", err);
    }
  }, []);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-pink-500/30 overflow-hidden relative font-sans flex flex-col items-center justify-center p-6">
      {/* Background gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-purple-600/20 to-transparent rounded-full blur-[120px] mix-blend-screen opacity-50" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-pink-600/20 to-transparent rounded-full blur-[120px] mix-blend-screen opacity-50" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md relative z-10 flex flex-col items-center text-center space-y-8"
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center space-x-2 bg-white/5 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full"
        >
          <Sparkles className="w-4 h-4 text-pink-400" />
          <span className="text-sm font-medium tracking-wide text-zinc-300">
            现象级全网爆款心理测试
          </span>
        </motion.div>

        {/* Title */}
        <div className="space-y-4">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight"
          >
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-500">
              月老高阶档案局
            </span>
            测测你的「高阶命定恋人」长什么样？
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-base md:text-lg text-zinc-400 leading-relaxed text-justify"
          >
            据说人这一生，其实在潜意识里早就画好了另一半的画像。别猜了，用这20道直击灵魂的题，去月老高阶档案局调取你的专属红线匹配报告吧。
          </motion.p>
        </div>

        {/* Action Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="w-full pt-4 flex flex-col items-center space-y-4"
        >
          {/* 主按钮 */}
          <button
            onClick={() => router.push("/destined-lover/test")}
            className="group relative w-full overflow-hidden rounded-2xl bg-white px-8 py-4 font-bold text-black transition-all hover:scale-[1.02] active:scale-95"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-pink-200 to-purple-200 opacity-0 transition-opacity group-hover:opacity-100" />
            <span className="relative flex items-center justify-center space-x-2">
              <Heart className="w-5 h-5 text-pink-600 fill-pink-600 animate-pulse" />
              <span className="text-lg">开启潜意识探测</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </span>
          </button>

          {/* 伪造在线人数 */}
          <div className="flex items-center space-x-2 text-sm text-zinc-500">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <Users className="w-4 h-4" />
            <motion.span
              key={onlineUsers}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-mono font-medium text-zinc-300"
            >
              {onlineUsers.toLocaleString()}
            </motion.span>
            <span>人正在和你一起测</span>
          </div>

          {/* 次级按钮 Flex 并排 - 按 SOP 规范 */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75 }}
            className="flex gap-4 w-full"
          >
            {/* 查看历史档案 */}
            <AnimatePresence>
              {history.length > 0 && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={() => setShowHistoryModal(true)}
                  className="flex-1 flex items-center justify-center gap-2 bg-transparent text-zinc-400 hover:text-white text-xs font-mono font-bold py-3 transition-colors tracking-widest underline underline-offset-4"
                >
                  查看历史档案
                </motion.button>
              )}
            </AnimatePresence>

            {/* 探索其他专柜 */}
            <button
              onClick={() => router.push('/hub')}
              className="flex-1 flex items-center justify-center gap-2 bg-transparent text-zinc-400 hover:text-white text-xs font-mono font-bold py-3 transition-colors tracking-widest underline underline-offset-4"
            >
              探索其他专柜
            </button>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* 历史记录 Modal */}
      <AnimatePresence>
        {showHistoryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowHistoryModal(false)}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4 pb-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">我的历史档案</h2>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="p-2 bg-white/5 rounded-full"
                >
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>
              <div className="space-y-3">
                {history.map((item) => (
                  <button
                    key={item.timestamp}
                    onClick={() => {
                      setShowHistoryModal(false);
                      router.push(`/destined-lover/result/${item.id}`);
                    }}
                    className="w-full flex items-center justify-between p-4 bg-zinc-800 hover:bg-zinc-700 rounded-2xl transition-colors text-left group"
                  >
                    <div>
                      <p className="font-bold text-white group-hover:text-pink-300 transition-colors">{archetypes[item.id]?.title || item.title}</p>
                      <p className="text-xs text-zinc-500 mt-1 font-mono">{item.id} · {formatTime(item.timestamp)}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-pink-400 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
