import os
import re

file_path = r'e:\AI\Antigravity\小红书\emotional-friction-test\emotional-friction-test-单文件.html'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

new_css = """
:root {
    --bg-color: #F7F7F6;
    --card-bg: #FFFFFF;
    --text-primary: #1A1C1E;
    --text-secondary: #64676A;
    --text-tertiary: #A0A4A8;
    --accent-color: #2C363F;
    --accent-hover: #1A2127;
    --accent-light: #F0F2F4;
    --border-color: rgba(0,0,0,0.06);
    --border-radius: 12px;
}

* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    -webkit-tap-highlight-color: transparent;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans SC", sans-serif;
    background-color: var(--bg-color);
    color: var(--text-primary);
    line-height: 1.7;
    height: 100vh;
    overflow: hidden;
    font-weight: 400;
}

/* 容器与页面切换 */
.app-container {
    max-width: 480px;
    margin: 0 auto;
    width: 100%;
    height: 100%;
    position: relative;
    background-color: var(--bg-color);
}

@media (min-width: 768px) {
    body {
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #EFEFEF;
    }

    .app-container {
        max-width: 900px;
        width: 90%;
        height: 85vh;
        max-height: 860px;
        margin: 0; 
        background: var(--bg-color);
        border-radius: 20px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.04);
        overflow: hidden;
        border: 1px solid var(--border-color);
    }
    
    #intro-page .intro-content {
        max-width: 100%;
        display: grid;
        grid-template-columns: 1fr 1.2fr;
        gap: 60px;
        padding: 60px;
        height: 100%;
        align-content: center;
    }

    #intro-page .intro-header {
        text-align: left;
        grid-column: 1;
        align-self: center;
    }

    #intro-page .intro-body {
        grid-column: 2;
        grid-row: 1 / span 3;
        background: var(--card-bg);
        padding: 40px;
        border-radius: 16px;
        border: 1px solid var(--border-color);
        display: flex;
        flex-direction: column;
        justify-content: center;
    }

    #intro-page .bottom-bar {
        position: absolute;
        bottom: 40px;
        right: 40px;
        left: auto;
        transform: none;
        width: auto;
        background: transparent;
        border: none;
        padding: 0;
        box-shadow: none;
    }

    #result-page .result-content {
        display: flex;
        flex-direction: column;
        max-width: 640px;
        margin: 0 auto;
        padding: 60px 40px;
        gap: 24px;
    }
}

section {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow-y: auto;
    padding: 32px 24px;
    display: flex;
    flex-direction: column;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s ease, transform 0.3s ease;
    transform: translateY(10px);
}

section.active-page {
    opacity: 1;
    pointer-events: auto;
    transform: translateY(0);
    z-index: 10;
}

/* Typography Shared */
h1, h2, h3 {
    font-weight: 500;
    letter-spacing: -0.02em;
    line-height: 1.3;
}

/* 1. 入口页 */
#landing-page .content-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
}

.brand-name {
    font-size: 11px;
    font-weight: 500;
    color: var(--text-secondary);
    margin-bottom: 16px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
}

.main-title {
    font-size: 32px;
    color: var(--text-primary);
    margin-bottom: 12px;
}

.subtitle {
    font-size: 14px;
    margin-bottom: 40px;
    color: var(--text-secondary);
}

.trust-card {
    display: flex;
    flex-direction: row;
    justify-content: center;
    gap: 24px;
    margin-bottom: 48px;
}

.trust-item {
    display: flex;
    align-items: center;
    gap: 6px;
}

.trust-item .icon {
    font-size: 14px;
    opacity: 0.5;
}

.trust-item .text {
    font-size: 13px;
    color: var(--text-secondary);
}

.action-area {
    width: 100%;
    margin-top: auto;
    padding-bottom: 24px;
}

.primary-btn {
    background: var(--accent-color);
    color: white;
    border: none;
    width: 100%;
    padding: 16px;
    font-size: 15px;
    font-weight: 500;
    border-radius: 8px;
    cursor: pointer;
    transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1), background 0.15s;
}

.primary-btn:active {
    transform: scale(0.98);
    background: var(--accent-hover);
}

.disclaimer, .footer-disclaimer {
    font-size: 12px;
    color: var(--text-tertiary);
    margin-top: 16px;
    text-align: center;
}

/* 2. 测试页 */
.quiz-header {
    margin-bottom: 40px;
}

.progress-bar-container {
    height: 2px;
    background-color: var(--border-color);
    overflow: hidden;
    margin-bottom: 12px;
}

.progress-bar {
    height: 100%;
    background: var(--accent-color);
    width: 10%;
    transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.progress-text {
    text-align: right;
    font-size: 12px;
    color: var(--text-tertiary);
}

.question-text {
    font-size: 22px;
    color: var(--text-primary);
    margin-bottom: 40px;
    min-height: 60px;
    line-height: 1.4;
    font-weight: 500;
}

.option-btn {
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    width: 100%;
    padding: 18px 20px;
    margin-bottom: 12px;
    border-radius: var(--border-radius);
    text-align: left;
    font-size: 15px;
    color: var(--text-primary);
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
}

.option-btn:active, .option-btn.selected {
    background: var(--accent-light);
    border-color: var(--border-color);
    transform: scale(0.99);
}

/* 3. 结果页 */
.result-content {
    padding-bottom: 40px;
}

.score-card {
    background: var(--card-bg);
    border-radius: var(--border-radius);
    padding: 40px 24px;
    text-align: center;
    margin-bottom: 24px;
    border: 1px solid var(--border-color);
}

.result-icon {
    font-size: 40px;
    margin-bottom: 16px;
    display: block;
    opacity: 0.8;
}

.result-title {
    font-size: 24px;
    color: var(--text-primary);
    margin-bottom: 16px;
}

.result-desc {
    font-size: 15px;
    color: var(--text-secondary);
    line-height: 1.7;
    text-align: left;
    white-space: pre-line;
}

.advice-card {
    background: var(--card-bg);
    border-radius: var(--border-radius);
    padding: 24px;
    margin-bottom: 24px;
    border: 1px solid var(--border-color);
}

.advice-card h3 {
    font-size: 14px;
    color: var(--text-primary);
    margin-bottom: 12px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.advice-card p {
    font-size: 14px;
    color: var(--text-secondary);
    line-height: 1.7;
    white-space: pre-line;
}

.promotion-card {
    background: var(--accent-color);
    border-radius: var(--border-radius);
    padding: 32px 24px;
    margin-bottom: 32px;
    text-align: center;
}

.promo-header {
    font-size: 16px;
    color: white;
    margin-bottom: 12px;
}

.promo-text {
    font-size: 14px;
    color: rgba(255,255,255,0.7);
    margin-bottom: 24px;
    line-height: 1.6;
}

.promo-btn {
    display: block;
    background: white;
    color: var(--accent-color);
    text-decoration: none;
    padding: 14px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    transition: opacity 0.15s, transform 0.15s;
}

.promo-btn:active {
    opacity: 0.9;
    transform: scale(0.98);
}

.promo-btn .small-text {
    display: none;
}

#restart-btn {
    background: transparent;
    border: 1px solid var(--border-color);
    color: var(--text-secondary);
    font-size: 14px;
    cursor: pointer;
    width: 100%;
    margin-top: 16px;
    padding: 14px;
    border-radius: 8px;
    transition: background 0.15s;
}

#restart-btn:active {
    background: var(--accent-light);
}

/* 4. 推荐测试 */
.recommended-section {
    margin-top: 40px;
    margin-bottom: 24px;
}

.divider {
    font-size: 12px;
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 16px;
}

.rec-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.rec-card {
    background: var(--card-bg);
    border-radius: var(--border-radius);
    padding: 20px;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid var(--border-color);
}

.rec-card:active {
    transform: scale(0.99);
    background: var(--accent-light);
}

.rec-header {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
}

.rec-title {
    font-size: 15px;
    font-weight: 500;
    color: var(--text-primary);
}

.rec-desc {
    font-size: 13px;
    color: var(--text-secondary);
    margin-bottom: 12px;
}

.rec-tags {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.tag {
    background: var(--accent-light);
    color: var(--text-secondary);
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 11px;
}

/* 5. 介绍页 */
#intro-page {
    background: var(--bg-color);
}

.intro-nav {
    margin-bottom: 32px;
}

.nav-back {
    background: none;
    border: none;
    font-size: 14px;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 8px 0;
    display: flex;
    align-items: center;
    gap: 4px;
}

.intro-header {
    margin-bottom: 32px;
}

.intro-title {
    font-size: 28px;
    color: var(--text-primary);
    margin-bottom: 8px;
}

.intro-subtitle {
    font-size: 15px;
    color: var(--text-secondary);
}

.intro-body {
    font-size: 15px;
    line-height: 1.8;
    color: var(--text-secondary);
    margin-bottom: 32px;
}

.intro-body p {
    margin-bottom: 16px;
}

.intro-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 32px;
}

.intro-tag {
    background: var(--accent-light);
    color: var(--text-secondary);
    font-size: 12px;
    padding: 6px 12px;
    border-radius: 4px;
}

.bottom-bar {
    position: fixed;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 480px;
    background: var(--bg-color);
    padding: 16px 24px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    z-index: 100;
    border-top: 1px solid var(--border-color);
}

.price-info {
    display: flex;
    align-items: baseline;
    gap: 8px;
}

.price-original {
    font-size: 13px;
    color: var(--text-tertiary);
    text-decoration: line-through;
}

.price-val {
    font-size: 20px;
    color: var(--text-primary);
    font-weight: 500;
}

.buy-btn {
    background: var(--accent-color);
    color: white;
    text-decoration: none;
    padding: 14px 24px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    transition: transform 0.15s, opacity 0.15s;
    text-align: center;
}

.buy-btn:active {
    transform: scale(0.98);
}

.btn-xhs {
    background: #FF2442 !important;
    color: white !important;
}

.text-undeveloped {
    color: var(--text-secondary);
    font-size: 14px;
}

/* 弹窗 */
.modal-overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 1000;
    justify-content: center;
    align-items: flex-end;
    backdrop-filter: blur(4px);
}

.modal-overlay.active {
    display: flex;
    animation: fadeInOverlay 0.2s ease;
}

@keyframes fadeInOverlay {
    from { opacity: 0; }
    to { opacity: 1; }
}

.modal-card {
    background: var(--card-bg);
    border-radius: 20px 20px 0 0;
    width: 100%;
    max-width: 480px;
    position: relative;
    animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    max-height: 85vh;
    display: flex;
    flex-direction: column;
}

@media (min-width: 768px) {
    .modal-overlay {
        align-items: center;
    }
    .modal-card {
        border-radius: 16px;
        max-width: 400px;
        max-height: 75vh;
    }
}

@keyframes slideUp {
    from { transform: translateY(40px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
}

.modal-body {
    padding: 32px 24px 24px;
    overflow-y: auto;
}

.modal-close {
    position: absolute;
    top: 16px;
    right: 16px;
    background: var(--accent-light);
    border: none;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    font-size: 14px;
    color: var(--text-secondary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s;
}

.modal-close:hover {
    background: #E2E4E8;
}

.modal-tags {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
}

.modal-tag {
    background: var(--accent-light);
    color: var(--text-secondary);
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 11px;
}

.modal-title {
    font-size: 20px;
    color: var(--text-primary);
    margin-bottom: 8px;
    padding-right: 32px;
}

.modal-subtitle {
    font-size: 14px;
    color: var(--text-secondary);
    margin-bottom: 24px;
}

.modal-desc {
    font-size: 14px;
    color: var(--text-secondary);
    line-height: 1.8;
}

.modal-desc p {
    margin-bottom: 12px;
}

.modal-desc b {
    color: var(--text-primary);
    font-weight: 500;
}

.modal-footer {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 24px 32px;
    background: var(--card-bg);
    border-top: 1px solid var(--border-color);
}

.modal-price-wrap {
    display: flex;
    flex-direction: column;
}

.modal-price-original {
    font-size: 12px;
    color: var(--text-tertiary);
    text-decoration: line-through;
}

.modal-price-current {
    font-size: 20px;
    font-weight: 500;
    color: var(--text-primary);
}

.modal-btn {
    flex: 1;
    background: var(--accent-color);
    color: white;
    text-align: center;
    padding: 14px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    text-decoration: none;
    transition: transform 0.15s;
}

.modal-btn:active {
    transform: scale(0.98);
}

.modal-btn.btn-undeveloped {
    background: var(--accent-light);
    color: var(--text-tertiary);
    pointer-events: none;
}
"""

content = re.sub(r'<style>.*?</style>', f'<style>\n{new_css}\n</style>', content, flags=re.DOTALL)
content = content.replace('<span class="icon">✅</span>', '<span class="icon">·</span>')

# Modify JS option btn logic slightly to remove A/B/C/D circles and just show the text clean.
content = content.replace("const labels = ['A', 'B', 'C', 'D'];", "// const labels = ['A', 'B', 'C', 'D'];")
content = content.replace("btn.setAttribute('data-label', labels[idx]);", "// btn.setAttribute('data-label', labels[idx]);")
content = content.replace("btn.textContent = option.text;", "btn.textContent = option.text.replace(/^[A-D]·/, '');")

# Modify rec-num rendering logic
content = content.replace('<span class="rec-num">${num}</span>', '')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
