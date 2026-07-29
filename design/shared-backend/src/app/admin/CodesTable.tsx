'use client';

import { useState } from 'react';
import { TEST_PROJECTS } from '@/config/projects';

export default function CodesTable({ initialCodes }: { initialCodes: any[] }) {
  const [codes, setCodes] = useState(initialCodes);
  const [loadingCodeId, setLoadingCodeId] = useState<string | null>(null);
  const [devicesModal, setDevicesModal] = useState<{ show: boolean, code: any, devices: any[] }>({ show: false, code: null, devices: [] });
  const [generateModal, setGenerateModal] = useState<{ show: boolean, status: 'idle' | 'loading' | 'success' | 'error', message: string, count: number, testId: string }>({ show: false, status: 'idle', message: '', count: 10, testId: '' });
  const [editModal, setEditModal] = useState<{ show: boolean, type: 'maxUses' | 'code', codeObj: any, val: string, loading: boolean }>({ show: false, type: 'maxUses', codeObj: null, val: '', loading: false });
  const [confirmModal, setConfirmModal] = useState<{ show: boolean, message: string, onConfirm: () => void }>({ show: false, message: '', onConfirm: () => {} });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [filterTestId, setFilterTestId] = useState<string>('ALL');

  const displayedCodes = filterTestId === 'ALL' 
    ? codes 
    : codes.filter(c => (c.testId || '') === filterTestId);

  const handleToggleDisable = async (id: string) => {
    setLoadingCodeId(id);
    try {
      const res = await fetch(`/api/admin/code/${id}/disable`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setCodes(codes.map(c => c._id === id ? { ...c, isDisabled: data.isDisabled } : c));
      }
    } catch (e) {
      alert('操作失败');
    } finally {
      setLoadingCodeId(null);
    }
  };

  const handleViewDevices = async (code: any) => {
    try {
      const res = await fetch(`/api/admin/code/${code._id}/devices`);
      const data = await res.json();
      if (data.success) {
        setDevicesModal({ show: true, code, devices: data.devices });
      }
    } catch (e) {
      alert('获取设备记录失败');
    }
  };

  const handleClearDevices = async (id: string) => {
    setConfirmModal({
      show: true,
      message: '确定要清理设备吗？将只保留最早验证的 3 个设备。',
      onConfirm: async () => {
        setConfirmModal({ show: false, message: '', onConfirm: () => {} });
        setLoadingCodeId(id);
        try {
          const res = await fetch(`/api/admin/code/${id}/clear-devices`, { method: 'POST' });
          const data = await res.json();
          if (data.success) {
            window.location.reload();
          }
        } catch (e) {
          console.error('清理失败', e);
        } finally {
          setLoadingCodeId(null);
        }
      }
    });
  };
  const handleEditMaxUses = (code: any) => {
    const currentMax = code.maxUses !== undefined ? code.maxUses : 3;
    setEditModal({ show: true, type: 'maxUses', codeObj: code, val: currentMax.toString(), loading: false });
  };

  const handleEditCodeText = (code: any) => {
    const currentCodeStr = code.code || '';
    setEditModal({ show: true, type: 'code', codeObj: code, val: currentCodeStr, loading: false });
  };

  const submitEdit = async () => {
    if (!editModal.codeObj) return;
    const { type, codeObj, val } = editModal;
    setEditModal(prev => ({ ...prev, loading: true }));

    if (type === 'maxUses') {
      const maxUses = parseInt(val);
      if (isNaN(maxUses) || maxUses < 1) {
        alert('请输入有效的大于0的数字');
        setEditModal(prev => ({ ...prev, loading: false }));
        return;
      }
      try {
        const res = await fetch(`/api/admin/code/${codeObj._id}/max-uses`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ maxUses })
        });
        const data = await res.json();
        if (data.success) {
          setCodes(codes.map(c => c._id === codeObj._id ? { ...c, maxUses: data.maxUses } : c));
          setEditModal({ show: false, type: 'maxUses', codeObj: null, val: '', loading: false });
        } else {
          alert(data.error || '修改失败');
          setEditModal(prev => ({ ...prev, loading: false }));
        }
      } catch (e) {
        alert('网络错误');
        setEditModal(prev => ({ ...prev, loading: false }));
      }
    } else {
      if (!val || val.trim() === '' || val.trim() === (codeObj.code || '')) {
        setEditModal({ show: false, type: 'code', codeObj: null, val: '', loading: false });
        return;
      }
      try {
        const res = await fetch(`/api/admin/code/${codeObj._id}/edit-code`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newCode: val.trim() })
        });
        const data = await res.json();
        if (data.success) {
          setCodes(codes.map(c => c._id === codeObj._id ? { ...c, code: data.code } : c));
          setEditModal({ show: false, type: 'code', codeObj: null, val: '', loading: false });
        } else {
          alert(data.error || '修改失败');
          setEditModal(prev => ({ ...prev, loading: false }));
        }
      } catch (e) {
        alert('网络错误');
        setEditModal(prev => ({ ...prev, loading: false }));
      }
    }
  };

  const handleExportCSV = () => {
    if (selectedIds.length === 0) return alert('请先勾选需要导出的激活码');
    const codesToExport = codes.filter(c => selectedIds.includes(c._id));
    let csv = '\uFEFF卡密,项目专属,设备上限,状态\n';
    codesToExport.forEach(c => {
      csv += `${c.code},${c.testId || '通用'},${c.maxUses},${c.isDisabled ? '已禁用' : '正常'}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `activation_codes.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    setConfirmModal({
      show: true,
      message: `确定要彻底删除这 ${selectedIds.length} 个卡密吗？此操作不可恢复！`,
      onConfirm: async () => {
        setConfirmModal({ show: false, message: '', onConfirm: () => {} });
        setDeleteLoading(true);
        try {
          const res = await fetch('/api/admin/code/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: selectedIds })
          });
          const data = await res.json();
          if (data.success) {
            setCodes(codes.filter(c => !selectedIds.includes(c._id)));
            setSelectedIds([]);
          }
        } catch (e) {
          console.error('网络错误', e);
        } finally {
          setDeleteLoading(false);
        }
      }
    });
  };

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-4">
          卡密详细列表
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleBatchDelete}
                disabled={deleteLoading}
                className="text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded shadow active:scale-95 transition-transform"
              >
                批量删除 ({selectedIds.length})
              </button>
              <button 
                onClick={handleExportCSV}
                className="text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded shadow active:scale-95 transition-transform"
              >
                导出已选 ({selectedIds.length})
              </button>
            </div>
          )}
        </h2>
        <div className="flex gap-4 items-center">
          <select 
            value={filterTestId}
            onChange={(e) => setFilterTestId(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="ALL">全部项目</option>
            <option value="">通用</option>
            {TEST_PROJECTS.map(p => (
              <option key={p.id} value={p.testId}>{p.name}</option>
            ))}
          </select>
          <button 
            onClick={() => {
              setGenerateModal({ show: true, status: 'idle', message: '', count: 10, testId: filterTestId === 'ALL' ? '' : filterTestId });
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded font-bold shadow transition-colors whitespace-nowrap"
          >
            + 一键生成
          </button>
        </div>
      </div>
      <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg shadow-sm">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-900 font-semibold">
            <tr>
              <th className="p-4 w-10">
                <input 
                  type="checkbox" 
                  checked={displayedCodes.length > 0 && displayedCodes.every(c => selectedIds.includes(c._id))}
                  onChange={(e) => {
                    if (e.target.checked) {
                      const newIds = new Set([...selectedIds, ...displayedCodes.map(c => c._id)]);
                      setSelectedIds(Array.from(newIds));
                    } else {
                      const displayedIds = displayedCodes.map(c => c._id);
                      setSelectedIds(selectedIds.filter(id => !displayedIds.includes(id)));
                    }
                  }}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300"
                />
              </th>
              <th className="p-4">订单编号</th>
              <th className="p-4">项目专属</th>
              <th className="p-4">设备上限</th>
              <th className="p-4">已绑设备数</th>
              <th className="p-4">状态</th>
              <th className="p-4">操作</th>
            </tr>
          </thead>
          <tbody>
            {displayedCodes.map(code => (
              <tr key={code._id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="p-4">
                  <input 
                    type="checkbox"
                    checked={selectedIds.includes(code._id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds([...selectedIds, code._id]);
                      } else {
                        setSelectedIds(selectedIds.filter(id => id !== code._id));
                      }
                    }}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300"
                  />
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium text-black">{code.code}</span>
                    <button onClick={() => handleEditCodeText(code)} className="text-gray-400 hover:text-blue-500 text-xs border border-gray-200 px-1 rounded shadow-sm bg-white active:scale-95">修改</button>
                  </div>
                </td>
                <td className="p-4">
                  {TEST_PROJECTS.find(p => p.testId === code.testId)?.name || (code.testId ? code.testId : '通用')}
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{code.maxUses}</span>
                    <button onClick={() => handleEditMaxUses(code)} className="text-gray-400 hover:text-blue-500 text-xs border border-gray-200 px-1 rounded shadow-sm bg-white active:scale-95">修改</button>
                  </div>
                </td>
                <td className="p-4">
                  <span className={`font-bold ${(code.devices || []).length > (code.maxUses || 3) ? 'text-red-500' : 'text-green-600'}`}>
                    {(code.devices || []).length}
                  </span>
                </td>
                <td className="p-4">
                  {code.isDisabled ? (
                    <span className="px-2 py-1 text-xs font-bold bg-red-100 text-red-700 rounded">已禁用</span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-bold bg-green-100 text-green-700 rounded">正常</span>
                  )}
                </td>
                <td className="p-4 flex gap-2">
                  <button 
                    onClick={() => handleToggleDisable(code._id)}
                    disabled={loadingCodeId === code._id}
                    className="text-xs px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded font-medium disabled:opacity-50"
                  >
                    {code.isDisabled ? '解除禁用' : '禁用'}
                  </button>
                  <button 
                    onClick={() => handleViewDevices(code)}
                    className="text-xs px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded font-medium"
                  >
                    设备记录
                  </button>
                  <button 
                    onClick={() => handleClearDevices(code._id)}
                    disabled={loadingCodeId === code._id || (code.devices || []).length <= 3}
                    className="text-xs px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded font-medium disabled:opacity-50"
                  >
                    防白嫖清理(留3)
                  </button>
                </td>
              </tr>
            ))}
            {displayedCodes.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">暂无相关卡密记录</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {devicesModal.show && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">设备记录 - {devicesModal.code?.code}</h3>
              <button onClick={() => setDevicesModal({ show: false, code: null, devices: [] })} className="text-gray-500 hover:text-black font-bold">X</button>
            </div>
            <div className="p-6 overflow-y-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="border-b border-gray-200 text-gray-900">
                  <tr>
                    <th className="pb-3">设备标识</th>
                    <th className="pb-3">首次绑定时间</th>
                    <th className="pb-3">最近验证时间</th>
                    <th className="pb-3">总请求次数</th>
                  </tr>
                </thead>
                <tbody>
                  {devicesModal.devices.map((d: any, index: number) => (
                    <tr key={d.id} className="border-b border-gray-100">
                      <td className="py-3 font-mono text-xs">{d.deviceId.substring(0, 16)}...</td>
                      <td className="py-3">{new Date(d.createdAt).toLocaleString()}</td>
                      <td className="py-3">{new Date(d.lastUsedAt).toLocaleString()}</td>
                      <td className="py-3 font-bold">{d.useCount}</td>
                    </tr>
                  ))}
                  {devicesModal.devices.length === 0 && (
                    <tr><td colSpan={4} className="py-6 text-center italic">暂无设备绑定记录</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {generateModal.show && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full flex flex-col overflow-hidden">
            <div className="p-5 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">批量生成卡密</h3>
            </div>
            <div className="p-6">
              {generateModal.status === 'idle' && (
                <div className="text-gray-600 flex flex-col gap-4">
                  <p>确定要生成新的激活码吗？（默认上限3台设备）</p>
                  <label className="flex flex-col gap-2 font-bold text-gray-800">
                    项目专属:
                    <select 
                      value={generateModal.testId}
                      onChange={(e) => setGenerateModal(prev => ({ ...prev, testId: e.target.value }))}
                      className="border border-gray-300 rounded px-3 py-2 font-normal focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">通用 (所有测试可用)</option>
                      {TEST_PROJECTS.map(p => (
                        <option key={p.id} value={p.testId}>{p.name}</option>
                      ))}
                    </select>
                  </label>
                  <label className="flex items-center gap-3 font-bold text-gray-800 bg-gray-50 p-3 rounded border border-gray-200 mt-2">
                    生成数量:
                    <input 
                      type="number" 
                      min="1" 
                      max="1000"
                      value={generateModal.count} 
                      onChange={(e) => setGenerateModal(prev => ({ ...prev, count: parseInt(e.target.value) || 1 }))}
                      className="border border-gray-300 rounded px-3 py-1 w-24 text-center font-normal focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </label>
                </div>
              )}
              {generateModal.status === 'loading' && (
                <div className="flex items-center gap-3 text-blue-600 font-bold">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  正在向云端生成...
                </div>
              )}
              {generateModal.status === 'success' && (
                <p className="text-green-600 font-bold flex items-center gap-2">✅ {generateModal.message}</p>
              )}
              {generateModal.status === 'error' && (
                <p className="text-red-600 font-bold flex items-start gap-2">❌ {generateModal.message}</p>
              )}
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
              {generateModal.status === 'success' ? (
                <button 
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-purple-600 text-white rounded font-bold hover:bg-purple-700"
                >
                  刷新页面
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => setGenerateModal({ show: false, status: 'idle', message: '', count: 10, testId: '' })}
                    disabled={generateModal.status === 'loading'}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded font-bold hover:bg-gray-300 disabled:opacity-50"
                  >
                    取消
                  </button>
                  <button 
                    disabled={generateModal.status === 'loading'}
                    onClick={async () => {
                      setGenerateModal(prev => ({ ...prev, status: 'loading' }));
                      try {
                        const res = await fetch('/api/admin/generate', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          credentials: 'include',
                          body: JSON.stringify({ count: generateModal.count, maxUses: 3, testId: generateModal.testId })
                        });
                        
                        if (!res.ok) {
                           setGenerateModal(prev => ({ ...prev, status: 'error', message: `请求失败：${res.status} (可能认证失效，请刷新页面)` }));
                           return;
                        }
                        
                        const data = await res.json();
                        if(data.success) {
                          setGenerateModal(prev => ({ ...prev, status: 'success', message: `成功生成 ${data.count} 个激活码！` }));
                        } else {
                          setGenerateModal(prev => ({ ...prev, status: 'error', message: data.error || '生成失败' }));
                        }
                      } catch (err: any) {
                        setGenerateModal(prev => ({ ...prev, status: 'error', message: err.message || '网络断开或超时' }));
                      }
                    }}
                    className="px-4 py-2 bg-purple-600 text-white rounded font-bold hover:bg-purple-700 disabled:opacity-50"
                  >
                    确认生成
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {editModal.show && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full flex flex-col overflow-hidden">
            <div className="p-5 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">
                {editModal.type === 'maxUses' ? '修改设备上限' : '修改激活码文本'}
              </h3>
            </div>
            <div className="p-6">
              <label className="flex flex-col gap-2 font-bold text-gray-800">
                {editModal.type === 'maxUses' ? '设备上限 (台):' : '激活码文本:'}
                <input 
                  type={editModal.type === 'maxUses' ? 'number' : 'text'}
                  value={editModal.val}
                  onChange={(e) => setEditModal(prev => ({ ...prev, val: e.target.value }))}
                  className="border border-gray-300 rounded px-3 py-2 text-left font-normal focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  autoFocus
                />
              </label>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
              <button 
                onClick={() => setEditModal({ show: false, type: 'maxUses', codeObj: null, val: '', loading: false })}
                disabled={editModal.loading}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded font-bold hover:bg-gray-300 disabled:opacity-50"
              >
                取消
              </button>
              <button 
                onClick={submitEdit}
                disabled={editModal.loading}
                className="px-4 py-2 bg-purple-600 text-white rounded font-bold hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
              >
                {editModal.loading ? '保存中...' : '确认保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmModal.show && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full flex flex-col overflow-hidden">
            <div className="p-5 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">操作确认</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-800 font-medium">{confirmModal.message}</p>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
              <button 
                onClick={() => setConfirmModal({ show: false, message: '', onConfirm: () => {} })}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded font-bold hover:bg-gray-300"
              >
                取消
              </button>
              <button 
                onClick={confirmModal.onConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded font-bold hover:bg-red-700"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

