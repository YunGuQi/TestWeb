# -*- coding: utf-8 -*-
from pathlib import Path

def main():
    base_dir = Path(__file__).parent.resolve()
    p = base_dir / "generate_skill_map.py"
    s = p.read_text(encoding="utf-8")
    
    s = s.replace('<html lang="zh-CN" data-theme="obsidian">', '<html lang="zh-CN" data-theme="swiss">')
    s = s.replace('const savedTheme = localStorage.getItem("wayfinder_theme") || "obsidian";', 
                  'const savedTheme = localStorage.getItem("wayfinder_theme") || "swiss";')
    s = s.replace('<button class="theme-btn active" onclick="setTheme(\'obsidian\', this)"',
                  '<button class="theme-btn" onclick="setTheme(\'obsidian\', this)"')
    s = s.replace('<button class="theme-btn" onclick="setTheme(\'swiss\', this)"',
                  '<button class="theme-btn active" onclick="setTheme(\'swiss\', this)"')
                  
    p.write_text(s, encoding="utf-8")
    print("GENERATE_SCRIPT_DEFAULT_SWISS_UPDATED_OK")

if __name__ == "__main__":
    main()
