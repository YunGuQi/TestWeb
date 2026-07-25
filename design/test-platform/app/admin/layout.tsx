import { Suspense } from 'react';
import AdminNav from './AdminNav';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#FDFBF7] text-[#37352F] font-sans">
      <aside className="w-64 bg-[#F7F6F3] border-r border-[#EBEBEB] flex-shrink-0 flex flex-col">
        <Suspense fallback={<div className="p-4 text-[#787774] text-sm">Loading Nav...</div>}>
          <AdminNav />
        </Suspense>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto py-8 px-8 lg:px-12">
          {children}
        </div>
      </main>
    </div>
  );
}
