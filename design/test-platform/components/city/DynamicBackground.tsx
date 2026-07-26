'use client';

export default function DynamicBackground() {
  return (
    <div className="fixed inset-0 z-[-1] bg-[#121212] overflow-hidden">
      {/* 深邃的天空背景渐变 */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] to-[#1a1a1a]"></div>

      {/* 飞驰的横向光线（线条） */}
      <div className="absolute inset-0 opacity-60 mix-blend-screen"
           style={{
             backgroundImage: `
               linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 10%, transparent 20%),
               linear-gradient(90deg, transparent 40%, rgba(255,200,100,0.1) 45%, transparent 50%),
               linear-gradient(90deg, transparent 70%, rgba(100,200,255,0.15) 80%, transparent 90%)
             `,
             backgroundSize: '300% 1px, 200% 2px, 250% 1px',
             backgroundPosition: '0 20%, 0 50%, 0 80%',
             backgroundRepeat: 'no-repeat',
             animation: 'moveLines 4s linear infinite',
           }}
      />
      
      {/* 额外的光晕划过 */}
      <div className="absolute inset-0 opacity-40 mix-blend-screen"
           style={{
             background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)',
             backgroundSize: '200% 100%',
             animation: 'moveScenery 12s linear infinite',
           }}
      />

      {/* 掠过的柱子阴影（强化车窗速度感） */}
      <div className="absolute inset-0 opacity-30 mix-blend-multiply"
           style={{
             backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 150px, rgba(0,0,0,0.9) 150px, rgba(0,0,0,0.9) 180px)',
             animation: 'movePillars 2s linear infinite',
           }}
      />

      {/* CSS for animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes moveLines {
          0% { background-position: 100% 20%, 150% 50%, 200% 80%; }
          100% { background-position: -100% 20%, -50% 50%, -100% 80%; }
        }
        @keyframes moveScenery {
          0% { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }
        @keyframes movePillars {
          0% { transform: translateX(180px); }
          100% { transform: translateX(0); }
        }
      `}} />
    </div>
  );
}
