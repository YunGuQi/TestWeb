'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useEffect } from 'react';

interface PrototypeSwitcherProps {
  variants: { id: string; name: string }[];
  currentVariant: string;
}

export default function PrototypeSwitcher({ variants, currentVariant }: PrototypeSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentIndex = variants.findIndex(v => v.id === currentVariant) === -1 ? 0 : variants.findIndex(v => v.id === currentVariant);
  const prevId = variants[(currentIndex - 1 + variants.length) % variants.length].id;
  const nextId = variants[(currentIndex + 1) % variants.length].id;
  
  const currentName = variants[currentIndex]?.name || variants[0].name;

  const navigateTo = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('variant', id);
    router.replace(`${pathname}?${params.toString()}`);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
      
      if (e.key === 'ArrowLeft') {
        navigateTo(prevId);
      } else if (e.key === 'ArrowRight') {
        navigateTo(nextId);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [prevId, nextId]);

  if (process.env.NODE_ENV === 'production') return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center bg-zinc-900/90 backdrop-blur-md border border-zinc-700 p-1.5 rounded-full shadow-2xl text-white font-sans text-sm">
      <button onClick={() => navigateTo(prevId)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-700 transition">←</button>
      <div className="px-4 font-medium min-w-[240px] text-center">
        <span className="text-zinc-400 mr-1">{currentVariant} —</span> {currentName}
      </div>
      <button onClick={() => navigateTo(nextId)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-700 transition">→</button>
    </div>
  );
}
