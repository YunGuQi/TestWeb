import asyncio
from playwright.async_api import async_playwright
import os
import sys
from datetime import datetime

async def generate_images(html_path, output_dir):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] 🚀 开始为 {html_path} 生成截图...")
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1920, "height": 1080})
        
        file_uri = f"file:///{html_path.replace('\\', '/')}"
        await page.goto(file_uri)
        
        # 等待字体加载完毕
        await page.evaluate("document.fonts.ready")
        
        # 隐藏控制栏避免影响截图
        await page.evaluate("if(document.querySelector('.controls')) document.querySelector('.controls').style.display = 'none'")
        
        # 将被缩小的卡片重置为原始大小 (1080x1440)
        await page.evaluate("""
            document.querySelectorAll('.post-card').forEach(el => {
                el.style.transform = 'none';
                el.style.margin = '0';
                el.style.position = 'relative';
                el.style.boxShadow = 'none';
            });
            document.body.style.display = 'block';
        """)
        
        ids = ['capture-cover-1', 'capture-cover-2', 'capture-cover-3', 'capture-cover-4', 'capture-cover-5', 'capture-q1', 'capture-q2', 'capture-q3', 'capture-q4', 'capture-q5', 'capture-ticket', 'capture-result-high', 'capture-result-mid', 'capture-result-low']
        names = ['0-首图-角度1.png', '0-首图-角度2.png', '0-首图-角度3.png', '0-首图-角度4.png', '0-首图-角度5.png', '1-题1.png', '2-题2.png', '3-题3.png', '4-题4.png', '5-题5.png', '6-引导图.png', '7-结果-严重透支.png', '8-结果-收支平衡.png', '9-结果-一毛不拔.png']
        
        for ele_id, name in zip(ids, names):
            loc = page.locator(f"#{ele_id}")
            if await loc.count() > 0:
                print(f"📸 正在截取: {name}")
                await loc.screenshot(path=os.path.join(output_dir, name))
            else:
                # 兼容只有一个首图的情况
                if ele_id == 'capture-cover-1':
                    fallback_loc = page.locator("#capture-cover")
                    if await fallback_loc.count() > 0:
                        print(f"📸 正在截取: 0-首图.png (兼容单首图模式)")
                        await fallback_loc.screenshot(path=os.path.join(output_dir, '0-首图.png'))
                        continue
                print(f"⚠️ 未找到元素 #{ele_id}，跳过 {name}")
                
        await browser.close()
        print(f"✅ 截图完成！图片已保存至: {output_dir}\n")

async def main():
    if len(sys.argv) < 2:
        print("用法: uv run python auto_screenshot.py <测试项目文件夹名>")
        print("示例: uv run python auto_screenshot.py 地气勘探局")
        return
        
    project_name = sys.argv[1]
    base_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.join(base_dir, project_name)
    html_path = os.path.join(project_dir, "post_generator.html")
    
    if not os.path.exists(html_path):
        print(f"❌ 错误: 找不到文件 {html_path}")
        return
        
    today_str = datetime.now().strftime("%Y-%m-%d")
    output_dir = os.path.join(project_dir, today_str)
    
    await generate_images(html_path, output_dir)

if __name__ == "__main__":
    asyncio.run(main())
