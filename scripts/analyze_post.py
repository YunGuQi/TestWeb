import requests
import json
import base64
import sys

URL = "http://localhost:18060/mcp"

def mcp_call(method, params={}):
    init_data = {
        "jsonrpc": "2.0", "id": 1, "method": "initialize",
        "params": {"protocolVersion": "2024-11-05", "capabilities": {}, "clientInfo": {"name": "python", "version": "1.0"}}
    }
    headers_init = {"Accept": "application/json, text/event-stream"}
    r = requests.post(URL, json=init_data, headers=headers_init)
    session_id = r.headers.get("Mcp-Session-Id")
    
    headers = {"Mcp-Session-Id": session_id, "Accept": "application/json, text/event-stream"}
    requests.post(URL, json={"jsonrpc": "2.0", "method": "notifications/initialized"}, headers=headers)
    
    call_data = {
        "jsonrpc": "2.0", "id": 2, "method": "tools/call",
        "params": {"name": method, "arguments": params}
    }
    r3 = requests.post(URL, json=call_data, headers=headers)
    try:
        return r3.json()
    except Exception as e:
        print("MCP Error:", r3.text)
        return {"error": r3.text}

def main():
    sys.stdout.reconfigure(encoding='utf-8')
    
    # 检查登录
    login_status = mcp_call("check_login_status")
    try:
        is_logged_in = json.loads(login_status["result"]["content"][0]["text"]).get("is_logged_in", False)
    except:
        is_logged_in = False

    if not is_logged_in:
        print("⚠️ 无法连接到小红书或未登录，请确保 cookies.json 在正确目录。")
        return

    print("✅ 已登录，正在搜索爆款笔记并获取详情...")
    res = mcp_call("search_feeds", {
        "keyword": "森林心理测试", 
        "filters": {"sort_by": "最多点赞", "note_type": "图文"}
    })
    
    if "error" in res:
        print("Search Error:", res["error"])
        return
        
    result_text = res["result"]["content"][0]["text"]
    data = json.loads(result_text)
    
    if not data:
        print("未找到帖子。")
        return
        
    # 找一篇趣味测试帖子（非医疗类）
    target_feed = None
    for feed in data:
        author = feed.get("noteCard", {}).get("user", {}).get("nickname", "")
        if "医生" not in author and "科" not in author:
            target_feed = feed
            break
            
    if not target_feed:
        target_feed = data[0]
        
    feed_id = target_feed.get("id")
    xsec_token = target_feed.get("xsecToken")
    title = target_feed.get("noteCard", {}).get("displayTitle", "")
    author = target_feed.get("noteCard", {}).get("user", {}).get("nickname", "")
    
    print(f"\n======== 抓取目标: {title} (作者: {author}) ========\n")
    print("正在拉取帖子详情和评论...\n")
    
    detail_res = mcp_call("get_feed_detail", {
        "feed_id": feed_id,
        "xsec_token": xsec_token,
        "load_all_comments": False,
        "limit": 15
    })
    
    detail_text = detail_res["result"]["content"][0]["text"]
    detail_data = json.loads(detail_text)
    
    # 提取有价值的信息
    note = detail_data.get("note", {})
    
    print("【首图与配图】")
    images = note.get("images", [])
    for i, img in enumerate(images):
        print(f"图 {i+1}: {img.get('url', '')}")
        
    print("\n【标题】")
    print(note.get("title", ""))
    
    print("\n【正文内容】")
    print(note.get("desc", ""))
    
    print("\n【互动数据】")
    print(f"点赞: {note.get('likedCount', 0)}, 收藏: {note.get('collectedCount', 0)}, 评论: {note.get('commentCount', 0)}")
    
    print("\n【热门评论提取】(观察博主如何互动)")
    comments = detail_data.get("comments", [])
    for i, c in enumerate(comments[:10]):
        content = c.get("content", "")
        print(f"[{i+1}] 用户: {content}")
        # 如果有回复，打印博主回复
        sub_comments = c.get("sub_comments", [])
        for sc in sub_comments:
            sc_author = sc.get("user_info", {}).get("nickname", "")
            if sc_author == author:
                print(f"    ↳ 博主回复: {sc.get('content', '')}")
            else:
                print(f"    ↳ 网友跟评: {sc.get('content', '')}")
                
    with open("artifacts/viral_post_data.json", "w", encoding="utf-8") as f:
        json.dump(detail_data, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    main()
