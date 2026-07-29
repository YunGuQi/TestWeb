'use client';

import { useState } from 'react';

import Link from 'next/link';

export default function ProjectStats({ projects, allCodes }: { projects: any[], allCodes: any[] }) {
  const validProjects = projects.filter(p => p.id !== 'dummy' && p._id !== 'dummy' && p.name);
  const [selectedId, setSelectedId] = useState<string>(validProjects[0]?.id || '');
  const [editModal, setEditModal] = useState<{ show: boolean, project: any, val: string, loading: boolean }>({ show: false, project: null, val: '', loading: false });
  
  const totalOrders = allCodes.length;
  const boundCodesCount = allCodes.filter(c => c.devices && c.devices.length > 0).length;
  const totalTestCompletions = validProjects.reduce((sum, p) => sum + (p.realCount || 0), 0);

  const selectedProject = validProjects.find(p => p.id === selectedId);

  const handleExportProjectCSV = () => {
    if (validProjects.length === 0) return alert('没有可导出的项目数据');
    let csv = '\uFEFF项目ID,项目名称,基础访问基数,真实完成人数,前端展示总数\n';
    validProjects.forEach(p => {
      const baseCount = p.baseCount || 0;
      const realCount = p.realCount || 0;
      const total = baseCount + realCount;
      csv += `${p.testId},${p.name},${baseCount},${realCount},${total}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `projects_stats.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const submitEditBaseCount = async () => {
    if (!editModal.project) return;
    const { project, val } = editModal;
    const newBaseCount = parseInt(val);
    if (isNaN(newBaseCount) || newBaseCount < 0) {
      return alert('请输入大于或等于0的有效数字');
    }

    setEditModal(prev => ({ ...prev, loading: true }));
    try {
      const res = await fetch(`/api/admin/project/${project.testId}/base-count`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseCount: newBaseCount })
      });
      const data = await res.json();
      if (data.success) {
        // Optimistic update by reloading the page
        window.location.reload();
      } else {
        alert(data.error || '修改失败');
        setEditModal(prev => ({ ...prev, loading: false }));
      }
    } catch (e) {
      alert('网络错误');
      setEditModal(prev => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="mb-8">
      {/* 汇总信息 */}
      <div className="bg-gray-900 text-white p-6 rounded-lg shadow-md mb-6 grid grid-cols-2 md:grid-cols-5 gap-6 items-center">
        <div className="col-span-2 md:col-span-2 md:border-r border-gray-700 md:pr-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold mb-1">大盘核心数据</h2>
            <p className="text-gray-400 text-sm">收录 {validProjects.length} 个项目</p>
          </div>
          <button 
            onClick={handleExportProjectCSV}
            className="bg-gray-700 hover:bg-gray-600 text-white text-sm px-3 py-1.5 rounded shadow transition-colors"
          >
            导出大盘CSV
          </button>
        </div>
        <div>
          <p className="text-sm text-gray-400 mb-1">总激活码数量</p>
          <p className="text-3xl font-black text-blue-400">{totalOrders}</p>
        </div>
        <div>
          <p className="text-sm text-gray-400 mb-1">已绑定激活码数量</p>
          <p className="text-3xl font-black text-green-400">{boundCodesCount}</p>
        </div>
        <div>
          <p className="text-sm text-gray-400 mb-1">真实总测算次数</p>
          <p className="text-3xl font-black text-purple-400">{totalTestCompletions}</p>
        </div>
      </div>

      {/* 下拉框与单个测试展示 */}
      {validProjects.length > 0 && (
        <div className="border border-gray-200 p-6 rounded-lg shadow-sm bg-white">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h2 className="font-semibold text-lg text-gray-900">单项测试管理与数据查询</h2>
            <select 
              value={selectedId} 
              onChange={e => setSelectedId(e.target.value)}
              className="border-2 border-gray-300 rounded p-2 text-gray-800 font-medium focus:outline-none focus:border-black max-w-xs w-full sm:w-auto"
            >
              {validProjects.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.testId})</option>
              ))}
            </select>
          </div>
          
          {selectedProject && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded border border-gray-100 flex justify-between items-center">
                <div>
                  <p className="text-gray-500 text-sm mb-1">基础访问基数</p>
                  <p className="text-xl font-bold text-gray-800">{selectedProject.baseCount || 0}</p>
                </div>
                <button 
                  onClick={() => setEditModal({ show: true, project: selectedProject, val: (selectedProject.baseCount || 0).toString(), loading: false })}
                  className="text-blue-500 hover:text-blue-700 text-sm border border-blue-200 bg-white px-2 py-1 rounded shadow-sm transition-colors"
                >
                  修改
                </button>
              </div>
              <div className="bg-gray-50 p-4 rounded border border-gray-100">
                <p className="text-gray-500 text-sm mb-1">真实完成人数</p>
                <p className="text-xl font-bold text-gray-800">{selectedProject.realCount || 0}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded border border-blue-100">
                <p className="text-blue-600 text-sm font-bold mb-1">前端展示总数</p>
                <p className="text-3xl font-black text-blue-700">{(selectedProject.baseCount || 0) + (selectedProject.realCount || 0)}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 修改基础访问基数 Modal */}
      {editModal.show && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full flex flex-col overflow-hidden">
            <div className="p-5 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">修改基础访问基数</h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-500 mb-4">项目：{editModal.project?.name}</p>
              <label className="flex flex-col gap-2 font-bold text-gray-800">
                基础访问基数:
                <input 
                  type="number"
                  value={editModal.val}
                  onChange={(e) => setEditModal(prev => ({ ...prev, val: e.target.value }))}
                  className="border border-gray-300 rounded px-3 py-2 text-left font-normal focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  autoFocus
                />
              </label>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
              <button 
                onClick={() => setEditModal({ show: false, project: null, val: '', loading: false })}
                disabled={editModal.loading}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded font-bold hover:bg-gray-300 disabled:opacity-50"
              >
                取消
              </button>
              <button 
                onClick={submitEditBaseCount}
                disabled={editModal.loading}
                className="px-4 py-2 bg-purple-600 text-white rounded font-bold hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
              >
                {editModal.loading ? '保存中...' : '确认保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
