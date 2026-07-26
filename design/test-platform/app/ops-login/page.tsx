'use client';

import { useState } from 'react';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
        // Dual-layer cookie write + hard navigation to guarantee middleware authorization
        document.cookie = "admin_token=jiasite_Authorized; path=/; max-age=604800; SameSite=Lax";
        window.location.href = '/ops-dashboard';
      } else {
        setError(data.error || '验证失败');
      }
    } catch (err: any) {
      setError('网络请求失败');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#FDF9F1] text-black font-sans flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white p-8 rounded-xl border-4 border-black shadow-[8px_8px_0px_#000]">
        <h1 className="text-3xl font-black mb-2 uppercase tracking-tighter">RESTRICTED</h1>
        <h2 className="text-xl font-bold text-gray-600 mb-8 tracking-wide">独立大盘访问控制</h2>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-bold mb-2 uppercase tracking-widest">Master Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-[#FDF9F1] border-4 border-black p-3 pr-12 font-mono text-lg font-bold outline-none focus:bg-yellow-100 transition-colors"
                placeholder="•••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-black p-1.5 transition-colors flex items-center justify-center"
                title={showPassword ? "隐藏密码" : "显示密码"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
          
          {error && (
            <div className="bg-red-100 text-red-700 font-bold p-3 border-2 border-red-700 text-sm">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white font-black uppercase tracking-widest py-4 border-4 border-black hover:bg-white hover:text-black transition-all active:translate-y-1 cursor-pointer"
          >
            {loading ? 'Verifying...' : 'Unlock System'}
          </button>
        </form>
      </div>
    </div>
  );
}
