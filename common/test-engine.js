/**
 * 小红书测试矩阵 - 公共核心引擎
 * 提取海报截图生成、SPA路由拦截等各测试共用逻辑。
 */
window.TestEngine = {
    /**
     * 本地存储历史记录通用管理 (纯数据层)
     * 各测试页面负责自有 UI，这里只负责保持格式统一并控制最大长度
     */
    History: {
        MAX_ITEMS: 5,
        
        /**
         * 获取某个测试的历史记录列表
         * @param {string} storageKey 
         * @returns {Array} 
         */
        get: function(storageKey) {
            try {
                return JSON.parse(localStorage.getItem(storageKey) || '[]');
            } catch(e) {
                return [];
            }
        },

        /**
         * 向某个测试的历史记录开头插入一条新记录，并保持最多 5 条
         * @param {string} storageKey 
         * @param {Object} itemData 
         * @returns {Array} 更新后的完整记录
         */
        save: function(storageKey, itemData) {
            let history = this.get(storageKey);
            history.unshift(itemData);
            if (history.length > this.MAX_ITEMS) {
                history = history.slice(0, this.MAX_ITEMS);
            }
            localStorage.setItem(storageKey, JSON.stringify(history));
            return history;
        },

        /**
         * 删除特定索引的记录
         */
        remove: function(storageKey, index) {
            let history = this.get(storageKey);
            if (index >= 0 && index < history.length) {
                history.splice(index, 1);
                localStorage.setItem(storageKey, JSON.stringify(history));
            }
            return history;
        }
    },

    /**
     * 生成截图并显示在模态框中
     * 封装 htmlToImage，并统一处理加载状态、成功与错误渲染
     * @param {Object} options 
     */
    generatePoster: async function(options) {
        const {
            targetElementId = 'ticket-capture',
            modalId = 'poster-modal',
            containerId = 'poster-img-container',
            loadingText = '制卷中...',
            errorText = '制卷失败，请重试或直接截屏',
            useJpeg = false,
            backgroundColor = null,
            onBeforeCapture,
            onAfterCapture
        } = options;

        const modal = document.getElementById(modalId);
        const container = document.getElementById(containerId);
        const el = document.getElementById(targetElementId);
        
        if(!modal || !container || !el) {
            console.error('TestEngine: Missing DOM elements for poster generation.');
            return;
        }

        modal.classList.add('show');
        container.innerHTML = `<div class="m-auto"><span class="text-white/40 text-sm animate-pulse font-bold" id="poster-loading">${loadingText}</span></div>`;
        
        if (typeof onBeforeCapture === 'function') {
            await onBeforeCapture();
        }

        try {
            await document.fonts.ready;
            await new Promise(r => setTimeout(r, 100)); // 让 DOM 彻底重绘

            const config = {
                pixelRatio: window.devicePixelRatio > 1 ? window.devicePixelRatio : 2,
                width: el.offsetWidth,
                height: el.offsetHeight,
                style: {
                    transform: 'scale(1)',
                    transformOrigin: 'top left',
                    margin: '0',
                    filter: 'none'
                }
            };
            
            if (backgroundColor) {
                config.backgroundColor = backgroundColor;
            } else {
                const computedBg = getComputedStyle(document.body).backgroundColor;
                config.backgroundColor = computedBg === 'rgba(0, 0, 0, 0)' ? 'transparent' : computedBg;
            }

            let dataUrl;
            if (useJpeg) {
                dataUrl = await htmlToImage.toJpeg(el, config);
            } else {
                dataUrl = await htmlToImage.toPng(el, config);
            }
            
            const img = document.createElement('img');
            img.src = dataUrl;
            img.className = 'w-full h-auto drop-shadow-2xl touch-callout-default select-all pointer-events-auto';
            
            container.innerHTML = '';
            container.appendChild(img);
        } catch (err) {
            console.error(err);
            container.innerHTML = `<div class="m-auto"><span class="text-red-400 font-bold text-sm">${errorText}</span></div>`;
        } finally {
            if (typeof onAfterCapture === 'function') {
                await onAfterCapture();
            }
        }
    },

    /**
     * 统一的路由后退拦截器
     * 处理 hash 的跳转，以及当从矩阵弹窗返回时的规避逻辑。
     * @param {Object} options 
     */
    initRouter: function(options) {
        const {
            onQuizBack,     // Function: 在答题页按后退时的回调，返回 true 表示消耗了该事件(回退一题)，false 表示跳回首页
            onReturnHome,   // Function: 当应当强制回到主页时的回调
            isQuizActive,   // Function: 返回 boolean，当前是否在答题页
            isResultActive  // Function: 返回 boolean，当前是否在结果页
        } = options;

        window.addEventListener('DOMContentLoaded', () => {
            if (!window.location.hash) {
                history.replaceState(null, '', '#landing');
            }
        });

        window.addEventListener('popstate', (e) => {
            const hash = window.location.hash;
            
            // 矩阵弹窗的 hash 由 test-matrix.js 自行处理，页面级不干预
            if (hash === '#matrix' || hash === '#matrix-detail') return;

            const quizActive = typeof isQuizActive === 'function' ? isQuizActive() : false;
            const resultActive = typeof isResultActive === 'function' ? isResultActive() : false;

            // 如果当前是在结果页，并且返回之后还是结果页，说明是从弹窗返回的，停留在结果页不动
            if (resultActive && hash === '#result') return;

            if (quizActive) {
                const handled = typeof onQuizBack === 'function' ? onQuizBack() : false;
                if (handled) {
                    // 回调成功回退了上一题，需要把 hash 重新挂回 #quiz 阻止跳回首页
                    history.pushState(null, '', '#quiz');
                } else {
                    if (typeof onReturnHome === 'function') onReturnHome();
                }
            } else if (resultActive) {
                // 如果在结果页并触发了向后路由 (变成了 #landing 或 #quiz)，则跳转首页
                if (typeof onReturnHome === 'function') onReturnHome();
            } else {
                if (typeof onReturnHome === 'function') onReturnHome();
            }
        });
    }
};
