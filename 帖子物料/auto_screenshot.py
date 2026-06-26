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
        try:
            await page.goto(file_uri, wait_until="domcontentloaded", timeout=60000)
        except Exception as e:
            print(f"⚠️ 页面加载超时或出错: {e}，但将继续尝试截图")
        
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
        
        versions = ['A', 'B', 'C', 'D', 'E']
        ids = ['capture-cover-1', 'capture-cover-2', 'capture-cover-3', 'capture-cover-4', 'capture-cover-5']
        
        common_ids = ['capture-q1', 'capture-q2', 'capture-q3', 'capture-q4', 'capture-q5', 'capture-ticket']
        common_names = ['1-题1.png', '2-题2.png', '3-题3.png', '4-题4.png', '5-题5.png', '6-引导图.png']
        
        for idx, version in enumerate(versions):
            print(f"\n--- 正在生成 {version} 版防重图片 ---")
            
            try:
                await page.evaluate(f"if(window.applyAntiDup) window.applyAntiDup('{version}')")
                await page.wait_for_timeout(300)
            except Exception as e:
                print(f"⚠️ 无法应用防重脚本: {e}")
            
            cover_id = ids[idx]
            cover_loc = page.locator(f"#{cover_id}")
            if await cover_loc.count() > 0:
                cover_name = f"{version}-0-首图.png"
                print(f"📸 正在截取: {cover_name}")
                await cover_loc.screenshot(path=os.path.join(output_dir, cover_name))
                
            for q_id, q_name in zip(common_ids, common_names):
                q_loc = page.locator(f"#{q_id}")
                if await q_loc.count() > 0:
                    ver_q_name = f"{version}-{q_name}"
                    print(f"📸 正在截取: {ver_q_name}")
                    await q_loc.screenshot(path=os.path.join(output_dir, ver_q_name))
                
        await browser.close()
        print(f"\n✅ 截图完成！共生成5套防重图片。保存至: {output_dir}\n")

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
