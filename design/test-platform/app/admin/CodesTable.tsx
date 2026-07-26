'use client';

import { useState } from 'react';

export default function CodesTable({ initialCodes, testId }: { initialCodes: any[], testId: string }) {
  const [codes, setCodes] = useState(initialCodes);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [generateModal, setGenerateModal] = useState({ show: false, count: 10 });
  const [editModal, setEditModal] = useState({ show: false, id: 0, code: '', maxUses: 3 });

  const handleExportCSV = () => {
    if (selectedIds.length === 0) return alert('请先勾选需要导出的激活码');
    const codesToExport = codes.filter(c => selectedIds.includes(c.id));
    let csv = '\uFEFF卡密,设备上限,状态\n';
    codesToExport.forEach(c => {
      csv += `${c.code},${c.maxUses},${c.isDisabled ? '已禁用' : '正常'}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'activation_codes.csv';
    link.click();
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`确定删除这 ${selectedIds.length} 个卡密吗？`)) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/code/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds })
      });
      const data = await res.json();
      if (data.success) {
        setCodes(codes.filter(c => !selectedIds.includes(c.id)));
        setSelectedIds([]);
      }
    } catch(e) {}
    setLoading(false);
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: generateModal.count, maxUses: 3, testId })
      });
      
      if (!res.ok) {
         const text = await res.text();
         throw new Error(`API 返回错误: ${res.status} ${text}`);
      }

      const data = await res.json();
      if (data.success) {
        window.location.reload();
      } else {
        alert(data.error);
      }
    } catch(e: any) {
      alert('发生异常: ' + e.message);
      console.error(e);
    }
    setLoading(false);
  };

  const handleEdit = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/code_edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editModal.id, code: editModal.code, maxUses: editModal.maxUses })
      });
      const data = await res.json();
      if (data.success) {
        window.location.reload();
      } else {
        alert(data.error);
      }
    } catch(e: any) {
      alert('发生异常: ' + e.message);
    }
    setLoading(false);
  };

  return (
    <div className="mt-8 text-[#37352F]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold flex items-center gap-4 text-[#37352F]">
          卡密详细列表
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2">
              <button onClick={handleBatchDelete} disabled={loading} className="text-xs font-semibold bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 transition-colors px-3 py-1.5 rounded-md">
                批量删除 ({selectedIds.length})
              </button>
              <button onClick={handleExportCSV} className="text-xs font-semibold bg-green-50 text-green-600 border border-green-100 hover:bg-green-100 transition-colors px-3 py-1.5 rounded-md">
                导出已选 ({selectedIds.length})
              </button>
            </div>
          )}
        </h2>
        <button 
          onClick={() => setGenerateModal({ show: true, count: 10 })}
          className="bg-white border border-[#EBEBEB] hover:bg-[#F7F6F3] transition-colors text-[#37352F] px-4 py-2 rounded-md font-semibold text-sm shadow-sm flex items-center gap-2"
        >
          <span>✨</span> 一键生成
        </button>
      </div>

      {/* ============ Mobile Cards View (< md) ============ */}
      <div className="md:hidden space-y-3">
        {codes.map(code => {
          const isSelected = selectedIds.includes(code.id);
          const deviceCount = JSON.parse(code.devices || '[]').length;
          return (
            <div 
              key={code.id} 
              className={`bg-white border p-4 rounded-xl transition-colors shadow-sm ${
                isSelected ? 'border-blue-500 bg-blue-50/20' : 'border-[#EBEBEB]'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#EBEBEB]/60 mb-3">
                <div className="flex items-center gap-2.5">
                  <input 
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedIds([...selectedIds, code.id]);
                      else setSelectedIds(selectedIds.filter(id => id !== code.id));
                    }}
                    className="rounded border-[#EBEBEB] text-blue-500 focus:ring-blue-500"
                  />
                  <span className="font-mono font-bold text-base text-[#37352F] tracking-wide">{code.code}</span>
                </div>
                <button 
                  onClick={() => setEditModal({ show: true, id: code.id, code: code.code, maxUses: code.maxUses })}
                  className="text-xs font-semibold text-[#787774] hover:text-[#37352F] bg-[#F7F6F3] hover:bg-[#EBEBEB] transition-colors px-3 py-1.5 rounded-lg border border-[#EBEBEB] shadow-sm cursor-pointer"
                >
                  修改上限
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 py-1 mb-2 text-center">
                <div className="bg-[#FDFBF7] p-2 rounded-lg border border-[#EBEBEB]/50">
                  <div className="text-[10px] text-[#787774] font-medium mb-0.5">可用上限</div>
                  <div className="font-bold text-sm text-[#37352F]">{code.maxUses}</div>
                </div>
                <div className="bg-[#FDFBF7] p-2 rounded-lg border border-[#EBEBEB]/50">
                  <div className="text-[10px] text-[#787774] font-medium mb-0.5">已绑设备</div>
                  <div className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-blue-50 text-blue-700">
                    {deviceCount}
                  </div>
                </div>
                <div className="bg-[#FDFBF7] p-2 rounded-lg border border-[#EBEBEB]/50">
                  <div className="text-[10px] text-[#787774] font-medium mb-0.5">测算次数</div>
                  <div className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-purple-50 text-purple-700">
                    {code.testCount || 0}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 text-[11px] text-[#9F9E9B] font-mono">
                <span>创建: {new Date(code.createdAt).toLocaleDateString('zh-CN')}</span>
                <span>ID: #{code.id}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ============ Desktop Table View (>= md) ============ */}
      <div className="hidden md:block overflow-x-auto bg-white border border-[#EBEBEB] rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-[#F7F6F3] border-b border-[#EBEBEB] text-[#787774] font-medium text-xs uppercase tracking-wider">
            <tr>
              <th className="p-4 w-10">
                <input 
                  type="checkbox" 
                  checked={codes.length > 0 && codes.every(c => selectedIds.includes(c.id))}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedIds(codes.map(c => c.id));
                    else setSelectedIds([]);
                  }}
                  className="rounded border-[#EBEBEB] text-blue-500 focus:ring-blue-500"
                />
              </th>
              <th className="p-4">卡密</th>
              <th className="p-4">上限</th>
              <th className="p-4">已绑设备数</th>
              <th className="p-4">测算次数</th>
              <th className="p-4">创建时间</th>
              <th className="p-4">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EBEBEB]">
            {codes.map(code => (
              <tr key={code.id} className="hover:bg-[#FDFBF7] transition-colors">
                <td className="p-4">
                  <input 
                    type="checkbox"
                    checked={selectedIds.includes(code.id)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedIds([...selectedIds, code.id]);
                      else setSelectedIds(selectedIds.filter(id => id !== code.id));
                    }}
                    className="rounded border-[#EBEBEB] text-blue-500 focus:ring-blue-500"
                  />
                </td>
                <td className="p-4 font-mono font-medium text-[#37352F]">{code.code}</td>
                <td className="p-4 text-[#787774]">{code.maxUses}</td>
                <td className="p-4">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                    {JSON.parse(code.devices || '[]').length}
                  </span>
                </td>
                <td className="p-4">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700">
                    {code.testCount || 0}
                  </span>
                </td>
                <td className="p-4 text-[#9F9E9B] text-xs font-mono">{new Date(code.createdAt).toLocaleString()}</td>
                <td className="p-4">
                  <button 
                    onClick={() => setEditModal({ show: true, id: code.id, code: code.code, maxUses: code.maxUses })}
                    className="text-xs font-medium text-[#787774] hover:text-[#37352F] bg-[#F7F6F3] hover:bg-[#EBEBEB] transition-colors px-2.5 py-1 rounded-md border border-[#EBEBEB]"
                  >
                    修改
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {generateModal.show && (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity">
          <div className="bg-white p-6 rounded-2xl max-w-sm w-full border border-[#EBEBEB] shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
            <h3 className="text-lg font-bold mb-4 text-[#37352F] flex items-center gap-2">
              <span>🎟️</span> 批量生成卡密
            </h3>
            <label className="flex items-center justify-between mb-6 text-[#787774] text-sm">
              生成数量:
              <input type="number" value={generateModal.count} onChange={e => setGenerateModal({ ...generateModal, count: parseInt(e.target.value) || 1 })} className="border border-[#EBEBEB] px-3 py-1.5 w-24 text-center rounded-lg outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all text-[#37352F] font-medium"/>
            </label>
            <div className="flex justify-end gap-2">
              <button onClick={() => setGenerateModal({ show: false, count: 10 })} className="px-4 py-2 bg-white border border-[#EBEBEB] text-[#787774] hover:bg-[#F7F6F3] rounded-lg text-sm font-semibold transition-colors">取消</button>
              <button onClick={handleGenerate} disabled={loading} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm">{loading ? '生成中...' : '确认生成'}</button>
            </div>
          </div>
        </div>
      )}

      {editModal.show && (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity">
          <div className="bg-white p-6 rounded-2xl max-w-sm w-full border border-[#EBEBEB] shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
            <h3 className="text-lg font-bold mb-5 text-[#37352F] flex items-center gap-2">
              <span>✍️</span> 修改卡密
            </h3>
            <label className="flex items-center justify-between mb-4 text-[#787774] text-sm">
              <span className="shrink-0 w-20">卡密内容:</span>
              <input type="text" value={editModal.code} onChange={e => setEditModal({ ...editModal, code: e.target.value })} className="border border-[#EBEBEB] px-3 py-1.5 w-full rounded-lg font-mono text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all text-[#37352F]"/>
            </label>
            <label className="flex items-center justify-between mb-6 text-[#787774] text-sm">
              <span className="shrink-0 w-20">可用上限:</span>
              <input type="number" value={editModal.maxUses} onChange={e => setEditModal({ ...editModal, maxUses: parseInt(e.target.value) || 1 })} className="border border-[#EBEBEB] px-3 py-1.5 w-full rounded-lg outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all text-[#37352F]"/>
            </label>
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditModal({ ...editModal, show: false })} className="px-4 py-2 bg-white border border-[#EBEBEB] text-[#787774] hover:bg-[#F7F6F3] rounded-lg text-sm font-semibold transition-colors">取消</button>
              <button onClick={handleEdit} disabled={loading} className="px-4 py-2 bg-[#37352F] hover:bg-black text-white rounded-lg text-sm font-semibold transition-colors shadow-sm">{loading ? '保存中...' : '确认修改'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
