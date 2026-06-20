import sys
import io
import time
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
from playwright.sync_api import sync_playwright

def publish():
    with sync_playwright() as p:
        print("启动桌面浏览器...")
        # Launch browser headful
        browser = p.chromium.launch_persistent_context(
            user_data_dir="e:\\AI\\Antigravity\\小红书\\.playwright_data",
            headless=False,
            channel="chrome", # try to use local chrome to bypass detection
            args=["--start-maximized"]
        )
        page = browser.pages[0]
        
        print("正在前往小红书创作者中心...")
        page.goto("https://creator.xiaohongshu.com/publish/publish?source=official")
        
        print("等待登录或加载发布页面 (如果您看到登录码，请用手机扫码)...")
        # Wait up to 2 minutes for user to login if needed
        try:
            page.wait_for_url("**/publish/publish**", timeout=120000)
        except Exception:
            print("超时未进入发布页面")
            browser.close()
            return
            
        print("✅ 已成功进入发布页面！")
        time.sleep(3)
        
        # 1. Upload image
        print("📸 正在上传本地图片...")
        try:
            # wait for the file input to be available in the DOM
            page.wait_for_selector('input[type="file"]', timeout=10000)
            page.set_input_files('input[type="file"]', "e:\\AI\\Antigravity\\小红书\\测试链接合集.png")
            time.sleep(3)
        except Exception as e:
            print("上传图片失败:", e)
            
        # 2. Fill Title
        print("✍️ 正在自动填写标题...")
        title_text = "🌿测一测你的“情绪内耗”指数！"
        try:
            # xiaohongshu title is usually an input with placeholder "填写标题" or class "c-input_inner"
            title_input = page.locator('input[placeholder*="填写标题"], input.c-input_inner, input[type="text"]').first
            title_input.wait_for(state="visible", timeout=5000)
            title_input.fill(title_text)
            time.sleep(1)
        except Exception as e:
            print("填写标题失败:", e)
            
        # 3. Fill Content
        print("📝 正在自动注入文案正文...")
        content_text = """最近是不是常常觉得很累，明明什么都没做，却像是跑了一场马拉松？
脑子里总是有各种声音在打架，一点小事就能让你纠结半天？

别慌！这可能不是身体累了，而是你的“精神电量”正在被内耗悄悄吸干。🔋

💡 情绪内耗的4个典型信号：
1. 【过度反思】一件小事在脑子里反复回放，总觉得自已表现得不够好。
2. 【预支焦虑】事情还没发生，就开始疯狂脑补最坏的结果。
3. 【自我攻击】习惯性否定自已，把别人的情绪和错误归咎于自己。
4. 【选择困难】在无意义的选择上消耗大量精力，做决定变得无比艰难。

🌻 3个小方法，帮你切断“内耗插头”：
🌟 允许不完美：完成比完美更重要，做完就是胜利！
🌟 5分钟行动法：想做就立刻去做，用行动打败胡思乱想。
🌟 物理切断：当意识到自己在纠结时，立刻起身深呼吸，或者去喝杯水。

每一个普通人，都值得被温柔对待，包括你自己。❤️
想知道自己目前的内耗指数，可以到我的主页测一测哦～

#情绪内耗 #心理健康 #个人成长 #治愈系 #内耗自救指南 #正能量 #安安心理自评屋"""
        
        try:
            # XHS uses rich text editor (quill) or normal textarea
            editor = page.locator('.ql-editor, #post-textarea, textarea').first
            editor.wait_for(state="visible", timeout=5000)
            # Use innerText assignment if fill fails, but fill usually works for contenteditable
            editor.fill(content_text)
            time.sleep(2)
        except Exception as e:
            print("填写正文失败:", e)

        print("✨ 所有内容填装完毕！")
        print("🚀 尝试自动点击发布按钮...")
        try:
            # Find the publish button. It usually contains the text "发布"
            publish_btn = page.locator('button:has-text("发布")').first
            publish_btn.wait_for(state="visible", timeout=3000)
            publish_btn.click()
            print("✅ 已点击发布！如果您看到验证码，请在弹出的窗口中手动滑一下！")
        except Exception as e:
            print("未能自动点击发布按钮，您可以手动在界面上点击发布。")
            
        # Give user time to see it and pass captcha if needed
        print("程序将保持浏览器开启 60 秒，完成后将自动关闭...")
        time.sleep(60)
        
        browser.close()
        print("浏览器已关闭，发布流程结束！")

if __name__ == "__main__":
    publish()
