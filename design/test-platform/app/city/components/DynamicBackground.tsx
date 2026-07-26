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

      {/* 缓慢旋转的抽象弧线（手机与电脑双端适配版） */}
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        {/* 将锚点放置在屏幕垂直 150% 的位置，水平居中。*/}
        <div className="absolute w-0 h-0 top-[150%] left-1/2">
          {/* 使用 vh 代替 vw，确保在手机端（屏幕很窄时）圆的半径依然足够大，能够从 150% 底部升起并划过整个屏幕 */}
          <div className="absolute w-[270vh] h-[270vh] -left-[135vh] -top-[135vh] rounded-[40%_60%_70%_30%/40%_50%_60%_50%] border border-[#e6e4df] opacity-10 animate-[spin_40s_linear_infinite]" />
          <div className="absolute w-[210vh] h-[210vh] -left-[105vh] -top-[105vh] rounded-[60%_40%_30%_70%/50%_60%_40%_50%] border border-[#e6e4df] opacity-[0.15] animate-[spin_35s_linear_infinite_reverse]" />
          <div className="absolute w-[160vh] h-[160vh] -left-[80vh] -top-[80vh] rounded-[30%_70%_70%_30%/30%_30%_70%_70%] border border-[#e6e4df] opacity-20 animate-[spin_30s_linear_infinite]" />
          <div className="absolute w-[110vh] h-[110vh] -left-[55vh] -top-[55vh] rounded-[50%_50%_20%_80%/25%_75%_25%_75%] border border-[#e6e4df] opacity-[0.25] animate-[spin_25s_linear_infinite_reverse]" />
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
