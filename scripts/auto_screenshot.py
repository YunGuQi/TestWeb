import asyncio
from playwright.async_api import async_playwright
import os

async def generate_images(html_path, output_dir):
    print(f"Generating images for {html_path}...")
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 1920, "height": 1080})
        
        # We need an absolute file URI
        file_uri = f"file:///{html_path.replace('\\', '/')}"
        await page.goto(file_uri)
        
        # Wait for fonts to load
        await page.evaluate("document.fonts.ready")
        
        # Hide controls
        await page.evaluate("document.querySelector('.controls').style.display = 'none'")
        
        # The elements are scaled down for display. We need to reset their transform and margins to take full resolution screenshots.
        # Playwright's locator.screenshot handles this automatically if we capture the element, but since there's a custom scale, 
        # it's safer to remove the scale so the element is its true 1080x1440 size.
        await page.evaluate("""
            document.querySelectorAll('.post-card').forEach(el => {
                el.style.transform = 'none';
                el.style.margin = '0';
                el.style.position = 'relative';
                el.style.boxShadow = 'none';
            });
            document.body.style.display = 'block';
        """)
        
        ids = ['capture-cover-1', 'capture-cover-2', 'capture-cover-3', 'capture-cover-4', 'capture-cover-5', 'capture-q1', 'capture-q2', 'capture-q3', 'capture-q4', 'capture-q5', 'capture-ticket']
        names = ['0-首图-角度1.png', '0-首图-角度2.png', '0-首图-角度3.png', '0-首图-角度4.png', '0-首图-角度5.png', '1-题1.png', '2-题2.png', '3-题3.png', '4-题4.png', '5-题5.png', '6-车票引导.png']
        
        # If capture-ticket isn't found, try without it or ignore
        for ele_id, name in zip(ids, names):
            loc = page.locator(f"#{ele_id}")
            if await loc.count() > 0:
                print(f"Capturing {name}...")
                await loc.screenshot(path=os.path.join(output_dir, name))
            else:
                print(f"Element #{ele_id} not found, skipping {name}")
                
        await browser.close()
        print("Done.")

async def main():
    await generate_images(
        r"E:\AI\Antigravity\小红书\帖子物料\地气勘探局\post_generator.html",
        r"E:\AI\Antigravity\小红书\帖子物料\地气勘探局\2026-06-21"
    )
    
    await generate_images(
        r"E:\AI\Antigravity\小红书\帖子物料\性格城市匹配\post_generator.html",
        r"E:\AI\Antigravity\小红书\帖子物料\性格城市匹配\2026-06-21"
    )

asyncio.run(main())