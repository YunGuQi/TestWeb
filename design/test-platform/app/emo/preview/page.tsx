'use client';
import ResultReceipt from '../components/ResultReceipt';
import { results } from '../../../lib/data';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function EmoPreviewContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const result = {
    ...results.find(r => r.key === id) || results[0],
    totalFriction: 85000,
    billItems: [
      { name: "灾难化想象费", cost: 15000 },
      { name: "午夜疯狂内耗税", cost: 25000 },
      { name: "精神黑历史拷问", cost: 45000 }
    ]
  };
  return (
    <div className="min-h-screen bg-[#f3f4f6] pb-24 font-sans text-[#1c1c1e] relative selection:bg-black selection:text-white">
      <main className="max-w-md mx-auto pt-6 px-4 relative z-10 flex flex-col items-center">
        <ResultReceipt result={result} onRestart={() => {}} forcedUnlock={true} />
      </main>
    </div>
  );
}

export default function EmoPreview() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EmoPreviewContent />
    </Suspense>
  );
}
