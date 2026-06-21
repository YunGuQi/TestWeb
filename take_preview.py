import asyncio
from playwright.async_api import async_playwright
import os

async def main():
    tests = [
        ('common/city-matching-test/index.html', '#landing-page', 'common/city-matching-test/preview.jpg', '帖子物料/性格城市匹配/测试截图/首页.jpg'),
        ('common/five-elements-city-test/index.html', '#landing-page', 'common/five-elements-city-test/preview.jpg', '帖子物料/地气勘探局/测试截图/首页.jpg'),
        ('common/emotional-friction-test/index.html', '#landing-page', 'common/emotional-friction-test/preview.jpg', '帖子物料/深度情绪内耗/测试截图/首页.jpg')
    ]
    base_dir = r"E:\AI\Antigravity\小红书"
    
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        # Use mobile viewport but 3x scale factor to get high resolution (1125x2436) 
        # which satisfies the >= 750x1000px requirement.
        page = await browser.new_page(viewport={"width": 375, "height": 812}, device_scale_factor=3)
        
        for html_file, selector, out_file1, out_file2 in tests:
            file_uri = f"file:///{os.path.join(base_dir, html_file).replace(chr(92), '/')}"
            print(f"Loading {file_uri}")
            await page.goto(file_uri)
            await page.evaluate("document.fonts.ready")
            await asyncio.sleep(1) # wait for animations
            
            loc = page.locator(selector)
            
            out_path1 = os.path.join(base_dir, out_file1)
            print(f"Saving to {out_path1}")
            await loc.screenshot(path=out_path1)
            
            out_path2 = os.path.join(base_dir, out_file2)
            print(f"Saving to {out_path2}")
            await loc.screenshot(path=out_path2)
            
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
