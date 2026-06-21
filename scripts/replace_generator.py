import re

path = r"e:\AI\Antigravity\小红书\帖子物料\地气勘探局\post_generator.html"
with open(path, "r", encoding="utf-8") as f:
    html = f.read()

# Replace general strings
html = html.replace("NO.08 | 城市与性格", "NO.10 | 城市栖息地")
html = html.replace("# 现在的城市真的懂你吗？", "# 别让环境埋没了你")
html = html.replace("心灵归属", "环境契合度")

# Replace covers
html = html.replace(
    '救命！终于找到我<br><br>每天都<span class="highlight-red">很累</span>的<br><br>原因了 😭',
    '状态越来越差？<br><br>可能你真的<span class="highlight-red">待错了</span><br><br>城市 🛑'
)
html = html.replace(
    '得罪人的<span class="highlight-red">大实话</span>：<br><br>别硬挤北上广了 🛑',
    '别硬卷了！<br><br>有些城市可能天生<br><br><span class="highlight-red">“克”</span>你 🥀'
)
html = html.replace(
    '测疯了！据说<span class="highlight-red">90%</span>的人<br><br>都生活在<span class="highlight-red">错误</span>的城市 🤯',
    '测疯了！据说<span class="highlight-red">90%</span>的人<br><br>都生活在<span class="highlight-red">错误</span>的栖息地 🤯'
)
html = html.replace(
    '不知道该留下还是<br><br><span class="highlight-red">回老家</span>？<br><br>做完这篇就懂了 🧭',
    '不知道该留下还是<br><br><span class="highlight-red">换城市</span>？<br><br>做完这篇就懂了 🧭'
)
html = html.replace(
    '裸辞前，<br><br>我终于看清了<br><br>自己的<span class="highlight-red">底牌</span> 🃏',
    '换了座城市后，<br><br>我的状态<br><br>彻底<span class="highlight-red">拉满了</span> 🛫'
)

# Questions
html = html.replace("星期五晚上 11 点，你刚结束连续 14 天的加班，走出写字楼。", "休假时，你更倾向于哪种充电方式？")
html = html.replace("叫专车回家，只想赶紧把大脑关机。", "去有山有水的地方，亲近自然，安静放空。")
html = html.replace("突然觉得还没累透，想找个喧闹的地方报复性熬夜。", "去繁华的大都市，感受灯火阑珊和快节奏。")

html = html.replace("对于<span class=\"highlight-red underline-rough\">“30岁之前必须攒够100万”</span>这种网络观点，你内心的真实反应：", "面对突如其来的<span class=\"highlight-red underline-rough\">环境变动</span>，你的第一反应是：")
html = html.replace("深表认同，这是一种安全感底线。", "随遇而安，既来之则安之，觉得是新机会。")
html = html.replace("太焦虑了吧，人生为什么要被数字绑架。", "有点焦虑，想要提前规划好所有的应对方案。")

html = html.replace("去常买的咖啡店，老板突然开始<span class=\"highlight-red\">热情地叫出你的名字</span>：", "你理想中的居住环境周围，绝对不能缺少的是：")
html = html.replace("感觉私人领地被入侵，下次考虑换一家买。", "咖啡馆、便利店和24小时灯火通明的商圈。")
html = html.replace("觉得很亲切，顺便多聊了几句。", "公园绿地、安静的步道和能看到天空的视野。")

html = html.replace("休年假去旅行，你更倾向于：", "在人际交往中，你更舒服的状态是：")
html = html.replace("每天安排2个城市，特种兵式打卡。", "和两三知己深度交流，不需要刻意应酬。")
html = html.replace("找个舒服的酒店躺三天，哪也不去。", "喜欢热闹，能在各种社交场合中游刃有余。")

html = html.replace("如果你的生活是一列火车，你<span class=\"highlight-red\">最怕</span>遇到哪种情况？", "仔细回想一下，你在什么<span class=\"highlight-red\">天气</span>下效率最高、状态最好？")
html = html.replace("突然脱轨，不知道下一站停在哪里的失控。", "阳光明媚，天朗气清的晴朗日子。")
html = html.replace("永远按既定轨道行驶，一眼望到头的无趣。", "阴雨绵绵，或者带着一点凉意的阴天。")

# Ticket 
html = html.replace("即可获取你的简版性格诊断", "即可获取你的性格基因简版诊断")
html = html.replace("主页查看完整版，获取专属单程车票 👇", "主页查看完整版，获取专属异地调令 👇")
html = html.replace("逃离<br>许可", "异地<br>调令")
html = html.replace("北京", "大理", 1)
html = html.replace(">北京<", ">云南<")
html = html.replace("冰冷的齿轮驱动者", "旷野里的寻风者")
html = html.replace("“在绝对理性的巨型机器里，你找到了最安全的齿轮位置。”", "“你天生属于自然与旷野，钢筋水泥只会让你的灵魂逐渐枯萎。”")
html = html.replace(">快节奏<", ">自然治愈<")
html = html.replace(">高边界<", ">极度松弛<")
html = html.replace(">秩序掌控<", ">拒绝内卷<")
html = html.replace(">冷峻现实<", ">情绪自由<")

with open(path, "w", encoding="utf-8") as f:
    f.write(html)