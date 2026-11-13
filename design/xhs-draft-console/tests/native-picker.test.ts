import { describe, expect, it, vi } from 'vitest';
import * as pickerModule from '../lib/picker';
import { executePickerPowerShell } from '../lib/picker';
import { browseButtonLabel } from '../lib/browse-label';
import { POST } from '../app/api/dialog/pick/route';
import { NextRequest } from 'next/server';

describe('浏览按钮 loading 文案隔离 (回归：不可共用 boolean)', () => {
  it('只让被点击目标显示「选择中…」，另一侧保持 idle', () => {
    expect(browseButtonLabel('md', 'md', '📂 浏览文件')).toBe('选择中…');
    expect(browseButtonLabel('cards', 'md', '📂 浏览目录')).toBe('📂 浏览目录');
    expect(browseButtonLabel('cards', 'cards', '📂 浏览目录')).toBe('选择中…');
    expect(browseButtonLabel('md', 'cards', '📂 浏览文件')).toBe('📂 浏览文件');
    expect(browseButtonLabel('md', null, '📂 浏览文件')).toBe('📂 浏览文件');
  });
});

describe('原生系统路径选择器 (/api/dialog/pick)', () => {
  it('正常返回选中的路径并做斜杠正规化', async () => {
    // 模拟 execFile 返回选中的 Windows 路径
    const mockExec = ((file: any, args: any, options: any, cb: any) => {
      // simulate output
      cb(null, 'E:\\AI\\Antigravity\\小红书\\test.md\r\n', '');
      return {} as any;
    }) as any;

    const res = await executePickerPowerShell({ mode: 'file' }, mockExec);
    expect(res.cancelled).toBe(false);
    expect(res.path).toBe('E:/AI/Antigravity/小红书/test.md');
  });

  it('用户点击取消时返回 cancelled: true', async () => {
    const mockExec = ((file: any, args: any, options: any, cb: any) => {
      // empty output or whitespace means cancel
      cb(null, '   \r\n', '');
      return {} as any;
    }) as any;

    const res = await executePickerPowerShell({ mode: 'file' }, mockExec);
    expect(res.cancelled).toBe(true);
    expect(res.path).toBeNull();
  });

  it('执行报错或超时优雅降级', async () => {
    const mockExec = ((file: any, args: any, options: any, cb: any) => {
      cb(new Error('Command timed out'), '', 'Timeout stderr');
      return {} as any;
    }) as any;

    const res = await executePickerPowerShell({ mode: 'directory' }, mockExec);
    expect(res.cancelled).toBe(true);
    expect(res.error).toContain('选择器执行失败');
  });

  it('POST 路由接口正确接收 JSON 请求体', async () => {
    const spy = vi.spyOn(pickerModule, 'executePickerPowerShell').mockResolvedValueOnce({
      path: 'E:/AI/Antigravity/小红书/test.md',
      cancelled: false,
    });

    const req = new NextRequest('http://localhost/api/dialog/pick', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'file' }),
    });

    const response = await POST(req);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('cancelled');
    expect(data.cancelled).toBe(false);
    expect(data.path).toBe('E:/AI/Antigravity/小红书/test.md');
    spy.mockRestore();
  });
});
