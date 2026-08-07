'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import PrototypeSwitcher from '../../../components/PrototypeSwitcher';

// ---------------------------------------------------------------------------
// Variant A: 【Y2K·酸性杂志掌机卡套风】
// 高饱和克莱因蓝 + 荧光电光粉 + 酸性青绿，极具视觉冲击的Y2K情绪探测掌机
// ---------------------------------------------------------------------------
function VariantA() {
  return (
    <div className="w-[800px] h-[800px] bg-[#0A0B10] relative overflow-hidden flex flex-col justify-between p-8 select-none font-sans text-white border-[12px] border-[#0028FF] shadow-[0_0_80px_rgba(0,40,255,0.4)]">
      {/* 酸性炫彩放射网格背景 */}
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#CCFF00_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#FF1493]/30 blur-[90px] pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-[#0028FF]/40 blur-[90px] pointer-events-none" />

      {/* 顶部：Y2K酸性标识栏 & 档案批号 */}
      <div className="relative z-10 flex items-center justify-between border-b-2 border-[#0028FF] pb-4">
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-[#CCFF00] text-[#0A0B10] font-black text-xs tracking-widest uppercase transform -skew-x-12">
            LIMITED EDITION · 千帆正品
          </div>
          <span className="text-xs font-mono tracking-widest text-[#00F0FF]">
            SYS.VER 4.0 // SOUL_SCANNER
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#FF1493] animate-ping" />
          <span className="text-xs font-mono font-bold text-[#FF1493] tracking-widest">
            LIVE DETECTION
          </span>
        </div>
      </div>

      {/* 核心视觉标题区：极高对比酸性排版 */}
      <div className="relative z-10 my-auto">
        <div className="inline-block px-4 py-1.5 bg-[#FF1493] text-white font-black text-sm tracking-[0.2em] uppercase mb-4 shadow-[4px_4px_0px_#CCFF00]">
          3 MIN SOUL CONNECTION QUIZ
        </div>
        <h1 className="text-6xl font-black tracking-tighter leading-[0.9] uppercase text-white drop-shadow-[0_4px_20px_rgba(255,20,147,0.5)]">
          谁容易被你
          <span className="block text-[#CCFF00] drop-shadow-[4px_4px_0px_#0028FF]">
            吃 · 定？
          </span>
        </h1>
        <div className="mt-3 text-lg font-bold text-[#00F0FF] tracking-wide font-mono">
          [ 命 定 恋 人 · 灵 魂 契 合 度 侦 测 ]
        </div>

        {/* 核心：掌机风测试简要说明面板 */}
        <div className="mt-8 grid grid-cols-2 gap-4">
          <div className="bg-[#0028FF]/40 border-2 border-[#00F0FF] p-4 rounded-none relative group hover:bg-[#0028FF]/60 transition-all">
            <div className="text-[10px] font-mono font-bold text-[#CCFF00] uppercase tracking-widest mb-1">
              // 01. MATCH PROFILE
            </div>
            <div className="text-base font-black text-white">
              TA的性格与神仙长相
            </div>
            <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
              测算命中注定的另一半底层人格底色、五官倾向与气质氛围。
            </p>
          </div>

          <div className="bg-[#FF1493]/30 border-2 border-[#FF1493] p-4 rounded-none relative group hover:bg-[#FF1493]/50 transition-all">
            <div className="text-[10px] font-mono font-bold text-[#CCFF00] uppercase tracking-widest mb-1">
              // 02. DYNAMICS
            </div>
            <div className="text-base font-black text-white">
              双方情感博弈模式
            </div>
            <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
              深度解析你们是高位压制、灵魂互补还是并肩作战的宿命羁绊。
            </p>
          </div>

          <div className="bg-[#0A0B10]/80 border-2 border-[#CCFF00] p-4 rounded-none relative col-span-2 flex items-center justify-between">
            <div className="flex-1 pr-4">
              <div className="text-[10px] font-mono font-bold text-[#FF1493] uppercase tracking-widest mb-0.5">
                // 03. HOW IT WORKS · 快速测试说明
              </div>
              <div className="text-xs text-zinc-200 leading-relaxed font-medium">
                耗时 <span className="text-[#CCFF00] font-bold">3分钟</span> · 12道情感投射选择 · 月老算法精准匹配生成专属【红娘档案书】
              </div>
            </div>
            <div className="bg-[#CCFF00] text-[#0A0B10] px-4 py-2 font-black text-xs uppercase tracking-wider shrink-0 transform -rotate-2">
              点击立刻测算
            </div>
          </div>
        </div>
      </div>

      {/* 底部：镭射贴纸风格标尺 */}
      <div className="relative z-10 flex items-center justify-between pt-4 border-t border-zinc-800 text-xs font-mono text-zinc-400">
        <div className="flex items-center gap-3">
          <span className="bg-white text-black font-black px-1.5 py-0.5 text-[10px]">1:1 EXP</span>
          <span>SQUARE DISPLAY ASSET</span>
        </div>
        <div className="text-[#CCFF00] font-bold">
          ★ 超过 100,000+ 用户验证 ★
        </div>
        <div>
          XHS-ECOMMERCE // OFFICIAL
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Variant B: 【波普·新潮 Bento 撞色拼贴卡风】
// 糖果色高饱和不对称 Bento Grid，极具潮流设计师品牌与潮流日记的视觉美感
// ---------------------------------------------------------------------------
function VariantB() {
  return (
    <div className="w-[800px] h-[800px] bg-[#FFF8EE] relative overflow-hidden p-6 select-none font-sans text-zinc-900 border-8 border-[#1D1D1F] shadow-[0_20px_70px_rgba(0,0,0,0.25)] flex flex-col justify-between">
      {/* 顶部标语栏 */}
      <div className="flex items-center justify-between font-mono text-xs font-bold text-zinc-500 border-b-2 border-zinc-900 pb-3">
        <span className="bg-[#FF4500] text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
          POP BENTO ARCHIVE
        </span>
        <span className="tracking-widest uppercase">
          DESTINY LOVER // TEST SERIES
        </span>
        <span className="font-black text-zinc-900">#001-DL</span>
      </div>

      {/* 不对称 Bento 网格主区域 */}
      <div className="grid grid-cols-12 grid-rows-12 gap-4 my-auto h-[660px] pt-4">
        {/* 左主大字区 (6 cols, 7 rows) */}
        <div className="col-span-7 row-span-7 bg-[#FF4500] rounded-2xl p-6 flex flex-col justify-between text-white relative overflow-hidden shadow-lg border-2 border-black">
          <div className="text-xs font-mono tracking-widest uppercase opacity-80">
            [ SOUL QUESTIONNAIRE ]
          </div>
          <div>
            <div className="text-6xl font-black leading-none tracking-tight">
              谁容易
            </div>
            <div className="text-7xl font-black leading-none tracking-tight text-[#FFE600] mt-1">
              被你吃定?
            </div>
          </div>
          <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-white/20">
            <span>精准探索情感吸引力图谱</span>
            <span className="bg-black text-white px-3 py-1 rounded-full">命定恋人篇</span>
          </div>
        </div>

        {/* 右上简介说明卡 (5 cols, 7 rows) */}
        <div className="col-span-5 row-span-7 bg-[#00E5FF] rounded-2xl p-6 flex flex-col justify-between border-2 border-black shadow-lg">
          <div>
            <div className="inline-block bg-black text-white text-[11px] font-black px-2.5 py-1 rounded-md mb-3 uppercase tracking-wider">
              测试简要说明
            </div>
            <h3 className="text-xl font-black text-black leading-snug">
              为什么每次心动总是遇上同样模式的人？
            </h3>
            <p className="text-xs font-medium text-zinc-900 mt-2 leading-relaxed">
              基于心理投射与人际交往吸引力法则，只需 3 分钟完成本次测验，看穿你潜意识中最致命的情感特质。
            </p>
          </div>
          
          <div className="bg-white/90 rounded-xl p-3 border border-black/10 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF4500]" />
              <span className="text-xs font-bold">外貌推论：TA的高频特征</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#9D00FF]" />
              <span className="text-xs font-bold">性格分析：底色与互动雷达</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00BA38]" />
              <span className="text-xs font-bold">相处建议：感情破局指南</span>
            </div>
          </div>
        </div>

        {/* 左下测试核心参数 Bento 卡 (5 cols, 5 rows) */}
        <div className="col-span-5 row-span-5 bg-[#9D00FF] text-white rounded-2xl p-5 flex flex-col justify-between border-2 border-black shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase font-bold text-[#FFE600]">
              ★ FAST EXAM
            </span>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded">12 道题</span>
          </div>
          <div>
            <div className="text-3xl font-black text-[#FFE600]">
              3 MINS
            </div>
            <div className="text-xs opacity-90 mt-0.5">
              极速测试 · 获取一对一完整档案
            </div>
          </div>
          <div className="text-[11px] font-medium opacity-80 border-t border-white/20 pt-2">
            适合单身、恋爱中或渴望突破情感迷局的你
          </div>
        </div>

        {/* 右下转化引导 Bento 卡 (7 cols, 5 rows) */}
        <div className="col-span-7 row-span-5 bg-[#FFE600] rounded-2xl p-6 flex flex-col justify-between border-2 border-black shadow-lg">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-black text-black uppercase">
              // READY TO START
            </span>
            <span className="bg-black text-white font-mono text-[10px] px-2 py-0.5 rounded font-bold">
              POP ARCHIVE
            </span>
          </div>
          <div className="text-2xl font-black text-black leading-tight">
            全网已超 <span className="underline decoration-4 decoration-[#FF4500]">100,000+</span> 人参与
          </div>
          <button className="w-full bg-black text-white font-black text-sm py-3 rounded-xl tracking-widest uppercase hover:bg-zinc-800 transition shadow-md">
            点击右下角 · 立即进入测试 &gt;&gt;
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Variant C: 【赛博·电光心情唱片封面风】
// 仿造 1:1 音乐限定唱片与专辑曲目栏(Tracklist) 的独特多巴胺表现形式
// ---------------------------------------------------------------------------
function VariantC() {
  return (
    <div className="w-[800px] h-[800px] bg-[#0A0A0C] relative overflow-hidden p-8 select-none font-sans text-white border-[10px] border-[#222] shadow-[0_20px_80px_rgba(0,0,0,0.8)] flex flex-col justify-between">
      {/* 炫彩色声波霓虹渐变背景 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[680px] h-[680px] rounded-full bg-gradient-to-tr from-[#FF0055] via-[#7000FF] to-[#00F0FF] opacity-15 blur-[60px] pointer-events-none" />

      {/* 顶部：唱片公司与产品序列 */}
      <div className="relative z-10 flex items-center justify-between text-xs font-mono tracking-widest text-zinc-400 border-b border-zinc-800 pb-3">
        <span className="text-[#FF0055] font-bold">REC // STEREO 33 ⅓ RPM</span>
        <span>DESTINY LOVER OFFICIAL LP</span>
        <span>CAT. NO. XHS-2026-DL</span>
      </div>

      {/* 唱片核心视觉标题区 */}
      <div className="relative z-10 my-6 flex items-center gap-8">
        {/* 1:1 多巴胺唱片图形 */}
        <div className="w-56 h-56 rounded-full bg-gradient-to-br from-[#FF0055] via-[#7000FF] to-[#00F0FF] p-1 shadow-[0_0_40px_rgba(255,0,85,0.4)] shrink-0 flex items-center justify-center relative animate-spin-slow">
          <div className="w-full h-full rounded-full bg-[#0A0A0C] flex items-center justify-center relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#FF0055] to-[#00F0FF] flex items-center justify-center">
              <div className="w-6 h-6 rounded-full bg-[#0A0A0C]" />
            </div>
            <div className="absolute inset-4 rounded-full border border-white/10" />
            <div className="absolute inset-8 rounded-full border border-white/10" />
          </div>
        </div>

        {/* 大标与艺术家名称 */}
        <div>
          <div className="text-xs font-mono text-[#00F0FF] uppercase tracking-[0.25em] mb-2 font-bold">
            PSYCHOLOGICAL SCAN RECORD
          </div>
          <h1 className="text-5xl font-black tracking-tighter leading-tight">
            谁容易被你
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#FF0055] to-[#00F0FF]">
              吃定？
            </span>
          </h1>
          <p className="text-sm font-medium text-zinc-400 mt-2">
            命定恋人 · 个人专属情感吸引力声带
          </p>
        </div>
      </div>

      {/* 测试简要说明 — 专辑曲目清单风格 (Tracklist) */}
      <div className="relative z-10 bg-zinc-900/80 border border-zinc-800 p-6 rounded-xl backdrop-blur-md">
        <div className="flex items-center justify-between text-xs font-mono text-zinc-400 uppercase tracking-widest border-b border-zinc-800 pb-3 mb-4">
          <span>// LINER NOTES · 测试简要说明</span>
          <span className="text-[#FF0055] font-bold">TOTAL DURATION: 03:00</span>
        </div>

        <div className="space-y-3 font-mono text-sm">
          <div className="flex items-center justify-between group hover:text-[#00F0FF] transition-colors">
            <div className="flex items-center gap-3">
              <span className="text-[#FF0055] font-bold">01.</span>
              <span className="font-sans font-bold text-white">TA的人格性格倾向</span>
              <span className="text-xs text-zinc-500 font-sans">| 揭露底色与人际交往特质</span>
            </div>
            <span className="text-xs text-zinc-500">COMPLETE</span>
          </div>

          <div className="flex items-center justify-between group hover:text-[#00F0FF] transition-colors">
            <div className="flex items-center gap-3">
              <span className="text-[#FF0055] font-bold">02.</span>
              <span className="font-sans font-bold text-white">神仙外貌特征识别</span>
              <span className="text-xs text-zinc-500 font-sans">| 估判对方高频外形氛围</span>
            </div>
            <span className="text-xs text-zinc-500">COMPLETE</span>
          </div>

          <div className="flex items-center justify-between group hover:text-[#00F0FF] transition-colors">
            <div className="flex items-center gap-3">
              <span className="text-[#FF0055] font-bold">03.</span>
              <span className="font-sans font-bold text-white">双方情感相处羁绊模式</span>
              <span className="text-xs text-zinc-500 font-sans">| 是灵魂高位还是平视同行</span>
            </div>
            <span className="text-xs text-zinc-500">COMPLETE</span>
          </div>

          <div className="flex items-center justify-between group hover:text-[#00F0FF] transition-colors">
            <div className="flex items-center gap-3">
              <span className="text-[#FF0055] font-bold">04.</span>
              <span className="font-sans font-bold text-white">心动阈值与破局指引</span>
              <span className="text-xs text-zinc-500 font-sans">| 恋爱关系避坑建议</span>
            </div>
            <span className="text-xs text-zinc-500">COMPLETE</span>
          </div>
        </div>
      </div>

      {/* 底部按键与参数 */}
      <div className="relative z-10 flex items-center justify-between pt-4 border-t border-zinc-800 text-xs font-mono text-zinc-500">
        <div>12 QUESTIONS // ACCURATE MATCHING</div>
        <div className="bg-white text-black font-black px-3 py-1 uppercase tracking-wider text-xs">
          点击进入测算 · 开始聆听
        </div>
        <div>1:1 MASTER POSTER</div>
      </div>
    </div>
  );
}

function PosterContent() {
  const searchParams = useSearchParams();
  const variantParam = searchParams.get('variant') || 'A';
  const [pureMode, setPureMode] = useState(false);

  const variants = [
    { id: 'A', name: 'Y2K·酸性杂志掌机卡套风' },
    { id: 'B', name: '波普·新潮 Bento 撞色拼贴风' },
    { id: 'C', name: '赛博·电光心情唱片封套风' },
  ];

  useEffect(() => {
    // 监听键盘 M 快捷键或 Esc 切换纯净无干扰模式
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'm' || e.key === 'M') {
        setPureMode(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#111114] text-white flex flex-col items-center justify-center relative overflow-x-hidden font-sans">
      {/* 顶栏控制台（在纯净模式下隐藏） */}
      {!pureMode && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-zinc-900/90 backdrop-blur-md px-6 py-2.5 rounded-full border border-zinc-700 shadow-2xl text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold tracking-widest uppercase text-zinc-300">
              宿命恋人 · 1:1 多巴胺千帆商品图
            </span>
          </div>
          <div className="h-4 w-[1px] bg-zinc-700" />
          <button
            onClick={() => setPureMode(true)}
            className="text-amber-400 hover:text-amber-300 font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>[ 进入纯净截图模式 (按M键还原) ]</span>
          </button>
        </div>
      )}

      {/* 纯净模式退出提示小胶囊 */}
      {pureMode && (
        <button
          onClick={() => setPureMode(false)}
          className="fixed top-4 right-4 z-50 bg-black/60 hover:bg-black/90 text-white/70 hover:text-white px-4 py-1.5 rounded-full text-xs font-mono backdrop-blur-sm border border-white/10 transition cursor-pointer"
        >
          ESC/按M退出纯净模式
        </button>
      )}

      {/* 1:1 主图容器（固定 800x800 正方形，通过 scale 在屏幕中居中最佳呈现） */}
      <div className="my-16 flex items-center justify-center shadow-[0_0_120px_rgba(0,0,0,0.9)]">
        {variantParam === 'A' && <VariantA />}
        {variantParam === 'B' && <VariantB />}
        {variantParam === 'C' && <VariantC />}
      </div>

      {/* 底部 Variant 切换器（仅在非纯净模式下展示） */}
      {!pureMode && (
        <PrototypeSwitcher variants={variants} currentVariant={variantParam} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page: 宿命恋人多巴胺 1:1 千帆商品展示图原型页面
// ---------------------------------------------------------------------------
export default function DestinyLoverPosterPrototype() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#111114] text-white flex items-center justify-center">加载1:1千帆多巴胺主图中...</div>}>
      <PosterContent />
    </Suspense>
  );
}
