'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { ResultLabel } from '@/lib/result-resolver';
import styles from './MobilePreview.module.css';

export interface MobilePreviewProps {
  draft: {
    cardId: string;
    coverLines: string[];
    title: string;
    body: string;
    topics: string[];
    slice: string;
    goods?: string;
  } | null;
  account?: {
    id?: string;
    name?: string;
    nickname?: string;
    avatarUrl?: string;
    redId?: string;
  } | null;
  cardsDir?: string;
  seed?: number | string;
  resultLabel?: ResultLabel;
  onSliceClick?: (sliceUrl: string) => void;
  onRefreshSlice?: () => void;
  className?: string;
}

/**
 * 提取正文文本中出现的所有 #话题（去重且去除 # 前缀）
 */
export function extractTopicsFromText(text: string): string[] {
  if (!text) return [];
  const matches = text.match(/#([\u4e00-\u9fa5\w]+)/g);
  if (!matches) return [];
  return Array.from(new Set(matches.map((m) => m.slice(1))));
}

/**
 * 合并正文中的话题与外部配置的话题
 */
export function getAllTopics(text: string, extraTopics: string[] = []): string[] {
  const extracted = extractTopicsFromText(text);
  const cleanedExtra = (extraTopics || [])
    .map((t) => t.replace(/^#/, '').trim())
    .filter(Boolean);
  return Array.from(new Set([...extracted, ...cleanedExtra]));
}

/**
 * 校验封面大字总字数是否超过 16 字硬顶
 */
export function isCoverOverLimit(coverLines: string[]): boolean {
  if (!coverLines || !Array.isArray(coverLines)) return false;
  const totalLength = coverLines.join('').length;
  return totalLength > 16;
}

/**
 * 将单行文本拆解为普通文本与话题片段
 */
export function splitTextWithTopics(
  text: string
): Array<{ text: string; isTopic: boolean }> {
  if (!text) return [];
  const parts: Array<{ text: string; isTopic: boolean }> = [];
  const regex = /#([\u4e00-\u9fa5\w]+)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, match.index), isTopic: false });
    }
    parts.push({ text: match[0], isTopic: true });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), isTopic: false });
  }

  return parts;
}

