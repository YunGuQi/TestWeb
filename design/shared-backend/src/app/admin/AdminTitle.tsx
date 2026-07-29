'use client';

import { useState } from 'react';

export default function AdminTitle() {
  const [clickCount, setClickCount] = useState(0);

  const handleTitleClick = async () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    
    if (newCount === 5) {
      setClickCount(0); // Reset
      try {
        const res = await fetch('/api/admin/debug/reload-csv', { method: 'POST' });
        const data = await res.json();
        if (data.success) {
          alert('CSV已重新加载！页面将刷新');
          window.location.reload();
        } else {
          // Might fail in production but silently ignore or show subtle log
          console.warn('Reload CSV failed:', data.error);
        }
      } catch (e) {
        console.error('Reload failed', e);
      }
    }
  };

  return (
    <h1 
      className="text-2xl font-bold mb-6 text-gray-800 select-none cursor-pointer"
      onClick={handleTitleClick}
      title="Click 5 times to reload local CSV"
    >
      测试项目大盘 (Admin)
    </h1>
  );
}
