import { prisma } from '@/lib/prisma'

export default async function AdminDashboard() {
  const totalTests = await prisma.testRecord.count()
  const resultCounts = await prisma.testRecord.groupBy({
    by: ['resultKey'],
    _count: {
      resultKey: true
    }
  })

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="text-sm font-medium text-gray-500 mb-1">总测试人次</div>
          <div className="text-3xl font-bold text-indigo-600">{totalTests}</div>
        </div>
        {/* Placeholder for other stats */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="text-sm font-medium text-gray-500 mb-1">今日新增</div>
          <div className="text-3xl font-bold text-green-600">--</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="text-sm font-medium text-gray-500 mb-1">拦截放行率</div>
          <div className="text-3xl font-bold text-amber-600">--</div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold mb-4">测试结果分布</h2>
        <div className="space-y-3">
          {resultCounts.map(item => (
            <div key={item.resultKey} className="flex items-center justify-between">
              <span className="text-gray-700">{item.resultKey}</span>
              <span className="font-medium text-gray-900">{item._count.resultKey}</span>
            </div>
          ))}
          {resultCounts.length === 0 && <div className="text-gray-400">暂无数据</div>}
        </div>
      </div>
    </div>
  )
}
