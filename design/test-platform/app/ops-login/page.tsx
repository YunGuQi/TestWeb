'use client';

import { useState } from 'react';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password })
      });

      const data = await res.json();
      if (data.success) {
        // 双层 cookie 写入 + 硬导航以确保中间件鉴权生效
        document.cookie = "admin_token=jiasite_Authorized; path=/; max-age=604800; SameSite=Lax";
        window.location.href = '/ops-dashboard';
      } else {
        setError(data.error || '访问凭证无效');
        setShake(true);
        setTimeout(() => setShake(false), 600);
      }
    } catch (err: any) {
      setError('网络请求失败 — 请检查连接');
      setShake(true);
      setTimeout(() => setShake(false), 600);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans flex items-center justify-center p-4 relative overflow-hidden">
      <style dangerouslySetInnerHTML={{__html: `
        /* 扫描线纹理 */
        .scanlines {
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(255,255,255,0.015) 2px,
            rgba(255,255,255,0.015) 4px
          );
          pointer-events: none;
        }

        /* 左上角警告灯闪烁 */
        @keyframes alert-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.15; }
        }
        .alert-blink { animation: alert-blink 1.2s ease-in-out infinite; }

        /* 顶部扫描进度条 */
        @keyframes scan-bar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        .scan-bar { animation: scan-bar 3s ease-in-out infinite; }

        /* 卡片摇晃 */
        @keyframes card-shake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-8px); }
          30% { transform: translateX(8px); }
          45% { transform: translateX(-6px); }
          60% { transform: translateX(6px); }
          75% { transform: translateX(-3px); }
          90% { transform: translateX(3px); }
        }
        .shake { animation: card-shake 0.6s cubic-bezier(.36,.07,.19,.97) both; }

        /* 终端光标闪烁 */
        @keyframes cursor-blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        .cursor-blink { animation: cursor-blink 1s step-end infinite; }

        /* 输入框焦点高亮 */
        .input-field:focus {
          background: #111;
          box-shadow: 0 0 0 2px #fff, 0 0 20px rgba(255,255,255,0.1);
          outline: none;
        }

        /* 背景格栅 */
        .grid-bg {
          background-image:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        /* 提交按钮悬浮 */
        .btn-unlock {
          position: relative;
          overflow: hidden;
          transition: all 0.15s;
        }
        .btn-unlock::before {
          content: '';
          position: absolute;
          inset: 0;
          background: #fff;
          transform: translateX(-101%);
          transition: transform 0.2s ease;
        }
        .btn-unlock:hover::before { transform: translateX(0); }
        .btn-unlock:hover { color: #000; }
        .btn-unlock:active { transform: translateY(3px); box-shadow: 0 0 0 3px #fff; }

        /* 顶部红色警报条 */
        .alert-stripe {
          background: repeating-linear-gradient(
            45deg,
            #dc2626,
            #dc2626 8px,
            #000 8px,
            #000 16px
          );
        }
      `}} />

      {/* ---- 背景层 ---- */}
      <div className="fixed inset-0 z-0 grid-bg" />
      <div className="fixed inset-0 z-0 scanlines" />
      {/* 左侧竖向警示红线 */}
      <div className="fixed left-0 top-0 bottom-0 w-1 bg-red-600 z-10" />
      <div className="fixed right-0 top-0 bottom-0 w-1 bg-red-600 z-10" />

      {/* ---- 顶部系统状态栏 ---- */}
      <div className="fixed top-0 left-0 right-0 z-20 bg-black border-b-2 border-white/20">
        {/* 警报斜纹条 */}
        <div className="alert-stripe h-1.5 w-full" />
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-3">
            <div className="alert-blink w-2 h-2 rounded-full bg-red-500" />
            <span className="text-[10px] font-mono font-bold tracking-[0.25em] text-red-400 uppercase">
              SYS-LOCK · ACCESS RESTRICTED
            </span>
          </div>
          <span className="text-[10px] font-mono text-white/30">
            {new Date().toISOString().slice(0,19).replace('T',' ')} UTC
          </span>
        </div>
        {/* 扫描进度条 */}
        <div className="relative h-[2px] bg-white/5 overflow-hidden">
          <div className="scan-bar absolute h-full w-1/4 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        </div>
      </div>

      {/* ---- 主卡片 ---- */}
      <div className={`relative z-10 w-full max-w-sm mt-12 ${shake ? 'shake' : ''}`}>

        {/* 卡片顶部标签 */}
        <div className="flex items-center gap-0 mb-0">
          <div className="bg-white text-black text-[9px] font-black tracking-[0.3em] uppercase px-3 py-1.5">
            AUTH-GATE
          </div>
          <div className="bg-red-600 text-white text-[9px] font-black tracking-[0.2em] uppercase px-3 py-1.5">
            ● LEVEL-5
          </div>
          <div className="h-[28px] flex-1 border-t-2 border-white/20" />
        </div>

        {/* 主体卡片 */}
        <div className="bg-[#111] border-2 border-white p-8 relative"
          style={{boxShadow: '6px 6px 0px #ffffff, 12px 12px 0px rgba(255,255,255,0.15)'}}>

          {/* 角落装饰 */}
          <div className="absolute top-3 right-3 text-white/10 text-[9px] font-mono">v2.4</div>

          {/* 标题区 */}
          <div className="mb-8">
            <div className="flex items-start gap-3 mb-1">
              {/* 大锁图标 */}
              <div className="shrink-0 mt-1">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <div>
                <h1 className="text-4xl font-black uppercase tracking-tighter leading-none text-white">
                  RESTRICTED
                </h1>
                <div className="text-[10px] font-mono text-white/40 tracking-widest mt-1 uppercase">
                  独立运营大盘 · 访问控制终端
                </div>
              </div>
            </div>

            {/* 分割线 */}
            <div className="flex items-center gap-2 mt-5">
              <div className="h-[2px] flex-1 bg-white" />
              <span className="text-[9px] font-mono text-white/30 tracking-widest">ENTER CREDENTIALS</span>
              <div className="h-[2px] flex-1 bg-white" />
            </div>
          </div>

          {/* 表单 */}
          <form onSubmit={handleLogin} className="space-y-5">

            {/* 密码字段 */}
            <div>
              <label className="block text-[10px] font-bold mb-2 uppercase tracking-[0.25em] text-white/60 font-mono">
                — Master Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field w-full bg-[#0a0a0a] border-2 border-white/50 hover:border-white p-3.5 pr-12 font-mono text-lg font-bold text-white transition-all placeholder-white/20"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                {/* 光标闪烁提示（仅在非输入时） */}
                {!password && (
                  <span className="cursor-blink absolute left-[58px] top-1/2 -translate-y-1/2 text-white/40 text-lg pointer-events-none font-mono">
                    _
                  </span>
                )}
                {/* 显示/隐藏按钮 */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white p-1.5 transition-colors flex items-center justify-center min-h-[44px]"
                  title={showPassword ? "隐藏密码" : "显示密码"}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="bg-red-950/60 text-red-400 font-mono font-bold p-3.5 border-2 border-red-500 text-[12px] flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="shrink-0">
                  <path d="M12 9v4M12 17h.01"/>
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                </svg>
                <span>[ERROR] {error}</span>
              </div>
            )}

            {/* 提交按钮 */}
            <button
              type="submit"
              disabled={loading}
              className="btn-unlock w-full bg-white text-black font-black uppercase tracking-[0.25em] py-4 border-2 border-white text-sm disabled:opacity-40 disabled:cursor-not-allowed min-h-[56px] flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
                  </svg>
                  <span>Unlock System</span>
                </>
              )}
            </button>

          </form>

          {/* 底部系统信息 */}
          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
            <span className="text-[9px] font-mono text-white/20 tracking-widest uppercase">
              OPS-PORTAL v2.4
            </span>
            <span className="text-[9px] font-mono text-white/20 tracking-widest">
              All access attempts logged
            </span>
          </div>
        </div>

        {/* 卡片底部标签 */}
        <div className="flex items-center gap-0">
          <div className="h-[6px] flex-1 bg-red-600/60" />
          <div className="h-[6px] flex-[2] bg-white/10" />
        </div>

      </div>

      {/* ---- 底部状态栏 ---- */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-black border-t border-white/10 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 alert-blink" />
          <span className="text-[9px] font-mono text-white/30 tracking-widest uppercase">Unauthorized access will be prosecuted</span>
        </div>
        <span className="text-[9px] font-mono text-white/20">© SOULSCAPE OPS</span>
      </div>

    </div>
  );
}
