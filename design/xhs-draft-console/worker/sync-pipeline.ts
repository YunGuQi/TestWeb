import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import child_process from 'node:child_process';
import {
  exportMobileHubData,
  exportMultiSuiteHubData,
  type ExportMobileHubOptions,
} from '../lib/export/mobile-hub-exporter';
import { packZipDirectory } from '../lib/export/zip-pack';
import type { ProductPresetItem } from '../lib/preset-suites';

export interface BaotaServerConfig {
  host: string;
  port?: number;
  username?: string;
  password?: string;
  privateKeyPath?: string;
  remoteDir?: string;
}

export interface BaotaHubConfig {
  server?: BaotaServerConfig;
  publicUrl?: string;
  security?: {
    accessPassword?: string;
  };
}

export interface SyncPipelineOptions {
  configPath?: string;
  mdPath?: string;
  cardsDir?: string;
  outDir?: string;
  silent?: boolean;
  timeoutMs?: number;
  /** 是否开启多套件全量模式，默认 true */
  multiSuite?: boolean;
  /** 自定义套件列表，若不传则扫描 PRODUCT_PRESETS */
  suites?: ProductPresetItem[];
  /** 默认激活的套件 ID */
  defaultSuiteId?: string;
}

export interface SyncResult {
  ok: boolean;
  mode: 'ssh' | 'fallback_zip';
  distDir: string;
  zipPath?: string;
  publicUrl?: string;
  fallbackReason?: string;
  manualSteps?: string[];
  totalCards?: number;
  totalSuites?: number;
}

/**
 * 加载宝塔环境配置 (配置文件优先，环境变量补充)
 */
export function loadBaotaConfig(
  customConfigPath?: string,
  projectRoot?: string
): BaotaHubConfig | null {
  const root = projectRoot || path.resolve(__dirname, '..');
  const configPath = customConfigPath
    ? path.resolve(customConfigPath)
    : path.resolve(root, 'mobile-hub.config.json');

  let fileConfig: BaotaHubConfig = {};
  if (fs.existsSync(configPath)) {
    try {
      fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch {
      // 容错降级
    }
  }

  const envHost = process.env.BAOTA_SSH_HOST;
  const envUser = process.env.BAOTA_SSH_USER;
  const envPort = process.env.BAOTA_SSH_PORT
    ? parseInt(process.env.BAOTA_SSH_PORT, 10)
    : undefined;
  const envPass = process.env.BAOTA_SSH_PASSWORD;
  const envKey = process.env.BAOTA_SSH_KEY;
  const envRemoteDir = process.env.BAOTA_REMOTE_DIR;
  const envPublicUrl = process.env.BAOTA_PUBLIC_URL;
  const envAccessPassword = process.env.MOBILE_HUB_PASSWORD;

  const server: BaotaServerConfig = {
    host: envHost || fileConfig.server?.host || '',
    port: envPort || fileConfig.server?.port || 22,
    username: envUser || fileConfig.server?.username || 'root',
    password: envPass || fileConfig.server?.password || '',
    privateKeyPath: envKey || fileConfig.server?.privateKeyPath || '',
    remoteDir: envRemoteDir || fileConfig.server?.remoteDir || '/www/wwwroot/post-hub',
  };

  const security = {
    accessPassword: envAccessPassword || fileConfig.security?.accessPassword || 'xhs2026',
  };

  const publicUrl = envPublicUrl || fileConfig.publicUrl || '';

  if (!server.host) {
    return null;
  }

  return {
    server,
    publicUrl,
    security,
  };
}

/**
 * 探测 TCP 端口可用性 (5s 超时防护，杜绝网络无响应挂死)
 */
export function testTcpConnection(
  host: string,
  port: number,
  timeoutMs = 5000
): Promise<void> {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    let isSettled = false;

    const timer = setTimeout(() => {
      if (!isSettled) {
        isSettled = true;
        socket.destroy();
        reject(new Error(`连接超时 (${timeoutMs}ms)`));
      }
    }, timeoutMs);

    socket.on('connect', () => {
      if (!isSettled) {
        // 如果是 SSH 端口 (22)，等待服务端的 SSH 握手协议标识
        // 这能彻底防范本地 TUN 代理伪造 TCP 握手导致的虚假连接与长挂死
        if (port === 22) {
          socket.once('data', (chunk) => {
            if (!isSettled) {
              isSettled = true;
              clearTimeout(timer);
              socket.destroy();
              if (chunk.toString().startsWith('SSH')) {
                resolve();
              } else {
                reject(new Error('目标端口未运行有效的 SSH 服务'));
              }
            }
          });
        } else {
          isSettled = true;
          clearTimeout(timer);
          socket.destroy();
          resolve();
        }
      }
    });

    socket.on('timeout', () => {
      if (!isSettled) {
        isSettled = true;
        clearTimeout(timer);
        socket.destroy();
        reject(new Error(`连接超时 (${timeoutMs}ms)`));
      }
    });

    socket.on('error', (err) => {
      if (!isSettled) {
        isSettled = true;
        clearTimeout(timer);
        socket.destroy();
        reject(err);
      }
    });

    socket.connect(port, host);
  });
}

