import asyncio
import os
import sys
import pyperclip
from playwright.async_api import async_playwright

# 修复 Windows 控制台中文和 emoji 打印报错问题
sys.stdout.reconfigure(encoding='utf-8')

async def publish_draft(images, title, content):
    # 使用独立的持久化浏览器配置目录，保留登录状态（Cookies/LocalStorage）
    profile_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "xhs_profile")
    
    async with async_playwright() as p:
        print("🚀 正在启动浏览器 (持久化模式)...")
        # headless=False 让我们能看到界面，方便首次扫码登录或排查问题
        browser = await p.chromium.launch_persistent_context(
            user_data_dir=profile_dir,
            headless=False,
            viewport={"width": 1440, "height": 900},
            args=['--disable-blink-features=AutomationControlled']
        )
        
        page = browser.pages[0]
        print("🌐 正在打开小红书创作者中心发布页 (图文模式)...")
        await page.goto("https://creator.xiaohongshu.com/publish/publish?source=official&from=menu&target=image")
        
        # ==========================================
        # 1. 登录与入口检测
        # ==========================================
        try:
            # 尝试等待上传图片 input 的出现 (注意：它是隐藏的，所以必须用 state="attached")
            print("⏳ 正在等待发布页面加载或扫码登录...")
            await page.wait_for_selector('input[type="file"][accept*=".png"]', state="attached", timeout=120000)
            print("✅ 成功进入发布页面。")
        except Exception as e:
            print(f"❌ 等待登录或页面加载超时: {e}")
            await browser.close()
            sys.exit(1)
            
        # ==========================================
        # 2. 底层无痕上传图片
        # ==========================================
        print(f"📸 正在通过底层 input 注入 {len(images)} 张图片...")
        # 核心：直接把绝对路径塞给能够接受 png 图片的上传框
        await page.locator('input[type="file"][accept*=".png"]').set_input_files(images)
        
        print("⏳ 等待图片上传并渲染编辑器输入框...")
        await page.wait_for_timeout(3000) # 简单等待3秒，确保前端渲染出标题和正文框
        
        # ==========================================
        # 3. 物理剪贴板防风控注入文案
        # ==========================================
        print("✍️ 正在注入标题与正文...")
        
        # 注入标题 (小红书会自动把文件名截断填入标题，所以必须先清空)
        title_loc = page.locator('input[placeholder*="标题"], .c-input_inner').first
        await title_loc.click()
        await page.keyboard.press("Control+A")
        await page.keyboard.press("Backspace")
        pyperclip.copy(title)
        await page.keyboard.press("Control+V")
        await page.wait_for_timeout(500)
        
        # 注入正文 (小红书用的是富文本编辑器，直接点内容区全选粘贴最稳妥)
        content_loc = page.locator('[contenteditable="true"], #post-textarea, .ql-editor').first
        await content_loc.click()
        await page.keyboard.press("Control+A")
        await page.keyboard.press("Backspace")
        pyperclip.copy(content)
        await page.keyboard.press("Control+V")
        await page.wait_for_timeout(500)
        
        # ==========================================
        # 4. 高级选项与保存
        # ==========================================
        print("🛡️ 正在尝试开启【原创声明】...")
        try:
            # 原创声明的 checkbox 通常是隐藏的，必须用 force=True 强行点击
            original_switch = page.locator('text="原创声明"').locator("xpath=../..").locator('.css-switch, .switch-container, input[type="checkbox"]')
            if await original_switch.count() > 0:
                await original_switch.first.click(force=True, timeout=5000)
            else:
                print("⚠️ 没找到原创声明开关，跳过。")
        except Exception as e:
            print(f"⚠️ 开启原创声明失败: {e}")

        print("💾 正在点击保存草稿...")
        try:
            # 按钮可能不是 <button> 标签，直接用文本定位并强制点击
            draft_btn = page.locator('text="暂存离开", text="存草稿"')
            await draft_btn.first.click(force=True, timeout=5000)
            await page.wait_for_timeout(2000)
            print("✅ 完美！草稿保存成功！")
        except Exception as e:
            print(f"❌ 保存草稿失败: {e}")
        print("🎉 自动化流程全部走完！")
        print("👉 您可以在浏览器中检查排版并手动点击发布。")
        print("💡 浏览器将持续保持打开，直到您手动关闭它。")
        try:
            # 永久等待，直到用户手动关闭网页
            await page.wait_for_event("close", timeout=0)
        except Exception:
            pass

if __name__ == "__main__":
    import json
    config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "publish_config.json")
    
    if not os.path.exists(config_path):
        print(f"❌ 找不到配置文件: {config_path}")
        print("💡 请先生成 publish_config.json，包含 images (列表), title (字符串), content (字符串)")
        sys.exit(1)
        
    with open(config_path, "r", encoding="utf-8") as f:
        config = json.load(f)
        
    test_images = config.get("images", [])
    test_title = config.get("title", "")
    test_content = config.get("content", "")

    valid_images = [img for img in test_images if os.path.exists(img)]
    if not valid_images:
        print("❌ 未找到测试图片，请检查文件路径是否正确。")
        sys.exit(1)
        
    asyncio.run(publish_draft(valid_images, test_title, test_content))
