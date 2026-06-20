import time
import pyautogui
import pyperclip

def type_xhs():
    title_text = "🌿测一测你的“情绪内耗”指数！"
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

    print("请在 15 秒内点击小红书网页的【填写标题】输入框，确保光标在里面闪烁！")
    for i in range(15, 0, -1):
        print(f"{i}...", end=" ", flush=True)
        time.sleep(1)
    print("\n开始注入标题！")

    # Paste title
    pyperclip.copy(title_text)
    time.sleep(0.1)
    pyautogui.hotkey('ctrl', 'v')
    time.sleep(0.5)

    print("切换到正文框...")
    # Press Tab to move to content area
    pyautogui.press('tab')
    time.sleep(0.5)

    print("开始注入正文！")
    # Paste content
    pyperclip.copy(content_text)
    time.sleep(0.1)
    pyautogui.hotkey('ctrl', 'v')
    time.sleep(0.5)

    print("注入完成！请手动点击发布按钮！")

if __name__ == "__main__":
    type_xhs()