export function MobilePreview({
  draft,
  account,
  cardsDir,
  seed: externalSeed,
  resultLabel,
  onSliceClick,
  onRefreshSlice,
  className,
}: MobilePreviewProps) {
  // 0: P1 封面大字卡, 1: P2 切片卡
  const [currentSlide, setCurrentSlide] = useState<0 | 1>(0);
  const [localSeed, setLocalSeed] = useState<number>(() => Date.now());

  // 切片加载状态
  const [sliceUrl, setSliceUrl] = useState<string | null>(null);
  const [loadingSlice, setLoadingSlice] = useState<boolean>(false);
  const [sliceError, setSliceError] = useState<string | null>(null);

  // 综合 Seed：只要外部 seed 或本地 seed 变动均触发
  const activeSeed = externalSeed !== undefined ? externalSeed : localSeed;

  // 获取切片 DataURL
  const fetchSlice = useCallback(async () => {
    if (!draft || !draft.cardId || !cardsDir) {
      setSliceUrl(null);
      return;
    }

    setLoadingSlice(true);
    setSliceError(null);

    try {
      const params = new URLSearchParams({
        cardsDir,
        cardId: draft.cardId,
        imageSlice: draft.slice || '',
        seed: String(activeSeed),
      });

      const res = await fetch(`/api/slice-preview?${params.toString()}`);
      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.err || `加载切片失败 (HTTP ${res.status})`);
      }

      setSliceUrl(data.dataUrl);
    } catch (err) {
      setSliceError((err as Error).message || '切片加载异常');
    } finally {
      setLoadingSlice(false);
    }
  }, [draft?.cardId, draft?.slice, cardsDir, activeSeed]);

  useEffect(() => {
    fetchSlice();
  }, [fetchSlice]);

  const handleRefreshClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLocalSeed(Date.now());
    onRefreshSlice?.();
  };

  const handleNextSlide = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentSlide((prev) => (prev === 0 ? 1 : 0));
  };

  const authorDisplayName = account?.nickname || account?.name || '安安';
  const authorInitial = authorDisplayName.charAt(0) || '安';

  // 过滤正文中尚未包含的补充话题
  const extraTopicsToRender = useMemo(() => {
    if (!draft) return [];
    const inBodyTopics = new Set(extractTopicsFromText(draft.body));
    return (draft.topics || []).filter(
      (t) => !inBodyTopics.has(t.replace(/^#/, ''))
    );
  }, [draft?.body, draft?.topics]);

  const isOverLimit = useMemo(
    () => isCoverOverLimit(draft?.coverLines || []),
    [draft?.coverLines]
  );

  return (
    <div className={`${styles.iphoneFrame} ${className || ''}`}>
      <div className={styles.screenInner}>
        {/* 顶部拟真状态栏与灵动岛 */}
        <header className={styles.statusBar}>
          <span className={styles.statusTime}>9:41</span>
          <div className={styles.dynamicIsland}>
            <div className={styles.islandCamera} />
          </div>
          <div className={styles.statusIcons}>
            {/* 5G 信号 */}
            <svg width="15" height="11" viewBox="0 0 17 12" fill="currentColor">
              <rect x="0" y="9" width="3" height="3" rx="0.5" />
              <rect x="4.5" y="6" width="3" height="6" rx="0.5" />
              <rect x="9" y="3" width="3" height="9" rx="0.5" />
              <rect x="13.5" y="0" width="3" height="12" rx="0.5" />
            </svg>
            {/* WiFi */}
            <svg width="15" height="11" viewBox="0 0 16 12" fill="currentColor">
              <path d="M8 9.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm-4.24-3.24a6 6 0 0 1 8.48 0l-1.06 1.06a4.5 4.5 0 0 0-6.36 0L3.76 6.26zm-2.83-2.83a10 10 0 0 1 14.14 0l-1.06 1.06a8.5 8.5 0 0 0-12.02 0L.93 3.43z" />
            </svg>
            {/* 电池 */}
            <svg width="22" height="11" viewBox="0 0 24 12" fill="none">
              <rect
                x="0.5"
                y="0.5"
                width="20"
                height="11"
                rx="3.5"
                stroke="currentColor"
              />
              <rect
                x="2"
                y="2"
                width="17"
                height="8"
                rx="2"
                fill="#34c759"
              />
              <path
                d="M22 4.5v3c.6 0 1-.4 1-1v-1c0-.6-.4-1-1-1z"
                fill="currentColor"
              />
            </svg>
          </div>
        </header>

        {!draft ? (
          <div className={styles.emptyHint}>
            <span>📱</span>
            <span>请在左侧选择一篇笔记预览</span>
          </div>
        ) : (
          <>
            {/* 笔记顶部作者栏 */}
            <nav className={styles.authorBar}>
              <button
                type="button"
                className={styles.backBtn}
                title="返回"
                aria-label="返回"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>

              <div className={styles.authorInfo}>
                <div className={styles.authorAvatar}>
                  {account?.avatarUrl ? (
                    <img
                      src={account.avatarUrl}
                      alt={authorDisplayName}
                      className={styles.authorAvatarImg}
                    />
                  ) : (
                    <span>{authorInitial}</span>
                  )}
                </div>
                <div className={styles.authorDetails}>
                  <span className={styles.authorName}>{authorDisplayName}</span>
                </div>
                <button type="button" className={styles.followBtn}>
                  关注
                </button>
              </div>

              <div className={styles.headerActions}>
                <button
                  type="button"
                  className={styles.iconBtn}
                  title="分享"
                  aria-label="分享"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                </button>
                <button
                  type="button"
                  className={styles.iconBtn}
                  title="更多"
                  aria-label="更多"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <circle cx="5" cy="12" r="2" />
                    <circle cx="12" cy="12" r="2" />
                    <circle cx="19" cy="12" r="2" />
                  </svg>
                </button>
              </div>
            </nav>

            {/* 双图画廊轮播切换区 (3:4) */}
            <div className={styles.gallery} onClick={() => handleNextSlide()}>
              {/* 所属测试结果画像徽章 */}
              {resultLabel && (
                <div
                  className={styles.mobileResultTag}
                  title={`所属测试结果画像: ${resultLabel.full}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className={styles.mobileResultTagIcon}>🔖</span>
                  <span className={styles.mobileResultTagText}>{resultLabel.full}</span>
                </div>
              )}

              {/* 右上角指示胶囊 */}
              <div className={styles.slideIndicator}>
                {currentSlide + 1}/2
              </div>

              {/* 左右微型切换按钮 */}
              <button
                type="button"
                className={`${styles.navArrow} ${styles.navArrowLeft}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentSlide(0);
                }}
                title="上一张"
                aria-label="上一张"
              >
                ‹
              </button>
              <button
                type="button"
                className={`${styles.navArrow} ${styles.navArrowRight}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentSlide(1);
                }}
                title="下一张"
                aria-label="下一张"
              >
                ›
              </button>

              {/* P1: 封面大字卡 */}
              {currentSlide === 0 && (
                <div className={styles.p1CoverCard}>
                  <div className={styles.coverBadge}>深度测评</div>

                  <div className={styles.coverLinesWrapper}>
                    {draft.coverLines && draft.coverLines.length > 0 ? (
                      draft.coverLines.map((line, idx) => (
                        <div key={idx} className={styles.coverLineText}>
                          {line}
                        </div>
                      ))
                    ) : (
                      <div className={styles.coverLineText}>（暂无封面大字）</div>
                    )}
                  </div>

                  {isOverLimit && (
                    <div className={styles.coverWarning}>
                      ⚠️ 封面总字数超过 16 字
                    </div>
                  )}

                  <div className={styles.coverFooterHint}>
                    点击查看完整测评 ➔
                  </div>
                </div>
              )}

              {/* P2: 切片图展示 */}
              {currentSlide === 1 && (
                <div className={styles.p2SliceCard}>
                  {loadingSlice ? (
                    <div className={styles.shimmerBox}>
                      <span>正在加载高清切片...</span>
                    </div>
                  ) : sliceError ? (
                    <div className={styles.errorBox}>
                      <span>{sliceError}</span>
                      <button
                        type="button"
                        className={styles.retryBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          fetchSlice();
                        }}
                      >
                        重试
                      </button>
                    </div>
                  ) : sliceUrl ? (
                    <>
                      <img
                        src={sliceUrl}
                        alt="切片图"
                        className={styles.sliceImage}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSliceClick) {
                            onSliceClick(sliceUrl);
                          } else {
                            handleNextSlide();
                          }
                        }}
                        title="点击放大查看切片"
                      />
                      <button
                        type="button"
                        className={styles.refreshSliceBtn}
                        onClick={handleRefreshClick}
                        title="重新随机截取一段母本切片"
                      >
                        <span>🎲</span>
                        <span>换个切片</span>
                      </button>
                    </>
                  ) : (
                    <div className={styles.shimmerBox}>
                      <span>未找到切片素材</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 图文正文排版区 */}
            <article className={styles.noteContent}>
              <h2 className={styles.noteTitle}>{draft.title || '（无标题）'}</h2>

              <div className={styles.noteBody}>
                {(draft.body || '').split(/\r?\n/).map((line, lIdx) => {
                  if (!line.trim()) {
                    return <div key={lIdx} className={styles.paragraph} />;
                  }

                  const parts = splitTextWithTopics(line);
                  return (
                    <p key={lIdx} className={styles.paragraph}>
                      {parts.map((p, pIdx) =>
                        p.isTopic ? (
                          <span key={pIdx} className={styles.topicTag}>
                            {p.text}
                          </span>
                        ) : (
                          <React.Fragment key={pIdx}>{p.text}</React.Fragment>
                        )
                      )}
                    </p>
                  );
                })}

                {/* 正文后附加话题 */}
                {extraTopicsToRender.length > 0 && (
                  <div className={styles.extraTopicsList}>
                    {extraTopicsToRender.map((t, idx) => (
                      <span key={idx} className={styles.topicTag}>
                        #{t.replace(/^#/, '')}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <footer className={styles.noteFooterMeta}>
                <span>刚刚</span>
                <span> · </span>
                <span>北京</span>
              </footer>
            </article>
          </>
        )}
      </div>

      {/* 底部吸底互动栏 */}
      <footer className={styles.bottomBar}>
        <div className={styles.inputMock}>说点什么...</div>
        <div className={styles.interactionIcons}>
          {/* 点赞 */}
          <div className={styles.iconGroup} title="赞">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#555"
              strokeWidth="2"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <span>2.4k</span>
          </div>

          {/* 收藏 */}
          <div className={styles.iconGroup} title="收藏">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#555"
              strokeWidth="2"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span>1.8k</span>
          </div>

          {/* 评论 */}
          <div className={styles.iconGroup} title="评论">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#555"
              strokeWidth="2"
            >
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
            <span>328</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
