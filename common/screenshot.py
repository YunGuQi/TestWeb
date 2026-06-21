import asyncio
from playwright.async_api import async_playwright
import os

async def generate_city_matching(page):
    print("Generating city-matching-test...")
    test_dir = 'city-matching-test'
    file_path = f"file:///{os.path.abspath(test_dir + '/index.html').replace('\\\\', '/')}"
    await page.goto(file_path)
    
    themes = ['industrial', 'cyber', 'wabisabi', 'nature', 'ocean']
    for theme in themes:
        print(f"  -> {theme}")
        await page.evaluate(f'''() => {{
            const city = cityPool.find(c => c.theme === '{theme}') || cityPool[0];
            renderResultPage(city, {{p: 1, b: 1, r: 1, t: 1}});
            applyTheme('{theme}');
        }}''')
        await page.wait_for_timeout(500)
        ticket = page.locator('#ticket-capture')
        await ticket.screenshot(path=f'{test_dir}/result-{theme}.jpg')

    print("  -> disclaimer")
    await page.evaluate('''() => {
        document.getElementById('r-city').textContent = "仅供参考";
        document.getElementById('r-city').style.fontSize = "3rem";
        document.getElementById('r-province').textContent = "免责声明";
        document.getElementById('r-tag').textContent = "娱乐属性";
        document.getElementById('r-desc').textContent = "“本系列测试结果仅供娱乐与自我探索，不具备专业医疗诊断效力。部分素材源于网络，侵权请联系删除。”";
        document.getElementById('r-dimensions').innerHTML = '<span style="background-color:#e6e4df; border-color:#d1cdc1;" class="px-2 py-1 text-xs font-bold font-ticket border">理性看待</span><span style="background-color:#e6e4df; border-color:#d1cdc1;" class="px-2 py-1 text-xs font-bold font-ticket border">切勿较真</span>';
        applyTheme('industrial');
    }''')
    await page.wait_for_timeout(500)
    await page.locator('#ticket-capture').screenshot(path=f'{test_dir}/result-disclaimer.jpg')

async def generate_emotional_friction(page):
    print("Generating emotional-friction-test...")
    test_dir = 'emotional-friction-test'
    file_path = f"file:///{os.path.abspath(test_dir + '/index.html').replace('\\\\', '/')}"
    await page.goto(file_path)
    
    levels = [('low', 10), ('mid', 25), ('high', 40)]
    for key, score in levels:
        print(f"  -> {key}")
        await page.evaluate(f'''() => {{
            totalScore = {score};
            generateResult('landing', false);
        }}''')
        await page.wait_for_timeout(1000) # wait for animations
        card = page.locator('#result-page .doppel-shell').first
        await card.screenshot(path=f'{test_dir}/result-{key}.jpg')

    print("  -> disclaimer")
    await page.evaluate('''() => {
        document.getElementById('result-icon').textContent = "⚠️";
        document.getElementById('result-title').textContent = "免责声明";
        document.getElementById('result-desc').innerHTML = "<p class='mb-2 text-cyberblue font-bold tracking-widest text-xs'>测试仅供参考</p><p class='mb-2'>✦ 本系列测试结果仅供娱乐与自我探索，不具备任何专业医疗、心理诊断效力。</p><p>✦ 部分素材来源于网络，如有侵权请联系删除。请理性看待测试结果，切勿过度沉迷或对号入座。</p>";
    }''')
    await page.wait_for_timeout(500)
    await page.locator('#result-page .doppel-shell').first.screenshot(path=f'{test_dir}/result-disclaimer.jpg')

async def generate_five_elements(page):
    print("Generating five-elements-city-test...")
    test_dir = 'five-elements-city-test'
    file_path = f"file:///{os.path.abspath(test_dir + '/index.html').replace('\\\\', '/')}"
    await page.goto(file_path)
    
    elements = ['金', '木', '水', '火', '土']
    for elem in elements:
        print(f"  -> {elem}")
        await page.evaluate(f'''() => {{
            scores = {{'金': 0, '木': 0, '水': 0, '火': 0, '土': 0}};
            scores['{elem}'] = 10;
            generateResult();
            document.getElementById('result-page').classList.remove('hidden');
        }}''')
        await page.wait_for_timeout(500)
        # Hide the buttons at the bottom so they aren't in the screenshot
        await page.evaluate('''() => {
            const btns = document.querySelectorAll('#result-page button, #test-matrix-container');
            btns.forEach(btn => btn.style.display = 'none');
        }''')
        area = page.locator('#poster-area')
        # We map element names to english for filename
        elem_map = {'金': 'metal', '木': 'wood', '水': 'water', '火': 'fire', '土': 'earth'}
        await area.screenshot(path=f'{test_dir}/result-{elem_map[elem]}.jpg')

    print("  -> disclaimer")
    await page.evaluate('''() => {
        document.getElementById('result-city').innerText = "仅供参考";
        document.querySelector('#poster-area h2').innerText = "免责声明";
        document.querySelector('#poster-area p.text-lg').innerText = "娱乐属性测试";
        document.getElementById('result-desc').innerHTML = "本系列测试结果仅供娱乐与自我探索，不具备任何专业心理诊断效力。<br><br>部分素材来源于网络，如有侵权请联系删除。请理性看待测试结果，切勿较真。";
    }''')
    await page.wait_for_timeout(500)
    await page.locator('#poster-area').screenshot(path=f'{test_dir}/result-disclaimer.jpg')

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(device_scale_factor=2)
        
        await generate_city_matching(page)
        await generate_emotional_friction(page)
        await generate_five_elements(page)
            
        await browser.close()
        print("All screenshots generated successfully.")

if __name__ == '__main__':
    asyncio.run(main())
