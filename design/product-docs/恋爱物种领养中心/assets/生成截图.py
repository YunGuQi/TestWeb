import asyncio
import os
from playwright.async_api import async_playwright

async def generate_standard_screenshots(page, save_dir):
    print("开始生成常规维度结果图...")
    results = [
        {"key": "S_HIGH", "name": "水豚恋人", "tag": "情绪稳定 / 绝对松弛", "emoji": "🦦", "color": "#8EA980", "desc": "你的内核极其稳固，万物皆可佛。在感情中不内耗也不折腾，能提供极高的情绪价值，但也需要对方绝对尊重你的边界。", "defense": "松弛感/升华。面对矛盾不激化，天然的钝感力化解一切。", "best": "金毛恋人、含羞草恋人", "toxic": "猫薄荷恋人"},
        {"key": "S_LOW", "name": "金毛恋人", "tag": "阳光纯爱 / 毫无保留", "emoji": "🐶", "color": "#D4A373", "desc": "给点阳光就灿烂！你拥有治愈人心的力量，总是毫无保留地偏爱对方。真诚是你永远的必杀技，好养活且粘人得刚好。", "defense": "利他/热情。用温暖和真诚直接融化对方的防御。", "best": "树袋熊恋人、寄居蟹恋人", "toxic": "变色龙恋人"},
        {"key": "A_HIGH", "name": "树袋熊恋人", "tag": "终极黏人 / 情绪挂件", "emoji": "🐨", "color": "#A8D0E6", "desc": "一谈恋爱就化身对方的专属挂件，需要超高浓度的情绪价值和身体接触。极度专一，但也容易因为对方的冷落而陷入深渊。", "defense": "过度依附/退行。一有危机就紧紧抱住，害怕被抛弃。", "best": "金毛恋人、水豚恋人", "toxic": "含羞草恋人、寄居蟹恋人"},
        {"key": "A_LOW", "name": "猫薄荷恋人", "tag": "患得患失 / 索取试探", "emoji": "🌿", "color": "#B8E0D2", "desc": "看似高冷实则内心极度渴望被偏爱。你总是用不断试探和作闹来证明自己被爱，只要对方通过考验，你就会展现极度的柔软。", "defense": "索取/投射。用试探来掩饰内心的极度不安。", "best": "水豚恋人", "toxic": "刺猬恋人"},
        {"key": "AV_HIGH", "name": "含羞草恋人", "tag": "极度慢热 / 边界守护", "emoji": "🌱", "color": "#95B8D1", "desc": "你的边界感极强，稍微过度的热情就会让你立刻“卷起来”自我保护。需要极大的耐心慢慢打开，内心柔软只对一人展现。", "defense": "退缩/压抑。一有风吹草动就立刻封闭自己。", "best": "水豚恋人", "toxic": "树袋熊恋人"},
        {"key": "AV_LOW", "name": "寄居蟹恋人", "tag": "忽冷忽热 / 壳里试探", "emoji": "🐚", "color": "#E8D8C3", "desc": "一靠近就想缩回壳里，需要极大的安全感才敢探出头。你习惯性逃避冲突，认为只要不抱期待就不会受到伤害。", "defense": "隔离/逃避。遇到问题先躲进坚硬的壳里再说。", "best": "金毛恋人", "toxic": "树袋熊恋人"},
        {"key": "F_HIGH", "name": "刺猬恋人", "tag": "嘴硬心软 / 渴望拥抱", "emoji": "🦔", "color": "#C4A484", "desc": "渴望拥抱却因为害怕受伤而长满了一身刺。你总是用推开对方的方式来测试对方是否会留下，典型的嘴硬心软惹人疼。", "defense": "攻击性防御。用尖锐的外表掩盖脆弱的内心。", "best": "水豚恋人、金毛恋人", "toxic": "猫薄荷恋人、变色龙恋人"},
        {"key": "F_LOW", "name": "变色龙恋人", "tag": "敏感伪装 / 捉摸不透", "emoji": "🦎", "color": "#8EBCB5", "desc": "极度敏感，雷达全开。你会根据对方的态度随时调整自己的保护色，让人觉得难以捉摸，但其实这只是你害怕受伤的伪装。", "defense": "变形/保护色。隐藏真实需求以迎合或防御对方。", "best": "金毛恋人", "toxic": "寄居蟹恋人、刺猬恋人"}
    ]
    
    for t in results:
        print(f"正在生成 {t['name']}...")
        await page.evaluate(f'''() => {{
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            document.getElementById('result-page').classList.add('active');
            
            document.getElementById('res-emoji').textContent = "{t['emoji']}";
            document.getElementById('res-name').textContent = "{t['name']}";
            document.getElementById('res-name').style.color = "{t['color']}";
            document.getElementById('res-desc').innerHTML = "{t['desc']}";
            document.getElementById('res-defense').innerHTML = "{t['defense']}";
            document.getElementById('res-best').textContent = "{t['best']}";
            document.getElementById('res-toxic').textContent = "{t['toxic']}";
            
            const tagsArr = "{t['tag']}".split(' / ');
            const tagContainer = document.getElementById('res-tags');
            tagContainer.innerHTML = tagsArr.map(tag => `<span class="tag-pill">${{tag}}</span>`).join('');
            
            document.getElementById('cert-id').textContent = Math.floor(Math.random() * 899999 + 100000);
            
            const container = document.getElementById('capture-wrapper');
            if(container) {{
                container.style.filter = 'none';
            }}
        }}''')
        
        await page.wait_for_timeout(1000)
        
        screenshot_path = os.path.join(save_dir, f"{t['name']}.jpg")
        card_elem = await page.query_selector("#capture-wrapper")
        if card_elem:
            await card_elem.screenshot(path=screenshot_path)
            print(f"已保存: {screenshot_path}")

