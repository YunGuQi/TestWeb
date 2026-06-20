import os
import re

file_path = r'e:\AI\Antigravity\小红书\emotional-friction-test\emotional-friction-test-单文件.html'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update CSS
new_css = """
:root {
    --bg-main: #FFFFFF;
    --bg-secondary: #F2F1EB;
    --text-primary: #111111;
    --text-secondary: #666666;
    --text-tertiary: #999999;
    --accent-color: #0047FF;
    --accent-hover: #0036CC;
    --accent-light: rgba(0, 71, 255, 0.04);
    --border-color: rgba(0,0,0,0.08);
    --border-radius: 0px; /* Sharp editorial feel */
}

* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    -webkit-tap-highlight-color: transparent;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif;
    background-color: var(--bg-main);
    color: var(--text-primary);
    line-height: 1.6;
    height: 100vh;
    overflow: hidden;
    font-weight: 400;
}

/* Split Layout */
.split-layout {
    display: flex;
    width: 100vw;
    height: 100vh;
}

.left-panel {
    display: none;
}

.right-panel {
    width: 100%;
    height: 100%;
    position: relative;
    background: var(--bg-main);
}

.app-container {
    width: 100%;
    height: 100%;
    position: relative;
    background-color: var(--bg-main);
    color: var(--text-primary);
}

@media (min-width: 768px) {
    .left-panel {
        display: flex;
        flex-direction: column;
        justify-content: center;
        width: 45%;
        background-color: var(--bg-secondary);
        padding: 80px;
        position: relative;
        overflow: hidden;
    }
    .right-panel {
        width: 55%;
    }
    .app-container {
        max-width: 540px;
        margin: 0 auto;
    }
}

.noise-overlay {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    opacity: 0.4;
    pointer-events: none;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
    mix-blend-mode: multiply;
}

.left-content {
    position: relative;
    z-index: 2;
    max-width: 400px;
}

.left-content .brand-badge {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--text-secondary);
    margin-bottom: 24px;
}

.left-content .hero-title {
    font-size: 48px;
    font-weight: 600;
    letter-spacing: -0.04em;
    line-height: 1.1;
    margin-bottom: 24px;
    color: var(--text-primary);
}

.left-content .hero-sub {
    font-size: 16px;
    color: var(--text-secondary);
    line-height: 1.6;
}

/* Sections */
section {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow-y: auto;
    padding: 40px 32px;
    display: flex;
    flex-direction: column;
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transition: opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1), transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.5s;
    transform: translateX(20px);
    background-color: var(--bg-main);
}

section.active-page {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
    transform: translateX(0);
    z-index: 10;
}

/* Typography Shared */
h1, h2, h3 {
    font-weight: 600;
    letter-spacing: -0.03em;
    line-height: 1.2;
}

/* 1. Landing Page */
#landing-page .content-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.main-title {
    font-size: 36px;
    color: var(--text-primary);
    margin-bottom: 16px;
}

.subtitle {
    font-size: 15px;
    margin-bottom: 48px;
    color: var(--text-secondary);
}

.trust-card {
    display: flex;
    flex-direction: row;
    gap: 24px;
    margin-bottom: 48px;
}

.trust-item {
    display: flex;
    align-items: center;
    gap: 8px;
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
    padding: 20px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), background 0.2s;
}

.primary-btn:active {
    transform: scale(0.97);
    background: var(--accent-hover);
}

/* 2. Quiz Page */
.quiz-header {
    margin-bottom: 48px;
}

.progress-bar-container {
    height: 1px;
    background-color: var(--border-color);
    margin-bottom: 16px;
}

.progress-bar {
    height: 100%;
    background: var(--accent-color);
    width: 10%;
    transition: width 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.progress-text {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.1em;
    color: var(--text-tertiary);
    text-transform: uppercase;
}

.question-text {
    font-size: 28px;
    color: var(--text-primary);
    margin-bottom: 48px;
    min-height: 80px;
    line-height: 1.3;
}

.option-btn {
    background: var(--bg-main);
    border: 1px solid var(--border-color);
    width: 100%;
    padding: 20px 24px;
    margin-bottom: 16px;
    text-align: left;
    font-size: 16px;
    color: var(--text-primary);
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    display: flex;
    align-items: center;
}

.option-btn:hover {
    border-color: var(--text-tertiary);
}

.option-btn:active, .option-btn.selected {
    background: var(--text-primary);
    border-color: var(--text-primary);
    color: white;
    transform: scale(0.98);
}

/* 3. Result Page */
.result-content {
    padding-bottom: 40px;
}

.score-card {
    background: var(--bg-secondary);
    padding: 48px 32px;
    margin-bottom: 32px;
}

.result-title {
    font-size: 32px;
    color: var(--text-primary);
    margin-bottom: 24px;
}

.result-desc {
    font-size: 15px;
    color: var(--text-secondary);
}

.promotion-card {
    background: var(--accent-color);
    padding: 40px 32px;
    margin-bottom: 32px;
    color: white;
}

.promo-header {
    font-size: 20px;
    margin-bottom: 16px;
}

.promo-text {
    font-size: 14px;
    color: rgba(255,255,255,0.8);
    margin-bottom: 32px;
}

.promo-btn {
    display: block;
    background: white;
    color: var(--accent-color);
    text-decoration: none;
    padding: 18px;
    text-align: center;
    font-weight: 600;
    transition: transform 0.2s;
}

.promo-btn:active {
    transform: scale(0.97);
}

#restart-btn {
    background: transparent;
    border: 1px solid var(--border-color);
    color: var(--text-secondary);
    width: 100%;
    padding: 18px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
}

#restart-btn:active {
    background: var(--bg-secondary);
}

/* Modals */
.modal-overlay {
    position: fixed;
    top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(17, 17, 17, 0.4);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 100;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
}

.modal-overlay.show {
    opacity: 1;
    visibility: visible;
}

.modal-content {
    background: var(--bg-main);
    width: 90%;
    max-width: 400px;
    padding: 40px;
    transform: translateY(20px);
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-overlay.show .modal-content {
    transform: translateY(0);
}

.modal-title {
    font-size: 20px;
    margin-bottom: 16px;
}

.modal-desc {
    font-size: 14px;
    color: var(--text-secondary);
    margin-bottom: 32px;
}
"""

content = re.sub(r'<style>.*?</style>', f'<style>\n{new_css}\n</style>', content, flags=re.DOTALL)

# 2. Inject Split Layout DOM
split_open = """
<div class="split-layout">
    <div class="left-panel">
        <div class="noise-overlay"></div>
        <div class="left-content">
            <div class="brand-badge">AWARENESS TEST</div>
            <h1 class="hero-title">情绪内耗<br>深度测评</h1>
            <p class="hero-sub">倾听内心的声音，了解你的情绪刻度。这是一个完全私密的安全空间。</p>
        </div>
    </div>
    <div class="right-panel">
        <div class="app-container">
"""

content = re.sub(r'<div class="app-container">', split_open, content, count=1)

# Close the split layout before </body>
split_close = """
        </div>
    </div>
</div>
"""
# Find the end of app-container. It is right before <!-- 各种弹窗结构 -->
content = content.replace('<!-- 各种弹窗结构 -->', split_close + '\n<!-- 各种弹窗结构 -->')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Redesign V2 applied successfully.")