/**
 * 通过 SCP 上传静态包至宝塔 (支持 Zip 单包直传解压与目录递归兜底)
 */
export async function uploadViaScp(
  server: BaotaServerConfig,
  localDir: string,
  timeoutMs = 60000
): Promise<void> {
  const port = server.port || 22;
  const user = server.username || 'root';
  const remoteDir = server.remoteDir || '/www/wwwroot/post-hub';
  const connectTimeoutSec = Math.max(1, Math.min(10, Math.ceil(timeoutMs / 1000)));

  const baseSshArgs = [
    '-p',
    String(port),
    '-o',
    `ConnectTimeout=${connectTimeoutSec}`,
    '-o',
    'BatchMode=yes',
    '-o',
    'StrictHostKeyChecking=no',
  ];
  const baseScpArgs = [
    '-P',
    String(port),
    '-o',
    `ConnectTimeout=${connectTimeoutSec}`,
    '-o',
    'BatchMode=yes',
    '-o',
    'StrictHostKeyChecking=no',
  ];

  if (server.privateKeyPath) {
    baseSshArgs.push('-i', server.privateKeyPath);
    baseScpArgs.push('-i', server.privateKeyPath);
  }

  // 方案 A（优先）：本地打临时 zip 包，一键上传并远程解压 (毫秒级直传，杜绝 Windows 路径通配符问题)
  try {
    const tempZipPath = path.resolve(localDir, '../__deploy_hub.zip');
    await packZipDirectory(localDir, tempZipPath);

    const scpZipArgs = [
      ...baseScpArgs,
      tempZipPath,
      `${user}@${server.host}:${remoteDir}/__deploy_hub.zip`,
    ];

    await new Promise<void>((resolve, reject) => {
      const proc = child_process.spawn('scp', scpZipArgs, {
        windowsHide: true,
        stdio: 'pipe',
      });
      const timer = setTimeout(() => {
        proc.kill();
        reject(new Error(`SCP 压缩包上传超时 (${timeoutMs}ms)`));
      }, timeoutMs);

      proc.on('close', (code) => {
        clearTimeout(timer);
        if (code === 0) resolve();
        else reject(new Error(`SCP 上传异常退出，退出码: ${code}`));
      });
      proc.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });

    // 远程解压并清理临时包
    const sshCmd = `mkdir -p ${remoteDir} && cd ${remoteDir} && unzip -qo __deploy_hub.zip && rm -f __deploy_hub.zip && chown -R www:www ${remoteDir} 2>/dev/null || true`;
    const sshArgs = [...baseSshArgs, `${user}@${server.host}`, sshCmd];

    await new Promise<void>((resolve, reject) => {
      const proc = child_process.spawn('ssh', sshArgs, {
        windowsHide: true,
        stdio: 'pipe',
      });
      const timer = setTimeout(() => {
        proc.kill();
        reject(new Error(`SSH 远程解压超时 (${timeoutMs}ms)`));
      }, timeoutMs);

      proc.on('close', (code) => {
        clearTimeout(timer);
        if (code === 0) resolve();
        else reject(new Error(`SSH 远程解压异常，退出码: ${code}`));
      });
      proc.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });

    if (fs.existsSync(tempZipPath)) {
      fs.unlinkSync(tempZipPath);
    }
    return;
  } catch (err: any) {
    if (err?.message?.includes('超时') || err?.message?.includes('timed out')) {
      throw err;
    }
    // 若 Zip 直传遇到特殊异常，回退尝试原生 SCP 目录传输
  }

  // 方案 B：目录原生递归上传
  const args = [
    '-r',
    ...baseScpArgs,
    `${localDir}/.`,
    `${user}@${server.host}:${remoteDir}`,
  ];

  await new Promise<void>((resolve, reject) => {
    const proc = child_process.spawn('scp', args, {
      windowsHide: true,
      stdio: 'pipe',
    });

    const timer = setTimeout(() => {
      proc.kill();
      reject(new Error(`SCP 传输超时 (${timeoutMs}ms)`));
    }, timeoutMs);

    proc.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) resolve();
      else reject(new Error(`SCP 上传异常退出，退出码: ${code}`));
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

/** 打印降级手动部署彩色指引 */
export function printFallbackNotice(
  reason: string,
  zipPath: string,
  manualSteps: string[]
): void {
  console.log('\n┌────────────────────────────────────────────────────────────┐');
  console.log('│ ⚠️  宝塔 SSH 自动上传未就绪，已 100% 自动降级生成 update.zip │');
  console.log('├────────────────────────────────────────────────────────────┤');
  console.log(`│ 原因: ${reason}`);
  console.log(`│ 产物: ${zipPath}`);
  console.log('│');
  console.log('│ 【手动部署 3 步指引】:');
  manualSteps.forEach((step) => {
    console.log(`│  ${step}`);
  });
  console.log('└────────────────────────────────────────────────────────────┘\n');
}

/** 打印上传成功提示 */
export function printSuccessNotice(
  publicUrl: string,
  remoteDir: string,
  totalSuites?: number,
  totalCards?: number
): void {
  console.log('\n┌────────────────────────────────────────────────────────────┐');
  console.log('│ ✅  Mobile Post Hub 宝塔云端自动同步完成！                 │');
  console.log('├────────────────────────────────────────────────────────────┤');
  if (totalSuites !== undefined && totalCards !== undefined) {
    console.log(`│ 📦 套件汇总: 共 ${totalSuites} 套文案套件 / 累计 ${totalCards} 张发帖卡片`);
  }
  console.log(`│ 🌐 手机访问链接: ${publicUrl || '请使用宝塔绑定的公网域名/IP访问'}`);
  console.log(`│ 📂 远程静态目录: ${remoteDir}`);
  console.log('└────────────────────────────────────────────────────────────┘\n');
}

function findDefaultMd(): string {
  const candidates = [
    'design/product-docs/大女主觉醒测试/docs/2026-10-28_发帖文案.md',
    'design/product-docs/大女主觉醒测试/docs/2026-10-10_发帖文案.md',
    'design/xhs-draft-console/tests/fixtures/sample-copy.md',
  ];
  for (const c of candidates) {
    const full = path.resolve(process.cwd(), c);
    if (fs.existsSync(full)) return full;
    const fromConsole = path.resolve(process.cwd(), '../../', c);
    if (fs.existsSync(fromConsole)) return fromConsole;
  }
  return path.resolve(__dirname, '../tests/fixtures/sample-copy.md');
}

function findDefaultCardsDir(mdPath?: string): string | undefined {
  if (mdPath) {
    const p = path.resolve(mdPath);
    const productDir = p.replace(/[\\/]docs[\\/].*$/, '');
    const directCards = path.join(productDir, 'assets/结果测试截图/cards');
    if (fs.existsSync(directCards)) return directCards;
    const assetsCards = path.join(productDir, 'assets/cards');
    if (fs.existsSync(assetsCards)) return assetsCards;
    const directAssets = path.join(productDir, 'assets');
    if (fs.existsSync(directAssets)) return directAssets;
    return undefined;
  }

  const candidates = [
    'design/product-docs/大女主觉醒测试/assets/结果测试截图/cards',
    'design/product-docs/大女主觉醒测试/assets',
    'design/product-docs/大女主觉醒测试',
  ];
  for (const c of candidates) {
    const full = path.resolve(process.cwd(), c);
    if (fs.existsSync(full)) return full;
    const fromConsole = path.resolve(process.cwd(), '../../', c);
    if (fs.existsSync(fromConsole)) return fromConsole;
  }
  return undefined;
}

/**
 * 宝塔自动化同步与 100% 容错降级流水线核心函数 (支持多套件与单套件模式)
 */
export async function runBaotaSync(
  options?: SyncPipelineOptions
): Promise<SyncResult> {
  const isMultiSuite =
    options?.multiSuite !== undefined
      ? options.multiSuite
      : !options?.mdPath;
  const projectRoot = path.resolve(__dirname, '..');
  const outDir = options?.outDir
    ? path.resolve(options.outDir)
    : path.resolve(projectRoot, 'dist/mobile-hub');
  const timeoutMs = options?.timeoutMs || 5000;

  // 1. 加载宝塔 SSH 配置
  const config = loadBaotaConfig(options?.configPath, projectRoot);
  const accessPassword = config?.security?.accessPassword || 'xhs2026';

  // 2. 本地静态数据包编译 (生成 dist/mobile-hub/)
  let totalCards = 0;
  let totalSuites = 1;

  if (isMultiSuite) {
    // 多套件全量聚合打包
    const multiRes = await exportMultiSuiteHubData({
      suites: options?.suites,
      defaultSuiteId: options?.defaultSuiteId,
      outDir,
      accessPassword,
      generateZip: false, // 由流水线接管或降级打包
    });
    totalCards = multiRes.totalCards;
    totalSuites = multiRes.totalSuites;
  } else {
    // 兼容单套件模式
    const mdPath = options?.mdPath ? path.resolve(options.mdPath) : findDefaultMd();
    const cardsDir = options?.cardsDir ? path.resolve(options.cardsDir) : findDefaultCardsDir(mdPath);
    const singleRes = await exportMobileHubData({
      mdPath,
      cardsDir,
      outDir,
      accessPassword,
      generateZip: false,
    });
    totalCards = singleRes.totalCards;
    totalSuites = 1;
  }

  // 降级兜底生成器 (100% 自动无缝降级 AC-8.1)
  const triggerFallback = async (reason: string): Promise<SyncResult> => {
    const zipPath = path.resolve(outDir, '../update.zip');
    await packZipDirectory(outDir, zipPath);

    const remoteDir = config?.server?.remoteDir || '/www/wwwroot/post-hub';
    const manualSteps = [
      '1. 登录您的宝塔 Linux 面板，点击左侧【文件】菜单；',
      `2. 进入目标网站静态目录：${remoteDir}；`,
      '3. 上传 update.zip 并右键解压至当前目录，即可完成极速部署！',
    ];

    if (!options?.silent) {
      printFallbackNotice(reason, zipPath, manualSteps);
    }

    return {
      ok: true,
      mode: 'fallback_zip',
      distDir: outDir,
      zipPath,
      fallbackReason: reason,
      manualSteps,
      totalCards,
      totalSuites,
    };
  };

  if (!config || !config.server?.host) {
    return triggerFallback('未检测到有效宝塔 SSH 配置 (mobile-hub.config.json)');
  }

  // 3. 尝试建立 SSH/SFTP 连接探测与文件上传
  try {
    const port = config.server.port || 22;
    const probeTimeout = options?.timeoutMs || 5000;
    const uploadTimeout = options?.timeoutMs || 60000;
    await testTcpConnection(config.server.host, port, probeTimeout);
    await uploadViaScp(config.server, outDir, uploadTimeout);

    const publicUrl =
      config.publicUrl || `http://${config.server.host}:${config.server.port === 80 ? '' : config.server.port || 80}`;

    if (!options?.silent) {
      printSuccessNotice(
        publicUrl,
        config.server.remoteDir || '/www/wwwroot/post-hub',
        totalSuites,
        totalCards
      );
    }

    return {
      ok: true,
      mode: 'ssh',
      distDir: outDir,
      publicUrl,
      totalCards,
      totalSuites,
    };
  } catch (err: any) {
    return triggerFallback(`SSH 自动连接/上传失败: ${err.message || '网络连接超时'}`);
  }
}
