import { Suspense } from 'react';
import AdminNav from './AdminNav';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-[#FDFBF7] text-[#37352F] font-sans">
      <aside className="w-full md:w-64 bg-[#F7F6F3] border-b md:border-b-0 md:border-r border-[#EBEBEB] flex-shrink-0 flex flex-col z-20">
        <Suspense fallback={<div className="p-4 text-[#787774] text-sm">Loading Nav...</div>}>
          <AdminNav />
        </Suspense>
      </aside>

      <main className="flex-1 overflow-y-auto w-full">
        <div className="max-w-6xl mx-auto py-4 px-3 md:py-8 md:px-8 lg:px-12">
          {children}
        </div>
      </main>
    </div>
  );
}
