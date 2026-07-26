'use client';

export default function DynamicBackground() {
  return (
    <div className="fixed inset-0 z-[-1] bg-[#1a1a1a] overflow-hidden">
      {/* 飞驰的车窗光影 */}
      <div className="absolute inset-0 opacity-40 mix-blend-screen z-0"
           style={{
             background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)',
             backgroundSize: '200% 100%',
             animation: 'moveScenery 10s linear infinite',
           }}
      />
      
      {/* 车窗外掠过的柱子阴影 */}
      <div className="absolute inset-0 opacity-20 z-0"
           style={{
             backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 100px, rgba(0,0,0,0.8) 100px, rgba(0,0,0,0.8) 120px)',
             animation: 'movePillars 3s linear infinite',
           }}
      />

      {/* 缓慢旋转的抽象弧线（完美复刻 HTML 中因 CSS 错位产生的 Y=150vh 下沉式巨型弧线美感） */}
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        {/* 将锚点放置在屏幕垂直 150% 的位置，水平居中。
            这样就能完美重现 HTML 原型里，因为 content-b 将 content-c 向下挤压了一屏高度，
            导致圆心跑到屏幕正下方，从而在屏幕内只露出巨大、舒展边缘弧线的神级视觉效果。 */}
        <div className="absolute w-0 h-0 top-[150%] left-1/2">
          <div className="absolute w-[150vw] h-[150vw] -left-[75vw] -top-[75vw] rounded-[40%_60%_70%_30%/40%_50%_60%_50%] border border-[#e6e4df] opacity-10 animate-[spin_40s_linear_infinite]" />
          <div className="absolute w-[120vw] h-[120vw] -left-[60vw] -top-[60vw] rounded-[60%_40%_30%_70%/50%_60%_40%_50%] border border-[#e6e4df] opacity-[0.15] animate-[spin_35s_linear_infinite_reverse]" />
          <div className="absolute w-[90vw] h-[90vw] -left-[45vw] -top-[45vw] rounded-[30%_70%_70%_30%/30%_30%_70%_70%] border border-[#e6e4df] opacity-20 animate-[spin_30s_linear_infinite]" />
          <div className="absolute w-[60vw] h-[60vw] -left-[30vw] -top-[30vw] rounded-[50%_50%_20%_80%/25%_75%_25%_75%] border border-[#e6e4df] opacity-[0.25] animate-[spin_25s_linear_infinite_reverse]" />
        </div>
      </div>

      {/* CSS for animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes moveScenery {
          0% { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }
        @keyframes movePillars {
          0% { transform: translateX(120px); }
          100% { transform: translateX(0); }
        }
      `}} />
    </div>
  );
}
