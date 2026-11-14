/**
 * 手机复制板 · 发帖文案 MD 最小解析器
 * 逻辑对齐 design/xhs-draft-console/lib/md/parse.ts（仅保留展示/复制所需字段）
 */
(function (global) {
  'use strict';

  var FENCE_RE = /```text\r?\n([\s\S]*?)```/g;

  function parseMetaLine(inner) {
    var fields = {};
    String(inner || '')
      .split(/[｜|]/)
      .forEach(function (part) {
        var i = part.indexOf('=');
        if (i <= 0) return;
        fields[part.slice(0, i).trim()] = part.slice(i + 1).trim();
      });
    return fields;
  }

  function parseTextBlock(body) {
    var lines = String(body || '')
      .replace(/\r\n/g, '\n')
      .split('\n');
    var coverLines = [];
    var title = '';
    var bodyLines = [];
    var tags = [];
    var mode = 'pre';

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].replace(/\s+$/, '');
      var t = line.replace(/^\s+/, '').replace(/\s+$/, '');
      if (t.indexOf('[封面]') === 0) {
        mode = 'cover';
        var rest = t.slice('[封面]'.length).replace(/^\s+/, '');
        if (rest) coverLines.push(rest);
        continue;
      }
      if (t.indexOf('[标题]') === 0) {
        mode = 'body';
        title = t.slice('[标题]'.length).replace(/^\s+/, '');
        continue;
      }
      if (mode === 'cover') {
        if (!t) {
          mode = 'afterCover';
          continue;
        }
        coverLines.push(t);
        continue;
      }
      if (mode === 'body' || mode === 'afterCover') {
        if (/^#[^\s#]/.test(t) || /^#\S/.test(t)) {
          var found = t.match(/#[^\s#]+/g) || [];
          tags = found.map(function (x) {
            return x.replace(/^#/, '');
          });
          continue;
        }
        if (t) bodyLines.push(t);
        mode = 'body';
      }
    }

    return {
      coverLines: coverLines,
      title: title,
      body: bodyLines.join('\n'),
      tags: tags,
    };
  }

  function formatTags(tags) {
    return (tags || [])
      .map(function (t) {
        return t.indexOf('#') === 0 ? t : '#' + t;
      })
      .join(' ');
  }

  function buildImages(cardId, sliceName, localImageMap, testId) {
    var images = [];
    var map = localImageMap || {};
    var coverKey = cardId + '_p1.png';
    var tId = testId || 'family-origin';
    var sliceBaseUrl = './data/' + tId + '/slices/';

    var rule1 = (sliceName || '').trim();
    var rule2 = cardId ? (cardId.trim() + '_slice.png') : '';
    var primaryKey = rule1 || rule2;
    var fallbackKey = (rule2 && rule2 !== primaryKey) ? rule2 : '';

    if (map[coverKey] || map[cardId + '_cover.png']) {
      images.push({
        type: 'cover',
        label: 'P1 封面图',
        filename: coverKey,
        url: map[coverKey] || map[cardId + '_cover.png'],
      });
    }

    if (map[primaryKey]) {
      images.push({
        type: 'slice',
        label: '切片图',
        filename: primaryKey,
        rule1: rule1,
        rule2: rule2,
        url: map[primaryKey],
        fallbackUrl: '',
      });
    } else if (map[fallbackKey]) {
      images.push({
        type: 'slice',
        label: '切片图',
        filename: fallbackKey,
        rule1: rule1,
        rule2: rule2,
        url: map[fallbackKey],
        fallbackUrl: '',
      });
    } else if (primaryKey) {
      images.push({
        type: 'slice',
        label: '切片图',
        filename: primaryKey,
        rule1: rule1,
        rule2: rule2,
        url: sliceBaseUrl + primaryKey,
        fallbackUrl: fallbackKey ? (sliceBaseUrl + fallbackKey) : '',
      });
    }

    if (images.length === 0 && map[coverKey]) {
      images.push({
        type: 'cover',
        label: 'P1 封面图',
        filename: coverKey,
        url: map[coverKey],
      });
    }

    return images;
  }

  /**
   * @param {string} mdText
   * @param {{ localImageMap?: Record<string,string>, testId?: string }} [opts]
   * @returns {{ cards: Array, errors: string[] }}
   */
  function parseCopyMd(mdText, opts) {
    var errors = [];
    var cards = [];
    var localImageMap = (opts && opts.localImageMap) || {};
    var testId = (opts && opts.testId) || 'family-origin';
    var index = 0;
    var m;
    FENCE_RE.lastIndex = 0;

    while ((m = FENCE_RE.exec(mdText))) {
      index += 1;
      var fenceEnd = m.index + m[0].length;
      var block = parseTextBlock(m[1]);
      var rest = mdText.slice(fenceEnd);
      var metaMatch = rest.match(/^\r?\n(`([^`]+)`)\s*(?:\r?\n|$)/);
      var fields = metaMatch ? parseMetaLine(metaMatch[2]) : {};

      var cardId = fields.cardId || 'card_' + index;
      var sliceName = fields['切片'] || '';
      var goods = fields['商品'] || '';
      var resultName = fields['结果'] || '';
      var mode = fields['模式'] || '';
      var status = fields['状态'] || '';

      var resultCode = 'r' + index;
      var codeMatch = String(cardId).match(/^(r\d+)/i);
      if (codeMatch) resultCode = codeMatch[1];

      cards.push({
        id: cardId,
        index: index,
        resultCode: resultCode,
        resultName: resultName || '自测画像',
        mode: mode || '模式一',
        goods: goods || '未标注商品',
        status: status,
        slice: sliceName,
        cover: {
          text: block.coverLines.join('\n'),
          lines: block.coverLines,
        },
        title: block.title || '',
        body: block.body || '',
        tags: block.tags || [],
        formattedTags: formatTags(block.tags || []),
        images: buildImages(cardId, sliceName, localImageMap, testId),
      });
    }

    if (!cards.length) {
      errors.push('未找到任何 ```text 卡块');
    }

    return { cards: cards, errors: errors };
  }

  global.CopyBoardParse = {
    parseCopyMd: parseCopyMd,
    parseMetaLine: parseMetaLine,
    parseTextBlock: parseTextBlock,
    formatTags: formatTags,
    buildImages: buildImages,
  };
})(typeof window !== 'undefined' ? window : globalThis);
