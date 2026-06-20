import os
import re

file_path = r'e:\AI\Antigravity\小红书\emotional-friction-test\emotional-friction-test-单文件.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix hidden-page and section transitions
css_patch = """
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
    visibility: hidden;
    pointer-events: none;
    transition: opacity 0.3s ease, transform 0.3s ease, visibility 0.3s;
    transform: translateY(10px);
    background-color: var(--bg-color);
}

section.active-page {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
    transform: translateY(0);
    z-index: 10;
}
"""

content = re.sub(r'section\s*\{[^}]+\}\s*section\.active-page\s*\{[^}]+\}', css_patch, content)

# Fix JS to not remove active-page too early if needed, or simply let CSS handle it.
# Ensure text color is solid for app-container.
css_patch2 = """
.app-container {
    max-width: 480px;
    margin: 0 auto;
    width: 100%;
    height: 100%;
    position: relative;
    background-color: var(--bg-color);
    color: var(--text-primary);
}
"""
content = re.sub(r'\.app-container\s*\{[^}]+\}', css_patch2, content, count=1)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
