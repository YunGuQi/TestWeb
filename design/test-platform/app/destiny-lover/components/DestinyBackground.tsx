'use client';

import React, { useEffect, useState } from 'react';

interface DestinyBackgroundProps {
  children?: React.ReactNode;
}

export default function DestinyBackground({ children }: DestinyBackgroundProps) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let animationFrameId: number;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      // 计算相对屏幕中心偏移的百分比 (-0.5 ~ +0.5)
      targetX = (e.clientX / window.innerWidth - 0.5) * 36; // 左右最大视角视差 36px
      targetY = (e.clientY / window.innerHeight - 0.5) * 36;
    };

    const updateParallax = () => {
      // 缓动平滑阻尼公式 (Lerp)，60fps下如丝般柔滑
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;
      setMousePos({ x: currentX, y: currentY });
      animationFrameId = requestAnimationFrame(updateParallax);
    };

    window.addEventListener('mousemove', handleMouseMove);
    animationFrameId = requestAnimationFrame(updateParallax);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      className="min-h-[100dvh] w-full relative flex flex-col items-center justify-start overflow-hidden text-[#2C2825] font-serif transition-colors duration-500 select-none"
      style={{
        backgroundColor: '#F4EFE6',
        backgroundImage: `
          radial-gradient(rgba(185,58,50,0.065) 1px, transparent 0),
          radial-gradient(rgba(44,40,37,0.08) 1px, transparent 0)
        `,
        backgroundSize: '32px 32px',
        backgroundPosition: '0 0, 16px 16px',
      }}
    >
      {/* 1. 顶部仿古宣纸微颗粒感茶色渐变压边 */}
      <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-[#EAE3D4]/80 to-transparent pointer-events-none z-0" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#EAE3D4]/70 to-transparent pointer-events-none z-0" />

      {/* 2. 90秒自转仿古天象因缘命盘暗纹 (Astral Stamp) */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[780px] h-[780px] md:w-[980px] md:h-[980px] pointer-events-none opacity-[0.32] z-0 flex items-center justify-center"
        style={{
          transform: `translate(calc(-50% + ${mousePos.x * -0.4}px), calc(-50% + ${mousePos.y * -0.4}px))`,
          transition: 'transform 0.1s ease-out',
        }}
      >
        <svg
          className="w-full h-full animate-spin-slow text-[#B93A32]"
          viewBox="0 0 600 600"
          fill="none"
          stroke="currentColor"
        >
          {/* 最外侧十二时辰/天星仪虚线圆 */}
          <circle cx="300" cy="300" r="280" strokeWidth="1" strokeDasharray="6 8" />
          <circle cx="300" cy="300" r="240" strokeWidth="1.2" />
          <circle cx="300" cy="300" r="200" strokeWidth="1.5" strokeDasharray="3 9" />
          <circle cx="300" cy="300" r="140" strokeWidth="1" />
          <circle cx="300" cy="300" r="80" strokeWidth="1.2" strokeDasharray="2 4" />
          {/* 八方乾坤连线 */}
          <path
            d="M300 20 L300 580 M20 300 L580 300 M102 102 L498 498 M102 498 L498 102"
            strokeWidth="0.8"
            opacity="0.75"
          />
          {/* 古典几何星相菱格 */}
          <polygon
            points="300,50 330,280 550,300 330,320 300,550 270,320 50,300 270,280"
            strokeWidth="1.2"
            fill="none"
          />
        </svg>
      </div>

      {/* 3. 宿命牵连 · 月老朱砂因缘红绳 (Crimson Cord SVG，带精细视差偏转) */}
      <div
        className="absolute inset-0 pointer-events-none opacity-85 z-0 flex items-center justify-center"
        style={{
          transform: `translate(${mousePos.x * 0.8}px, ${mousePos.y * 0.8}px)`,
        }}
      >
        <svg className="w-full h-full" viewBox="0 0 1440 900" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* 红色姻缘主线 */}
          <path
            d="M-100,180 C320,380 680,60 1560,580"
            stroke="#B93A32"
            strokeWidth="2.2"
            strokeDasharray="8 6"
          />
          {/* 交互缠绕交叉细纹 */}
          <path
            d="M-40,760 C440,540 960,860 1520,120"
            stroke="#B93A32"
            strokeWidth="1.6"
            opacity="0.9"
          />
          {/* 红绳端点节点印斑 */}
          <circle cx="320" cy="275" r="5" fill="#B93A32" opacity="0.8" />
          <circle cx="1080" cy="565" r="5" fill="#B93A32" opacity="0.8" />
        </svg>
      </div>

      {/* 4. 鼠标跟随微弱朱砂光斑 (Interactive Glow) */}
      <div
        className="absolute w-96 h-96 rounded-full bg-[#B93A32]/[0.05] blur-3xl pointer-events-none z-0"
        style={{
          left: '50%',
          top: '40%',
          transform: `translate(calc(-50% + ${mousePos.x * 2.2}px), calc(-50% + ${mousePos.y * 2.2}px))`,
        }}
      />

      {/* 5. 右上侧古典姻缘档案小签章 (复古东方美学点睛) */}
      <div className="absolute top-6 right-6 md:right-12 hidden md:flex flex-col items-center pointer-events-none opacity-40 z-0">
        <div className="w-9 h-9 border-2 border-[#B93A32] rounded-full flex items-center justify-center text-[#B93A32] font-black text-[11px] -rotate-12 bg-[#FAF7F0] shadow-sm">
          <span className="leading-tight text-center">月老<br />印鉴</span>
        </div>
        <span className="text-[10px] font-mono text-[#8C8275] mt-1 tracking-widest">// NO.08492 //</span>
      </div>

      {/* 6. 左侧纵向古风篆刻装饰浮水印 (长屏幕大屏展现) */}
      <div
        className="absolute left-6 top-1/4 hidden lg:block text-[#8C8275] text-xs tracking-[0.7em] font-serif opacity-30 pointer-events-none select-none z-0"
        style={{ writingMode: 'vertical-rl' }}
      >
        千里姻缘一线牵 · 红线结发注此生
      </div>

      {/* 7. 前台所有组件插槽 (绝对 z-10 安全区域) */}
      <div className="relative z-10 w-full flex-1 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}
