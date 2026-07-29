import { db } from '@/lib/tcb';
import CodesTable from './CodesTable';
import ProjectStats from './ProjectStats';
import AdminTitle from './AdminTitle';
import { TEST_PROJECTS } from '@/config/projects';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  let projects: any[] = [];
  let allCodes: any[] = [];
  
  try {
    const pRes = await db.collection('TestProject').get();
    const dbProjects = pRes.data || [];
    
    // Merge local config with DB stats
    projects = TEST_PROJECTS.map(configP => {
      const dbP = dbProjects.find((dp: any) => dp.testId === configP.testId);
      return {
        ...configP,
        baseCount: (dbP && dbP.baseCount !== undefined) ? dbP.baseCount : configP.baseCount,
        realCount: dbP ? (dbP.realCount || 0) : 0
      };
    });
  } catch (e: any) {
    console.log('TestProject collection might not exist yet:', e.message);
    projects = TEST_PROJECTS.map(p => ({ ...p, realCount: 0 }));
  }

  try {
    const cRes = await db.collection('ActivationCode').orderBy('createdAt', 'desc').limit(1000).get();
    allCodes = cRes.data || [];
  } catch (e: any) {
    console.log('ActivationCode collection might not exist yet:', e.message);
  }

  const codesCount = allCodes.length;

  return (
    <div className="p-8 font-sans max-w-5xl mx-auto">
      <AdminTitle />
      <ProjectStats projects={projects} allCodes={allCodes} />
      <div className="bg-gray-100 border border-gray-200 p-6 rounded-lg">
        <h2 className="font-semibold text-lg text-gray-800">系统数据提示</h2>
        <p className="mt-2 text-gray-700">当前数据库中共有 <strong className="text-xl">{codesCount}</strong> 个激活码。</p>
        <p className="text-sm text-gray-500 mt-4 bg-white p-3 border rounded">
          💡 提示：如需批量生成卡密并导入【阿奇索】等发货平台，建议直接在服务器运行 Node.js 批量脚本插入 `ActivationCode` 表，然后导出为 CSV，这样最安全高效。
        </p>
      </div>

      <CodesTable initialCodes={allCodes} />
    </div>
  );
}
