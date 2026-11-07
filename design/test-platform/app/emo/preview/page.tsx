import ResultReceipt from '../components/ResultReceipt';
import { results } from '../../../lib/data';
import { notFound } from 'next/navigation';
import { resolveEmoFromSlug } from '../../../lib/preview-slugs';

export const dynamic = 'force-dynamic';

export default async function EmoPreview({ searchParams }: { searchParams: Promise<{ id?: string; slug?: string; secret?: string }> }) {
  const resolvedParams = await searchParams;

  // 1. 服务端私有秘钥强制鉴权：未授权或伪造秘钥一律 404 隐身
  const secret = resolvedParams?.secret?.trim();
  const validSecret = process.env.ADMIN_PREVIEW_SECRET || 'mutong-preview-secret-2026';
  if (!secret || secret !== validSecret) {
    notFound();
  }

  // 2. 混淆短 Slug 校验：禁止明文 id 字典遍历，必须携带已注册合法的 slug
  const slug = resolvedParams?.slug?.trim().toLowerCase();
  if (!slug) {
    notFound();
  }
  const matchedKey = resolveEmoFromSlug(slug);
  if (!matchedKey) {
    notFound();
  }

  const emoItem = results.find(r => r.key === matchedKey || r.id === matchedKey) || results[0];
  const result = {
    ...emoItem,
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
        <ResultReceipt result={result} forcedUnlock={true} />
      </main>
    </div>
  );
}
