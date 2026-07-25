'use client';

import { useState } from 'react';

export default function CodesTable({ initialCodes }: { initialCodes: any[] }) {
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
        body: JSON.stringify({ count: generateModal.count, maxUses: 3 })
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
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold flex items-center gap-4">
          卡密详细列表
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2">
              <button onClick={handleBatchDelete} disabled={loading} className="text-sm bg-red-500 text-white px-3 py-1 rounded">批量删除 ({selectedIds.length})</button>
              <button onClick={handleExportCSV} className="text-sm bg-green-600 text-white px-3 py-1 rounded">导出已选 ({selectedIds.length})</button>
            </div>
          )}
        </h2>
        <button 
          onClick={() => setGenerateModal({ show: true, count: 10 })}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded font-bold shadow"
        >
          + 一键生成
        </button>
      </div>

      <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b font-semibold">
            <tr>
              <th className="p-4 w-10">
                <input 
                  type="checkbox" 
                  checked={codes.length > 0 && codes.every(c => selectedIds.includes(c.id))}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedIds(codes.map(c => c.id));
                    else setSelectedIds([]);
                  }}
                />
              </th>
              <th className="p-4">卡密</th>
              <th className="p-4">上限</th>
              <th className="p-4">已绑设备数</th>
              <th className="p-4">创建时间</th>
              <th className="p-4">操作</th>
            </tr>
          </thead>
          <tbody>
            {codes.map(code => (
              <tr key={code.id} className="border-b">
                <td className="p-4">
                  <input 
                    type="checkbox"
                    checked={selectedIds.includes(code.id)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedIds([...selectedIds, code.id]);
                      else setSelectedIds(selectedIds.filter(id => id !== code.id));
                    }}
                  />
                </td>
                <td className="p-4 font-mono font-medium">{code.code}</td>
                <td className="p-4">{code.maxUses}</td>
                <td className="p-4">{JSON.parse(code.devices || '[]').length}</td>
                <td className="p-4 text-gray-500">{new Date(code.createdAt).toLocaleString()}</td>
                <td className="p-4">
                  <button 
                    onClick={() => setEditModal({ show: true, id: code.id, code: code.code, maxUses: code.maxUses })}
                    className="text-indigo-600 font-bold hover:underline"
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
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg max-w-sm w-full">
            <h3 className="text-lg font-bold mb-4">批量生成卡密</h3>
            <label className="flex items-center justify-between mb-6">
              生成数量:
              <input type="number" value={generateModal.count} onChange={e => setGenerateModal({ ...generateModal, count: parseInt(e.target.value) || 1 })} className="border px-2 py-1 w-24 text-center rounded"/>
            </label>
            <div className="flex justify-end gap-2">
              <button onClick={() => setGenerateModal({ show: false, count: 10 })} className="px-4 py-2 bg-gray-200 rounded font-bold">取消</button>
              <button onClick={handleGenerate} disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded font-bold">{loading ? '生成中...' : '确认生成'}</button>
            </div>
          </div>
        </div>
      )}

      {editModal.show && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg max-w-sm w-full border-2 border-black shadow-[4px_4px_0px_#000]">
            <h3 className="text-lg font-bold mb-4">修改卡密</h3>
            <label className="flex items-center justify-between mb-4">
              <span className="shrink-0 w-20">卡密内容:</span>
              <input type="text" value={editModal.code} onChange={e => setEditModal({ ...editModal, code: e.target.value })} className="border-2 border-black px-2 py-1 w-full rounded font-mono text-sm outline-none focus:bg-yellow-50"/>
            </label>
            <label className="flex items-center justify-between mb-6">
              <span className="shrink-0 w-20">可用上限:</span>
              <input type="number" value={editModal.maxUses} onChange={e => setEditModal({ ...editModal, maxUses: parseInt(e.target.value) || 1 })} className="border-2 border-black px-2 py-1 w-full rounded outline-none focus:bg-yellow-50"/>
            </label>
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditModal({ ...editModal, show: false })} className="px-4 py-2 bg-white border-2 border-black rounded font-bold">取消</button>
              <button onClick={handleEdit} disabled={loading} className="px-4 py-2 bg-black text-white border-2 border-black rounded font-bold active:translate-y-1">{loading ? '保存中...' : '确认修改'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
