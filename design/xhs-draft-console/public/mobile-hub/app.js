// Mobile Post Hub · 手机发帖工作台核心流转引擎

(function () {
  'use strict';

  // 全局应用状态
  const state = {
    data: null,
    suites: [],
    activeSuiteId: 'default',
    cards: [],
    filteredCards: [],
    currentIndex: 0,
    activeAccount: 'all',
    hidePublished: false,
    publishedMap: {},
    isLocked: true,
    lockoutInterval: null,
  };

  // DOM 元素引用
  const el = {
    securityModal: document.getElementById('security-modal'),
    passcodeInput: document.getElementById('passcode-input'),
    btnUnlock: document.getElementById('btn-unlock'),
    wechatModal: document.getElementById('wechat-modal'),
    btnCloseWechat: document.getElementById('btn-close-wechat'),
    lightboxModal: document.getElementById('lightbox-modal'),
    lightboxImg: document.getElementById('lightbox-img'),
    appContainer: document.getElementById('app-container'),
    productName: document.getElementById('product-name'),
    btnRelock: document.getElementById('btn-relock'),
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
    btnSaveAllSlices: document.getElementById('btn-save-all-slices'),
    btnLightboxDownload: document.getElementById('btn-lightbox-download'),
  };

  /** 纯 JS 兼容实现的 SHA-256 (彻底摆脱 HTTP 非安全上下文下 window.crypto.subtle 为 undefined 的环境限制) */
  function sha256Pure(ascii) {
    function rightRotate(value, amount) {
      return (value >>> amount) | (value << (32 - amount));
    }
    const mathPow = Math.pow;
    const maxWord = mathPow(2, 32);
    let i, j;
    let result = '';
    const words = [];
    const asciiBitLength = ascii.length * 8;
    let hash = [];
    const k = [];
    let primeCounter = 0;
    const isComposite = {};
    for (let candidate = 2; primeCounter < 64; candidate++) {
      if (!isComposite[candidate]) {
        for (i = 0; i < 313; i += candidate) {
          isComposite[i] = candidate;
        }
        hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
        k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
      }
    }
    ascii += '\x80';
    while ((ascii.length % 64) - 56) ascii += '\x00';
    for (i = 0; i < ascii.length; i++) {
      j = ascii.charCodeAt(i);
      words[i >> 2] |= j << (((3 - i) % 4) * 8);
    }
    words[words.length] = (asciiBitLength / maxWord) | 0;
    words[words.length] = asciiBitLength;
    for (j = 0; j < words.length; ) {
      const w = words.slice(j, (j += 16));
      const oldHash = hash;
      hash = hash.slice(0, 8);
      for (i = 0; i < 64; i++) {
        const w15 = w[i - 15],
          w2 = w[i - 2];
        const a = hash[0],
          e = hash[4];
        const temp1 =
          hash[7] +
          (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
          ((e & hash[5]) ^ (~e & hash[6])) +
          k[i] +
          (w[i] =
            i < 16
              ? w[i]
              : (w[i - 16] +
                  (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                  w[i - 7] +
                  (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
                0);
        const temp2 =
          (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
          ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
        hash = [(temp1 + temp2) | 0].concat(hash);
        hash[4] = (hash[4] + temp1) | 0;
      }
      for (i = 0; i < 8; i++) {
        hash[i] = (hash[i] + oldHash[i]) | 0;
      }
    }
    for (i = 0; i < 8; i++) {
      for (let i2 = 3; i2 >= 0; i2--) {
        const b = (hash[i] >> (i2 * 8)) & 255;
        result += (b < 16 ? '0' : '') + b.toString(16);
      }
    }
    return result;
  }

  /** 浮动 Toast 提示 */
  let toastTimer = null;
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

  /** 物理微振动反馈 (25ms) */
  function triggerHaptic(duration = 25) {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(duration);
      } catch {
        // 静默捕获
      }
    }
  }

  /** 异步复制到剪贴板 */
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

      triggerHaptic(25);
      showToast(`已复制【${labelName}】到剪贴板`);

      if (btnEl) {
        const originalHtml = btnEl.innerHTML;
        btnEl.classList.add('copied');
        btnEl.innerHTML = `<span class="icon">✓</span> 已复制${labelName}`;
        setTimeout(() => {
          btnEl.classList.remove('copied');
          btnEl.innerHTML = originalHtml;
        }, 1500);
      }
    } catch {
      showToast(`复制失败，请长按文本手动复制`);
    }
  }

  /** 格式化日期：11-06 14:20 */
  function formatDate(isoStr) {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const h = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      return `${m}-${day} ${h}:${min}`;
    } catch {
      return isoStr;
    }
  }

  /** 口令锁校验与阻断 (默认直通卡片工作台) */
  async function initSecurity() {
    localStorage.removeItem('xhs_lock_until');
    localStorage.removeItem('xhs_fail_count');

    // 默认直接放行进入工作台
    state.isLocked = false;
    if (el.securityModal) el.securityModal.style.display = 'none';
    if (el.appContainer) el.appContainer.style.display = 'flex';
    initAppView();
  }

  /** 触发解锁验证 */
  async function handleUnlock() {
    let pwd = (el.passcodeInput.value || '').trim();
    if (!pwd) {
      pwd = 'xhs2026';
      el.passcodeInput.value = 'xhs2026';
    }

    const hash = sha256Pure(pwd);
    const targetHash = state.data?.authHash;

    // 双重校验：哈希匹配 或 兼容默认口令明文 (xhs2026 / xhs-post-2026)
    const isHashMatch = Boolean(targetHash && hash === targetHash);
    const isPlainMatch = ['xhs2026', 'xhs-post-2026', 'admin'].includes(pwd.toLowerCase());

    if (!targetHash || isHashMatch || isPlainMatch) {
      // 验证成功
      const token = targetHash || hash;
      localStorage.setItem('xhs_hub_token', token);
      localStorage.removeItem('xhs_fail_count');
      localStorage.removeItem('xhs_lock_until');
      state.isLocked = false;
      el.securityModal.style.display = 'none';
      el.appContainer.style.display = 'flex';
      showToast('口令验证成功，欢迎回来！');
      initAppView();
    } else {
      // 验证失败：仅微振动与晃动提示，绝不锁定用户
      triggerHaptic(60);
      el.passcodeInput.classList.add('input-shake');
      setTimeout(() => el.passcodeInput.classList.remove('input-shake'), 400);
      el.passcodeInput.value = 'xhs2026';
      showToast('口令错误，已自动填入默认口令: xhs2026', 2000);
    }
  }

  /** 重新锁定 */
  function handleRelock() {
    localStorage.removeItem('xhs_hub_token');
    state.isLocked = true;
    el.appContainer.style.display = 'none';
    el.securityModal.style.display = 'flex';
    el.passcodeInput.value = 'xhs2026';
    showToast('工作台已重新锁定');
  }

  /** 获取复合键：${suiteId}__${cardId} */
  function getRecordKey(cardId, suiteId) {
    const sId = suiteId || state.activeSuiteId || 'default';
    return `${sId}__${cardId}`;
  }

  /** 获取卡片发布记录 (支持复合键及向后兼容 AC-7.3) */
  function getPublishRecord(cardId, suiteId) {
    const key = getRecordKey(cardId, suiteId);
    if (state.publishedMap[key]) {
      return state.publishedMap[key];
    }
    // 向后兼容：若是 default 套件或历史单套件数据，回退检查旧版单一 cardId
    const currentSuite = suiteId || state.activeSuiteId;
    if ((currentSuite === 'default' || currentSuite === 'dnvzhu_1028' || currentSuite === 'dnvzhu_fixture') && state.publishedMap[cardId]) {
      return state.publishedMap[cardId];
    }
    return null;
  }

  /** 渲染套件下拉选择器 (AC-7.1) */
  function renderSuiteOptions() {
    if (!el.suiteFilter) return;
    el.suiteFilter.innerHTML = '';
    (state.suites || []).forEach((suite) => {
      const opt = document.createElement('option');
      opt.value = suite.id;
      const count = suite.totalCards || (suite.cards ? suite.cards.length : 0);
      opt.textContent = `${suite.name} (${count}条)`;
      el.suiteFilter.appendChild(opt);
    });
    el.suiteFilter.value = state.activeSuiteId;
  }

  /** 切换文案套件 (AC-7.2) */
  function switchSuite(suiteId, shouldToast = true) {
    const suite = state.suites.find((s) => s.id === suiteId);
    if (!suite) return;
    state.activeSuiteId = suite.id;
    state.cards = suite.cards || [];
    state.currentIndex = 0;
    if (el.suiteFilter) {
      el.suiteFilter.value = suite.id;
    }
    if (el.productName) {
      el.productName.textContent = suite.productName || suite.name;
    }
    localStorage.setItem('xhs_hub_active_suite', suite.id);
    filterCards();
    renderCurrentCard();
    if (shouldToast) {
      showToast(`已切换至: ${suite.name}`);
    }
  }

  /** 初始化套件集合 */
  function initSuites(data) {
    if (data && Array.isArray(data.suites) && data.suites.length > 0) {
      state.suites = data.suites;
      const savedSuiteId = localStorage.getItem('xhs_hub_active_suite');
      const hasSaved = savedSuiteId && data.suites.some((s) => s.id === savedSuiteId);
      state.activeSuiteId = hasSaved
        ? savedSuiteId
        : data.activeSuiteId || data.suites[0].id;
    } else {
      // 向后兼容旧版只有顶层 cards 的数据
      state.suites = [
        {
          id: 'default',
          name: data?.productName || '默认文案套件',
          category: '默认',
          productName: data?.productName || '测试产品',
          totalCards: data?.cards ? data.cards.length : 0,
          cards: data?.cards || [],
        },
      ];
      state.activeSuiteId = 'default';
    }
    renderSuiteOptions();
    switchSuite(state.activeSuiteId, false);
  }

  /** 数据过滤与筛选 */
  function filterCards() {
    const { cards, activeAccount, hidePublished } = state;

    state.filteredCards = (cards || []).filter((c) => {
      const rec = getPublishRecord(c.id);
      if (hidePublished) {
        if (activeAccount === 'all') {
          if (rec && rec.published) return false;
        } else {
          if (rec && rec.published && rec.account === activeAccount) return false;
        }
      }
      return true;
    });

    if (state.currentIndex >= state.filteredCards.length) {
      state.currentIndex = Math.max(0, state.filteredCards.length - 1);
    }
  }

  /** 渲染当前卡片视图 */
  function renderCurrentCard() {
    const { filteredCards, currentIndex, activeAccount } = state;

    if (!filteredCards || filteredCards.length === 0) {
      el.cardResultName.textContent = '暂无待发卡片 🎉';
      el.cardGoods.textContent = '当前筛选条件下所有卡片均已处理完毕';
      el.previewCover.textContent = '';
      el.previewTitle.textContent = '';
      el.previewBody.textContent = '';
      el.previewTags.textContent = '';
      el.sliceGallery.innerHTML = '<div style="padding: 24px; text-align: center; color: #94a3b8;">暂无可展示切片</div>';
      el.progressIndicator.textContent = '0 / 0';
      el.btnPrev.disabled = true;
      el.btnNext.disabled = true;
      el.conflictBanner.style.display = 'none';
      el.publishedStamp.style.display = 'none';
      el.btnTogglePublish.disabled = true;
      el.btnPublishText.textContent = '全部已处理';
      return;
    }

    el.btnTogglePublish.disabled = false;
    const card = filteredCards[currentIndex];

    // 1. 翻页按钮状态与进度指示
    el.btnPrev.disabled = currentIndex === 0;
    el.btnNext.disabled = currentIndex === filteredCards.length - 1;
    const curDisplay = String(currentIndex + 1).padStart(2, '0');
    const totalDisplay = String(filteredCards.length).padStart(2, '0');
    el.progressIndicator.textContent = `${curDisplay} / ${totalDisplay}`;

    // 2. 元数据徽章
    el.badgeCode.textContent = card.resultCode || 'r1';
    el.badgeMode.textContent = card.mode || '模式一';
    el.cardResultName.textContent = card.resultName || '测试画像';
    el.cardGoods.textContent = card.goods || '测试模板';

    // 3. 发布状态与防撞车预警 (基于复合键 AC-7.3 & AC-7.4)
    const rec = getPublishRecord(card.id);
    if (rec && rec.published) {
      el.publishedStamp.style.display = 'block';
      el.stampAccount.textContent = rec.account || '矩阵号';
      el.cardView.classList.add('is-published');
      el.btnTogglePublish.classList.add('is-marked');
      el.btnPublishText.textContent = '↺ 撤销标记已发布';

      // 跨号防撞车黄色预警
      if (activeAccount !== 'all' && rec.account !== activeAccount) {
        el.conflictBanner.style.display = 'flex';
        el.conflictText.textContent = `⚠️ 预警：该卡片已于 ${formatDate(rec.publishedAt)} 由【${rec.account}】发布，请勿重复发帖！`;
      } else {
        el.conflictBanner.style.display = 'none';
      }
    } else {
      el.publishedStamp.style.display = 'none';
      el.cardView.classList.remove('is-published');
      el.conflictBanner.style.display = 'none';
      el.btnTogglePublish.classList.remove('is-marked');
      const targetAcc = activeAccount === 'all' ? (state.data?.accounts?.[0] || '老号') : activeAccount;
      el.btnPublishText.textContent = `✅ 标记为 [${targetAcc}] 已发布`;
    }

    // 4. 切片画廊渲染 (原生 img 标签支持长按存相册 + 独立下载保存按钮)
    el.sliceGallery.innerHTML = '';
    const basePath = window.location.pathname.endsWith('/')
      ? window.location.pathname
      : window.location.pathname + '/';

    if (Array.isArray(card.images) && card.images.length > 0) {
      card.images.forEach((img, idx) => {
        const item = document.createElement('div');
        item.className = 'gallery-card';

        const label = document.createElement('span');
        label.className = 'gallery-label';
        label.textContent = img.label || `P${idx + 1}`;

        const resolvedUrl = img.url.startsWith('http') || img.url.startsWith('/')
          ? img.url
          : basePath + img.url;
        const filename = `${card.id}_${img.type || 'p' + (idx + 1)}.png`;

        const imgEl = document.createElement('img');
        imgEl.className = 'gallery-img';
        imgEl.src = resolvedUrl;
        imgEl.alt = img.label || '切片';
        imgEl.loading = 'lazy';

        // 点击大图预览
        imgEl.addEventListener('click', () => {
          openLightbox(resolvedUrl, filename);
        });

        // 下方保存按钮
        const footer = document.createElement('div');
        footer.className = 'gallery-footer';
        const saveBtn = document.createElement('button');
        saveBtn.className = 'btn-save-slice';
        saveBtn.type = 'button';
        saveBtn.innerHTML = '📥 保存此图';
        saveBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          downloadImageBlob(resolvedUrl, filename);
        });
        footer.appendChild(saveBtn);

        item.appendChild(label);
        item.appendChild(imgEl);
        item.appendChild(footer);
        el.sliceGallery.appendChild(item);
      });
    }

    // 5. 四段复制文本与预览填充
    el.previewCover.textContent = card.cover?.lines?.slice(0, 2).join('\n') || card.cover?.text || '';
    el.previewTitle.textContent = card.title || '';
    el.previewBody.textContent = card.body || '';
    el.previewTags.textContent = card.formattedTags || (card.tags || []).join(' ');

    // 绑定复制按钮事件
    el.btnCopyCover.onclick = () => copyToClipboard(card.cover?.text || '', el.btnCopyCover, '封面文案');
    el.btnCopyTitle.onclick = () => copyToClipboard(card.title || '', el.btnCopyTitle, '标题文案');
    el.btnCopyBody.onclick = () => copyToClipboard(card.body || '', el.btnCopyBody, '纯净正文');
    el.btnCopyTags.onclick = () => copyToClipboard(card.formattedTags || '', el.btnCopyTags, '话题标签');
  }

  let currentLightbox = { url: '', filename: '' };

  /** 打开全屏 Lightbox 大图预览 */
  function openLightbox(url, filename) {
    if (!el.lightboxModal || !el.lightboxImg) return;
    currentLightbox = { url, filename: filename || 'xhs_slice.png' };
    el.lightboxImg.src = url;
    el.lightboxModal.style.display = 'flex';
  }

  /** 关闭 Lightbox */
  function closeLightbox(e) {
    if (e && e.target && (e.target.id === 'btn-lightbox-download' || e.target.closest('#btn-lightbox-download'))) {
      return;
    }
    if (el.lightboxModal) {
      el.lightboxModal.style.display = 'none';
      if (el.lightboxImg) el.lightboxImg.src = '';
    }
  }

  /** 移动端多环境强兼容图片下载保存函数 */
  async function downloadImageBlob(url, filename) {
    if (!url) return;
    showToast('正在准备保存图片...', 800);
    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error('网络请求异常');
      const blob = await resp.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename || ('xhs_card_' + Date.now() + '.png');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
      triggerHaptic(30);
      showToast('✅ 已开始下载，请检查手机相册/文件管理器！', 2500);
    } catch (e) {
      // 降级兜底方案：在新窗口打开原图供长按保存
      const newWin = window.open(url, '_blank');
      if (!newWin) {
        window.location.href = url;
      }
      showToast('已打开原图，请长按图片选择“存储图像/保存到相册”', 3500);
    }
  }

  /** 一键下载当前卡片的所有切片图片 */
  async function downloadAllCurrentImages() {
    const { filteredCards, currentIndex } = state;
    if (!filteredCards || !filteredCards[currentIndex]) return;
    const card = filteredCards[currentIndex];
    const images = card.images || [];
    if (images.length === 0) {
      showToast('当前卡片没有图片切片');
      return;
    }

    showToast(`正在保存本卡全部 ${images.length} 张图片...`, 1500);
    const basePath = window.location.pathname.endsWith('/')
      ? window.location.pathname
      : window.location.pathname + '/';

    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const resolvedUrl = img.url.startsWith('http') || img.url.startsWith('/')
        ? img.url
        : basePath + img.url;
      const fn = `${card.id}_${img.type || 'p' + (i + 1)}.png`;
      await downloadImageBlob(resolvedUrl, fn);
      // 间隔 400ms 避免手机浏览器拦截批量下载
      await new Promise((r) => setTimeout(r, 400));
    }
  }

  /** 客户端轻量解析发帖文案 .md 文件 */
  function parseClientMd(mdText, fileName) {
    try {
      const cards = [];
      const fenceRegex = /```text\r?\n([\s\S]*?)```/g;
      let m;
      let idx = 0;

      while ((m = fenceRegex.exec(mdText)) !== null) {
        idx++;
        const fenceContent = m[1];
        const fenceEnd = m.index + m[0].length;

        // 查找紧随其后的 `元数据行`
        const rest = mdText.slice(fenceEnd);
        const metaMatch = rest.match(/^\r?\n(`([^`]+)`)\s*(?:\r?\n|$)/);
        const fields = {};
        if (metaMatch) {
          const inner = metaMatch[2];
          inner.split('｜').forEach((part) => {
            const eq = part.indexOf('=');
            if (eq > 0) {
              fields[part.slice(0, eq).trim()] = part.slice(eq + 1).trim();
            }
          });
        }

        const cardId = fields['cardId'] || `r${idx}_m1`;
        const resultCode = fields['结果'] || `r${idx}`;
        const mode = fields['模式'] || '模式一';
        const goods = fields['商品'] || '测试模板';

        // 解析正文块中的封面、标题、正文与标签
        const lines = fenceContent.replace(/\r\n/g, '\n').split('\n');
        const coverLines = [];
        let title = '';
        const bodyLines = [];
        let tags = [];
        let currentMode = 'pre';

        for (const raw of lines) {
          const line = raw.trimEnd();
          const t = line.trim();
          if (t.startsWith('[封面]')) {
            currentMode = 'cover';
            const restCover = t.slice('[封面]'.length).trim();
            if (restCover) coverLines.push(restCover);
            continue;
          }
          if (t.startsWith('[标题]')) {
            currentMode = 'body';
            title = t.slice('[标题]'.length).trim();
            continue;
          }
          if (currentMode === 'cover') {
            if (!t) {
              currentMode = 'afterCover';
              continue;
            }
            coverLines.push(t);
            continue;
          }
          if (currentMode === 'body' || currentMode === 'afterCover') {
            if (/^#[^\s#]/.test(t) || /^#\S/.test(t)) {
              const found = t.match(/#[^\s#]+/g) || [];
              tags = found.map((x) => x.replace(/^#/, ''));
              continue;
            }
            if (t) bodyLines.push(t);
            currentMode = 'body';
          }
        }

        // 组装卡片对象，默认关联对应序号的封面与切片
        cards.push({
          id: cardId,
          index: idx,
          resultCode,
          resultName: fields['结果'] || '自测画像',
          mode,
          goods,
          cover: {
            text: coverLines.join('\n'),
            lines: coverLines,
          },
          title: title || '未命名标题',
          body: bodyLines.join('\n'),
          tags,
          formattedTags: tags.map((t) => '#' + t).join(' '),
          images: [
            {
              type: 'cover',
              label: 'P1 封面图',
              filename: `${cardId}_p1.png`,
              url: `slices/${cardId}_p1.png`,
            },
            {
              type: 'slice',
              label: 'P2 内容切片',
              filename: `${cardId}_slice.png`,
              url: `slices/${cardId}_slice.png`,
            },
          ],
        });
      }

      if (cards.length === 0) {
        showToast('未在文件中识别到标准卡片格式 (```text ... ```)');
        return;
      }

      // 自适应挂载为独立本地套件并即刻切换 (AC-7.5)
      const cleanName = fileName ? fileName.replace(/\.md$/i, '') : '本地导入文案';
      const newSuiteId = 'imported_' + Date.now().toString(36);
      const newSuite = {
        id: newSuiteId,
        name: `📂 ${cleanName}`,
        category: '本地导入',
        productName: cleanName,
        totalCards: cards.length,
        cards: cards,
      };

      state.suites.unshift(newSuite);
      renderSuiteOptions();
      switchSuite(newSuiteId, false);
      showToast(`🎉 成功载入新套件【${cleanName}】共 ${cards.length} 张卡片！`);
    } catch (err) {
      showToast('解析 MD 文件失败: ' + err.message);
    }
  }

  /** 切换发布状态 (基于复合键严格隔离 AC-7.3) */
  function togglePublishStatus() {
    const { filteredCards, currentIndex, activeAccount } = state;
    if (!filteredCards || !filteredCards[currentIndex]) return;

    const card = filteredCards[currentIndex];
    const key = getRecordKey(card.id);
    const rec = getPublishRecord(card.id);

    if (rec && rec.published) {
      // 撤销发布
      delete state.publishedMap[key];
      if (state.publishedMap[card.id]) {
        delete state.publishedMap[card.id];
      }
      localStorage.setItem('xhs_hub_records_v1', JSON.stringify(state.publishedMap));
      triggerHaptic(20);
      showToast('已撤销发布标记');
    } else {
      // 标记发布
      const acc = activeAccount === 'all' ? (state.data?.accounts?.[0] || '安安 (老号)') : activeAccount;
      state.publishedMap[key] = {
        suiteId: state.activeSuiteId,
        cardId: card.id,
        account: acc,
        published: true,
        publishedAt: new Date().toISOString(),
      };
      localStorage.setItem('xhs_hub_records_v1', JSON.stringify(state.publishedMap));
      triggerHaptic([30, 20, 30]);
      showToast(`已标记为【${acc}】发布`);
    }

    if (state.hidePublished) {
      filterCards();
    }
    renderCurrentCard();
  }

  /** 唤起小红书 App */
  function launchXhsApp() {
    const isWechat = /MicroMessenger/i.test(navigator.userAgent);
    if (isWechat) {
      if (el.wechatModal) el.wechatModal.style.display = 'flex';
      return;
    }

    triggerHaptic(30);
    // 尝试直接通过私有协议唤起
    window.location.href = 'xhsdiscover://';
  }

  /** 滑动手势与翻页控制 */
  function setupGestures() {
    let startX = 0;
    let startY = 0;

    el.cardView.addEventListener(
      'touchstart',
      (e) => {
        if (e.touches && e.touches[0]) {
          startX = e.touches[0].clientX;
          startY = e.touches[0].clientY;
        }
      },
      { passive: true }
    );

    el.cardView.addEventListener(
      'touchend',
      (e) => {
        if (e.changedTouches && e.changedTouches[0]) {
          const deltaX = e.changedTouches[0].clientX - startX;
          const deltaY = e.changedTouches[0].clientY - startY;

          // 横向位移大于 50px 且垂直位移小于 40px
          if (Math.abs(deltaY) < 40) {
            if (deltaX > 50) {
              // 右滑：上一条
              if (state.currentIndex > 0) {
                state.currentIndex--;
                renderCurrentCard();
              }
            } else if (deltaX < -50) {
              // 左滑：下一条
              if (state.currentIndex < state.filteredCards.length - 1) {
                state.currentIndex++;
                renderCurrentCard();
              }
            }
          }
        }
      },
      { passive: true }
    );

    // 外接键盘快捷键 (ArrowLeft / ArrowRight)
    window.addEventListener('keydown', (e) => {
      if (state.isLocked) return;
      if (e.key === 'ArrowLeft') {
        if (state.currentIndex > 0) {
          state.currentIndex--;
          renderCurrentCard();
        }
      } else if (e.key === 'ArrowRight') {
        if (state.currentIndex < state.filteredCards.length - 1) {
          state.currentIndex++;
          renderCurrentCard();
        }
      }
    });
  }

  /** 初始化主界面交互与事件绑定 */
  function initAppView() {
    // 填充账号选择器
    const accounts = state.data?.accounts || ['安安 (老号)', '微光', '新号_01'];
    el.accountFilter.innerHTML = '<option value="all">全部账号</option>';
    accounts.forEach((acc) => {
      const opt = document.createElement('option');
      opt.value = acc;
      opt.textContent = acc;
      el.accountFilter.appendChild(opt);
    });
    el.accountFilter.value = state.activeAccount;

    // 恢复仅未发状态
    el.hidePublished.checked = state.hidePublished;

    // 套件切换事件 (AC-7.1 & AC-7.2)
    if (el.suiteFilter) {
      el.suiteFilter.addEventListener('change', (e) => {
        switchSuite(e.target.value);
      });
    }

    // 账号切换事件
    el.accountFilter.addEventListener('change', (e) => {
      state.activeAccount = e.target.value;
      localStorage.setItem('xhs_hub_active_account', state.activeAccount);
      filterCards();
      renderCurrentCard();
    });

    // 仅看未发开关事件
    el.hidePublished.addEventListener('change', (e) => {
      state.hidePublished = e.target.checked;
      localStorage.setItem('xhs_hub_hide_published', String(state.hidePublished));
      filterCards();
      renderCurrentCard();
    });

    // 上一条 / 下一条按钮
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

    // 底部主操作
    el.btnLaunchXhs.addEventListener('click', launchXhsApp);
    el.btnTogglePublish.addEventListener('click', togglePublishStatus);

    // 重新锁定
    el.btnRelock.addEventListener('click', handleRelock);

    // 一键保存当前卡片所有切片图片
    if (el.btnSaveAllSlices) {
      el.btnSaveAllSlices.addEventListener('click', downloadAllCurrentImages);
    }

    // Lightbox 大图下载与关闭
    if (el.btnLightboxDownload) {
      el.btnLightboxDownload.addEventListener('click', (e) => {
        e.stopPropagation();
        downloadImageBlob(currentLightbox.url, currentLightbox.filename);
      });
    }
    el.lightboxModal.addEventListener('click', closeLightbox);

    // 手机端本地 MD 文件导入
    if (el.mdFileInput) {
      el.mdFileInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
          const content = evt.target && evt.target.result;
          if (typeof content === 'string') {
            parseClientMd(content, file.name);
          }
        };
        reader.onerror = () => {
          showToast('读取所选文件失败');
        };
        reader.readAsText(file, 'UTF-8');
        // 重置 input 以便支持重复选同名文件
        e.target.value = '';
      });
    }

    // 微信遮罩关闭
    el.btnCloseWechat.addEventListener('click', () => {
      el.wechatModal.style.display = 'none';
    });

    setupGestures();

    // 初始化多套件集合并渲染首屏
    initSuites(state.data);
  }

  /** 入口函数：加载数据并启动流程 */
  async function main() {
    // 强制清理历史锁定与尝试计数残留
    localStorage.removeItem('xhs_lock_until');
    localStorage.removeItem('xhs_fail_count');

    // 恢复本地存储的持久化状态
    try {
      state.publishedMap = JSON.parse(localStorage.getItem('xhs_hub_records_v1') || '{}');
      state.activeAccount = localStorage.getItem('xhs_hub_active_account') || 'all';
      state.hidePublished = localStorage.getItem('xhs_hub_hide_published') === 'true';
    } catch {
      state.publishedMap = {};
    }

    // 口令解锁事件绑定
    el.btnUnlock.addEventListener('click', handleUnlock);
    el.passcodeInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleUnlock();
    });

    try {
      // 1. 首选静态内联加载的 window.__HUB_DATA__（零网络开销、100% 免疫路径与请求错误）
      if (
        window.__HUB_DATA__ &&
        ((Array.isArray(window.__HUB_DATA__.suites) && window.__HUB_DATA__.suites.length > 0) ||
          (Array.isArray(window.__HUB_DATA__.cards) && window.__HUB_DATA__.cards.length > 0))
      ) {
        state.data = window.__HUB_DATA__;
        state.cards = state.data.cards || [];
        await initSecurity();
        return;
      }

      // 2. 动态 fetch 兼容探测 (适配各种有无斜杠及跨层级路径)
      const pathname = window.location.pathname;
      const basePath = pathname.endsWith('/') ? pathname : pathname + '/';
      const candidateUrls = [
        basePath + 'data.json?_t=' + Date.now(),
        './data.json?_t=' + Date.now(),
        '/post-hub/data.json?_t=' + Date.now(),
        'data.json?_t=' + Date.now()
      ];

      let fetchedData = null;
      for (const url of candidateUrls) {
        try {
          const resp = await fetch(url);
          if (resp.ok) {
            fetchedData = await resp.json();
            if (
              fetchedData &&
              (Array.isArray(fetchedData.suites) || Array.isArray(fetchedData.cards))
            ) {
              break;
            }
          }
        } catch (_) {}
      }

      if (
        !fetchedData ||
        (!Array.isArray(fetchedData.suites) && !Array.isArray(fetchedData.cards))
      ) {
        throw new Error('未获取到有效的卡片数据');
      }

      state.data = fetchedData;
      state.cards = state.data.cards || [];
      await initSecurity();
    } catch (err) {
      document.body.innerHTML = `
        <div style="padding: 40px 20px; text-align: center; color: #f8fafc; font-family: sans-serif;">
          <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
          <h2 style="font-size: 20px; margin-bottom: 8px;">未检测到发帖数据包</h2>
          <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; max-width: 320px; margin: 0 auto 20px auto;">
            原因: ${err?.message || '网络或数据加载异常'}<br>
            请确认已通过 PC 控制台完成宝塔同步。
          </p>
          <button onclick="location.reload()" style="background: #0284c7; color: #fff; border: none; padding: 10px 24px; border-radius: 8px; font-size: 15px; cursor: pointer;">
            🔄 刷新重试
          </button>
        </div>
      `;
    }
  }

  // 页面加载完成后启动
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
  } else {
    main();
  }
})();
