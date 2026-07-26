import ResultReceipt from '../components/ResultReceipt';
import { results } from '../lib/data';

export default function EmoPreview({ searchParams }: { searchParams: { id?: string } }) {
  const result = results.find(r => r.key === searchParams.id) || results[0];
  return (
    <div className="min-h-screen bg-[#f3f4f6] pb-24 font-sans text-[#1c1c1e] relative selection:bg-black selection:text-white">
      <main className="max-w-md mx-auto pt-6 px-4 relative z-10 flex flex-col items-center">
        <ResultReceipt result={result} onRestart={() => {}} forcedUnlock={true} />
      </main>
    </div>
  );
}
