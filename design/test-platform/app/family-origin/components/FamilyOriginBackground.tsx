'use client';

import React, { useEffect, useState } from 'react';

interface FamilyOriginBackgroundProps {
  children?: React.ReactNode;
}

export default function FamilyOriginBackground({ children }: FamilyOriginBackgroundProps) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let animationFrameId: number;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let time = 0;

    const handleMouseMove = (e: MouseEvent) => {
      targetX = (e.clientX / window.innerWidth - 0.5) * 20;
      targetY = (e.clientY / window.innerHeight - 0.5) * 20;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        targetX = (e.touches[0].clientX / window.innerWidth - 0.5) * 10;
        targetY = (e.touches[0].clientY / window.innerHeight - 0.5) * 10;
      }
    };

    const updateParallax = () => {
      time += 0.015;
      const autoDriftX = Math.sin(time) * 4;
      const autoDriftY = Math.cos(time * 0.8) * 4;

      currentX += (targetX + autoDriftX - currentX) * 0.08;
      currentY += (targetY + autoDriftY - currentY) * 0.08;
      
      setMousePos({ x: currentX, y: currentY });
      animationFrameId = requestAnimationFrame(updateParallax);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    animationFrameId = requestAnimationFrame(updateParallax);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      className="min-h-[100dvh] w-full relative flex flex-col items-center justify-start overflow-hidden text-[#121212] font-serif transition-colors duration-500 select-none bg-[#FDFBF7]"
    >
      {/* 1. 剧本分镜网格背景 (Storyboard Grid) */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.4] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(18,18,18,0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(18,18,18,0.08) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          backgroundPosition: 'center center',
          transform: `translate(${mousePos.x * 0.5}px, ${mousePos.y * 0.5}px)`,
        }}
      />

      {/* 边缘虚化掩盖网格的突兀 */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#FDFBF7] to-transparent pointer-events-none z-0" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#FDFBF7] to-transparent pointer-events-none z-0" />
      <div className="absolute inset-y-0 left-0 w-16 md:w-32 bg-gradient-to-r from-[#FDFBF7] to-transparent pointer-events-none z-0" />
      <div className="absolute inset-y-0 right-0 w-16 md:w-32 bg-gradient-to-l from-[#FDFBF7] to-transparent pointer-events-none z-0" />

      {/* 2. 电影摄影机取景框修饰 (Viewfinder Corners) */}
      <div className="absolute inset-8 md:inset-12 border border-[#121212]/10 pointer-events-none z-0 hidden sm:block">
          <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-[#121212]/30"></div>
          <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-[#121212]/30"></div>
          <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-[#121212]/30"></div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-[#121212]/30"></div>
      </div>

      {/* 3. 动态焦距扫描光圈 (Interactive Focus) */}
      <div
        className="absolute w-96 h-96 rounded-full border border-[#121212]/5 pointer-events-none z-0 flex items-center justify-center opacity-40"
        style={{
          left: '50%',
          top: '50%',
          transform: `translate(calc(-50% + ${mousePos.x * 2}px), calc(-50% + ${mousePos.y * 2}px))`,
        }}
      >
          <div className="w-64 h-64 border border-[#121212]/5 rounded-full"></div>
          <div className="absolute w-full h-[1px] bg-[#121212]/10"></div>
          <div className="absolute h-full w-[1px] bg-[#121212]/10"></div>
      </div>

      {/* 4. 右上角：场记板/档案编号 */}
      <div className="absolute top-[max(24px,env(safe-area-inset-top))] right-4 sm:top-8 sm:right-10 flex flex-col items-end pointer-events-none opacity-80 z-0">
        <div className="bg-[#121212] text-white px-3 py-1 font-mono text-[10px] sm:text-xs tracking-widest uppercase font-bold flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
          DIRECTOR'S CUT
        </div>
        <span className="text-[10px] font-mono text-[#121212]/60 mt-2 tracking-widest">// TAKE 01 //</span>
      </div>

      {/* 5. 左侧纵向现代排版装饰标语 */}
      <div
        className="absolute left-6 top-1/4 hidden lg:flex flex-col text-[#121212]/40 text-xs tracking-[0.6em] font-sans pointer-events-none select-none z-0 uppercase font-bold items-center gap-6"
      >
        <span style={{ writingMode: 'vertical-rl' }}>ORIGINAL SCRIPT</span>
        <div className="w-[1px] h-12 bg-[#121212]/20"></div>
        <span style={{ writingMode: 'vertical-rl' }}>重写人生剧本</span>
      </div>

      {/* 7. 前台组件安全容器 */}
      <div className="relative z-10 w-full flex-1 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}

