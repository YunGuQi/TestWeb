import requests
import json
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
        return {"error": r3.text}

def main():
    sys.stdout.reconfigure(encoding='utf-8')
    keyword = "测测你适合大城市拼，还是小城市慢慢过"
    print(f"正在搜索关键词: {keyword}")
    
    res = mcp_call("search_feeds", {
        "keyword": keyword, 
        "filters": {"sort_by": "综合", "note_type": "全部"}
    })
    
    if "error" in res:
        print("Search Error:", res["error"])
        return
        
    result_text = res["result"]["content"][0]["text"]
    data = json.loads(result_text)
    
    if not data:
        print("未找到帖子。")
        return
        
    target_feed = data[0]
    feed_id = target_feed.get("id")
    xsec_token = target_feed.get("xsecToken")
    
    print("正在拉取帖子详情...")
    detail_res = mcp_call("get_feed_detail", {
        "feed_id": feed_id,
        "xsec_token": xsec_token,
        "load_all_comments": False,
        "limit": 20
    })
    
    detail_text = detail_res["result"]["content"][0]["text"]
    
    with open("artifacts/temp_feed_data.json", "w", encoding="utf-8") as f:
        f.write(detail_text)
        
    print("详情抓取完成，已保存至 artifacts/temp_feed_data.json")

if __name__ == "__main__":
    main()
