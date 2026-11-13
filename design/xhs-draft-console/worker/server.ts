/**
 * Worker HTTP（仅 localhost:3722）— 工单 06
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { URL } from 'url';
import {
  WORKER_HOST,
  WORKER_PORT,
  CDP_DEBUG_PORT,
  chromeUserDataDir,
  getScreenshotDir,
} from './config';
import {
  CHROME_SESSION_DOCS,
  checkLogin,
  getLastSession,
  closeCurrentBrowser,
  launchVisibleBrowser,
} from './chrome-session';
import {
  enqueueRun,
  resumeRun,
  retryRun,
  getRunStatus,
  isQueueActive,
  triggerNextNow,
  cancelRun,
  type RunConfig,
  type EnqueueDeps,
} from './queue';
import {
  loadAccounts,
  setActiveAccount,
  createAccount,
  updateAccount,
  type AccountMeta,
} from './accounts';

function json(
  res: http.ServerResponse,
  status: number,
  body: unknown
) {
  const data = JSON.stringify(body, null, 2);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(data);
}

async function readBody(req: http.IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  return Buffer.concat(chunks).toString('utf8');
}

export function createServer(queueDeps: EnqueueDeps = {}) {
  return http.createServer(async (req, res) => {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      });
      res.end();
      return;
    }

    const host = req.headers.host || `${WORKER_HOST}:${WORKER_PORT}`;
    const u = new URL(req.url || '/', `http://${host}`);

    try {
      if (req.method === 'GET' && u.pathname === '/health') {
        return json(res, 200, {
          ok: true,
          antiDetect: true,
          host: WORKER_HOST,
          port: WORKER_PORT,
          cdpPort: CDP_DEBUG_PORT,
          chromeUserDataDir: chromeUserDataDir(),
          profileDir: chromeUserDataDir(),
          cookiePolicy: CHROME_SESSION_DOCS.cookiePolicy,
        });
      }

      if (req.method === 'GET' && u.pathname === '/accounts') {
        const store = loadAccounts();
        return json(res, 200, {
          ok: true,
          activeId: store.activeId,
          accounts: store.accounts,
        });
      }

      if (req.method === 'POST' && u.pathname === '/accounts/switch') {
        if (isQueueActive()) {
          return json(res, 409, {
            ok: false,
            err: '当前有任务正在执行或排队，为防串号已锁定切号',
            code: 'BUSY',
          });
        }
        const raw = await readBody(req);
        let body: { accountId?: string };
        try {
          body = JSON.parse(raw || '{}');
        } catch {
          return json(res, 400, { ok: false, err: 'JSON 无效' });
        }
        if (!body.accountId) {
          return json(res, 400, { ok: false, err: '缺少 accountId' });
        }
        try {
          await closeCurrentBrowser();
          const acc = setActiveAccount(body.accountId);
          return json(res, 200, {
            ok: true,
            activeId: acc.id,
            account: acc,
          });
        } catch (e) {
          const msg = String((e as Error).message || e);
          const status = msg.includes('不存在') ? 404 : 400;
          return json(res, status, {
            ok: false,
            err: msg,
          });
        }
      }

      if (req.method === 'POST' && u.pathname === '/accounts/create') {
        if (isQueueActive()) {
          return json(res, 409, {
            ok: false,
            err: '当前有任务正在执行或排队，为防串号已锁定操作',
            code: 'BUSY',
          });
        }
        const raw = await readBody(req);
        let body: { name?: string };
        try {
          body = JSON.parse(raw || '{}');
        } catch {
          body = {};
        }
        const acc = createAccount(body.name);
        return json(res, 200, { ok: true, account: acc });
      }

      if (req.method === 'PATCH' && u.pathname === '/accounts/update') {
        const raw = await readBody(req);
        let body: { id?: string; patch?: Partial<AccountMeta> };
        try {
          body = JSON.parse(raw || '{}');
        } catch {
          return json(res, 400, { ok: false, err: 'JSON 无效' });
        }
        if (!body.id || !body.patch) {
          return json(res, 400, { ok: false, err: '缺少 id 或 patch' });
        }
        try {
          const acc = updateAccount(body.id, body.patch);
          return json(res, 200, { ok: true, account: acc });
        } catch (e) {
          return json(res, 400, {
            ok: false,
            err: String((e as Error).message || e),
          });
        }
      }

      if (req.method === 'POST' && u.pathname === '/launch-browser') {
        const raw = await readBody(req);
        let body: { accountId?: string };
        try {
          body = JSON.parse(raw || '{}');
        } catch {
          body = {};
        }
        try {
          launchVisibleBrowser(body.accountId);
          return json(res, 200, { ok: true, message: '已唤起独立可见浏览器' });
        } catch (e) {
          return json(res, 500, {
            ok: false,
            err: String((e as Error).message || e),
          });
        }
      }

      if (req.method === 'GET' && u.pathname === '/screenshot') {
        const file = u.searchParams.get('file');
        if (!file || file.includes('..') || path.isAbsolute(file)) {
          return json(res, 400, { ok: false, err: '非法文件名' });
        }
        const filePath = path.join(getScreenshotDir(), path.basename(file));
        if (!fs.existsSync(filePath)) {
          return json(res, 404, { ok: false, err: '截图不存在' });
        }
        res.writeHead(200, {
          'Content-Type': 'image/png',
          'Access-Control-Allow-Origin': '*',
        });
        fs.createReadStream(filePath).pipe(res);
        return;
      }

      if (req.method === 'GET' && u.pathname === '/login') {
        const refresh = u.searchParams.get('refresh') !== '0';
        const snap = refresh
          ? await checkLogin({ navigate: true, captureQr: true })
          : getLastSession() ||
            (await checkLogin({ navigate: true, captureQr: true }));
        return json(res, 200, snap);
      }

      if (req.method === 'POST' && u.pathname === '/run/trigger-next') {
        const result = triggerNextNow();
        return json(res, 200, result);
      }

      if (req.method === 'POST' && u.pathname === '/run/resume') {
        const raw = await readBody(req);
        let runId: string | undefined;
        try {
          const body = JSON.parse(raw || '{}');
          runId = body.runId;
        } catch {}
        try {
          const state = await resumeRun(runId, queueDeps);
          return json(res, 200, { ok: true, run: state });
        } catch (e) {
          const err = e as Error & { code?: string; run?: unknown };
          return json(res, 400, {
            ok: false,
            err: err.message,
            code: err.code,
            run: err.run,
          });
        }
      }

      if (req.method === 'POST' && u.pathname === '/run/retry') {
        const raw = await readBody(req);
        let body: { runId?: string; cardId?: string; mode?: 'resume_remaining' | 'card_only' };
        try {
          body = JSON.parse(raw || '{}');
        } catch {
          body = {};
        }
        try {
          const state = await retryRun(body, queueDeps);
          return json(res, 200, { ok: true, run: state });
        } catch (e) {
          const err = e as Error & { code?: string; run?: unknown };
          const status =
            err.code === 'BUSY'
              ? 409
              : err.code === 'NOT_FOUND'
              ? 404
              : 400;
          return json(res, status, {
            ok: false,
            err: err.message,
            code: err.code,
            run: err.run,
          });
        }
      }

      if (req.method === 'POST' && u.pathname === '/run/cancel') {
        const raw = await readBody(req);
        let runId: string | undefined;
        try {
          const body = JSON.parse(raw || '{}');
          runId = body.runId;
        } catch {}
        const result = cancelRun(runId);
        return json(res, 200, result);
      }

      if (req.method === 'GET' && u.pathname === '/run') {
        const runId = u.searchParams.get('runId') || undefined;
        const st = getRunStatus(runId || undefined);
        if (!st) return json(res, 404, { ok: false, err: '无 run' });
        return json(res, 200, st);
      }

      if (req.method === 'POST' && u.pathname === '/run') {
        const raw = await readBody(req);
        let body: RunConfig;
        try {
          body = JSON.parse(raw || '{}') as RunConfig;
        } catch {
          return json(res, 400, { ok: false, err: 'JSON 无效' });
        }
        try {
          const state = await enqueueRun(body, queueDeps);
          return json(res, 200, { ok: true, run: state });
        } catch (e) {
          const err = e as Error & { code?: string; run?: unknown };
          const status =
            err.code === 'NEED_LOGIN' || err.code === 'BAD_CONFIG'
              ? 400
              : err.code === 'BUSY'
                ? 409
                : 500;
          return json(res, status, {
            ok: false,
            err: err.message,
            code: err.code,
            run: err.run,
          });
        }
      }

      return json(res, 404, { ok: false, err: 'not found' });
    } catch (e) {
      return json(res, 500, {
        ok: false,
        err: String((e as Error).message || e),
      });
    }
  });
}

export function startWorkerServer() {
  const server = createServer();
  server.listen(WORKER_PORT, WORKER_HOST, () => {
    console.log(
      JSON.stringify({
        ok: true,
        msg: `xhs-draft worker listening http://${WORKER_HOST}:${WORKER_PORT}`,
        chromeUserDataDir: chromeUserDataDir(),
      })
    );
    try {
      const orphan = getRunStatus();
      if (orphan && (orphan.status === 'running' || orphan.status === 'interrupted')) {
        console.log(
          JSON.stringify({
            ok: true,
            msg: `检测到任务 [${orphan.runId.slice(0, 8)}] 状态: ${orphan.status}，已完成 ${orphan.completed}/${orphan.total}，支持断点续跑`,
          })
        );
      }
    } catch {}
  });
  return server;
}

if (require.main === module) {
  startWorkerServer();
}
