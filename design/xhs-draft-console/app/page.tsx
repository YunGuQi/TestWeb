'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  WorkerUnreachableError,
  enqueueRun,
  getLoginStatus,
  getRunStatus,
  triggerNextRun,
  retryRun,
  resumeRun,
  cancelRun,
  healthCheck,
  getAccounts,
  switchAccount,
  createAccount,
  updateAccountMeta,
  launchBrowser,
  openNativePicker,
  fetchScannedPresets,
  type AccountItem,
  type CardOverridePayload,
} from '@/lib/api/worker-client';
import { browseButtonLabel } from '@/lib/browse-label';
import { PRODUCT_PRESETS, type ProductPresetItem } from '@/lib/preset-suites';
import { MobilePreview } from '@/components/MobilePreview';
import { resolveResultLabel, type ResultLabel } from '@/lib/result-resolver';
import {
  formatCountdown,
  formatCountdownChinese,
  useCountdown,
} from '@/lib/countdown';

type NavId = 'account' | 'materials' | 'draft' | 'publish' | 'progress';

type CardRow = {
  index: number;
  title: string;
  coverLines: string[];
  body: string;
  tags: string[];
  runnable: boolean;
  skipReason?: string;
  errors: string[];
  meta: {
    cardId?: string;
    slice?: string;
    goods?: string;
    statusRaw?: string;
    fields?: Record<string, string>;
    resolvedResult?: ResultLabel;
  } | null;
  resultLabel?: ResultLabel;
};

type PublishDraft = {
  cardId: string;
  coverLines: string[];
  title: string;
  body: string;
  topics: string[];
  slice: string;
  goods: string;
};

type RunCard = {
  cardId?: string;
  title?: string;
  status?: string;
  err?: string;
  screenshotPath?: string | null;
};

type RunState = {
  runId?: string;
  status?: string;
  completed?: number;
  total?: number;
  currentCardId?: string;
  nextRunAt?: string;
  circuitReason?: string;
  phase?: 'running' | 'cooldown' | 'interval';
  cooldownUntil?: string;
  cards?: RunCard[];
};

const NAV: { id: NavId; label: string; ico: string }[] = [
  { id: 'account', label: '账号管理', ico: '◎' },
  { id: 'materials', label: '素材管理', ico: '▤' },
  { id: 'publish', label: '发布中心', ico: '✎' },
  { id: 'progress', label: '任务进度', ico: '◉' },
  { id: 'draft', label: '设置中心', ico: '⚙' },
];

function statusLabel(st: string): string {
  switch (st) {
    case 'pending':
      return '排队中';
    case 'running':
      return '进行中';
    case 'ok':
      return '成功';
    case 'fail':
      return '失败';
    case 'skipped':
      return '已跳过';
    default:
      return st;
  }
}

function runStatusLabel(st?: string): string {
  switch (st) {
    case 'queued':
      return '排队中';
    case 'scheduled':
      return '定时等待';
    case 'running':
      return '进行中';
    case 'interrupted':
      return '已中断（可恢复）';
    case 'completed':
      return '已完成';
    case 'circuit_open':
      return '已熔断（停跑）';
    case 'rejected':
      return '已拒绝';
    case 'cancelled':
      return '已取消';
    default:
      return st || '—';
  }
}

