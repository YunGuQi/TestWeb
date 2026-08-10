# -*- coding: utf-8 -*-
import shutil
from pathlib import Path

def main():
    src_file = Path(r"e:\AI\Antigravity\小红书\skill-map.html")
    html = src_file.read_text(encoding="utf-8")
    
    # 1. 替换默认的 html data-theme
    html = html.replace('<html lang="zh-CN" data-theme="obsidian">', '<html lang="zh-CN" data-theme="swiss">')
    
    # 2. 替换 js localStorage 默认兜底项
    html = html.replace('const savedTheme = localStorage.getItem("wayfinder_theme") || "obsidian";', 
                        'const savedTheme = localStorage.getItem("wayfinder_theme") || "swiss";')
                        
    # 3. 替换右上角模式切换按钮的高亮 active class
    html = html.replace('<button class="theme-btn active" onclick="setTheme(\'obsidian\', this)"',
                        '<button class="theme-btn" onclick="setTheme(\'obsidian\', this)"')
    html = html.replace('<button class="theme-btn" onclick="setTheme(\'swiss\', this)"',
                        '<button class="theme-btn active" onclick="setTheme(\'swiss\', this)"')
                        
    # 写回原始主路径
    src_file.write_text(html, encoding="utf-8")
    print("SUCCESS_UPDATE_DEFAULT_SWISS: e:\\AI\\Antigravity\\小红书\\skill-map.html")
    
    # 4. 同步复制到全局技能目录中 (C:\Users\GU\.gemini\config\skills\skill-map.html 以及全局根目录 config\skill-map.html)
    global_skills_dir = Path(r"C:\Users\GU\.gemini\config\skills")
    global_skills_dir.mkdir(parents=True, exist_ok=True)
    dst1 = global_skills_dir / "skill-map.html"
    shutil.copy2(src_file, dst1)
    print(f"SUCCESS_COPY_GLOBAL_SKILLS: {dst1}")
    
    global_config_dir = Path(r"C:\Users\GU\.gemini\config")
    dst2 = global_config_dir / "skill-map.html"
    shutil.copy2(src_file, dst2)
    print(f"SUCCESS_COPY_GLOBAL_CONFIG: {dst2}")
    
    # 5. 同步复制到 E:\AI\Antigravity 根目录
    root_dir = Path(r"E:\AI\Antigravity")
    root_dir.mkdir(parents=True, exist_ok=True)
    dst3 = root_dir / "skill-map.html"
    shutil.copy2(src_file, dst3)
    print(f"SUCCESS_COPY_ROOT: {dst3}")

if __name__ == "__main__":
    main()
