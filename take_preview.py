import asyncio
from playwright.async_api import async_playwright
import os

async def main():
    tests = [
        ('common/city-matching-test/index.html', '#landing-page', 'common/city-matching-test/preview.jpg'),
        ('common/five-elements-city-test/index.html', '#landing-page', 'common/five-elements-city-test/preview.jpg'),
        ('common/emotional-friction-test/index.html', '#landing-page', 'common/emotional-friction-test/preview.jpg')
    ]
    base_dir = r"E:\AI\Antigravity\小红书"
    
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        # use mobile viewport to match what the user sees
        page = await browser.new_page(viewport={"width": 375, "height": 812})
        
        for html_file, selector, out_file in tests:
            file_uri = f"file:///{os.path.join(base_dir, html_file).replace(chr(92), '/')}"
            print(f"Loading {file_uri}")
            await page.goto(file_uri)
            await page.evaluate("document.fonts.ready")
            await asyncio.sleep(1) # wait for animations
            
            loc = page.locator(selector)
            out_path = os.path.join(base_dir, out_file)
            print(f"Saving to {out_path}")
            await loc.screenshot(path=out_path)
            
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
