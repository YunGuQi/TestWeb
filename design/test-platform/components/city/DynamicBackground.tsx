'use client';

export default function DynamicBackground() {
  return (
    <div className="fixed inset-0 z-[-1] bg-[#1a1a1a] overflow-hidden">
      <div className="absolute inset-0 opacity-40 mix-blend-screen"
           style={{
             background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)',
             backgroundSize: '200% 100%',
             animation: 'moveScenery 10s linear infinite',
           }}
      />
      <div className="absolute inset-0 opacity-20"
           style={{
             backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 100px, rgba(0,0,0,0.8) 100px, rgba(0,0,0,0.8) 120px)',
             animation: 'movePillars 3s linear infinite',
           }}
      />
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
