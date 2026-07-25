'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      
      const data = await res.json();
      if (data.success) {
        router.push('/admin');
        router.refresh(); // Refresh to update middleware state in client
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
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-[#FDF9F1] border-4 border-black p-3 font-mono text-lg font-bold outline-none focus:bg-yellow-100 transition-colors"
              placeholder="•••••••"
              required
            />
          </div>
          
          {error && (
            <div className="bg-red-100 text-red-700 font-bold p-3 border-2 border-red-700 text-sm">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white font-black uppercase tracking-widest py-4 border-4 border-black hover:bg-white hover:text-black transition-all active:translate-y-1"
          >
            {loading ? 'Verifying...' : 'Unlock System'}
          </button>
        </form>
      </div>
    </div>
  );
}
