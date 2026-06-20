import requests
import json
import base64
import sys

URL = "http://localhost:18060/mcp"

def mcp_call(method, params={}):
    # 1. Initialize
    init_data = {
        "jsonrpc": "2.0", "id": 1, "method": "initialize",
        "params": {"protocolVersion": "2024-11-05", "capabilities": {}, "clientInfo": {"name": "python", "version": "1.0"}}
    }
    headers_init = {"Accept": "application/json, text/event-stream"}
    r = requests.post(URL, json=init_data, headers=headers_init)
    session_id = r.headers.get("Mcp-Session-Id")
    
    # 2. Notify initialized
    headers = {"Mcp-Session-Id": session_id, "Accept": "application/json, text/event-stream"}
    requests.post(URL, json={"jsonrpc": "2.0", "method": "notifications/initialized"}, headers=headers)
    
    # 3. Call Tool
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
        print("⚠️ 未登录！正在获取二维码...")
        qr_res = mcp_call("get_login_qrcode")
        content_list = qr_res.get("result", {}).get("content", [])
        
        b64_str = ""
        for item in content_list:
            if item.get("type") == "image":
                b64_str = item.get("data", "")
                break
                
        if b64_str:
            with open("mcp_login_qr.png", "wb") as f:
                f.write(base64.b64decode(b64_str))
            print(">>> 请打开 mcp_login_qr.png 用小红书 APP 扫码登录！扫码后重新运行此脚本 <<<")
            return
        else:
            print("获取二维码失败！", qr_data)
            return

    keyword = "心理测试"
    print(f"✅ 已登录，正在搜索关键词: {keyword}...")
    
    res = mcp_call("search_feeds", {
        "keyword": keyword,
        "filters": {"sort_by": "最多点赞", "note_type": "图文"}
    })
    
    if "error" in res:
        print("Error:", res["error"])
        return
        
    result_text = res["result"]["content"][0]["text"]
    data = json.loads(result_text)
    
    print("\n--- Top 5 爆款帖子 ---")
    for i, feed in enumerate(data[:5]):
        card = feed.get("noteCard", {})
        title = card.get("displayTitle", "无标题")
        author = card.get("user", {}).get("nickname", "未知")
        likes = card.get("interactInfo", {}).get("likedCount", "0")
        print(f"Top {i+1}:")
        print(f"标题: {title}")
        print(f"作者: {author}")
        print(f"点赞: {likes}")
        print(f"ID: {feed.get('id')}")
        print("-" * 30)

if __name__ == "__main__":
    main()
