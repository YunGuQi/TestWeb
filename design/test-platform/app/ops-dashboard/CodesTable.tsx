'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminStore } from '../../lib/store/admin-store';

export default function CodesTable({ initialCodes, testId }: { initialCodes: any[], testId: string }) {
  const router = useRouter();
  const { isUnlocked } = useAdminStore();
  const [codes, setCodes] = useState(initialCodes);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [generateModal, setGenerateModal] = useState({ show: false, count: 10 });
  const [editModal, setEditModal] = useState({ show: false, id: 0, code: '', maxUses: 3 });
  const [batchEditModal, setBatchEditModal] = useState({ show: false, maxUses: 3 });

  // Filter & Sort States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUsage, setFilterUsage] = useState('all'); // all, used, unused
  const [filterExported, setFilterExported] = useState('all'); // all, exported, unexported
  const [sortBy, setSortBy] = useState('createdAt'); // createdAt, deviceCount, testCount
  const [sortOrder, setSortOrder] = useState('desc'); // desc, asc

  const processedCodes = useMemo(() => {
    let result = codes.map(code => ({
      ...code,
      deviceCount: (() => {
        try {
          const devices = JSON.parse(code.devices || '[]');
          return new Set(devices).size;
        } catch { return 0; }
      })()
    }));

    // 1. 搜索卡密
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(c => c.code.toLowerCase().includes(term));
    }

    // 2. 使用状态过滤
    if (filterUsage === 'used') result = result.filter(c => c.deviceCount > 0);
    if (filterUsage === 'unused') result = result.filter(c => c.deviceCount === 0);

    // 3. 导出状态过滤
    if (filterExported === 'exported') result = result.filter(c => c.isExported);
    if (filterExported === 'unexported') result = result.filter(c => !c.isExported);

    // 4. 排序
    result.sort((a, b) => {
      let valA, valB;
      if (sortBy === 'createdAt') {
        valA = new Date(a.createdAt).getTime();
        valB = new Date(b.createdAt).getTime();
      } else if (sortBy === 'deviceCount') {
        valA = a.deviceCount;
        valB = b.deviceCount;
      } else if (sortBy === 'testCount') {
        valA = a.testCount || 0;
        valB = b.testCount || 0;
      } else {
        valA = 0; valB = 0;
      }
      return sortOrder === 'desc' ? valB - valA : valA - valB;
    });

    return result;
  }, [codes, searchTerm, filterUsage, filterExported, sortBy, sortOrder]);

  useEffect(() => {
    setCodes(initialCodes);
  }, [initialCodes]);

  const handleExportTXT = async () => {
    if (selectedIds.length === 0) return alert('请先勾选需要导出的激活码');
    const codesToExport = codes.filter(c => selectedIds.includes(c.id));
    
    setLoading(true);
    try {
      // 1. 标记为已导出
      const res = await fetch('/api/admin/code/export_mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '标记导出失败');
      }

      // 2. 乐观更新UI状态
      setCodes(codes.map(c => selectedIds.includes(c.id) ? { ...c, isExported: true } : c));
      setSelectedIds([]);

      // 3. 阿奇索卡券仓库格式：纯文本，一行一个卡密
      const txt = codesToExport.map(c => c.code).join('\n');
      const blob = new Blob([txt], { type: 'text/plain;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `agiso_codes_${Date.now()}.txt`;
      link.click();
    } catch(e: any) {
      alert(e.message);
    }
    setLoading(false);
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`确定删除这 ${selectedIds.length} 个卡密吗？`)) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/code/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds.map(id => Number(id)) })
      });
      const data = await res.json();
      if (data.success) {
        setCodes(codes.filter(c => !selectedIds.includes(c.id)));
        setSelectedIds([]);
      } else {
        alert(data.error || '批量删除卡密失败');
      }
    } catch(e: any) {
      alert('请求删除发生网络或服务器异常: ' + (e.message || ''));
    }
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
        if (data.codes && Array.isArray(data.codes)) {
          setCodes([...data.codes, ...codes]);
        }
        setGenerateModal({ show: false, count: 10 });
        router.refresh();
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
        setCodes(codes.map(c => c.id === editModal.id 
          ? { ...c, code: editModal.code, maxUses: editModal.maxUses } 
          : c
        ));
        setEditModal({ show: false, id: 0, code: '', maxUses: 3 });
      } else {
        alert(data.error);
      }
    } catch(e: any) {
      alert('发生异常: ' + e.message);
    }
    setLoading(false);
  };

  const handleBatchEdit = async () => {
    if (selectedIds.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/code/batch_edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, maxUses: batchEditModal.maxUses })
      });
      const data = await res.json();
      if (data.success) {
        setCodes(codes.map(c => selectedIds.includes(c.id)
          ? { ...c, maxUses: batchEditModal.maxUses }
          : c
        ));
        setBatchEditModal({ show: false, maxUses: 3 });
        setSelectedIds([]);
      } else {
        alert(data.error || '批量修改失败');
      }
    } catch (e: any) {
      alert('发生异常: ' + e.message);
    }
    setLoading(false);
  };

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return <span className="opacity-0 group-hover:opacity-30">↓</span>;
    return sortOrder === 'desc' ? <span>↓</span> : <span>↑</span>;
  };

  return (
    <div className="mt-8 text-[#37352F]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold flex flex-wrap items-center gap-2 sm:gap-4 text-[#37352F]">
          <span>卡密详细列表</span>
          {isUnlocked && selectedIds.length > 0 && (
            <div className="flex items-center gap-2">
              <button onClick={handleBatchDelete} disabled={loading} className="text-xs font-semibold bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 transition-colors px-3 py-1.5 rounded-md cursor-pointer">
                批量删除 ({selectedIds.length})
              </button>
              <button onClick={() => setBatchEditModal({ show: true, maxUses: 3 })} disabled={loading} className="text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 transition-colors px-3 py-1.5 rounded-md cursor-pointer">
                批量修改 ({selectedIds.length})
              </button>
              <button onClick={handleExportTXT} className="text-xs font-semibold bg-green-50 text-green-600 border border-green-100 hover:bg-green-100 transition-colors px-3 py-1.5 rounded-md cursor-pointer">
                导出阿奇索 txt ({selectedIds.length})
              </button>
            </div>
          )}
        </h2>
        {isUnlocked && (
          <button 
            onClick={() => setGenerateModal({ show: true, count: 10 })}
            className="bg-white border border-[#EBEBEB] hover:bg-[#F7F6F3] transition-colors text-[#37352F] px-4 py-2 rounded-md font-semibold text-sm shadow-sm flex items-center gap-2 shrink-0"
          >
            <span>✨</span> 一键生成
          </button>
        )}
      </div>

      {/* ============ Toolbar (Search, Filters, Mobile Sort) ============ */}
      <div className="bg-[#F7F6F3] border border-[#EBEBEB] p-3.5 rounded-xl mb-4 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="flex-1 min-w-[200px]">
          <input 
            type="text" 
            placeholder="搜索激活码..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-[#EBEBEB] px-3 py-1.5 rounded-md text-sm outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-100 transition-all text-[#37352F] font-mono"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select 
            value={filterUsage} 
            onChange={(e) => setFilterUsage(e.target.value)}
            className="border border-[#EBEBEB] px-2 py-1.5 rounded-md text-sm outline-none focus:border-blue-300 bg-white text-[#37352F] cursor-pointer"
          >
            <option value="all">使用状态: 全部</option>
            <option value="unused">未使用</option>
            <option value="used">已使用</option>
          </select>
          <select 
            value={filterExported} 
            onChange={(e) => setFilterExported(e.target.value)}
            className="border border-[#EBEBEB] px-2 py-1.5 rounded-md text-sm outline-none focus:border-blue-300 bg-white text-[#37352F] cursor-pointer"
          >
            <option value="all">导出状态: 全部</option>
            <option value="unexported">未导出</option>
            <option value="exported">已导出</option>
          </select>
          <div className="md:hidden flex items-center border border-[#EBEBEB] bg-white rounded-md pr-2">
            <select 
              value={`${sortBy}-${sortOrder}`} 
              onChange={(e) => {
                const [sb, so] = e.target.value.split('-');
                setSortBy(sb);
                setSortOrder(so);
              }}
              className="px-2 py-1.5 text-sm outline-none bg-transparent text-[#37352F] cursor-pointer"
            >
              <option value="createdAt-desc">创建时间: 新 → 旧</option>
              <option value="createdAt-asc">创建时间: 旧 → 新</option>
              <option value="deviceCount-desc">已绑设备: 多 → 少</option>
              <option value="deviceCount-asc">已绑设备: 少 → 多</option>
              <option value="testCount-desc">测算次数: 多 → 少</option>
              <option value="testCount-asc">测算次数: 少 → 多</option>
            </select>
          </div>
        </div>
      </div>

      {/* ============ Mobile Select All Bar (< md) ============ */}
      <div className="md:hidden bg-[#F7F6F3] border border-[#EBEBEB] p-3.5 rounded-xl mb-4 shadow-sm">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2.5 text-sm font-bold text-[#37352F] cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={processedCodes.length > 0 && processedCodes.every(c => selectedIds.includes(c.id))}
              onChange={(e) => {
                if (e.target.checked) setSelectedIds(processedCodes.map(c => c.id));
                else setSelectedIds([]);
              }}
              className="w-4 h-4 rounded border-[#EBEBEB] text-blue-500 focus:ring-blue-500 cursor-pointer"
            />
            <span>全选可视卡密 ({processedCodes.length})</span>
          </label>
          {selectedIds.length > 0 && (
            <span className="text-xs font-bold text-[#37352F] bg-white border border-[#EBEBEB] px-2.5 py-1 rounded-md shadow-sm">
              已选 {selectedIds.length} 项
            </span>
          )}
        </div>
      </div>

      {/* ============ Mobile Cards View (< md) ============ */}
      <div className="md:hidden space-y-3">
        {processedCodes.map(code => {
          const isSelected = selectedIds.includes(code.id);
          return (
            <div 
              key={code.id} 
              className={`bg-white border p-4 rounded-xl transition-colors shadow-sm ${
                isSelected ? 'border-blue-500 bg-blue-50/20' : 'border-[#EBEBEB]'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#EBEBEB]/60 mb-3">
                <div className="flex items-center gap-2.5">
                  {isUnlocked && (
                    <input 
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedIds([...selectedIds, code.id]);
                        else setSelectedIds(selectedIds.filter(id => id !== code.id));
                      }}
                      className="rounded border-[#EBEBEB] text-blue-500 focus:ring-blue-500"
                    />
                  )}
                  <span className="font-mono font-bold text-base text-[#37352F] tracking-wide">
                    {isUnlocked ? code.code : '****-****-****-****'}
                  </span>
                  {code.isExported && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-50 text-green-700 border border-green-100">
                      已导出
                    </span>
                  )}
                </div>
                {isUnlocked && (
                  <button 
                    onClick={() => setEditModal({ show: true, id: code.id, code: code.code, maxUses: code.maxUses })}
                    className="text-xs font-semibold text-[#787774] hover:text-[#37352F] bg-[#F7F6F3] hover:bg-[#EBEBEB] transition-colors px-3 py-1.5 rounded-lg border border-[#EBEBEB] shadow-sm cursor-pointer"
                  >
                    修改上限
                  </button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 py-1 mb-2 text-center">
                <div className="bg-[#FDFBF7] p-2 rounded-lg border border-[#EBEBEB]/50">
                  <div className="text-[10px] text-[#787774] font-medium mb-0.5">可用上限</div>
                  <div className="font-bold text-sm text-[#37352F]">{code.maxUses}</div>
                </div>
                <div className="bg-[#FDFBF7] p-2 rounded-lg border border-[#EBEBEB]/50">
                  <div className="text-[10px] text-[#787774] font-medium mb-0.5">已用次数</div>
                  <div className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-blue-50 text-blue-700">
                    {code.deviceCount}
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
        {processedCodes.length === 0 && (
          <div className="text-center py-8 text-[#9F9E9B] text-sm">
            没有找到匹配的卡密
          </div>
        )}
      </div>

      {/* ============ Desktop Table View (>= md) ============ */}
      <div className="hidden md:block overflow-x-auto bg-white border border-[#EBEBEB] rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-[#F7F6F3] border-b border-[#EBEBEB] text-[#787774] font-medium text-xs uppercase tracking-wider select-none">
            <tr>
              <th className="p-4 w-10">
                <input 
                  type="checkbox" 
                  checked={processedCodes.length > 0 && processedCodes.every(c => selectedIds.includes(c.id))}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedIds(processedCodes.map(c => c.id));
                    else setSelectedIds([]);
                  }}
                  className="rounded border-[#EBEBEB] text-blue-500 focus:ring-blue-500 cursor-pointer"
                />
              </th>
              <th className="p-4">卡密</th>
              <th className="p-4">上限</th>
              <th className="p-4 cursor-pointer hover:bg-[#EBEBEB]/50 transition-colors group" onClick={() => toggleSort('deviceCount')}>
                <div className="flex items-center gap-1">已绑设备数 {getSortIcon('deviceCount')}</div>
              </th>
              <th className="p-4 cursor-pointer hover:bg-[#EBEBEB]/50 transition-colors group" onClick={() => toggleSort('testCount')}>
                <div className="flex items-center gap-1">测算次数 {getSortIcon('testCount')}</div>
              </th>
              <th className="p-4 cursor-pointer hover:bg-[#EBEBEB]/50 transition-colors group" onClick={() => toggleSort('createdAt')}>
                <div className="flex items-center gap-1">创建时间 {getSortIcon('createdAt')}</div>
              </th>
              <th className="p-4">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EBEBEB]">
            {processedCodes.map(code => (
              <tr key={code.id} className="hover:bg-[#FDFBF7] transition-colors">
                <td className="p-4">
                  {isUnlocked && (
                    <input 
                      type="checkbox"
                      checked={selectedIds.includes(code.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedIds([...selectedIds, code.id]);
                        else setSelectedIds(selectedIds.filter(id => id !== code.id));
                      }}
                      className="rounded border-[#EBEBEB] text-blue-500 focus:ring-blue-500 cursor-pointer"
                    />
                  )}
                </td>
                <td className="p-4 font-mono font-medium text-[#37352F] flex items-center gap-2">
                  {isUnlocked ? code.code : '****-****-****-****'}
                  {code.isExported && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-50 text-green-700 border border-green-100">
                      已导出
                    </span>
                  )}
                </td>
                <td className="p-4 text-[#787774]">{code.maxUses}</td>
                <td className="p-4">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                    {code.deviceCount}
                  </span>
                </td>
                <td className="p-4">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700">
                    {code.testCount || 0}
                  </span>
                </td>
                <td className="p-4 text-[#9F9E9B] text-xs font-mono">{new Date(code.createdAt).toLocaleString()}</td>
                <td className="p-4">
                  {isUnlocked && (
                    <button 
                      onClick={() => setEditModal({ show: true, id: code.id, code: code.code, maxUses: code.maxUses })}
                      className="text-xs font-medium text-[#787774] hover:text-[#37352F] bg-[#F7F6F3] hover:bg-[#EBEBEB] transition-colors px-2.5 py-1 rounded-md border border-[#EBEBEB]"
                    >
                      修改
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {processedCodes.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-[#9F9E9B] text-sm">
                  没有找到匹配的卡密
                </td>
              </tr>
            )}
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
      {/* Batch Edit Modal */}
      {batchEditModal.show && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-[#37352F] mb-4">批量修改设备数上限</h3>
            <div className="text-sm text-[#787774] mb-4">
              已选中 <span className="font-bold text-blue-600">{selectedIds.length}</span> 个卡密。
            </div>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-[#787774] mb-2">新的设备数上限</label>
              <input 
                type="number" 
                value={batchEditModal.maxUses}
                onChange={e => setBatchEditModal({...batchEditModal, maxUses: parseInt(e.target.value) || 1})}
                className="w-full border border-[#EBEBEB] p-2.5 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors font-mono"
                min="1"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setBatchEditModal({ show: false, maxUses: 3 })}
                className="px-4 py-2 text-sm font-semibold text-[#787774] hover:bg-[#F7F6F3] rounded-lg transition-colors cursor-pointer"
              >
                取消
              </button>
              <button 
                onClick={handleBatchEdit}
                disabled={loading}
                className="px-4 py-2 text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors shadow-sm cursor-pointer disabled:opacity-50"
              >
                {loading ? '修改中...' : '确认修改'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
