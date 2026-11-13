/**
 * Windows 原生文件/目录选择器执行工具（工单 02）
 */
import { execFile } from 'child_process';
import path from 'path';
import os from 'os';

export interface PickOptions {
  mode?: 'file' | 'directory';
  defaultPath?: string;
  filter?: string;
}

export interface PickResult {
  path: string | null;
  cancelled: boolean;
  error?: string;
}

export function executePickerPowerShell(
  opts: PickOptions,
  customExec?: typeof execFile
): Promise<PickResult> {
  const runner = customExec || execFile;
  const isWindows = os.platform() === 'win32';
  if (!isWindows) {
    return Promise.resolve({
      path: null,
      cancelled: true,
      error: '原生系统选择器仅支持 Windows 环境',
    });
  }

  const mode = opts.mode === 'directory' ? 'directory' : 'file';
  let initialDir = opts.defaultPath ? opts.defaultPath.trim() : '';

  // 若传入的是文件路径，取其目录作为初始目录
  if (initialDir && path.extname(initialDir)) {
    initialDir = path.dirname(initialDir);
  }
  // 转换成 Windows 反斜杠
  if (initialDir) {
    initialDir = path.resolve(initialDir).replace(/\//g, '\\');
  }

  let psScript = '';
  if (mode === 'directory') {
    psScript = `
Add-Type -AssemblyName System.Windows.Forms
$dialog = New-Object System.Windows.Forms.FolderBrowserDialog
$dialog.Description = "请选择目录"
$dialog.ShowNewFolderButton = $true
${initialDir ? `$dialog.SelectedPath = '${initialDir.replace(/'/g, "''")}'` : ''}
$form = New-Object System.Windows.Forms.Form
$form.TopMost = $true
$form.StartPosition = [System.Windows.Forms.FormStartPosition]::CenterScreen
$res = $dialog.ShowDialog($form)
if ($res -eq [System.Windows.Forms.DialogResult]::OK) {
  [Console]::Out.Write($dialog.SelectedPath)
}
$form.Dispose()
`.trim();
  } else {
    const filter =
      opts.filter || 'Markdown Files (*.md)|*.md|All Files (*.*)|*.*';
    psScript = `
Add-Type -AssemblyName System.Windows.Forms
$dialog = New-Object System.Windows.Forms.OpenFileDialog
$dialog.Title = "请选择文件"
$dialog.Filter = "${filter.replace(/"/g, '`"')}"
${initialDir ? `$dialog.InitialDirectory = '${initialDir.replace(/'/g, "''")}'` : ''}
$form = New-Object System.Windows.Forms.Form
$form.TopMost = $true
$form.StartPosition = [System.Windows.Forms.FormStartPosition]::CenterScreen
$res = $dialog.ShowDialog($form)
if ($res -eq [System.Windows.Forms.DialogResult]::OK) {
  [Console]::Out.Write($dialog.FileName)
}
$form.Dispose()
`.trim();
  }

  return new Promise((resolve) => {
    // 使用 Base64 编码方式传给 powershell.exe -EncodedCommand，避免各种引号转义与换行问题
    const encoded = Buffer.from(psScript, 'utf16le').toString('base64');
    runner(
      'powershell.exe',
      ['-NoProfile', '-STA', '-EncodedCommand', encoded],
      { timeout: 60000, windowsHide: false },
      (error, stdout) => {
        if (error) {
          // 超时或进程终止
          return resolve({
            path: null,
            cancelled: true,
            error: `选择器执行失败: ${error.message}`,
          });
        }
        const picked = stdout.trim();
        if (!picked) {
          return resolve({
            path: null,
            cancelled: true,
          });
        }
        // 规范化路径为正斜杠格式，兼容前端与 Node
        const normalized = picked.replace(/\\/g, '/');
        return resolve({
          path: normalized,
          cancelled: false,
        });
      }
    );
  });
}