/** datetime-local → ISO（本地时区） */
function localInputToIso(local: string): string | undefined {
  if (!local || !local.trim()) return undefined;
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

const DEFAULT_FIXTURE_MD =
  'E:/AI/Antigravity/小红书/.scratch/xhs-draft-autofill/fixtures/dnvzhu-compliant-3cards.md';
const DEFAULT_FIXTURE_CARDS =
  'E:/AI/Antigravity/小红书/.scratch/xhs-draft-autofill/fixtures/cards';
const BUSINESS_MD_1028 =
  'E:/AI/Antigravity/小红书/design/product-docs/大女主觉醒测试/docs/2026-10-28_发帖文案.md';
const BUSINESS_MD_1010 =
  'E:/AI/Antigravity/小红书/design/product-docs/大女主觉醒测试/docs/2026-10-10_发帖文案.md';
const BUSINESS_MD = BUSINESS_MD_1028;
const SESSION_KEY = 'xhs_console_session_v2';
const MAX_COVER_LINES = 5;

type SessionSnap = {
  nav?: NavId;
  mdPath?: string;
  cardsDir?: string;
  n?: number;
  mode?: 'draft' | 'ready';
  intervalMin?: number;
  intervalMax?: number;
  selectedIds?: string[];
  activeCardId?: string | null;
  batch?: PublishDraft[];
  batchConfirmed?: boolean;
  scheduleLocal?: string;
  platformScheduleLocal?: string;
  runId?: string | null;
};

export default function HomePage() {
  const [hydrated, setHydrated] = useState(false);
  const pendingSession = useRef<SessionSnap | null>(null);
  const [nav, setNav] = useState<NavId>('materials');
  const [mdPath, setMdPath] = useState(DEFAULT_FIXTURE_MD);
  const [cards, setCards] = useState<CardRow[]>([]);
  const [parseErr, setParseErr] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [lastParsedMsg, setLastParsedMsg] = useState<string | null>(null);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [syncingMobile, setSyncingMobile] = useState(false);
  const [syncMobileMsg, setSyncMobileMsg] = useState<{
    ok: boolean;
    text: string;
    url?: string;
  } | null>(null);
  const [n, setN] = useState(3);
  const [mode, setMode] = useState<'draft' | 'ready'>('draft');
  const [intervalMin, setIntervalMin] = useState(15);
  const [intervalMax, setIntervalMax] = useState(30);
  const [login, setLogin] = useState<{
    status?: string;
    message?: string;
    qrScreenshotPath?: string | null;
    qrDataUrl?: string | null;
    cdpPort?: number;
    account?: AccountItem | null;
  } | null>(null);
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<string>('acc_01');
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [presetsList, setPresetsList] = useState<ProductPresetItem[]>(PRODUCT_PRESETS);
  /** 正在唤起的原生选择器目标；null=空闲。勿用单一 boolean，否则所有浏览按钮都会同时变成「选择中…」 */
  const [pickingTarget, setPickingTarget] = useState<'md' | 'cards' | null>(
    null
  );
  const [recentPaths, setRecentPaths] = useState<{
    mdPaths: string[];
    cardsPaths: string[];
  }>({ mdPaths: [], cardsPaths: [] });
  const [workerOk, setWorkerOk] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const [run, setRun] = useState<RunState | null>(null);
  const [cardsDir, setCardsDir] = useState(DEFAULT_FIXTURE_CARDS);
  const [resultMap, setResultMap] = useState<Record<string, string>>({});
  const [matSearch, setMatSearch] = useState('');

  const [triggeringNext, setTriggeringNext] = useState(false);
  const [retryingCardId, setRetryingCardId] = useState<string | null>(null);
  const [resuming, setResuming] = useState(false);
  const [pollKey, setPollKey] = useState(0);

  const triggeringNextRef = useRef(triggeringNext);
  triggeringNextRef.current = triggeringNext;

  const baselineCompletedRef = useRef<number | null>(null);
  const baselineNextRunAtRef = useRef<string | undefined>(undefined);

  const handleCountdownFinish = useCallback(async () => {
    const targetRunId = run?.runId || runId;
    if (!targetRunId) return;
    try {
      setPollKey((k) => k + 1);
      const st = (await getRunStatus(targetRunId)) as RunState;
      setRun(st);
    } catch {
      /* ignore */
    }
  }, [run?.runId, runId]);

  const countdown = useCountdown(
    (run?.status === 'running' || run?.status === 'interrupted') &&
      run.nextRunAt
      ? run.nextRunAt
      : undefined,
    handleCountdownFinish
  );

  // 发布中心本批态
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batch, setBatch] = useState<PublishDraft[]>([]);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [batchConfirmed, setBatchConfirmed] = useState(false);
  const [scheduleLocal, setScheduleLocal] = useState('');
  const [platformScheduleLocal, setPlatformScheduleLocal] = useState('');
  const [topicDraft, setTopicDraft] = useState('');

  const runnableCards = useMemo(
    () => cards.filter((c) => c.runnable && c.meta?.cardId),
    [cards]
  );
  const runnableCount = runnableCards.length;

  const cardsWithResult = useMemo(() => {
    return cards.map((c) => {
      const res =
        c.resultLabel ||
        c.meta?.resolvedResult ||
        resolveResultLabel(
          { id: c.meta?.cardId, meta: c.meta, title: c.title },
          resultMap
        );
      return {
        ...c,
        resultLabel: res,
      };
    });
  }, [cards, resultMap]);

  const filteredCards = useMemo(() => {
    if (!matSearch.trim()) return cardsWithResult;
    const q = matSearch.trim().toLowerCase();
    return cardsWithResult.filter((c) => {
      const id = (c.meta?.cardId || '').toLowerCase();
      const title = (c.title || '').toLowerCase();
      const code = (c.resultLabel?.code || '').toLowerCase();
      const name = (c.resultLabel?.name || '').toLowerCase();
      const full = (c.resultLabel?.full || '').toLowerCase();
      return (
        id.includes(q) ||
        title.includes(q) ||
        code.includes(q) ||
        name.includes(q) ||
        full.includes(q)
      );
    });
  }, [cardsWithResult, matSearch]);

  const activeDraft = useMemo(
    () => batch.find((b) => b.cardId === activeCardId) || null,
    [batch, activeCardId]
  );

  const activeDraftResultLabel = useMemo(() => {
    if (!activeDraft) return null;
    return resolveResultLabel(
      { id: activeDraft.cardId, title: activeDraft.title },
      resultMap,
      activeDraft.goods
    );
  }, [activeDraft, resultMap]);

  useEffect(() => {
    if (!cardsDir) {
      setResultMap({});
      return;
    }
    let active = true;
    fetch(`/api/results?cardsDir=${encodeURIComponent(cardsDir)}&_t=${Date.now()}`)
      .then((r) => r.json())
      .then((d) => {
        if (active && d.ok && d.resultMap) {
          setResultMap((prev) => ({ ...prev, ...d.resultMap }));
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [cardsDir]);

  const batchRunnable = useMemo(
    () =>
      batch.length > 0 &&
      batch.every((b) => b.slice && b.goods && b.cardId),
    [batch]
  );

  // 手机预览与切片相关状态
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);
  const [sliceSeed, setSliceSeed] = useState<number>(() => Date.now());
  const [formSliceUrl, setFormSliceUrl] = useState<string | null>(null);
  const [formSliceLoading, setFormSliceLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!activeDraft?.cardId || !cardsDir) {
      setFormSliceUrl(null);
      return;
    }
    let cancelled = false;
    setFormSliceLoading(true);
    const params = new URLSearchParams({
      cardsDir,
      cardId: activeDraft.cardId,
      imageSlice: activeDraft.slice || '',
      seed: String(sliceSeed),
    });
    fetch(`/api/slice-preview?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.ok) {
          setFormSliceUrl(data.dataUrl);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setFormSliceLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeDraft?.cardId, activeDraft?.slice, cardsDir, sliceSeed]);

  useEffect(() => {
    if (!lightboxImageUrl) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxImageUrl(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightboxImageUrl]);

  const isTaskRunningOrBusy = Boolean(
    run &&
      (run.status === 'running' ||
        run.status === 'queued' ||
        run.status === 'scheduled')
  );

  const activeAccount = useMemo(() => {
    return (
      accounts.find((a) => a.id === activeAccountId) ||
      login?.account || {
        id: activeAccountId,
        name: '安安 (老号)',
        nickname: '安安',
        profileDir: `profiles/${activeAccountId}`,
        createdAt: '',
      }
    );
  }, [accounts, activeAccountId, login?.account]);

  const refreshAccounts = useCallback(async () => {
    try {
      const res = await getAccounts();
      if (res && res.ok) {
        setAccounts(res.accounts || []);
        if (res.activeId) setActiveAccountId(res.activeId);
      }
    } catch {}
  }, []);

  const refreshWorker = useCallback(async (deep = false) => {
    try {
      await healthCheck();
      setWorkerOk(true);
      const snap = await getLoginStatus(deep);
      setLogin(snap);
      if (snap?.account?.id) {
        setActiveAccountId(snap.account.id);
      }
      setErr(null);
    } catch (e) {
      setWorkerOk(false);
      setLogin(null);
      if (e instanceof WorkerUnreachableError) setErr(e.message);
      else setErr(String((e as Error).message || e));
    }
  }, []);

  const saveRecentPath = useCallback((type: 'md' | 'cards', newP: string) => {
    if (!newP || !newP.trim()) return;
    setRecentPaths((prev) => {
      const list = type === 'md' ? [...prev.mdPaths] : [...prev.cardsPaths];
      const filtered = [newP, ...list.filter((p) => p !== newP)].slice(0, 8);
      const nextStore = {
        ...prev,
        [type === 'md' ? 'mdPaths' : 'cardsPaths']: filtered,
      };
      try {
        localStorage.setItem('xhs_console_recent_paths', JSON.stringify(nextStore));
      } catch {}
      return nextStore;
    });
  }, []);

  const clearRecentPaths = useCallback((type: 'md' | 'cards') => {
    setRecentPaths((prev) => {
      const nextStore = {
        ...prev,
        [type === 'md' ? 'mdPaths' : 'cardsPaths']: [],
      };
      try {
        localStorage.setItem('xhs_console_recent_paths', JSON.stringify(nextStore));
      } catch {}
      return nextStore;
    });
  }, []);

  const handlePickPath = async (mode: 'file' | 'directory', defaultP: string) => {
    const target: 'md' | 'cards' = mode === 'file' ? 'md' : 'cards';

    try {
      setPickingTarget(target);
      const res = await openNativePicker(mode, defaultP);
      if (res.error && !res.cancelled) {
        alert(res.error);
      }
      if (!res.cancelled && res.path) {
        if (mode === 'file') {
          setMdPath(res.path);
          saveRecentPath('md', res.path);
          void parseMd(res.path);
        } else {
          setCardsDir(res.path);
          saveRecentPath('cards', res.path);
        }
      }
    } catch (e) {
      console.warn('路径选择失败:', e);
    } finally {
      setPickingTarget(null);
    }
  };

  const handleSwitchAccount = async (targetId: string) => {
    if (isTaskRunningOrBusy) {
      alert('当前有发布任务正在排队或执行中，为防串号已锁定切号，请等待任务完成或先取消任务。');
      return;
    }
    if (targetId === activeAccountId) {
      setShowAccountDropdown(false);
      return;
    }
    try {
      setBusy(true);
      await switchAccount(targetId);
      setActiveAccountId(targetId);
      setShowAccountDropdown(false);
      await refreshWorker(true);
      await refreshAccounts();
    } catch (e) {
      alert(`切换账号失败: ${String((e as Error).message || e)}`);
    } finally {
      setBusy(false);
    }
  };

  const handleCreateAccount = async () => {
    if (isTaskRunningOrBusy) {
      alert('当前有任务正在执行或排队，为防串号已锁定操作。');
      return;
    }
    const name = window.prompt('请输入新账号别名（例如：微光矩阵02）：');
    if (!name?.trim()) return;
    try {
      setBusy(true);
      const res = await createAccount(name.trim());
      if (res.ok && res.account) {
        await refreshAccounts();
        await handleSwitchAccount(res.account.id);
      }
    } catch (e) {
      alert(`创建账号失败: ${String((e as Error).message || e)}`);
    } finally {
      setBusy(false);
    }
  };

  const handleLaunchBrowser = async (accId?: string) => {
    try {
      await launchBrowser(accId || activeAccountId);
    } catch (e) {
      alert(`唤起浏览器失败: ${String((e as Error).message || e)}`);
    }
  };

  const handleRenameAccount = async (accId: string, oldName: string) => {
    const nextName = window.prompt('请输入新的账号别名：', oldName);
    if (!nextName || nextName.trim() === oldName) return;
    try {
      await updateAccountMeta(accId, { name: nextName.trim() });
      await refreshAccounts();
    } catch (e) {
      alert(`更新别名失败: ${String((e as Error).message || e)}`);
    }
  };

  const handleSyncToMobile = async () => {
    setSyncingMobile(true);
    setSyncMobileMsg(null);
    try {
      const res = await fetch('/api/sync-baota', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mdPath,
          cardsDir,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || '宝塔同步流水线执行失败');
      }
      const totalSuites = data.totalSuites || 1;
      const totalCards = data.totalCards || 0;
      const successText = `已成功同步 ${totalSuites} 套件共 ${totalCards} 张卡片至手机端！`;
      const fallbackText = data.fallbackReason ? ` (自动降级: update.zip 已生成)` : '';
      setSyncMobileMsg({
        ok: true,
        text: `${successText}${fallbackText}`,
        url: data.publicUrl || 'http://mutong-xhs.top/post-hub/',
      });
    } catch (e: any) {
      setSyncMobileMsg({
        ok: false,
        text: e.message || '网络连接或同步异常',
      });
    } finally {
      setSyncingMobile(false);
    }
  };

  const parseMd = useCallback(
    async (
      pathOverride?: string,
      opts?: { keepSelection?: boolean; syncBatch?: boolean }
    ) => {
      setParseErr(null);
      setParsing(true);
      try {
        const targetPath = pathOverride || mdPath;
        const res = await fetch(`/api/parse?_t=${Date.now()}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          body: JSON.stringify({ mdPath: targetPath, cardsDir }),
        });
        const data = await res.json();
        if (!data.ok) {
          setParseErr(data.err || '解析失败');
          setCards([]);
          setLastParsedMsg(null);
          return;
        }
        if (data.resultMap) {
          setResultMap((prev) => ({ ...prev, ...data.resultMap }));
        }
        const activeResultMap = { ...resultMap, ...(data.resultMap || {}) };
        const parsedRows: CardRow[] = (data.cards || []).map(
          (c: CardRow & {
            coverLines?: string[];
            body?: string;
            tags?: string[];
          }) => ({
            index: c.index,
            title: c.title,
            coverLines: c.coverLines || [],
            body: c.body || '',
            tags: c.tags || [],
            runnable: c.runnable,
            skipReason: c.skipReason,
            errors: c.errors || [],
            meta: c.meta,
            resultLabel:
              c.resultLabel ||
              c.meta?.resolvedResult ||
              resolveResultLabel(
                { id: c.meta?.cardId, meta: c.meta, title: c.title },
                activeResultMap
              ),
          })
        );
        setCards(parsedRows);

        const rCount = parsedRows.filter(
          (c) => c.runnable && c.meta?.cardId
        ).length;
        const timeStr = new Date().toLocaleTimeString();
        setLastParsedMsg(
          `已重新读取 (${timeStr}) · 共 ${parsedRows.length} 张 (${rCount} 张可入队)`
        );

        if (opts?.syncBatch || opts?.keepSelection) {
          setBatch((prevBatch) => {
            if (!prevBatch.length) return prevBatch;
            return prevBatch.map((b) => {
              const updated = parsedRows.find(
                (c) => c.meta?.cardId === b.cardId
              );
              if (!updated) return b;
              return {
                ...b,
                coverLines: [...(updated.coverLines || [])].slice(
                  0,
                  MAX_COVER_LINES
                ),
                title: updated.title || b.title,
                body: updated.body || b.body,
                topics: [...(updated.tags || [])],
                slice: updated.meta?.slice || b.slice,
                goods: updated.meta?.goods || b.goods,
              };
            });
          });
        } else {
          setSelectedIds(new Set());
          setBatch([]);
          setBatchConfirmed(false);
          setActiveCardId(null);
        }
      } catch (e) {
        setParseErr(String((e as Error).message || e));
        setLastParsedMsg(null);
      } finally {
        setParsing(false);
      }
    },
    [mdPath]
  );

  // 启动：恢复路径记忆 + 会话勾选/进度指针
  useEffect(() => {
    try {
      const raw = localStorage.getItem('xhs_console_recent_paths');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          setRecentPaths({
            mdPaths: Array.isArray(parsed.mdPaths)
              ? parsed.mdPaths.slice(0, 8)
              : [],
            cardsPaths: Array.isArray(parsed.cardsPaths)
              ? parsed.cardsPaths.slice(0, 8)
              : [],
          });
        }
      }
    } catch {}
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const s = JSON.parse(raw) as SessionSnap;
        pendingSession.current = s;
        if (s.mdPath) setMdPath(s.mdPath);
        if (s.cardsDir) setCardsDir(s.cardsDir);
        if (typeof s.n === 'number') setN(s.n);
        if (s.mode === 'draft' || s.mode === 'ready') setMode(s.mode);
        if (typeof s.intervalMin === 'number') setIntervalMin(s.intervalMin);
        if (typeof s.intervalMax === 'number') setIntervalMax(s.intervalMax);
        if (typeof s.scheduleLocal === 'string')
          setScheduleLocal(s.scheduleLocal);
        if (typeof s.platformScheduleLocal === 'string')
          setPlatformScheduleLocal(s.platformScheduleLocal);
        if (s.nav) setNav(s.nav);
        if (s.runId) setRunId(s.runId);
      }
    } catch {}
    setHydrated(true);
    void refreshAccounts();
    void (async () => {
      const dynamicPresets = await fetchScannedPresets();
      if (dynamicPresets && dynamicPresets.length > 0) {
        setPresetsList(dynamicPresets);
      }
    })();
  }, [refreshAccounts]);

  useEffect(() => {
    if (!hydrated) return;
    void refreshWorker(false);
    void parseMd(undefined, { keepSelection: true });
  }, [hydrated, refreshWorker, parseMd]);

  // 解析完卡片后，把上次勾选 / 本批草稿套回去
  useEffect(() => {
    const s = pendingSession.current;
    if (!s || cards.length === 0) return;
    const allowed = new Set(
      cards.map((c) => c.meta?.cardId).filter(Boolean) as string[]
    );
    if (Array.isArray(s.selectedIds)) {
      setSelectedIds(
        new Set(s.selectedIds.filter((id) => allowed.has(id)))
      );
    }
    if (Array.isArray(s.batch) && s.batch.length) {
      // 封面行以最新 MD 解析为准，避免旧会话把 4 行砍成 3 行后「记忆」回来
      const kept = s.batch
        .filter((b) => allowed.has(b.cardId))
        .map((b) => {
          const src = cards.find((c) => c.meta?.cardId === b.cardId);
          const fromMd = (src?.coverLines || [])
            .map((l) => String(l || '').trim())
            .filter(Boolean)
            .slice(0, MAX_COVER_LINES);
          return {
            ...b,
            coverLines:
              fromMd.length >= (b.coverLines?.length || 0) && fromMd.length > 0
                ? fromMd
                : (b.coverLines || [])
                    .map((l) => String(l || '').trim())
                    .filter(Boolean)
                    .slice(0, MAX_COVER_LINES),
          };
        });
      setBatch(kept);
      if (s.batchConfirmed) setBatchConfirmed(true);
      if (s.activeCardId && kept.some((b) => b.cardId === s.activeCardId)) {
        setActiveCardId(s.activeCardId);
      } else if (kept[0]) {
        setActiveCardId(kept[0].cardId);
      }
    }
    pendingSession.current = null;
  }, [cards]);

  // 落盘会话：刷新后还能回到勾选与进度
  useEffect(() => {
    if (!hydrated) return;
    const snap: SessionSnap = {
      nav,
      mdPath,
      cardsDir,
      n,
      mode,
      intervalMin,
      intervalMax,
      selectedIds: [...selectedIds],
      activeCardId,
      batch,
      batchConfirmed,
      scheduleLocal,
      platformScheduleLocal,
      runId,
    };
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(snap));
    } catch {}
  }, [
    hydrated,
    nav,
    mdPath,
    cardsDir,
    n,
    mode,
    intervalMin,
    intervalMax,
    selectedIds,
    activeCardId,
    batch,
    batchConfirmed,
    scheduleLocal,
    platformScheduleLocal,
    runId,
  ]);

  // 恢复最近一次任务进度（worker 已落盘 latest-run.json）
  useEffect(() => {
    if (!hydrated) return;
    void (async () => {
      try {
        const st = (await getRunStatus(runId || undefined)) as RunState;
        if (st?.runId) {
          setRun(st);
          setRunId(st.runId);
        }
      } catch {
        /* worker 离线时忽略 */
      }
    })();
    // 仅启动时拉一次；后续靠 runId 轮询
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  // 活跃任务轮询与保活：只要任务处于 running/scheduled/triggeringNext，或者未进入终态，就持续保活轮询
  useEffect(() => {
    const targetRunId = runId || run?.runId;
    if (!targetRunId) return;

    const isTerminal = (status?: string) =>
      Boolean(
        status &&
          ['completed', 'circuit_open', 'rejected', 'cancelled'].includes(
            status
          )
      );

    // 若已处于终态且非 triggeringNext、非 retryingCardId、非 resuming，停止轮询以节省开销
    if (
      isTerminal(run?.status) &&
      !triggeringNext &&
      !retryingCardId &&
      !resuming
    ) {
      return;
    }

    let isMounted = true;
    let pollRunning = false;

    const poll = async () => {
      if (pollRunning || !isMounted) return;
      pollRunning = true;
      try {
        const currentTargetId = runId || run?.runId;
        if (!currentTargetId) return;
        const st = (await getRunStatus(currentTargetId)) as RunState;
        if (!isMounted || !st) return;

        setRun(st);
        if (st.runId && !runId) {
          setRunId(st.runId);
        }

        // 检查是否解除 triggeringNext 加载态
        if (triggeringNextRef.current) {
          const completedIncreased =
            typeof st.completed === 'number' &&
            baselineCompletedRef.current !== null &&
            st.completed > baselineCompletedRef.current;

          const nextRunAtUpdated =
            typeof st.nextRunAt === 'string' &&
            st.nextRunAt !== baselineNextRunAtRef.current &&
            new Date(st.nextRunAt).getTime() > Date.now();

          const terminalReached = isTerminal(st.status);
          const interruptedNotice =
            st.status === 'interrupted' && Boolean(st.circuitReason);

          if (
            completedIncreased ||
            nextRunAtUpdated ||
            terminalReached ||
            interruptedNotice
          ) {
            setTriggeringNext(false);
          }
        }
      } catch {
        /* 即使出现网络抖动或临时中断，不销毁轮询，待下周期自动重试 */
      } finally {
        pollRunning = false;
      }
    };

    // 立即执行一次刷新
    void poll();

    // 活跃轮询 1.5 秒一次
    const t = setInterval(() => {
      void poll();
    }, 1500);

    return () => {
      isMounted = false;
      clearInterval(t);
    };
  }, [runId, pollKey, run?.runId, run?.status, triggeringNext, retryingCardId, resuming]);

  // 有平台定时时 UI 升格 ready
  useEffect(() => {
    if (platformScheduleLocal) setMode('ready');
  }, [platformScheduleLocal]);

  const canStart =
    workerOk === true &&
    login?.status === 'logged_in' &&
    runnableCount > 0 &&
    !busy;

  const canPublishStart =
    workerOk === true &&
    (scheduleLocal || login?.status === 'logged_in') &&
    batchRunnable &&
    !busy;

  function buildBatchFromCards(source: CardRow[]): PublishDraft[] {
    return source
      .filter((c) => c.runnable && c.meta?.cardId && c.meta.slice && c.meta.goods)
      .map((c) => ({
        cardId: c.meta!.cardId!,
        coverLines: [...(c.coverLines || [])]
          .map((l) => String(l || '').trim())
          .filter(Boolean)
          .slice(0, MAX_COVER_LINES),
        title: c.title || '',
        body: c.body || '',
        topics: [...(c.tags || [])],
        slice: c.meta!.slice!,
        goods: c.meta!.goods!,
      }));
  }

  function loadBatch(source: CardRow[]) {
    const next = buildBatchFromCards(source);
    setBatch(next);
    setActiveCardId(next[0]?.cardId || null);
    setBatchConfirmed(false);
    setSelectedIds(new Set(next.map((b) => b.cardId)));
  }

  function takeFirstN() {
    loadBatch(runnableCards.slice(0, Math.min(n, 10)));
    setNav('publish');
  }

  function takeSelected() {
    const picked = runnableCards.filter(
      (c) => c.meta?.cardId && selectedIds.has(c.meta.cardId)
    );
    loadBatch(picked);
    setNav('publish');
  }

  function updateActive(patch: Partial<PublishDraft>) {
    if (!activeCardId) return;
    setBatch((prev) =>
      prev.map((b) => (b.cardId === activeCardId ? { ...b, ...patch } : b))
    );
    setBatchConfirmed(false);
  }

  function addTopic() {
    const t = topicDraft.replace(/^#/, '').trim();
    if (!t || !activeDraft) return;
    if (activeDraft.topics.includes(t)) {
      setTopicDraft('');
      return;
    }
    updateActive({ topics: [...activeDraft.topics, t] });
    setTopicDraft('');
  }

  function removeTopic(t: string) {
    if (!activeDraft) return;
    updateActive({ topics: activeDraft.topics.filter((x) => x !== t) });
  }

  async function onStart(fromPublish: boolean) {
    setBusy(true);
    setErr(null);
    try {
      const intervalMs: [number, number] = [
        Math.max(0, intervalMin) * 60 * 1000,
        Math.max(intervalMin, intervalMax) * 60 * 1000,
      ];
      let cardOverrides: CardOverridePayload[] | undefined;
      let cardIds: string[] | undefined;
      let scheduleAt: string | undefined;
      let platformScheduleAt: string | undefined;
      let runMode = mode;
      let runN = n;

      if (fromPublish) {
        if (!batchRunnable) {
          setErr('本批存在缺切片/商品的卡，不可开跑');
          return;
        }
        setBatchConfirmed(true);
        cardIds = batch.map((b) => b.cardId);
        cardOverrides = batch.map((b) => ({
          cardId: b.cardId,
          coverLines: b.coverLines,
          title: b.title,
          body: b.body,
          topics: b.topics,
        }));
        scheduleAt = localInputToIso(scheduleLocal);
        platformScheduleAt = localInputToIso(platformScheduleLocal);
        if (platformScheduleAt) runMode = 'ready';
        runN = batch.length;
      }

      const data = await enqueueRun({
        mdPath,
        n: runN,
        mode: runMode,
        intervalMs,
        cardsDir: cardsDir || undefined,
        scheduleAt,
        platformScheduleAt,
        cardIds,
        cardOverrides,
      });
      setRun(data.run as RunState);
      setRunId(data.run?.runId || null);
      setPollKey((k) => k + 1);
      setNav('progress');
    } catch (e) {
      const msg =
        e instanceof WorkerUnreachableError
          ? e.message
          : String((e as Error).message || e);
      setErr(msg);
    } finally {
      setBusy(false);
    }
  }

  async function handleTriggerNext() {
    if (busy || triggeringNext) return;
    setTriggeringNext(true);
    baselineCompletedRef.current = run?.completed ?? 0;
    baselineNextRunAtRef.current = run?.nextRunAt;
    setPollKey((k) => k + 1);

    try {
      setBusy(true);
      const res = await triggerNextRun();
      const targetRunId = runId || run?.runId;
      if (targetRunId) {
        const st = (await getRunStatus(targetRunId)) as RunState;
        setRun(st);
        if (st.runId && !runId) setRunId(st.runId);
      }
      if (!res.ok) {
        alert(res.msg || '触发失败');
        setTriggeringNext(false);
      }
    } catch (e) {
      alert(`触发失败: ${String((e as Error).message || e)}`);
      setTriggeringNext(false);
    } finally {
      setBusy(false);
      setPollKey((k) => k + 1);
    }
  }

  async function handleCancelRun() {
    if (!confirm('确定要取消剩余待发布的任务吗？')) return;
    try {
      setBusy(true);
      const res = await cancelRun(runId || undefined);
      if (runId) {
        const st = (await getRunStatus(runId)) as RunState;
        setRun(st);
      }
      setTriggeringNext(false);
      alert(res.msg || '已取消');
    } catch (e) {
      alert(`取消失败: ${String((e as Error).message || e)}`);
    } finally {
      setBusy(false);
      setPollKey((k) => k + 1);
    }
  }

  async function handleRetryCard(
    cardId?: string,
    mode: 'card_only' | 'resume_remaining' = 'card_only'
  ) {
    if (!run || busy || retryingCardId) return;
    setRetryingCardId(cardId || '__all__');
    setPollKey((k) => k + 1);
    try {
      setBusy(true);
      const res = await retryRun({
        runId: run.runId,
        cardId: cardId || undefined,
        mode,
      });
      if (!res.ok) {
        alert(`重试失败: ${res.err || '未知错误'}`);
      } else {
        const targetRunId = runId || run?.runId;
        if (targetRunId) {
          const st = (await getRunStatus(targetRunId)) as RunState;
          setRun(st);
        }
      }
    } catch (e) {
      alert(`重试失败: ${String((e as Error).message || e)}`);
    } finally {
      setBusy(false);
      setRetryingCardId(null);
      setPollKey((k) => k + 1);
    }
  }

  async function handleResumeAll() {
    if (!run || busy || resuming || retryingCardId) return;
    const firstSkipped = (run.cards || []).find((c) => c.status === 'skipped');
    if (!firstSkipped) {
      alert('当前任务没有后续跳过的卡片可继续执行');
      return;
    }
    setResuming(true);
    setPollKey((k) => k + 1);
    try {
      setBusy(true);
      const res = await retryRun({
        runId: run.runId,
        cardId: firstSkipped.cardId,
        mode: 'resume_remaining',
      });
      if (!res.ok) {
        alert(`恢复失败: ${res.err || '未知错误'}`);
      } else {
        const targetRunId = runId || run?.runId;
        if (targetRunId) {
          const st = (await getRunStatus(targetRunId)) as RunState;
          setRun(st);
        }
      }
    } catch (e) {
      alert(`恢复失败: ${String((e as Error).message || e)}`);
    } finally {
      setBusy(false);
      setResuming(false);
      setPollKey((k) => k + 1);
    }
  }

  const loginLabel =
    login?.status === 'logged_in'
      ? '已登录'
      : login?.status === 'need_qr'
        ? '待扫码'
        : login?.status || '未知';

  const pageTitle = NAV.find((x) => x.id === nav)?.label || '平台发布';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">播</div>
          <div className="brand-text">
            <strong>平台发布控制台</strong>
            <span>本机 · 自动化 · Safe Stop</span>
          </div>
        </div>

        <nav className="nav" aria-label="主导航">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-btn${nav === item.id ? ' active' : ''}`}
              onClick={() => setNav(item.id)}
            >
              <span className="nav-ico" aria-hidden>
                {item.ico}
              </span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-foot">
          <strong>风控口径</strong>
          <br />
          限频 + 失败熔断。默认「暂存离开」，不自动点发布。平台定时填完须人点确认。不承诺规避平台监控。
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <h1>{pageTitle}</h1>
            <p className="hint">
              选文案 → worker 填创作者后台 → 人点发布。仅图文；草稿在本机 Chrome 用户目录。
            </p>
          </div>
          <div className="live-strip" style={{ position: 'relative' }}>
            {/* 顶栏账号选择器 */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className="chip"
                style={{
                  cursor: isTaskRunningOrBusy ? 'not-allowed' : 'pointer',
                  opacity: isTaskRunningOrBusy ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                }}
                title={
                  isTaskRunningOrBusy
                    ? '当前有发布任务正在排队或执行中，为防串号已锁定切号，请等待任务完成或先取消任务。'
                    : '点击切换账号 / 管理多账号'
                }
                onClick={() => {
                  if (isTaskRunningOrBusy) {
                    alert(
                      '当前有发布任务正在排队或执行中，为防串号已锁定切号，请等待任务完成或先取消任务。'
                    );
                    return;
                  }
                  setShowAccountDropdown((v) => !v);
                }}
              >
                {activeAccount.avatarUrl ? (
                  <img
                    src={activeAccount.avatarUrl}
                    alt=""
                    style={{ width: 18, height: 18, borderRadius: '50%' }}
                  />
                ) : (
                  <span style={{ fontSize: 13 }}>👤</span>
                )}
                <strong>{activeAccount.name || activeAccount.id}</strong>
                {activeAccount.nickname ? (
                  <span style={{ color: 'var(--muted)', fontSize: 12 }}>
                    ({activeAccount.nickname})
                  </span>
                ) : null}
                <span
                  className={`dot ${
                    login?.status === 'logged_in'
                      ? 'on'
                      : login?.status === 'need_qr'
                        ? 'warn'
                        : 'off'
                  }`}
                />
                <span style={{ fontSize: 10, marginLeft: 2 }}>▾</span>
              </button>

              {showAccountDropdown && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: 6,
                    background: 'var(--panel-2)',
                    border: '1px solid var(--line-strong)',
                    borderRadius: 8,
                    padding: '8px 0',
                    zIndex: 100,
                    minWidth: 240,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                  }}
                >
                  <div
                    style={{
                      padding: '4px 12px 6px',
                      fontSize: 11,
                      color: 'var(--muted)',
                      borderBottom: '1px solid var(--line)',
                    }}
                  >
                    切换小红书发布账号（硬隔离）
                  </div>
                  {accounts.map((acc) => (
                    <button
                      key={acc.id}
                      type="button"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        padding: '8px 12px',
                        background:
                          acc.id === activeAccountId
                            ? 'var(--line)'
                            : 'transparent',
                        border: 'none',
                        color: 'var(--text)',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: 13,
                      }}
                      onClick={() => handleSwitchAccount(acc.id)}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        {acc.avatarUrl ? (
                          <img
                            src={acc.avatarUrl}
                            alt=""
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: '50%',
                            }}
                          />
                        ) : (
                          <span>👤</span>
                        )}
                        <span>{acc.name}</span>
                        {acc.nickname && (
                          <span
                            style={{ color: 'var(--muted)', fontSize: 11 }}
                          >
                            ({acc.nickname})
                          </span>
                        )}
                      </div>
                      {acc.id === activeAccountId && (
                        <span style={{ color: 'var(--ok)', fontSize: 12 }}>
                          ✓ 当前
                        </span>
                      )}
                    </button>
                  ))}
                  <div
                    style={{
                      borderTop: '1px solid var(--line)',
                      marginTop: 4,
                      paddingTop: 4,
                    }}
                  >
                    <button
                      type="button"
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '6px 12px',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--accent)',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: 12,
                      }}
                      onClick={() => {
                        setShowAccountDropdown(false);
                        void handleCreateAccount();
                      }}
                    >
                      + 添加新账号卡槽
                    </button>
                    <button
                      type="button"
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '6px 12px',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text)',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: 12,
                      }}
                      onClick={() => {
                        setShowAccountDropdown(false);
                        void handleLaunchBrowser();
                      }}
                    >
                      🌐 打开当前账号浏览器
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              className="btn"
              style={{ padding: '3px 8px', fontSize: 12 }}
              onClick={() => void handleLaunchBrowser()}
              title="打开当前账号的独立可见 Chrome 窗口，直达创作者中心"
            >
              🌐 打开浏览器
            </button>

            <span className="chip">
              <span
                className={`dot ${workerOk ? 'on' : workerOk === false ? 'off' : ''}`}
              />
              Worker {workerOk ? '在线' : workerOk === false ? '离线' : '…'}
            </span>
            <span className="chip">
              <span
                className={`dot ${
                  login?.status === 'logged_in'
                    ? 'on'
                    : login?.status === 'need_qr'
                      ? 'warn'
                      : 'off'
                }`}
              />
              {loginLabel}
            </span>
          </div>
        </header>

        {nav === 'account' && (
          <>
            <section className="panel">
              <div className="panel-head">
                <div>
                  <h2>创作者账号</h2>
                  <p className="sub">
                    当前账号：{activeAccount.name}（Profile: {activeAccount.profileDir}）· 物理隔离不出本机
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => void handleLaunchBrowser()}
                  >
                    🌐 打开可见 Chrome
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => void refreshWorker(true)}
                  >
                    刷新登录态
                  </button>
                </div>
              </div>

              {login?.status === 'need_qr' ? (
                <div
                  className="account-card"
                  style={{
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 14,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      width: '100%',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div
                        className="name"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <span>扫码登录创作者平台</span>
                        <span className="badge skip">待扫码</span>
                      </div>
                      <div className="meta" style={{ marginTop: 4 }}>
                        账号槽位：{activeAccount.name} ({activeAccount.id}) · 目录：{activeAccount.profileDir}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn"
                      disabled={busy}
                      onClick={() => void refreshWorker(true)}
                    >
                      🔄 刷新二维码
                    </button>
                  </div>

                  {login.qrDataUrl ? (
                    <div style={{ textAlign: 'center', width: '100%', padding: '12px 0' }}>
                      <img
                        src={login.qrDataUrl}
                        alt="小红书登录二维码"
                        style={{
                          width: 200,
                          height: 200,
                          borderRadius: 8,
                          border: '2px solid var(--line-strong)',
                          background: '#fff',
                          padding: 6,
                          display: 'inline-block',
                        }}
                      />
                    </div>
                  ) : login.qrScreenshotPath ? (
                    <p className="notice">
                      二维码截图已保存至：{login.qrScreenshotPath}
                    </p>
                  ) : (
                    <p className="notice">
                      正在等待二维码截屏生成… 请点击上方「🔄 刷新二维码」。
                    </p>
                  )}

                  <p
                    className="notice"
                    style={{
                      margin: 0,
                      fontSize: 13,
                      lineHeight: 1.6,
                      background: 'rgba(255, 36, 66, 0.08)',
                      borderColor: 'rgba(255, 36, 66, 0.2)',
                    }}
                  >
                    💡 <strong>使用指南</strong>：请使用小红书 App 扫描二维码登录。平台登录会话通常维持数天至数周，若失效仅需在上方重新扫码，历史账号配置与草稿记录完整保留。
                  </p>
                </div>
              ) : (
                <div className="account-card">
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 14 }}
                  >
                    {activeAccount.avatarUrl ? (
                      <img
                        src={activeAccount.avatarUrl}
                        alt=""
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: '50%',
                          border: '2px solid var(--ok)',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: '50%',
                          background: 'var(--panel-2)',
                          border: '1px solid var(--line-strong)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 22,
                        }}
                      >
                        👤
                      </div>
                    )}
                    <div>
                      <div
                        className="name"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <span>
                          {activeAccount.nickname || activeAccount.name}
                        </span>
                        <span
                          className={`badge ${
                            login?.status === 'logged_in' ? 'ok' : 'bad'
                          }`}
                        >
                          {loginLabel}
                        </span>
                      </div>
                      <div className="meta" style={{ marginTop: 2 }}>
                        {activeAccount.redId ? `小红书号: ${activeAccount.redId} · ` : ''}
                        槽位别名: {activeAccount.name} ({activeAccount.id}) · {activeAccount.profileDir}
                        {login?.cdpPort != null ? ` · CDP ${login.cdpPort}` : ''}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => void handleLaunchBrowser(activeAccount.id)}
                    >
                      打开独立浏览器
                    </button>
                  </div>
                </div>
              )}

              <div style={{ marginTop: 20 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 10,
                  }}
                >
                  <div>
                    <h3 style={{ margin: 0, fontSize: 15 }}>账号矩阵管理 (硬隔离)</h3>
                    <p className="sub" style={{ margin: '2px 0 0' }}>
                      每个账号独享本地 profiles/ 磁盘目录，Cookie 与设备指纹零交叉
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn primary"
                    disabled={isTaskRunningOrBusy}
                    onClick={() => void handleCreateAccount()}
                  >
                    + 添加新账号
                  </button>
                </div>

                {isTaskRunningOrBusy && (
                  <p
                    className="notice"
                    style={{
                      color: 'var(--warn)',
                      borderColor: 'rgba(230, 184, 77, 0.3)',
                    }}
                  >
                    ⚠️ 当前有发布任务正在排队或执行中，为防串号已锁定切号，请等待任务完成或先取消任务。
                  </p>
                )}

                <div style={{ overflowX: 'auto', marginTop: 10 }}>
                  <table className="mat-table">
                    <thead>
                      <tr>
                        <th>账号别名</th>
                        <th>创作者昵称</th>
                        <th>小红书号</th>
                        <th>Profile 目录</th>
                        <th>最后登录</th>
                        <th>状态</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accounts.map((acc) => {
                        const isActive = acc.id === activeAccountId;
                        return (
                          <tr
                            key={acc.id}
                            style={{
                              background: isActive
                                ? 'rgba(62, 207, 142, 0.05)'
                                : undefined,
                            }}
                          >
                            <td>
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6,
                                }}
                              >
                                {acc.avatarUrl ? (
                                  <img
                                    src={acc.avatarUrl}
                                    alt=""
                                    style={{
                                      width: 20,
                                      height: 20,
                                      borderRadius: '50%',
                                    }}
                                  />
                                ) : (
                                  <span>👤</span>
                                )}
                                <strong>{acc.name}</strong>
                              </div>
                            </td>
                            <td>{acc.nickname || '—'}</td>
                            <td>{acc.redId || '—'}</td>
                            <td>
                              <code style={{ fontSize: 12 }}>
                                {acc.profileDir}
                              </code>
                            </td>
                            <td>
                              {acc.lastLoginAt
                                ? new Date(acc.lastLoginAt).toLocaleString()
                                : '未记录'}
                            </td>
                            <td>
                              {isActive ? (
                                <span className="badge ok">当前生效</span>
                              ) : (
                                <span className="badge skip">备用</span>
                              )}
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: 6 }}>
                                {!isActive && (
                                  <button
                                    type="button"
                                    className="btn"
                                    style={{
                                      fontSize: 12,
                                      padding: '2px 8px',
                                    }}
                                    disabled={isTaskRunningOrBusy || busy}
                                    onClick={() => handleSwitchAccount(acc.id)}
                                  >
                                    切换
                                  </button>
                                )}
                                <button
                                  type="button"
                                  className="btn"
                                  style={{
                                    fontSize: 12,
                                    padding: '2px 8px',
                                  }}
                                  onClick={() =>
                                    void handleRenameAccount(acc.id, acc.name)
                                  }
                                >
                                  改名
                                </button>
                                <button
                                  type="button"
                                  className="btn"
                                  style={{
                                    fontSize: 12,
                                    padding: '2px 8px',
                                  }}
                                  onClick={() =>
                                    void handleLaunchBrowser(acc.id)
                                  }
                                >
                                  打开
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="stat-grid" style={{ marginTop: 20 }}>
                <div className="stat">
                  <div className="k">Worker</div>
                  <div className="v">{workerOk ? '3722' : '—'}</div>
                </div>
                <div className="stat">
                  <div className="k">UI</div>
                  <div className="v">3721</div>
                </div>
                <div className="stat">
                  <div className="k">可跑素材</div>
                  <div className="v">{runnableCount}</div>
                </div>
                <div className="stat">
                  <div className="k">反自动化指纹</div>
                  <div className="v" style={{ fontSize: 13, color: 'var(--ok)' }}>
                    已抹除
                  </div>
                </div>
              </div>
            </section>
            {err && <p className="err">{err}</p>}
          </>
        )}

        {nav === 'materials' && (
          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>文案素材库</h2>
                <p className="sub">本机 *发帖文案.md · 缺 cardId/切片/商品 不可入队</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {lastParsedMsg && (
                  <span style={{ fontSize: 12, color: 'var(--ok)' }}>
                    ✓ {lastParsedMsg}
                  </span>
                )}
                <button
                  type="button"
                  className="btn"
                  disabled={parsing}
                  onClick={() =>
                    void parseMd(undefined, {
                      keepSelection: true,
                      syncBatch: true,
                    })
                  }
                  title="重新从磁盘读取 MD 文档和卡片状态，同步最新的修改与草稿标记"
                >
                  {parsing ? '⏳ 正在重新读取…' : '🔄 重新读取 / 刷新列表'}
                </button>
                <button
                  type="button"
                  className="btn primary"
                  disabled={syncingMobile || parsing}
                  onClick={() => void handleSyncToMobile()}
                  style={{
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    color: '#fff',
                    fontWeight: 700,
                    border: 'none',
                    padding: '8px 16px',
                    boxShadow: '0 2px 8px rgba(2, 132, 199, 0.4)',
                  }}
                  title="将当前选中的 MD 文案与切片原图一键推送到宝塔手机端"
                >
                  {syncingMobile ? '⏳ 正在同步至手机…' : '📱 一键同步至手机发帖工作台'}
                </button>
              </div>
            </div>

            {syncMobileMsg && (
              <div
                style={{
                  marginBottom: 14,
                  padding: '10px 14px',
                  borderRadius: 6,
                  background: syncMobileMsg.ok
                    ? 'rgba(34, 197, 94, 0.12)'
                    : 'rgba(239, 68, 68, 0.12)',
                  border: `1px solid ${
                    syncMobileMsg.ok ? '#22c55e' : '#ef4444'
                  }`,
                  color: syncMobileMsg.ok ? '#4ade80' : '#f87171',
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>{syncMobileMsg.ok ? '✅ ' : '❌ '}{syncMobileMsg.text}</span>
                {syncMobileMsg.url && (
                  <a
                    href={syncMobileMsg.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      color: '#38bdf8',
                      textDecoration: 'underline',
                      fontWeight: 600,
                    }}
                  >
                    在浏览器中打开手机工作台 ↗
                  </a>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                type="button"
                className={`btn${mdPath === BUSINESS_MD_1028 ? ' primary' : ''}`}
                onClick={() => {
                  setMdPath(BUSINESS_MD_1028);
                  setCardsDir('E:/AI/Antigravity/小红书/design/product-docs/大女主觉醒测试/assets/结果测试截图/cards');
                  void parseMd(BUSINESS_MD_1028);
                }}
              >
                ★ 大女主最新文案（2026-10-28 · 24卡）
              </button>
              <button
                type="button"
                className={`btn${mdPath === BUSINESS_MD_1010 ? ' primary' : ''}`}
                onClick={() => {
                  setMdPath(BUSINESS_MD_1010);
                  setCardsDir('E:/AI/Antigravity/小红书/design/product-docs/大女主觉醒测试/assets/结果测试截图/cards');
                  void parseMd(BUSINESS_MD_1010);
                }}
              >
                大女主文案（2026-10-10 · 24卡）
              </button>
              <button
                type="button"
                className={`btn${mdPath === DEFAULT_FIXTURE_MD ? ' primary' : ''}`}
                onClick={() => {
                  setMdPath(DEFAULT_FIXTURE_MD);
                  setCardsDir(DEFAULT_FIXTURE_CARDS);
                  void parseMd(DEFAULT_FIXTURE_MD);
                }}
              >
                样例：合规测试（3卡）
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>常用测试项目预置:</span>
                <select
                  style={{
                    fontSize: 12,
                    padding: '4px 8px',
                    background: 'var(--panel-2)',
                    color: 'var(--text)',
                    border: '1px solid var(--line-strong)',
                    borderRadius: 4,
                  }}
                  value=""
                  onChange={(e) => {
                    const preset = presetsList.find((p) => p.id === e.target.value);
                    if (preset) {
                      if (preset.mdPath) {
                        setMdPath(preset.mdPath);
                        saveRecentPath('md', preset.mdPath);
                        void parseMd(preset.mdPath);
                      }
                      if (preset.cardsDir) {
                        setCardsDir(preset.cardsDir);
                        saveRecentPath('cards', preset.cardsDir);
                      }
                    }
                  }}
                >
                  <option value="">快速点选测试预置路径...</option>
                  {presetsList.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.category}] {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="field" style={{ marginBottom: 12 }}>
              <label htmlFor="md">文案 md 绝对路径</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  id="md"
                  value={mdPath}
                  onChange={(e) => setMdPath(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="btn"
                  disabled={pickingTarget !== null}
                  onClick={() => void handlePickPath('file', mdPath)}
                  title="唤起文件选择器"
                >
                  {browseButtonLabel('md', pickingTarget, '📂 浏览文件')}
                </button>
              </div>
              {recentPaths.mdPaths.length > 0 && (
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    flexWrap: 'wrap',
                  }}
                >
                  <span style={{ color: 'var(--muted)' }}>最近选择:</span>
                  <select
                    style={{
                      fontSize: 12,
                      padding: '2px 8px',
                      maxWidth: 400,
                      background: 'var(--panel-2)',
                      color: 'var(--text)',
                      border: '1px solid var(--line)',
                      borderRadius: 4,
                    }}
                    onChange={(e) => {
                      if (e.target.value) {
                        setMdPath(e.target.value);
                        saveRecentPath('md', e.target.value);
                        void parseMd(e.target.value);
                      }
                    }}
                    value=""
                  >
                    <option value="">快速点选最近 md 路径（最多 8 条）...</option>
                    {recentPaths.mdPaths.map((p, idx) => (
                      <option key={idx} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn"
                    style={{ fontSize: 11, padding: '1px 6px' }}
                    onClick={() => clearRecentPaths('md')}
                  >
                    清空历史
                  </button>
                </div>
              )}
            </div>

            <div className="field" style={{ marginBottom: 12 }}>
              <label htmlFor="cardsDir">切片 cards 目录（可选）</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  id="cardsDir"
                  value={cardsDir}
                  onChange={(e) => setCardsDir(e.target.value)}
                  placeholder="例如 …/assets/…/cards"
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="btn"
                  disabled={pickingTarget !== null}
                  onClick={() =>
                    void handlePickPath('directory', cardsDir || mdPath)
                  }
                  title="唤起目录选择器"
                >
                  {browseButtonLabel('cards', pickingTarget, '📂 浏览目录')}
                </button>
              </div>
              {recentPaths.cardsPaths.length > 0 && (
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    flexWrap: 'wrap',
                  }}
                >
                  <span style={{ color: 'var(--muted)' }}>最近选择:</span>
                  <select
                    style={{
                      fontSize: 12,
                      padding: '2px 8px',
                      maxWidth: 400,
                      background: 'var(--panel-2)',
                      color: 'var(--text)',
                      border: '1px solid var(--line)',
                      borderRadius: 4,
                    }}
                    onChange={(e) => {
                      if (e.target.value) {
                        setCardsDir(e.target.value);
                        saveRecentPath('cards', e.target.value);
                      }
                    }}
                    value=""
                  >
                    <option value="">快速点选最近 cards 目录（最多 8 条）...</option>
                    {recentPaths.cardsPaths.map((p, idx) => (
                      <option key={idx} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn"
                    style={{ fontSize: 11, padding: '1px 6px' }}
                    onClick={() => clearRecentPaths('cards')}
                  >
                    清空历史
                  </button>
                </div>
              )}
            </div>

            {parseErr && <p className="err">{parseErr}</p>}

            <p className="notice">
              可跑 {runnableCount} 张。旧卡请人工补字段（v1 无迁移脚本）。仅图文，无视频上传。
            </p>

            {cards.length === 0 ? (
              <div className="empty-state" style={{ marginTop: 14 }}>
                尚未解析。填好路径后点「解析卡列表」。
              </div>
            ) : (
              <>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 14,
                    marginBottom: 8,
                    gap: 10,
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="search"
                      value={matSearch}
                      onChange={(e) => setMatSearch(e.target.value)}
                      placeholder="🔍 搜索 Card / 画像名称 / 代码 / 标题..."
                      style={{
                        padding: '5px 10px',
                        fontSize: 12,
                        borderRadius: 6,
                        border: '1px solid var(--line)',
                        background: 'var(--panel-2)',
                        color: 'var(--text)',
                        minWidth: 260,
                      }}
                    />
                    {matSearch && (
                      <button
                        type="button"
                        className="btn"
                        style={{ fontSize: 11, padding: '3px 8px' }}
                        onClick={() => setMatSearch('')}
                      >
                        清空
                      </button>
                    )}
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                      {matSearch
                        ? `筛选出 ${filteredCards.length} / ${cards.length} 张`
                        : `共 ${cards.length} 张`}
                    </span>
                  </div>
                  {filteredCards.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button
                        type="button"
                        className="btn"
                        style={{ fontSize: 11, padding: '3px 8px' }}
                        onClick={() => {
                          setSelectedIds((prev) => {
                            const next = new Set(prev);
                            for (const fc of filteredCards) {
                              if (fc.runnable && fc.meta?.cardId) {
                                next.add(fc.meta.cardId);
                              }
                            }
                            return next;
                          });
                        }}
                      >
                        全选当前筛选
                      </button>
                      <button
                        type="button"
                        className="btn"
                        style={{ fontSize: 11, padding: '3px 8px' }}
                        onClick={() => {
                          setSelectedIds((prev) => {
                            const next = new Set(prev);
                            for (const fc of filteredCards) {
                              if (fc.meta?.cardId) {
                                next.delete(fc.meta.cardId);
                              }
                            }
                            return next;
                          });
                        }}
                      >
                        取消当前筛选
                      </button>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: 6, overflowX: 'auto' }}>
                  <table className="mat-table">
                    <thead>
                      <tr>
                        <th>选</th>
                        <th>Card</th>
                        <th className="result-col">测试结果</th>
                        <th>标题</th>
                        <th>切片</th>
                        <th>状态</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCards.map((c) => {
                        const id = c.meta?.cardId;
                        const checked = !!(id && selectedIds.has(id));
                        const res =
                          c.resultLabel ||
                          resolveResultLabel(
                            { id, meta: c.meta, title: c.title },
                            resultMap
                          );
                        return (
                          <tr
                            key={c.index}
                            className={
                              c.runnable ? '' : c.errors?.length ? 'bad' : 'skip'
                            }
                          >
                            <td>
                              {c.runnable && id ? (
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => {
                                    setSelectedIds((prev) => {
                                      const next = new Set(prev);
                                      if (next.has(id)) next.delete(id);
                                      else next.add(id);
                                      return next;
                                    });
                                  }}
                                  aria-label={`选中 ${id}`}
                                />
                              ) : (
                                '—'
                              )}
                            </td>
                            <td className="mono">{id || '—'}</td>
                            <td
                              className="result-col"
                              title={`测试画像: ${res.full}`}
                            >
                              {res.name && res.name !== '通用画像' ? (
                                <span
                                  className={`badge result-badge result-badge--${res.badgeVariant || 'purple'}`}
                                >
                                  {res.full}
                                </span>
                              ) : (
                                <span className="badge result-badge result-badge--slate">
                                  {res.code || '—'}
                                </span>
                              )}
                            </td>
                            <td className="mat-title-col">{c.title || '(无标题)'}</td>
                            <td className="mono">{c.meta?.slice || '—'}</td>
                            <td>
                              {c.runnable ? (
                                <span className="badge ok">可入队</span>
                              ) : c.errors?.some((e) => e.startsWith('缺')) ? (
                                <span className="badge bad">
                                  {c.errors
                                    .filter((e) => e.startsWith('缺'))
                                    .join(' / ')}
                                </span>
                              ) : (
                                <span className="badge skip">
                                  {c.skipReason || '跳过'}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            <div className="actions">
              <button
                type="button"
                className="btn"
                disabled={selectedIds.size === 0}
                onClick={() => takeSelected()}
              >
                选中送入发布中心
              </button>
              <button
                type="button"
                className="btn primary"
                disabled={runnableCount === 0}
                onClick={() => takeFirstN()}
              >
                按 N={n} 取前 N → 发布中心
              </button>
            </div>
          </section>
        )}

        {nav === 'draft' && (
          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>设置中心</h2>
                <p className="sub">
                  默认条数、模式、间隔。日常开跑请走「发布中心」核对后确认；此处也可盲跑。
                </p>
              </div>
            </div>

            <div className="row">
              <div className="field">
                <label htmlFor="n">本批 N（1–10）</label>
                <input
                  id="n"
                  type="number"
                  min={1}
                  max={10}
                  value={n}
                  onChange={(e) => setN(Number(e.target.value))}
                />
              </div>
              <div className="field">
                <label htmlFor="mode">模式</label>
                <select
                  id="mode"
                  value={mode}
                  onChange={(e) => setMode(e.target.value as 'draft' | 'ready')}
                >
                  <option value="draft">draft · 暂存离开</option>
                  <option value="ready">ready · 停发布前</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="imin">间隔下限（分）</label>
                <input
                  id="imin"
                  type="number"
                  min={0}
                  value={intervalMin}
                  onChange={(e) => setIntervalMin(Number(e.target.value))}
                />
              </div>
              <div className="field">
                <label htmlFor="imax">间隔上限（分）</label>
                <input
                  id="imax"
                  type="number"
                  min={0}
                  value={intervalMax}
                  onChange={(e) => setIntervalMax(Number(e.target.value))}
                />
              </div>
            </div>

            <div
              style={{
                marginTop: 16,
                marginBottom: 16,
                padding: 12,
                border: '1px solid var(--line)',
                borderRadius: 6,
                background: 'var(--panel-2)',
              }}
            >
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 13,
                  marginBottom: 10,
                  color: 'var(--text)',
                }}
              >
                素材源与切片路径设定
              </div>
              <div className="field" style={{ marginBottom: 10 }}>
                <label htmlFor="settings-md">文案 md 绝对路径</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    id="settings-md"
                    value={mdPath}
                    onChange={(e) => setMdPath(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="btn"
                    disabled={pickingTarget !== null}
                    onClick={() => void handlePickPath('file', mdPath)}
                    title="唤起 Windows 原生文件选择器"
                  >
                    {browseButtonLabel('md', pickingTarget, '📂 浏览文件')}
                  </button>
                </div>
              </div>
              <div className="field">
                <label htmlFor="settings-cards">切片 cards 目录（可选）</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    id="settings-cards"
                    value={cardsDir}
                    onChange={(e) => setCardsDir(e.target.value)}
                    placeholder="例如 …/assets/…/cards"
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="btn"
                    disabled={pickingTarget !== null}
                    onClick={() =>
                      void handlePickPath('directory', cardsDir || mdPath)
                    }
                    title="唤起 Windows 原生文件夹选择器"
                  >
                    {browseButtonLabel('cards', pickingTarget, '📂 浏览目录')}
                  </button>
                </div>
              </div>
            </div>

            <div className="stat-grid">
              <div className="stat">
                <div className="k">素材可跑</div>
                <div className="v">{runnableCount}</div>
              </div>
              <div className="stat">
                <div className="k">登录</div>
                <div className="v" style={{ fontSize: 15 }}>
                  {loginLabel}
                </div>
              </div>
              <div className="stat">
                <div className="k">Worker</div>
                <div className="v" style={{ fontSize: 15 }}>
                  {workerOk ? '在线' : '离线'}
                </div>
              </div>
            </div>

            {!canStart && (
              <p className="notice">
                开跑需：Worker 在线 + 已登录 + 至少 1 张可跑卡。可先到「账号管理 / 素材管理」准备。
              </p>
            )}
            {err && <p className="err">{err}</p>}

            <div className="cta-bar">
              <div className="meta">
                默认暂存；失败熔断停当天剩余。
                <br />
                队列落盘：.scratch/xhs-draft-autofill/runtime/
              </div>
              <div className="actions" style={{ marginTop: 0 }}>
                <button
                  type="button"
                  className="btn"
                  disabled={runnableCount === 0}
                  onClick={() => takeFirstN()}
                >
                  去发布中心核对
                </button>
                <button
                  type="button"
                  className="btn primary"
                  style={{ minWidth: 140 }}
                  disabled={!canStart}
                  onClick={() => void onStart(false)}
                >
                  {busy ? '下发中…' : '直接开跑'}
                </button>
              </div>
            </div>
          </section>
        )}

        {nav === 'publish' && (
          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>发布中心 · 本批核对</h2>
                <p className="sub">
                  仅图文。可改封面大字 / 标题 / 正文 / 话题；切片与商品只读。确认后再开跑；覆盖仅本 run，不写回源 md。
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {syncMsg && (
                  <span style={{ fontSize: 12, color: 'var(--ok)' }}>
                    ✓ {syncMsg}
                  </span>
                )}
                <button
                  type="button"
                  className="btn ghost"
                  disabled={parsing || batch.length === 0}
                  onClick={async () => {
                    await parseMd(undefined, {
                      keepSelection: true,
                      syncBatch: true,
                    });
                    setSyncMsg('已从 MD 重新同步本批内容');
                    setTimeout(() => setSyncMsg(null), 3500);
                  }}
                  title="若外部手动修改了 MD 文档，点击可将本批卡片的封面、标题、正文等重新与 MD 同步"
                >
                  {parsing ? '⏳ 正在同步…' : '🔄 从 MD 重新同步'}
                </button>
              </div>
            </div>

            {batch.length === 0 ? (
              <div className="empty-state">
                本批为空。请到「素材管理」多选或「按 N 取前 N」送入。
                <div className="actions" style={{ justifyContent: 'center' }}>
                  <button
                    type="button"
                    className="btn primary"
                    disabled={runnableCount === 0}
                    onClick={() => takeFirstN()}
                  >
                    按 N={n} 取前 N
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setNav('materials')}
                  >
                    去素材管理
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="pub-layout">
                  <aside className="pub-batch">
                    <div className="pub-batch-label">本批 {batch.length} 张</div>
                    {batch.map((b) => {
                      const ok = !!(b.slice && b.goods);
                      const res = resolveResultLabel(
                        { id: b.cardId, title: b.title },
                        resultMap,
                        b.goods
                      );
                      return (
                        <button
                          key={b.cardId}
                          type="button"
                          className={`pub-card-tab${activeCardId === b.cardId ? ' active' : ''}${ok ? '' : ' bad'}`}
                          onClick={() => setActiveCardId(b.cardId)}
                          title={`${res.full} · ${b.title}`}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              width: '100%',
                              gap: 6,
                            }}
                          >
                            <span className="mono">{b.cardId}</span>
                            <span
                              className={`badge result-badge-xs result-badge--${res.badgeVariant || 'purple'}`}
                            >
                              {res.name
                                ? res.name.length > 7
                                  ? res.name.slice(0, 7) + '…'
                                  : res.name
                                : res.code}
                            </span>
                          </div>
                          <span className="muted">
                            {ok ? b.title.slice(0, 18) : '缺切片/商品'}
                          </span>
                        </button>
                      );
                    })}
                  </aside>

                  <div className="pub-editor">
                    {activeDraft ? (
                      <>
                        <div className="pub-section">
                          <h3>封面大字（回车换行，1～5 行）</h3>
                          <textarea
                            className="pub-line"
                            rows={Math.min(
                              MAX_COVER_LINES,
                              Math.max(4, (activeDraft.coverLines.length || 1) + 1)
                            )}
                            value={activeDraft.coverLines.join('\n')}
                            placeholder={
                              '天生话少\n习惯独处\n只是太怕被消耗\n不想迎合'
                            }
                            onChange={(e) => {
                              const lines = e.target.value
                                .split(/\r?\n/)
                                .map((l) => l.trimEnd())
                                .slice(0, MAX_COVER_LINES);
                              updateActive({ coverLines: lines });
                            }}
                            onBlur={() => {
                              updateActive({
                                coverLines: activeDraft.coverLines
                                  .map((l) => l.trim())
                                  .filter(Boolean)
                                  .slice(0, MAX_COVER_LINES),
                              });
                            }}
                          />
                          <p className="sub" style={{ marginTop: 6 }}>
                            已解析{' '}
                            {
                              activeDraft.coverLines.filter((l) => l.trim())
                                .length
                            }{' '}
                            行（上限 {MAX_COVER_LINES}）· 合计{' '}
                            {activeDraft.coverLines.join('').length} 字
                            {activeDraft.coverLines.join('').length > 16
                              ? '（⚠️ 超过硬顶 16 字，生成图可能丢末行）'
                              : '（硬顶 ≤16）'}
                            。每行对应封面一截大字，勿粘成一行。
                          </p>
                        </div>

                        <div className="pub-section">
                          <h3>标题</h3>
                          <input
                            value={activeDraft.title}
                            onChange={(e) =>
                              updateActive({ title: e.target.value })
                            }
                          />
                        </div>

                        <div className="pub-section">
                          <h3>正文</h3>
                          <textarea
                            rows={6}
                            value={activeDraft.body}
                            onChange={(e) =>
                              updateActive({ body: e.target.value })
                            }
                          />
                        </div>

                        <div className="pub-section">
                          <h3>话题标签</h3>
                          <div className="topic-list">
                            {activeDraft.topics.map((t) => (
                              <button
                                key={t}
                                type="button"
                                className="topic-chip"
                                onClick={() => removeTopic(t)}
                                title="点击删除"
                              >
                                #{t} ×
                              </button>
                            ))}
                          </div>
                          <div className="topic-add">
                            <input
                              value={topicDraft}
                              placeholder="新话题（可不带 #）"
                              onChange={(e) => setTopicDraft(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  addTopic();
                                }
                              }}
                            />
                            <button
                              type="button"
                              className="btn"
                              onClick={() => addTopic()}
                            >
                              添加
                            </button>
                          </div>
                        </div>

                        {activeDraftResultLabel && (
                          <div
                            className="pub-result-banner"
                            style={{
                              background: 'rgba(255, 255, 255, 0.03)',
                              border: '1px solid var(--line)',
                              borderRadius: 8,
                              padding: '10px 14px',
                              marginBottom: 16,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                              }}
                            >
                              <span style={{ fontSize: 16 }}>🎯</span>
                              <div>
                                <div
                                  style={{
                                    fontSize: 11,
                                    color: 'var(--muted)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.04em',
                                  }}
                                >
                                  所属测试结果画像
                                </div>
                                <div
                                  style={{
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: 'var(--text)',
                                    marginTop: 2,
                                  }}
                                >
                                  {activeDraftResultLabel.full}
                                </div>
                              </div>
                            </div>
                            <span
                              className={`badge result-badge result-badge--${activeDraftResultLabel.badgeVariant || 'purple'}`}
                            >
                              {activeDraftResultLabel.code}
                            </span>
                          </div>
                        )}

                        <div className="pub-section readonly">
                          <h3>切片 / 商品（只读）</h3>
                          <div className="row">
                            <div className="field">
                              <label>切片</label>
                              <input
                                className="mono"
                                value={activeDraft.slice || '（缺）'}
                                readOnly
                              />
                            </div>
                            <div className="field">
                              <label>商品</label>
                              <input
                                value={activeDraft.goods || '（缺）'}
                                readOnly
                              />
                            </div>
                          </div>

                          {/* 切片缩略预览图与换切片按钮 */}
                          {activeDraft.cardId && (
                            <div className="slice-preview-row">
                              <div
                                className="slice-thumb-box"
                                onClick={() => {
                                  if (formSliceUrl) setLightboxImageUrl(formSliceUrl);
                                }}
                                title="点击放大查看切片原图"
                              >
                                {formSliceLoading ? (
                                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                                    加载中...
                                  </span>
                                ) : formSliceUrl ? (
                                  <>
                                    <img
                                      src={formSliceUrl}
                                      alt="切片缩略图"
                                      className="slice-thumb-img"
                                    />
                                    <div className="slice-thumb-overlay">🔍 放大</div>
                                  </>
                                ) : (
                                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                                    暂无切片
                                  </span>
                                )}
                              </div>
                              <div className="slice-actions-col">
                                <button
                                  type="button"
                                  className="btn"
                                  style={{
                                    width: 'fit-content',
                                    padding: '4px 10px',
                                    fontSize: 12,
                                  }}
                                  onClick={() => setSliceSeed(Date.now())}
                                >
                                  🎲 换个切片
                                </button>
                                <div className="slice-tip">
                                  黄金 1/3 动态切片 · 自动避让底部二维码
                                </div>
                              </div>
                            </div>
                          )}

                          {(!activeDraft.slice || !activeDraft.goods) && (
                            <p className="err">缺切片或商品，不可纳入开跑</p>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="empty-state">选择左侧一张卡编辑</div>
                    )}
                  </div>

                  <aside className="pub-preview-panel">
                    <div className="pub-preview-title">
                      <span>📱 拟真手机预览（实时）</span>
                      <span className="badge">P1 封面 + P2 切片</span>
                    </div>
                    <MobilePreview
                      draft={activeDraft}
                      account={activeAccount}
                      cardsDir={cardsDir}
                      seed={sliceSeed}
                      resultLabel={activeDraftResultLabel || undefined}
                      onRefreshSlice={() => setSliceSeed(Date.now())}
                      onSliceClick={(url) => setLightboxImageUrl(url)}
                    />
                  </aside>
                </div>

                <div className="pub-section" style={{ marginTop: 16 }}>
                  <h3>定时（可选）</h3>
                  <div className="row">
                    <div className="field">
                      <label htmlFor="sched">本机 scheduleAt（到点才填表）</label>
                      <input
                        id="sched"
                        type="datetime-local"
                        value={scheduleLocal}
                        onChange={(e) => {
                          setScheduleLocal(e.target.value);
                          setBatchConfirmed(false);
                        }}
                      />
                      <p className="field-hint">
                        只调度本机队列，不是小红书平台定时。过期时刻会拒绝入队。
                      </p>
                    </div>
                    <div className="field">
                      <label htmlFor="psched">
                        平台 platformScheduleAt（填开关+时间后停住）
                      </label>
                      <input
                        id="psched"
                        type="datetime-local"
                        value={platformScheduleLocal}
                        onChange={(e) => {
                          setPlatformScheduleLocal(e.target.value);
                          setBatchConfirmed(false);
                        }}
                      />
                      <p className="field-hint">
                        有值时强制 ready：自动化不点最终发布，须人确认。不可与 draft 同用。
                      </p>
                    </div>
                  </div>
                  <div className="row">
                    <div className="field">
                      <label htmlFor="pmode">模式</label>
                      <select
                        id="pmode"
                        value={mode}
                        disabled={!!platformScheduleLocal}
                        onChange={(e) =>
                          setMode(e.target.value as 'draft' | 'ready')
                        }
                      >
                        <option value="draft">draft · 暂存离开</option>
                        <option value="ready">ready · 停发布前</option>
                      </select>
                    </div>
                    <div className="field">
                      <label htmlFor="pimin">间隔下限（分）</label>
                      <input
                        id="pimin"
                        type="number"
                        min={0}
                        value={intervalMin}
                        onChange={(e) =>
                          setIntervalMin(Number(e.target.value))
                        }
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="pimax">间隔上限（分）</label>
                      <input
                        id="pimax"
                        type="number"
                        min={0}
                        value={intervalMax}
                        onChange={(e) =>
                          setIntervalMax(Number(e.target.value))
                        }
                      />
                    </div>
                  </div>
                </div>

                {!batchRunnable && (
                  <p className="err">本批有卡缺切片/商品，请剔除后重选。</p>
                )}
                {err && <p className="err">{err}</p>}

                <div className="cta-bar">
                  <div className="meta">
                    {batchConfirmed
                      ? '已确认本批预览，可下发 worker。'
                      : '请先点「本批预览确认」，未确认不会入队。'}
                    <br />
                    半自动 · 限频 · 熔断 · 不自动点发布
                  </div>
                  <div className="actions" style={{ marginTop: 0 }}>
                    <button
                      type="button"
                      className={`btn${batchConfirmed ? ' primary' : ''}`}
                      disabled={!batchRunnable}
                      onClick={() => setBatchConfirmed(true)}
                    >
                      {batchConfirmed ? '✓ 已确认本批预览' : '本批预览确认'}
                    </button>
                    <button
                      type="button"
                      className="btn primary"
                      style={{ minWidth: 160 }}
                      disabled={!canPublishStart}
                      onClick={() => void onStart(true)}
                    >
                      {busy ? '下发中…' : '确认开跑'}
                    </button>
                  </div>
                </div>
                {!canPublishStart && (
                  <div style={{ color: '#e06c75', fontSize: 13, marginTop: 8, textAlign: 'right' }}>
                    {!workerOk
                      ? '提示：Worker 3722 离线，请先检查后台服务'
                      : login?.status !== 'logged_in'
                      ? '提示：Chrome 未登录或创作者页面未就绪'
                      : !batchRunnable
                      ? '提示：本批有卡片缺少切片或商品'
                      : ''}
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {nav === 'progress' && (
          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>任务进度</h2>
                <p className="sub">
                  {run?.runId
                    ? `runId ${run.runId.slice(0, 8)}… · ${run.status || '—'}`
                    : '尚无任务'}
                  {run?.phase === 'cooldown' && (
                    <span
                      style={{
                        marginLeft: 6,
                        padding: '2px 8px',
                        borderRadius: 12,
                        background: 'rgba(20, 184, 166, 0.15)',
                        color: '#2dd4bf',
                        border: '1px solid rgba(20, 184, 166, 0.4)',
                        fontSize: 11,
                      }}
                    >
                      防风控冷静期中
                    </span>
                  )}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {(run?.status === 'running' || run?.status === 'interrupted') && run.nextRunAt && (
                  <div
                    className={`countdown-pill${
                      countdown.isOverdue
                        ? ' overdue'
                        : countdown.isUrgent
                          ? ' urgent'
                          : ''
                    }`}
                    style={
                      run.phase === 'cooldown'
                        ? {
                            borderColor: 'rgba(20, 184, 166, 0.5)',
                            color: '#2dd4bf',
                            background: 'rgba(20, 184, 166, 0.1)',
                          }
                        : countdown.isOverdue
                          ? { borderColor: '#ef4444', color: '#f87171' }
                          : undefined
                    }
                    title={
                      run.phase === 'cooldown'
                        ? '单卡暂存成功后的防风控物理随机冷静期'
                        : '距离下篇笔记发布的安全间隔'
                    }
                  >
                    {countdown.isOverdue
                      ? '⚠️ 倒计时超时'
                      : countdown.isDispatching && countdown.diffMs < 0
                        ? '⏳ 调度中...'
                        : run.phase === 'cooldown'
                          ? `🛡️ [防风控保护] 正在静息等待，还剩 ${countdown.chineseFormatted || countdown.formatted}...`
                          : `⏳ 倒计时 ${countdown.formatted}`}
                  </div>
                )}
                {(triggeringNext ||
                  (run?.status === 'running' &&
                    !run?.nextRunAt &&
                    (run?.completed ?? 0) < (run?.total ?? 0))) &&
                  !run?.nextRunAt && (
                    <div
                      className="countdown-pill"
                      style={{
                        borderColor: 'rgba(59, 130, 246, 0.5)',
                        color: '#93c5fd',
                      }}
                      title="自动化浏览器填写与草稿保存中"
                    >
                      ⚡ 自动化执行中 (15~30s)
                    </div>
                  )}
                {run &&
                  (run.status === 'running' ||
                    run.status === 'scheduled' ||
                    run.status === 'interrupted') && (
                    <>
                      <button
                        type="button"
                        className="btn primary"
                        disabled={busy || triggeringNext}
                        style={{
                          padding: '6px 14px',
                          fontSize: 13,
                          boxShadow:
                            countdown.isOverdue || run.status === 'interrupted'
                              ? '0 0 12px rgba(239, 68, 68, 0.5)'
                              : undefined,
                        }}
                        onClick={handleTriggerNext}
                      >
                        {triggeringNext
                          ? '⏳ 正在发布当前卡片...'
                          : run.status === 'interrupted'
                            ? '⚡ 恢复发布下一张'
                            : '⚡ 立即发布下一张'}
                      </button>
                      <button
                        type="button"
                        className="btn ghost"
                        disabled={busy}
                        style={{
                          padding: '6px 14px',
                          fontSize: 13,
                          borderColor: '#ef4444',
                          color: '#ef4444',
                        }}
                        onClick={handleCancelRun}
                      >
                        ✕ 取消发布
                      </button>
                    </>
                  )}
                {runId && (
                  <button
                    type="button"
                    className="btn ghost"
                    disabled={busy}
                    onClick={async () => {
                      try {
                        setPollKey((k) => k + 1);
                        const st = (await getRunStatus(runId)) as RunState;
                        setRun(st);
                      } catch {
                        /* ignore */
                      }
                    }}
                  >
                    立即刷新
                  </button>
                )}
              </div>
            </div>

            {!run ? (
              <div className="empty-state">
                还没有任务。在「发布中心」核对开跑后，进度会出现在这里。
              </div>
            ) : (
              <>
                <div className="stat-grid" style={{ marginBottom: 14 }}>
                  <div className="stat">
                    <div className="k">状态</div>
                    <div className="v" style={{ fontSize: 15 }}>
                      {runStatusLabel(run.status)}
                    </div>
                  </div>
                  <div className="stat">
                    <div className="k">完成</div>
                    <div className="v">
                      {run.completed ?? 0}/{run.total ?? 0}
                    </div>
                  </div>
                  <div className="stat">
                    <div className="k">当前</div>
                    <div className="v" style={{ fontSize: 14 }}>
                      {run.currentCardId || '—'}
                    </div>
                  </div>
                </div>

                {run.circuitReason && (
                  <p className="err">
                    {run.status === 'interrupted' ? '中断提示：' : '熔断/取消：'}
                    {run.circuitReason}
                  </p>
                )}
                {run.status === 'circuit_open' && (
                  <div className="circuit-break-banner">
                    <div className="circuit-header">
                      <div className="circuit-title">
                        <span className="circuit-icon">⚠️</span>
                        <span>流水线已熔断：{run.circuitReason || '单卡执行失败'}</span>
                      </div>
                      <div className="circuit-subtitle">
                        任务已暂停保护，已完成 {run.completed ?? 0}/{run.total ?? 0} 张。
                        您可在排查修复问题后，直接点击下方按钮重试或跳过。
                      </div>
                    </div>
                    <div className="circuit-actions">
                      <button
                        type="button"
                        className="btn primary"
                        disabled={busy || Boolean(retryingCardId) || resuming || triggeringNext}
                        onClick={() => {
                          const failCard = (run.cards || []).find((c) => c.status === 'fail');
                          const targetCardId = failCard?.cardId || run.currentCardId || '';
                          void handleRetryCard(targetCardId, 'resume_remaining');
                        }}
                      >
                        {retryingCardId ? '⏳ 正在重试...' : '⚡ 重试当前失败卡并继续后续'}
                      </button>
                      <button
                        type="button"
                        className="btn secondary"
                        disabled={busy || Boolean(retryingCardId) || resuming || triggeringNext}
                        onClick={handleResumeAll}
                      >
                        {resuming ? '⏳ 正在恢复...' : '⏭️ 跳过此卡，仅继续后续'}
                      </button>
                      <button
                        type="button"
                        className="btn danger-outline"
                        disabled={busy || Boolean(retryingCardId) || resuming || triggeringNext}
                        onClick={handleCancelRun}
                      >
                        🛑 终止整批任务
                      </button>
                    </div>
                  </div>
                )}
                {run.status === 'interrupted' && (
                  <div
                    style={{
                      background: 'rgba(245, 158, 11, 0.08)',
                      border: '1px solid rgba(245, 158, 11, 0.35)',
                      borderRadius: 8,
                      padding: '12px 16px',
                      marginBottom: 14,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ color: '#fcd34d', fontSize: 13, fontWeight: 500 }}>
                        ⚠️ 任务已中断未完成：已完成 {run.completed ?? 0}/{run.total ?? 0} 张
                      </div>
                      <div style={{ color: '#9ca3af', fontSize: 12, marginTop: 2 }}>
                        已到预定时间或 Worker 曾重启，可点击右侧按钮立即恢复发布后续卡片。
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn primary"
                      disabled={busy || triggeringNext}
                      style={{ padding: '6px 14px', fontSize: 12, flexShrink: 0 }}
                      onClick={handleTriggerNext}
                    >
                      {triggeringNext ? '⏳ 正在发布当前卡片...' : '⚡ 恢复发布下一张'}
                    </button>
                  </div>
                )}
                {run.status === 'cancelled' && (
                  <p className="notice">任务已取消发布，剩余未执行的卡已标记为跳过。</p>
                )}
                {(triggeringNext ||
                  (run.status === 'running' &&
                    !run.nextRunAt &&
                    (run.completed ?? 0) < (run.total ?? 0))) && (
                  <div
                    style={{
                      background: 'rgba(59, 130, 246, 0.08)',
                      border: '1px solid rgba(59, 130, 246, 0.35)',
                      borderRadius: 8,
                      padding: '12px 16px',
                      marginBottom: 14,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <div style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>
                      ⏳
                    </div>
                    <div>
                      <div
                        style={{
                          color: '#93c5fd',
                          fontSize: 13,
                          fontWeight: 500,
                        }}
                      >
                        ⚡ 正在后台自动化填写与发布草稿（预计 15~30 秒），完成后将自动进入下一轮倒计时，无需手动刷新
                      </div>
                      <div
                        style={{
                          color: '#9ca3af',
                          fontSize: 12,
                          marginTop: 2,
                        }}
                      >
                        Worker 正在自动化操作浏览器完成图文内容上载与草稿暂存，页面将自动刷新进度与倒计时。
                      </div>
                    </div>
                  </div>
                )}
                {(run.status === 'running' || run.status === 'interrupted') && run.nextRunAt && (
                  <div
                    style={{
                      background:
                        run.phase === 'cooldown'
                          ? 'rgba(20, 184, 166, 0.08)'
                          : countdown.isOverdue
                            ? 'rgba(239, 68, 68, 0.08)'
                            : 'rgba(59, 130, 246, 0.08)',
                      border: `1px solid ${
                        run.phase === 'cooldown'
                          ? 'rgba(20, 184, 166, 0.35)'
                          : countdown.isOverdue
                            ? 'rgba(239, 68, 68, 0.3)'
                            : 'rgba(59, 130, 246, 0.3)'
                      }`,
                      borderRadius: 8,
                      padding: '12px 16px',
                      marginBottom: 14,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          color:
                            run.phase === 'cooldown'
                              ? '#2dd4bf'
                              : countdown.isOverdue
                                ? '#fca5a5'
                                : '#93c5fd',
                          fontSize: 13,
                          fontWeight: 500,
                        }}
                      >
                        {run.phase === 'cooldown'
                          ? '🛡️ [防风控保护] 正在静息等待：预计冷静期结束于 '
                          : countdown.isOverdue
                            ? '⚠️ 预定执行已超时：预计下次执行于 '
                            : '⏱️ 默认安全间隔中：预计下次执行于 '}
                        <strong>
                          {new Date(run.nextRunAt).toLocaleTimeString()}
                        </strong>
                        （剩余 {countdown.chineseFormatted}）
                      </div>
                      <div
                        style={{
                          color: run.phase === 'cooldown' ? '#fbbf24' : '#6b7280',
                          fontSize: 12,
                          marginTop: 2,
                        }}
                      >
                        {run.phase === 'cooldown'
                          ? '⚠️ 平台风控高危期，建议等待倒计时自然结束。单卡暂存完毕后执行 15~35 秒随机物理冷静期。'
                          : countdown.isOverdue
                            ? '已到预定时间，Worker 可能中断或未唤醒，可点击立即发布下张。'
                            : '默认随机维持 15～30 分钟防控；如果想现在就跑，可随时点击右侧按钮立即发帖。'}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn primary"
                      disabled={busy || triggeringNext}
                      style={{
                        padding: '6px 14px',
                        fontSize: 12,
                        flexShrink: 0,
                        boxShadow: countdown.isOverdue
                          ? '0 0 10px rgba(239, 68, 68, 0.4)'
                          : undefined,
                      }}
                      onClick={handleTriggerNext}
                    >
                      {triggeringNext
                        ? '⏳ 正在发布当前卡片...'
                        : countdown.isOverdue
                          ? '⚡ 立即发布下一张'
                          : run.phase === 'cooldown'
                            ? '⚡ 强行跳过冷静期立即发布'
                            : '⚡ 跳过等待立即发布'}
                    </button>
                  </div>
                )}

                <ul className="progress-list">
                  {(run.cards || []).map((c) => {
                    const st = c.status || 'pending';
                    const cls =
                      st === 'ok'
                        ? 'ok'
                        : st === 'running'
                          ? 'running'
                          : st === 'fail'
                            ? 'fail'
                            : '';
                    return (
                      <li
                        key={c.cardId || c.title}
                        className={`progress-item ${cls}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 10,
                            flex: 1,
                          }}
                        >
                          <span className="step-dot" style={{ marginTop: 6 }} />
                          <div>
                            <div
                              className="title"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                flexWrap: 'wrap',
                              }}
                            >
                              {(() => {
                                const res = resolveResultLabel(
                                  { id: c.cardId, title: c.title },
                                  resultMap
                                );
                                return (
                                  <>
                                    <span
                                      className={`badge result-badge-sm result-badge--${res.badgeVariant || 'purple'}`}
                                      title={`画像: ${res.full}`}
                                    >
                                      {res.full}
                                    </span>
                                    <span
                                      className="mono"
                                      style={{
                                        color: 'var(--muted)',
                                        fontSize: 12,
                                      }}
                                    >
                                      {c.cardId || '—'}
                                    </span>
                                    <span style={{ fontWeight: 500 }}>
                                      {c.title || ''}
                                    </span>
                                  </>
                                );
                              })()}
                            </div>
                            {c.err && <div className="desc">{c.err}</div>}
                            {c.screenshotPath && (
                              <div className="desc">{c.screenshotPath}</div>
                            )}
                          </div>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            flexShrink: 0,
                          }}
                        >
                          {st === 'fail' && (
                            <button
                              type="button"
                              className="btn sm btn-retry"
                              disabled={
                                busy ||
                                retryingCardId === c.cardId ||
                                resuming ||
                                triggeringNext
                              }
                              style={{ padding: '3px 10px', fontSize: 12 }}
                              title="单独重新执行这张卡片"
                              onClick={() => handleRetryCard(c.cardId, 'card_only')}
                            >
                              {retryingCardId === c.cardId ? '⏳ 重试中...' : '🔄 重试'}
                            </button>
                          )}
                          {st === 'pending' && run.status === 'running' && (
                            <button
                              type="button"
                              className="btn primary"
                              disabled={
                                busy ||
                                triggeringNext ||
                                Boolean(retryingCardId) ||
                                resuming
                              }
                              style={{ padding: '3px 10px', fontSize: 12 }}
                              title="跳过间隔等待，立即开始执行"
                              onClick={handleTriggerNext}
                            >
                              {triggeringNext ? '⏳ 发布中...' : '立即发布'}
                            </button>
                          )}
                          <span
                            className={`badge ${
                              st === 'ok'
                                ? 'ok'
                                : st === 'fail'
                                  ? 'bad'
                                  : st === 'running'
                                    ? 'skip'
                                    : 'idle'
                            }`}
                          >
                            {statusLabel(st)}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </section>
        )}
        {lightboxImageUrl && (
          <div
            className="lightbox-overlay"
            onClick={() => setLightboxImageUrl(null)}
          >
            <div
              className="lightbox-content"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="lightbox-close-btn"
                onClick={() => setLightboxImageUrl(null)}
              >
                ✕ 关闭 (Esc)
              </button>
              <img
                src={lightboxImageUrl}
                alt="切片大图"
                className="lightbox-img"
              />
              <div className="lightbox-caption">
                <span>{activeDraft?.slice || activeDraft?.cardId || '切片原图'}</span>
                <span style={{ marginLeft: 8, opacity: 0.8 }}>
                  · 黄金 1/3 避让二维码裁切
                </span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
