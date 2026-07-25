import DanmakuManager from '../DanmakuManager';

export const dynamic = 'force-dynamic';

export default function DanmakuPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">弹幕管理</h1>
      <DanmakuManager />
    </div>
  );
}