async def generate_hook_screenshot(page, save_dir):
    print("开始生成引导版(钩子)结果图...")
    out_path = os.path.join(save_dir, "引导版_钩子截图.png")
    
    await page.evaluate("""
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById('result-page').classList.add('active');
        
        document.getElementById('res-emoji').textContent = "🔒";
        document.getElementById('res-name').textContent = "【系统结算中】";
        document.getElementById('res-name').style.color = "#4A4036";
        document.getElementById('res-desc').innerHTML = '系统已完成对你依恋防御机制的分析。<br><br>在评论区留下你的选项组合（如：ABAB）<br>并 <span style="color: #2563eb; font-weight: 900;">@问一问</span> 即可得到答案，<br>获取你的专属“恋爱物种领养证书”与避坑指南！';
        document.getElementById('res-defense').innerHTML = "******";
        document.getElementById('res-best').textContent = "******";
        document.getElementById('res-toxic').textContent = "******";
        document.getElementById('res-tags').innerHTML = '<span class="tag-pill">分析完成</span>';
        
        const container = document.getElementById('capture-wrapper');
        if(container) {
            container.style.filter = 'none';
        }
    """)
    
    await page.wait_for_timeout(1000)
    
    card = page.locator('#capture-wrapper')
    await card.screenshot(path=out_path)
    print(f"原生高清引流截图已成功生成：{out_path}")

async def generate_disclaimer_screenshot(page, save_dir):
    print("开始生成免责声明截图...")
    out_path = os.path.join(save_dir, "免责声明截图.png")
    
    await page.evaluate("""
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById('result-page').classList.add('active');
        
        document.getElementById('res-emoji').textContent = "⚠️";
        document.getElementById('res-name').textContent = "娱乐免责声明";
        document.getElementById('res-name').style.color = "#4A4036";
        
        const disclaimerText = '本测试内容及其解析结果仅供休闲娱乐与自我探索参考，不具备任何专业心理学、医学或职场指导的科学严谨性。<br><br>测试结果并非专业诊断，请勿将其作为重大人生决定（如转行、离职、就医等）的依据。如遇真实的心理困扰，请向具有执业资格的专业机构寻求帮助。';
        document.getElementById('res-desc').innerHTML = disclaimerText;
        
        document.getElementById('res-defense').innerHTML = "仅供娱乐参考";
        document.getElementById('res-best').textContent = "-";
        document.getElementById('res-toxic').textContent = "-";
        document.getElementById('res-tags').innerHTML = '<span class="tag-pill">心理科普</span>';
        
        const container = document.getElementById('capture-wrapper');
        if(container) {
            container.style.filter = 'none';
        }
    """)
    
    await page.wait_for_timeout(1000)
    
    card = page.locator('#capture-wrapper')
    await card.screenshot(path=out_path)
    print(f"免责声明截图已成功生成：{out_path}")

async def generate_home_screenshot(page, save_dir):
    print("开始生成首页截图...")
    out_path = os.path.join(save_dir, "首页截图.png")
    
    await page.evaluate('''() => {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById('start-page').classList.add('active');
    }''')
    
    await page.wait_for_timeout(1000)
    await page.screenshot(path=out_path, full_page=True)
    
    preview_path = os.path.join(os.path.dirname(os.path.dirname(save_dir)), "common", "love-species-test", "preview.jpg")
    preview_path = os.path.abspath(preview_path)
    await page.screenshot(path=preview_path, full_page=True)
    
    print(f"首页截图已成功生成：{out_path}")
    print(f"预览图已保存到：{preview_path}")

async def main():
    test_name = "恋爱物种领养中心"
    test_html_url = "file:///E:/AI/Antigravity/小红书/common/love-species-test/index.html"
    
    base_dir = os.path.dirname(os.path.abspath(__file__))
    save_dir = os.path.join(base_dir, "测试截图")
    os.makedirs(save_dir, exist_ok=True)
    
    print(f"开始为【{test_name}】生成自动化测试截图资产...")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 480, "height": 850}, device_scale_factor=3)
        await page.goto(test_html_url)
        
        await generate_home_screenshot(page, save_dir)
        await generate_standard_screenshots(page, save_dir)
        await generate_hook_screenshot(page, save_dir)
        await generate_disclaimer_screenshot(page, save_dir)
        
        await browser.close()
        
if __name__ == "__main__":
    asyncio.run(main())
