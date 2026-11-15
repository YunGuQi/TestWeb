// 手机复制板 · 纯展示/复制（公开访问、无口令、无自动发帖、无 CDP、无 worker）
(function () {
  'use strict';

  const TESTS = [
    { id: 'family-origin', name: '大女主觉醒测试' },
    { id: 'emo', name: '深度情绪内耗测试' },
    { id: 'destiny-lover', name: '命定恋人测试' },
    { id: 'city', name: '性格城市匹配测试' },
    { id: 'love-species', name: '恋爱物种分析' },
  ];

  const state = {
    tests: TESTS,
    activeTestId: 'family-origin',
    data: null,
    suites: [],
    activeSuiteId: 'empty',
    cards: [],
    filteredCards: [],
    currentIndex: 0,
    activeAccount: 'all',
    hidePublished: false,
    publishedMap: {},
    localImageMap: {},
    isLoadingRemote: false,
  };

  const el = {
    wechatModal: document.getElementById('wechat-modal'),
    btnCloseWechat: document.getElementById('btn-close-wechat'),
    lightboxModal: document.getElementById('lightbox-modal'),
    lightboxImg: document.getElementById('lightbox-img'),
    appContainer: document.getElementById('app-container'),
    productName: document.getElementById('product-name'),
    testFilter: document.getElementById('test-filter'),
    suiteFilter: document.getElementById('suite-filter'),
    accountFilter: document.getElementById('account-filter'),
    hidePublished: document.getElementById('hide-published'),
    progressIndicator: document.getElementById('progress-indicator'),
    btnPrev: document.getElementById('btn-prev'),
    btnNext: document.getElementById('btn-next'),
    badgeCode: document.getElementById('badge-code'),
    badgeMode: document.getElementById('badge-mode'),
    conflictBanner: document.getElementById('conflict-banner'),
    conflictText: document.getElementById('conflict-text'),
    cardView: document.getElementById('card-view'),
    publishedStamp: document.getElementById('published-stamp'),
    stampAccount: document.getElementById('stamp-account'),
    cardResultName: document.getElementById('card-result-name'),
    cardGoods: document.getElementById('card-goods'),
    sliceGallery: document.getElementById('slice-gallery'),
    btnCopyCover: document.getElementById('btn-copy-cover'),
    previewCover: document.getElementById('preview-cover'),
    btnCopyTitle: document.getElementById('btn-copy-title'),
    previewTitle: document.getElementById('preview-title'),
    btnCopyBody: document.getElementById('btn-copy-body'),
    previewBody: document.getElementById('preview-body'),
    btnCopyTags: document.getElementById('btn-copy-tags'),
    previewTags: document.getElementById('preview-tags'),
    btnLaunchXhs: document.getElementById('btn-launch-xhs'),
    btnTogglePublish: document.getElementById('btn-toggle-publish'),
    btnPublishText: document.getElementById('btn-publish-text'),
    toast: document.getElementById('app-toast'),
    toastText: document.getElementById('toast-text'),
    mdFileInput: document.getElementById('md-file-input'),
    imgFileInput: document.getElementById('img-file-input'),
    btnSaveAllSlices: document.getElementById('btn-save-all-slices'),
    btnLightboxDownload: document.getElementById('btn-lightbox-download'),
    cropModal: document.getElementById('crop-modal'),
    cropModalSub: document.getElementById('crop-modal-sub'),
    btnCropCloseX: document.getElementById('btn-crop-close-x'),
    cropViewport: document.getElementById('crop-viewport'),
    cropOriginalImg: document.getElementById('crop-original-img'),
    cropBox: document.getElementById('crop-box'),
    cropPreviewCanvas: document.getElementById('crop-preview-canvas'),
    cropOffsetText: document.getElementById('crop-offset-text'),
    cropRangeText: document.getElementById('crop-range-text'),
    cropSlider: document.getElementById('crop-slider'),
    btnCropStepUp50: document.getElementById('btn-crop-step-up-50'),
    btnCropStepUp10: document.getElementById('btn-crop-step-up-10'),
    btnCropStepDown10: document.getElementById('btn-crop-step-down-10'),
    btnCropStepDown50: document.getElementById('btn-crop-step-down-50'),
    btnCropReset: document.getElementById('btn-crop-reset'),
    btnCropCancel: document.getElementById('btn-crop-cancel'),
    btnCropConfirm: document.getElementById('btn-crop-confirm'),
    btnCropShare: document.getElementById('btn-crop-share'),
  };

  let toastTimer = null;
  let currentLightbox = { url: '', filename: '' };
  let appViewBound = false;

  function showToast(msg, duration = 1500) {
    if (!el.toast || !el.toastText) return;
    el.toastText.textContent = msg;
    el.toast.style.display = 'block';
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.toast.style.display = 'none';
      toastTimer = null;
    }, duration);
  }

  function triggerHaptic(duration = 25) {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(duration);
      } catch (_) {}
    }
  }

  async function copyToClipboard(text, btnEl, labelName) {
    if (!text) {
      showToast('内容为空');
      return;
    }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      triggerHaptic(20);
      showToast(`已复制${labelName || ''}`);
      if (btnEl) {
        btnEl.classList.add('copy-success');
        setTimeout(() => btnEl.classList.remove('copy-success'), 1200);
      }
    } catch (err) {
      showToast(`复制失败: ${err.message || err}`);
    }
  }

  function formatDate(isoStr) {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const h = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      return `${m}-${day} ${h}:${min}`;
    } catch (_) {
      return isoStr;
    }
  }

  function getRecordKey(cardId, suiteId) {
    const sId = suiteId || state.activeSuiteId || 'default';
    const tId = state.activeTestId || 'family-origin';
    return `${tId}__${sId}__${cardId}`;
  }

  function getPublishRecord(cardId, suiteId) {
    const key = getRecordKey(cardId, suiteId);
    if (state.publishedMap[key]) return state.publishedMap[key];
    return null;
  }

  const RESULT_ORIGINALS_MAP = {
    r1: 'r1.png',
    r2: 'r2.png',
    r3: 'r3.png',
    r4: 'r4.png',
    r5: 'r5.png',
    r6: 'r6.png',
  };

  function getOriginalImageInfo(card) {
    if (state.activeTestId !== 'family-origin' || !card) return null;
    let code = (card.resultCode || '').toLowerCase();
    if (!RESULT_ORIGINALS_MAP[code]) {
      const m = String(card.id || '').match(/r[1-6]/i);
      if (m) code = m[0].toLowerCase();
    }
    const origFile = RESULT_ORIGINALS_MAP[code];
    if (!origFile) return null;
    return {
      resultCode: code,
      filename: origFile,
      url: `./data/family-origin/originals/${origFile}`,
    };
  }

  function getSavedCropOffset(card) {
    if (!card) return null;
    const cardKey = `xhs_crop_offset_${card.id}`;
    const resKey = `xhs_crop_offset_${(card.resultCode || '').toLowerCase()}`;
    const val = localStorage.getItem(cardKey) || localStorage.getItem(resKey);
    if (val !== null && !isNaN(Number(val))) {
      return parseInt(val, 10);
    }
    return null;
  }

  function saveCropOffset(card, offset) {
    if (!card) return;
    const cardKey = `xhs_crop_offset_${card.id}`;
    const resKey = `xhs_crop_offset_${(card.resultCode || '').toLowerCase()}`;
    localStorage.setItem(cardKey, String(offset));
    localStorage.setItem(resKey, String(offset));
  }

  const croppedBlobCache = {};

  async function getCroppedSliceUrl(origUrl, offset, naturalW, cropH) {
    const cacheKey = `${origUrl}_${offset}`;
    if (croppedBlobCache[cacheKey]) {
      return croppedBlobCache[cacheKey];
    }
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const w = naturalW || img.naturalWidth || 1074;
        const h = cropH || Math.round(img.naturalHeight / 3);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, offset, w, h, 0, 0, w, h);
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            croppedBlobCache[cacheKey] = url;
            resolve(url);
          } else {
            resolve(origUrl);
          }
        }, 'image/png');
      };
      img.onerror = () => resolve(origUrl);
      img.src = origUrl;
    });
  }

  function renderTestOptions() {
    if (!el.testFilter) return;
    el.testFilter.innerHTML = '';
    state.tests.forEach((t) => {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = t.name;
      el.testFilter.appendChild(opt);
    });
    el.testFilter.value = state.activeTestId;
  }

  function renderSuiteOptions() {
    if (!el.suiteFilter) return;
    el.suiteFilter.innerHTML = '';
    if (!state.suites || state.suites.length === 0) {
      const opt = document.createElement('option');
      opt.value = 'empty';
      opt.textContent = '暂无文案';
      el.suiteFilter.appendChild(opt);
      el.suiteFilter.value = 'empty';
      return;
    }
    state.suites.forEach((suite) => {
      const opt = document.createElement('option');
      opt.value = suite.id;
      const count =
        suite.totalCards != null
          ? suite.totalCards
          : suite.cards
          ? suite.cards.length
          : 0;
      const text =
        suite.displayName ||
        `${suite.date ? suite.date + ' ' : ''}${suite.filename || suite.name} (${count}卡)`;
      opt.textContent = text;
      el.suiteFilter.appendChild(opt);
    });
    if (state.activeSuiteId) {
      el.suiteFilter.value = state.activeSuiteId;
    }
  }

  async function switchTest(testId, shouldToast = true) {
    const testDef = state.tests.find((t) => t.id === testId) || state.tests[0];
    state.activeTestId = testDef.id;
    if (el.testFilter) el.testFilter.value = testDef.id;

    // 动态同步页面标题和顶栏标题
    if (el.productName) el.productName.textContent = testDef.name;
    document.title = `${testDef.name} - 手机复制板`;

    // 刚性重置：卡片回到 01、账号筛选重置为全部、仅未发重置为关
    state.currentIndex = 0;
    state.activeAccount = 'all';
    if (el.accountFilter) el.accountFilter.value = 'all';
    state.hidePublished = false;
    if (el.hidePublished) el.hidePublished.checked = false;

    state.suites = [];
    state.cards = [];
    state.filteredCards = [];
    state.activeSuiteId = 'empty';

    localStorage.setItem('xhs_copy_active_test', testDef.id);

    try {
      state.isLoadingRemote = true;
      renderCurrentCard();
      const resp = await fetch(`./data/${testDef.id}/index.json?_t=${Date.now()}`, {
        cache: 'no-store',
      });
      if (resp.ok) {
        const list = await resp.json();
        if (Array.isArray(list) && list.length > 0) {
          state.suites = list.map((item) => {
            const count = item.totalCards != null ? item.totalCards : 0;
            const displayName = `${item.date ? item.date + ' ' : ''}${item.filename} (${count}卡)`;
            return {
              id: item.id || item.filename,
              filename: item.filename,
              date: item.date || '',
              title: item.title || item.filename,
              name: item.title || item.filename,
              displayName: displayName,
              totalCards: count,
              productName: testDef.name,
              isRemote: true,
              cards: null,
            };
          });

          renderSuiteOptions();
          const firstSuite = state.suites[0];
          await switchSuite(firstSuite.id, false);
          if (shouldToast) {
            showToast(`已切换至: ${testDef.name}`);
          }
          return;
        }
      }
    } catch (err) {
      console.warn(`拉取 ${testDef.id} 文案索引失败:`, err);
    } finally {
      state.isLoadingRemote = false;
    }

    // 该测试暂无文案
    initEmptyTestState(testDef.name);
    if (shouldToast) {
      showToast(`${testDef.name}: 暂无文案`);
    }
  }

  function initEmptyTestState(testName) {
    state.suites = [];
    state.activeSuiteId = 'empty';
    state.cards = [];
    state.filteredCards = [];
    state.currentIndex = 0;

    if (el.suiteFilter) {
      el.suiteFilter.innerHTML = '<option value="empty">暂无文案</option>';
      el.suiteFilter.value = 'empty';
    }
    filterCards();
    renderCurrentCard();
  }

  async function switchSuite(suiteId, shouldToast = true) {
    if (suiteId === 'empty') {
      const testDef = state.tests.find((t) => t.id === state.activeTestId);
      initEmptyTestState(testDef ? testDef.name : '手机复制板');
      return;
    }
    const suite = state.suites.find((s) => s.id === suiteId);
    if (!suite) return;

    // 若为远程且尚未解析拉取 cards
    if (suite.isRemote && (!suite.cards || !suite.cards.length)) {
      try {
        state.isLoadingRemote = true;
        if (shouldToast) showToast(`正在加载 ${suite.filename || suite.name}...`, 1000);
        const resp = await fetch(
          `./data/${state.activeTestId}/${encodeURIComponent(suite.filename)}?_t=${Date.now()}`
        );
        if (!resp.ok) {
          throw new Error(`HTTP ${resp.status}`);
        }
        const mdText = await resp.text();
        const parsed = window.CopyBoardParse.parseCopyMd(mdText, {
          localImageMap: state.localImageMap,
          testId: state.activeTestId,
        });
        suite.cards = parsed.cards || [];
        suite.totalCards = suite.cards.length;
      } catch (err) {
        showToast(`加载文案失败: ${err && err.message ? err.message : err}`);
        return;
      } finally {
        state.isLoadingRemote = false;
      }
    }

    state.activeSuiteId = suite.id;
    state.cards = suite.cards || [];
    state.currentIndex = 0;
    if (el.suiteFilter) el.suiteFilter.value = suite.id;
    const testDef = state.tests.find((t) => t.id === state.activeTestId);
    if (el.productName) {
      el.productName.textContent = testDef ? testDef.name : suite.productName || '手机复制板';
    }
    localStorage.setItem('xhs_copy_active_suite', suite.id);
    filterCards();
    renderCurrentCard();
    if (shouldToast) {
      const count = suite.cards ? suite.cards.length : 0;
      showToast(`已切换至: ${suite.title || suite.filename || suite.name} (${count}卡)`);
    }
  }

  function filterCards() {
    const { cards, activeAccount, hidePublished } = state;
    state.filteredCards = (cards || []).filter((c) => {
      const rec = getPublishRecord(c.id);
      if (hidePublished) {
        if (activeAccount === 'all') {
          if (rec && rec.published) return false;
        } else if (rec && rec.published && rec.account === activeAccount) {
          return false;
        }
      }
      return true;
    });
    if (state.currentIndex >= state.filteredCards.length) {
      state.currentIndex = Math.max(0, state.filteredCards.length - 1);
    }
  }

  function resolveImageUrl(url) {
    if (!url) return '';
    if (url.startsWith('blob:') || url.startsWith('http') || url.startsWith('data:')) return url;
    if (url.startsWith('/')) return url;
    const cleanUrl = url.replace(/^\.\//, '');
    const basePath = window.location.pathname.endsWith('/')
      ? window.location.pathname
      : window.location.pathname + '/';
    return basePath + cleanUrl;
  }

  function renderCurrentCard() {
    const { filteredCards, currentIndex, activeAccount } = state;

    if (!filteredCards || filteredCards.length === 0) {
      const testDef = state.tests.find((t) => t.id === state.activeTestId);
      const testName = testDef ? testDef.name : '该测试';
      const isRemoteEmpty =
        !state.suites || state.suites.length === 0 || state.activeSuiteId === 'empty';

      el.cardResultName.textContent = state.isLoadingRemote
        ? '正在从服务器加载文案…'
        : isRemoteEmpty
        ? '暂无文案'
        : '请先选择或导入发帖文案';
      el.cardGoods.textContent = state.isLoadingRemote
        ? '请稍候，正在获取卡片数据'
        : isRemoteEmpty
        ? `【${testName}】暂未录入文案`
        : '选择上方文案或右上角「导入文案」';
      el.previewCover.textContent = isRemoteEmpty ? '（暂无文案）' : '';
      el.previewTitle.textContent = isRemoteEmpty ? '（暂无文案）' : '';
      el.previewBody.textContent = isRemoteEmpty ? '（暂无文案）' : '';
      el.previewTags.textContent = '';
      el.sliceGallery.innerHTML = isRemoteEmpty
        ? '<div style="padding: 32px 16px; text-align: center; color: #94a3b8; font-size: 14px;">暂无切片</div>'
        : '<div style="padding: 24px; text-align: center; color: #94a3b8;">暂无切片。导入文案后可再点「导入切片」匹配图片文件名</div>';
      el.progressIndicator.textContent = '00 / 00';
      el.badgeCode.textContent = '--';
      el.badgeMode.textContent = '--';
      el.btnPrev.disabled = true;
      el.btnNext.disabled = true;
      el.conflictBanner.style.display = 'none';
      el.publishedStamp.style.display = 'none';
      el.btnTogglePublish.disabled = true;
      el.btnPublishText.textContent = '暂无卡片';
      return;
    }

    el.btnTogglePublish.disabled = false;
    const card = filteredCards[currentIndex];

    el.btnPrev.disabled = currentIndex === 0;
    el.btnNext.disabled = currentIndex === filteredCards.length - 1;
    el.progressIndicator.textContent = `${String(currentIndex + 1).padStart(2, '0')} / ${String(
      filteredCards.length
    ).padStart(2, '0')}`;

    el.badgeCode.textContent = card.resultCode || 'r1';
    el.badgeMode.textContent = card.mode || '模式一';
    el.cardResultName.textContent = card.resultName || '测试画像';
    el.cardGoods.textContent = card.goods || '测试模板';

    const rec = getPublishRecord(card.id);
    if (rec && rec.published) {
      el.publishedStamp.style.display = 'block';
      el.stampAccount.textContent = rec.account || '矩阵号';
      el.cardView.classList.add('is-published');
      el.btnTogglePublish.classList.add('is-marked');
      el.btnPublishText.textContent = '↺ 撤销标记已发布';
      if (activeAccount !== 'all' && rec.account !== activeAccount) {
        el.conflictBanner.style.display = 'flex';
        el.conflictText.textContent = `⚠️ 预警：该卡片已于 ${formatDate(
          rec.publishedAt
        )} 由【${rec.account}】发布`;
      } else {
        el.conflictBanner.style.display = 'none';
      }
    } else {
      el.publishedStamp.style.display = 'none';
      el.cardView.classList.remove('is-published');
      el.conflictBanner.style.display = 'none';
      el.btnTogglePublish.classList.remove('is-marked');
      const targetAcc =
        activeAccount === 'all' ? state.data?.accounts?.[0] || '老号' : activeAccount;
      el.btnPublishText.textContent = `✅ 标记为 [${targetAcc}] 已发布`;
    }

    el.sliceGallery.innerHTML = '';
    if (Array.isArray(card.images) && card.images.length > 0) {
      card.images.forEach((img, idx) => {
        const item = document.createElement('div');
        item.className = 'gallery-card';

        const label = document.createElement('span');
        label.className = 'gallery-label';
        label.textContent = img.label || `P${idx + 1}`;

        const resolvedUrl = resolveImageUrl(img.url);
        const resolvedFallbackUrl = img.fallbackUrl ? resolveImageUrl(img.fallbackUrl) : '';
        const filename = img.filename || `${card.id}_slice.png`;

        const imgEl = document.createElement('img');
        imgEl.className = 'gallery-img';
        imgEl.src = resolvedUrl;
        imgEl.alt = img.label || '切片';
        imgEl.loading = 'lazy';

        const origInfo = getOriginalImageInfo(card);
        const savedOffset = origInfo ? getSavedCropOffset(card) : null;

        // 若大女主测试且本地曾重裁过，自动按保存的偏移量裁剪展示
        if (origInfo && savedOffset !== null) {
          getCroppedSliceUrl(origInfo.url, savedOffset).then((customUrl) => {
            if (customUrl && imgEl.isConnected) {
              imgEl.src = customUrl;
            }
          });
        }

        let triedFallback = false;
        imgEl.addEventListener('error', () => {
          // 双规则兜底：规则1（slice字段）找不到时，自动尝试规则2（{cardId}_slice.png）
          if (!triedFallback && resolvedFallbackUrl && imgEl.src !== resolvedFallbackUrl) {
            triedFallback = true;
            console.warn(
              `[CopyBoard] 主切片未找到 (${img.filename})，自动回退备用规则 (${img.rule2}): ${resolvedFallbackUrl}`
            );
            imgEl.src = resolvedFallbackUrl;
            return;
          }
          item.innerHTML = `
            <span class="gallery-label">${img.label || '切片图'}</span>
            <div style="height: 140px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.03); border-radius: 8px; color: #94a3b8; font-size: 13px; border: 1px dashed rgba(255,255,255,0.1); flex-direction: column; gap: 4px;">
              <span>暂无切片</span>
              <span style="font-size: 11px; color: #64748b;">${filename}</span>
            </div>
          `;
        });
        imgEl.addEventListener('click', () => openLightbox(imgEl.src || resolvedUrl, filename));

        const footer = document.createElement('div');
        footer.className = 'gallery-footer';

        const actionRow = document.createElement('div');
        actionRow.className = 'gallery-footer-row';

        const saveBtn = document.createElement('button');
        saveBtn.className = 'btn-save-slice';
        saveBtn.type = 'button';
        saveBtn.innerHTML = '📥 保存此图';
        saveBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          downloadImageBlob(imgEl.src || resolvedUrl, filename);
        });
        actionRow.appendChild(saveBtn);

        const shareBtn = document.createElement('button');
        shareBtn.className = 'btn-share-slice';
        shareBtn.type = 'button';
        shareBtn.innerHTML = '📤 保存到相册';
        shareBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          shareSliceToAlbum(imgEl.src || resolvedUrl, filename);
        });
        actionRow.appendChild(shareBtn);

        footer.appendChild(actionRow);

        // 仅大女主觉醒测试切片显示“🔄 重新裁剪”按钮
        if (origInfo) {
          const recropBtn = document.createElement('button');
          recropBtn.className = 'btn-recrop-slice';
          recropBtn.type = 'button';
          recropBtn.innerHTML = '🔄 重新裁剪';
          recropBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openCropModal(card, img, imgEl);
          });
          footer.appendChild(recropBtn);
        }

        item.appendChild(label);
        item.appendChild(imgEl);
        item.appendChild(footer);
        el.sliceGallery.appendChild(item);
      });
    } else {
      el.sliceGallery.innerHTML =
        '<div style="padding: 24px; text-align: center; color: #94a3b8;">暂无切片</div>';
    }

    // 封面展示全部行（通常 3 行）
    el.previewCover.textContent = card.cover?.text || (card.cover?.lines || []).join('\n') || '';
    el.previewTitle.textContent = card.title || '';
    el.previewBody.textContent = card.body || '';
    el.previewTags.textContent = card.formattedTags || (card.tags || []).join(' ');

    el.btnCopyCover.onclick = () =>
      copyToClipboard(card.cover?.text || '', el.btnCopyCover, '封面文案');
    el.btnCopyTitle.onclick = () => copyToClipboard(card.title || '', el.btnCopyTitle, '标题文案');
    el.btnCopyBody.onclick = () => copyToClipboard(card.body || '', el.btnCopyBody, '纯净正文');
    el.btnCopyTags.onclick = () =>
      copyToClipboard(card.formattedTags || '', el.btnCopyTags, '话题标签');
  }

  function openLightbox(url, filename) {
    if (!el.lightboxModal || !el.lightboxImg) return;
    currentLightbox = { url, filename: filename || 'xhs_slice.png' };
    el.lightboxImg.src = url;
    el.lightboxModal.style.display = 'flex';
  }

  function closeLightbox() {
    if (!el.lightboxModal) return;
    el.lightboxModal.style.display = 'none';
  }

  async function downloadImageBlob(url, filename) {
    if (!url) return;
    try {
      showToast('正在准备保存图片...', 1000);
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const blob = await resp.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename || 'xhs_slice.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
      triggerHaptic(20);
      showToast(`已开始下载: ${filename}`);
    } catch (err) {
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'xhs_slice.png';
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast('已调起图片保存');
    }
  }

  async function shareOrFallbackDownload(blob, filename, blobUrl) {
    const url = blobUrl || URL.createObjectURL(blob);
    let canShare = false;
    let file = null;

    try {
      if (typeof File !== 'undefined' && navigator.share && navigator.canShare) {
        file = new File([blob], filename, { type: blob.type || 'image/png' });
        canShare = navigator.canShare({ files: [file] });
      }
    } catch (e) {
      canShare = false;
    }

    if (canShare && file) {
      try {
        showToast('请在分享菜单中点存储图像', 2500);
        await navigator.share({
          files: [file],
          title: filename,
        });
        triggerHaptic(30);
        return;
      } catch (shareErr) {
        // 用户在系统分享菜单中点击取消或关闭（AbortError），视为正常完成，不报错、不重复下载
        if (
          shareErr.name === 'AbortError' ||
          (shareErr.message && shareErr.message.toLowerCase().includes('cancel'))
        ) {
          return;
        }
        console.warn('Share failed with non-cancel error, falling back:', shareErr);
      }
    }

    // 不支持系统分享（canShare=false 或没有 navigator.share）或非取消异常时回退为原生下载
    showToast('当前浏览器不支持直接保存到相册，已改为下载，请去下载文件夹里保存到相册', 3000);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    triggerHaptic(20);
  }

  async function shareSliceToAlbum(url, filename) {
    if (!url) return;
    try {
      showToast('正在准备保存图片...', 1000);
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const blob = await resp.blob();
      await shareOrFallbackDownload(blob, filename || 'xhs_slice.png');
    } catch (err) {
      console.warn('Fetch image failed, direct fallback:', err);
      showToast('当前浏览器不支持直接保存到相册，已改为下载，请去下载文件夹里保存到相册', 3000);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'xhs_slice.png';
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }

  async function downloadAllCurrentImages() {
    const { filteredCards, currentIndex } = state;
    if (!filteredCards || !filteredCards[currentIndex]) return;
    const card = filteredCards[currentIndex];
    const images = (card.images || []).filter((img) => img.url);
    if (!images.length) {
      showToast('当前卡片没有可保存的图片');
      return;
    }
    showToast(`正在保存 ${images.length} 张图片...`, 1500);
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const resolvedUrl = resolveImageUrl(img.url);
      const filename = img.filename || `${card.id}_p${i + 1}.png`;
      await downloadImageBlob(resolvedUrl, filename);
      await new Promise((r) => setTimeout(r, 350));
    }
  }

  // ====== 切片重裁模块 (大女主觉醒测试专属) ======
  const cropState = {
    active: false,
    card: null,
    imgData: null,
    targetImgEl: null,
    origInfo: null,
    imgObj: null,
    naturalW: 1074,
    naturalH: 6288,
    cropH: 2096,
    maxOffset: 4192,
    currentOffset: 1048,
    defaultOffset: 1048,
    isDragging: false,
    dragStartY: 0,
    dragStartOffset: 0,
  };

  function setCropOffset(offset) {
    if (!cropState.imgObj) return;
    cropState.currentOffset = Math.max(0, Math.min(cropState.maxOffset, Math.round(offset)));
    syncCropUI();
  }

  function syncCropUI() {
    if (!cropState.imgObj) return;
    if (el.cropOffsetText) el.cropOffsetText.textContent = String(cropState.currentOffset);
    if (el.cropRangeText) el.cropRangeText.textContent = `(范围: 0 ~ ${cropState.maxOffset} px)`;
    if (el.cropSlider) el.cropSlider.value = String(cropState.currentOffset);

    // 视口与裁剪框尺寸匹配
    if (el.cropViewport && el.cropBox) {
      const vpHeight = el.cropViewport.clientHeight || 280;
      const scale = vpHeight / cropState.naturalH;
      const boxHeight = Math.max(20, Math.round(cropState.cropH * scale));
      const boxTop = Math.round(cropState.currentOffset * scale);
      el.cropBox.style.height = `${boxHeight}px`;
      el.cropBox.style.top = `${boxTop}px`;
    }

    // 实时 Canvas 预览
    renderCropPreview();
  }

  function renderCropPreview() {
    if (!cropState.imgObj || !el.cropPreviewCanvas) return;
    const canvas = el.cropPreviewCanvas;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(
      cropState.imgObj,
      0, cropState.currentOffset, cropState.naturalW, cropState.cropH,
      0, 0, canvas.width, canvas.height
    );
  }

  function openCropModal(card, imgData, imgEl) {
    const origInfo = getOriginalImageInfo(card);
    if (!origInfo) {
      showToast('未找到该卡对应的原图全景');
      return;
    }
    cropState.active = true;
    cropState.card = card;
    cropState.imgData = imgData;
    cropState.targetImgEl = imgEl;
    cropState.origInfo = origInfo;

    if (el.cropModalSub) {
      el.cropModalSub.textContent = `${card.resultCode || 'r1'} · ${card.resultName || ''} (${origInfo.filename})`;
    }

    if (el.cropOriginalImg) {
      el.cropOriginalImg.src = origInfo.url;
    }

    showToast('正在加载原图全图...', 800);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      cropState.imgObj = img;
      cropState.naturalW = img.naturalWidth || 1074;
      cropState.naturalH = img.naturalHeight || 6288;
      cropState.cropH = Math.round(cropState.naturalH / 3);
      cropState.maxOffset = Math.max(0, cropState.naturalH - cropState.cropH);
      cropState.defaultOffset = Math.round(cropState.maxOffset / 4);

      const saved = getSavedCropOffset(card);
      cropState.currentOffset = (saved !== null)
        ? Math.max(0, Math.min(cropState.maxOffset, saved))
        : cropState.defaultOffset;

      if (el.cropSlider) {
        el.cropSlider.min = '0';
        el.cropSlider.max = String(cropState.maxOffset);
        el.cropSlider.value = String(cropState.currentOffset);
      }

      if (el.cropPreviewCanvas) {
        el.cropPreviewCanvas.width = 600;
        el.cropPreviewCanvas.height = Math.round(600 * (cropState.cropH / cropState.naturalW));
      }

      if (el.cropModal) el.cropModal.style.display = 'flex';
      requestAnimationFrame(() => {
        syncCropUI();
      });
    };
    img.onerror = () => {
      showToast('加载原图失败，请检查网络或服务器文件');
    };
    img.src = origInfo.url;
  }

  function closeCropModal() {
    cropState.active = false;
    cropState.imgObj = null;
    if (el.cropModal) el.cropModal.style.display = 'none';
  }

  async function confirmRecrop() {
    if (!cropState.imgObj || !cropState.card) {
      closeCropModal();
      return;
    }
    try {
      showToast('正在按原图分辨率裁切...', 1000);
      const outCanvas = document.createElement('canvas');
      outCanvas.width = cropState.naturalW;
      outCanvas.height = cropState.cropH;
      const ctx = outCanvas.getContext('2d');
      ctx.drawImage(
        cropState.imgObj,
        0, cropState.currentOffset, cropState.naturalW, cropState.cropH,
        0, 0, cropState.naturalW, cropState.cropH
      );

      outCanvas.toBlob((blob) => {
        if (!blob) {
          showToast('生成裁剪图片失败');
          return;
        }
        const filename = cropState.imgData?.filename || `${cropState.card.id}_slice.png`;
        const blobUrl = URL.createObjectURL(blob);

        // 存入内存缓存
        const cacheKey = `${cropState.origInfo.url}_${cropState.currentOffset}`;
        croppedBlobCache[cacheKey] = blobUrl;

        // 保存位置到 localStorage
        saveCropOffset(cropState.card, cropState.currentOffset);

        // 更新当前页面画廊该切片展示
        if (cropState.targetImgEl) {
          cropState.targetImgEl.src = blobUrl;
        }

        // 自动触发原生下载
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        triggerHaptic(30);
        showToast(`已重裁并下载: ${filename}`);
        closeCropModal();
      }, 'image/png');
    } catch (err) {
      showToast(`裁图失败: ${err.message || err}`);
    }
  }

  async function shareRecropToAlbum() {
    if (!cropState.imgObj || !cropState.card) {
      closeCropModal();
      return;
    }
    try {
      showToast('正在按原图分辨率裁切...', 1000);
      const outCanvas = document.createElement('canvas');
      outCanvas.width = cropState.naturalW;
      outCanvas.height = cropState.cropH;
      const ctx = outCanvas.getContext('2d');
      ctx.drawImage(
        cropState.imgObj,
        0, cropState.currentOffset, cropState.naturalW, cropState.cropH,
        0, 0, cropState.naturalW, cropState.cropH
      );

      outCanvas.toBlob(async (blob) => {
        if (!blob) {
          showToast('生成裁剪图片失败');
          return;
        }
        const filename = cropState.imgData?.filename || `${cropState.card.id}_slice.png`;
        const blobUrl = URL.createObjectURL(blob);

        // 存入内存缓存
        const cacheKey = `${cropState.origInfo.url}_${cropState.currentOffset}`;
        croppedBlobCache[cacheKey] = blobUrl;

        // 保存位置到 localStorage
        saveCropOffset(cropState.card, cropState.currentOffset);

        // 更新当前页面画廊该切片展示
        if (cropState.targetImgEl) {
          cropState.targetImgEl.src = blobUrl;
        }

        // 先关弹窗，再调分享
        closeCropModal();

        // 调起分享或回退下载
        await shareOrFallbackDownload(blob, filename, blobUrl);
      }, 'image/png');
    } catch (err) {
      showToast(`裁图失败: ${err.message || err}`);
    }
  }

  function initCropInteraction() {
    if (!el.cropViewport) return;

    if (el.cropSlider) {
      el.cropSlider.addEventListener('input', () => {
        setCropOffset(parseInt(el.cropSlider.value, 10));
      });
    }

    if (el.btnCropStepUp50) {
      el.btnCropStepUp50.addEventListener('click', (e) => {
        e.preventDefault();
        setCropOffset(cropState.currentOffset - 50);
      });
    }
    if (el.btnCropStepUp10) {
      el.btnCropStepUp10.addEventListener('click', (e) => {
        e.preventDefault();
        setCropOffset(cropState.currentOffset - 10);
      });
    }
    if (el.btnCropStepDown10) {
      el.btnCropStepDown10.addEventListener('click', (e) => {
        e.preventDefault();
        setCropOffset(cropState.currentOffset + 10);
      });
    }
    if (el.btnCropStepDown50) {
      el.btnCropStepDown50.addEventListener('click', (e) => {
        e.preventDefault();
        setCropOffset(cropState.currentOffset + 50);
      });
    }
    if (el.btnCropReset) {
      el.btnCropReset.addEventListener('click', (e) => {
        e.preventDefault();
        setCropOffset(cropState.defaultOffset);
      });
    }

    // Pointer Events（手指 Touch 与 鼠标 Drag）
    el.cropViewport.addEventListener('pointerdown', (e) => {
      if (!cropState.imgObj) return;
      cropState.isDragging = true;
      cropState.dragStartY = e.clientY;
      cropState.dragStartOffset = cropState.currentOffset;
      try {
        el.cropViewport.setPointerCapture(e.pointerId);
      } catch (_) {}
    });

    el.cropViewport.addEventListener('pointermove', (e) => {
      if (!cropState.isDragging || !cropState.imgObj) return;
      const deltaYScreen = e.clientY - cropState.dragStartY;
      const vpHeight = el.cropViewport.clientHeight || 280;
      const scale = vpHeight / cropState.naturalH;
      const deltaYReal = deltaYScreen / scale;
      setCropOffset(Math.round(cropState.dragStartOffset + deltaYReal));
    });

    const stopDrag = (e) => {
      if (cropState.isDragging) {
        cropState.isDragging = false;
        try {
          if (e && e.pointerId != null) el.cropViewport.releasePointerCapture(e.pointerId);
        } catch (_) {}
      }
    };
    el.cropViewport.addEventListener('pointerup', stopDrag);
    el.cropViewport.addEventListener('pointercancel', stopDrag);

    if (el.btnCropCloseX) el.btnCropCloseX.addEventListener('click', closeCropModal);
    if (el.btnCropCancel) el.btnCropCancel.addEventListener('click', closeCropModal);
    if (el.btnCropConfirm) el.btnCropConfirm.addEventListener('click', confirmRecrop);
    if (el.btnCropShare) el.btnCropShare.addEventListener('click', shareRecropToAlbum);

    if (el.cropModal) {
      el.cropModal.addEventListener('click', (e) => {
        if (e.target === el.cropModal) closeCropModal();
      });
    }
  }

  function refreshCardImagesFromLocalMap() {
    state.suites.forEach((suite) => {
      (suite.cards || []).forEach((card) => {
        if (!window.CopyBoardParse) return;
        card.images = window.CopyBoardParse.buildImages(
          card.id,
          card.slice,
          state.localImageMap,
          state.activeTestId
        );
      });
    });
    const suite = state.suites.find((s) => s.id === state.activeSuiteId);
    if (suite) state.cards = suite.cards || [];
    filterCards();
    renderCurrentCard();
  }

  function parseClientMd(mdText, fileName) {
    if (!window.CopyBoardParse || typeof window.CopyBoardParse.parseCopyMd !== 'function') {
      showToast('解析器未加载');
      return;
    }
    try {
      const result = window.CopyBoardParse.parseCopyMd(mdText, {
        localImageMap: state.localImageMap,
        testId: state.activeTestId,
      });
      if (result.errors && result.errors.length && (!result.cards || !result.cards.length)) {
        showToast(result.errors[0]);
        return;
      }
      if (!result.cards.length) {
        showToast('未在文件中识别到标准卡片格式 (```text ... ```)');
        return;
      }

      const testDef = state.tests.find((t) => t.id === state.activeTestId);
      const testName = testDef ? testDef.name : '本地导入';
      const cleanName = fileName ? fileName.replace(/\.md$/i, '') : '本地导入文案';
      const newSuiteId = 'imported_' + Date.now().toString(36);
      const newSuite = {
        id: newSuiteId,
        filename: fileName || 'local.md',
        name: `📂 ${cleanName}`,
        displayName: `[本地导入] ${fileName || cleanName} (${result.cards.length}卡)`,
        category: '本地导入',
        productName: testName,
        totalCards: result.cards.length,
        isRemote: false,
        cards: result.cards,
      };
      state.suites = state.suites.filter((s) => s.id !== 'empty');
      state.suites.unshift(newSuite);
      renderSuiteOptions();
      switchSuite(newSuiteId, false);
      showToast(`成功载入【${cleanName}】共 ${result.cards.length} 张卡片`);
    } catch (err) {
      showToast('解析 MD 失败: ' + (err && err.message ? err.message : err));
    }
  }

  function handleImageFiles(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    let added = 0;
    files.forEach((file) => {
      const name = file.name;
      const url = URL.createObjectURL(file);
      state.localImageMap[name] = url;
      added += 1;
    });
    refreshCardImagesFromLocalMap();
    showToast(`已导入 ${added} 张切片图（当前测试: ${state.activeTestId}）`);
  }

  function togglePublishStatus() {
    const { filteredCards, currentIndex, activeAccount } = state;
    if (!filteredCards || !filteredCards[currentIndex]) return;
    const card = filteredCards[currentIndex];
    const key = getRecordKey(card.id);
    const rec = getPublishRecord(card.id);

    if (rec && rec.published) {
      delete state.publishedMap[key];
      localStorage.setItem('xhs_copy_records_v1', JSON.stringify(state.publishedMap));
      triggerHaptic(20);
      showToast('已撤销发布标记');
    } else {
      const targetAcc =
        activeAccount === 'all' ? state.data?.accounts?.[0] || '老号' : activeAccount;
      state.publishedMap[key] = {
        published: true,
        account: targetAcc,
        publishedAt: new Date().toISOString(),
      };
      localStorage.setItem('xhs_copy_records_v1', JSON.stringify(state.publishedMap));
      triggerHaptic(40);
      showToast(`已标记为 [${targetAcc}] 发布`);
    }
    filterCards();
    renderCurrentCard();
  }

  function launchXhsApp() {
    triggerHaptic(30);
    const ua = navigator.userAgent || '';
    const isWeChat = /MicroMessenger/i.test(ua);
    if (isWeChat) {
      if (el.wechatModal) el.wechatModal.style.display = 'flex';
      return;
    }
    const schemes = ['xhsdiscover://', 'xhs://'];
    let idx = 0;
    function tryNext() {
      if (idx >= schemes.length) {
        showToast('请直接手动在手机桌面打开小红书 App');
        return;
      }
      const s = schemes[idx++];
      window.location.href = s;
      setTimeout(tryNext, 600);
    }
    tryNext();
  }

  function setupGestures() {
    if (!el.cardView) return;
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;

    el.cardView.addEventListener(
      'touchstart',
      (e) => {
        if (!e.touches || !e.touches[0]) return;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      },
      { passive: true }
    );

    el.cardView.addEventListener(
      'touchend',
      (e) => {
        if (!e.changedTouches || !e.changedTouches[0]) return;
        touchEndX = e.changedTouches[0].clientX;
        touchEndY = e.changedTouches[0].clientY;
        handleSwipe();
      },
      { passive: true }
    );

    function handleSwipe() {
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;
      if (Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
        if (deltaX < 0) {
          if (state.currentIndex < state.filteredCards.length - 1) {
            state.currentIndex++;
            renderCurrentCard();
            triggerHaptic(15);
          }
        } else {
          if (state.currentIndex > 0) {
            state.currentIndex--;
            renderCurrentCard();
            triggerHaptic(15);
          }
        }
      }
    }

    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        if (state.currentIndex < state.filteredCards.length - 1) {
          state.currentIndex++;
          renderCurrentCard();
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        if (state.currentIndex > 0) {
          state.currentIndex--;
          renderCurrentCard();
        }
      }
    });
  }

  function initAppView() {
    if (!appViewBound) {
      renderTestOptions();

      const accounts = state.data?.accounts || ['安安 (老号)', '新号_01'];
      el.accountFilter.innerHTML = '<option value="all">全部账号</option>';
      accounts.forEach((acc) => {
        const opt = document.createElement('option');
        opt.value = acc;
        opt.textContent = acc;
        el.accountFilter.appendChild(opt);
      });
      el.accountFilter.value = state.activeAccount;
      el.hidePublished.checked = state.hidePublished;

      if (el.testFilter) {
        el.testFilter.addEventListener('change', (e) => switchTest(e.target.value));
      }
      if (el.suiteFilter) {
        el.suiteFilter.addEventListener('change', (e) => switchSuite(e.target.value));
      }
      el.accountFilter.addEventListener('change', (e) => {
        state.activeAccount = e.target.value;
        localStorage.setItem('xhs_copy_active_account', state.activeAccount);
        filterCards();
        renderCurrentCard();
      });
      el.hidePublished.addEventListener('change', (e) => {
        state.hidePublished = e.target.checked;
        localStorage.setItem('xhs_copy_hide_published', String(state.hidePublished));
        filterCards();
        renderCurrentCard();
      });
      el.btnPrev.addEventListener('click', () => {
        if (state.currentIndex > 0) {
          state.currentIndex--;
          renderCurrentCard();
        }
      });
      el.btnNext.addEventListener('click', () => {
        if (state.currentIndex < state.filteredCards.length - 1) {
          state.currentIndex++;
          renderCurrentCard();
        }
      });
      el.btnLaunchXhs.addEventListener('click', launchXhsApp);
      el.btnTogglePublish.addEventListener('click', togglePublishStatus);
      if (el.btnSaveAllSlices) {
        el.btnSaveAllSlices.addEventListener('click', downloadAllCurrentImages);
      }
      if (el.btnLightboxDownload) {
        el.btnLightboxDownload.addEventListener('click', (e) => {
          e.stopPropagation();
          downloadImageBlob(currentLightbox.url, currentLightbox.filename);
        });
      }
      el.lightboxModal.addEventListener('click', closeLightbox);
      if (el.mdFileInput) {
        el.mdFileInput.addEventListener('change', (e) => {
          const file = e.target.files && e.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (evt) => {
            if (typeof evt.target.result === 'string') {
              parseClientMd(evt.target.result, file.name);
            }
          };
          reader.onerror = () => showToast('读取所选文件失败');
          reader.readAsText(file, 'UTF-8');
          e.target.value = '';
        });
      }
      if (el.imgFileInput) {
        el.imgFileInput.addEventListener('change', (e) => {
          handleImageFiles(e.target.files);
          e.target.value = '';
        });
      }
      el.btnCloseWechat.addEventListener('click', () => {
        el.wechatModal.style.display = 'none';
      });
      setupGestures();
      initCropInteraction();
      appViewBound = true;
    }

    const savedTest = localStorage.getItem('xhs_copy_active_test');
    const initialTestId =
      savedTest && state.tests.some((t) => t.id === savedTest) ? savedTest : 'family-origin';
    switchTest(initialTestId, false);
  }

  function main() {
    try {
      state.publishedMap = JSON.parse(localStorage.getItem('xhs_copy_records_v1') || '{}');
      state.activeAccount = localStorage.getItem('xhs_copy_active_account') || 'all';
      state.hidePublished = localStorage.getItem('xhs_copy_hide_published') === 'true';
    } catch (_) {
      state.publishedMap = {};
    }

    state.data = window.__HUB_DATA__ || {
      productName: '手机复制板',
      accounts: ['安安 (老号)', '新号_01'],
      activeSuiteId: 'empty',
      suites: [],
      cards: [],
    };
    state.cards = state.data.cards || [];

    initAppView();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
  } else {
    main();
  }
})();
