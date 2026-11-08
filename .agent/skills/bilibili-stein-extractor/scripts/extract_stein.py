#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
extract_stein.py — 提取B站互动视频（stein）的完整分支逻辑图

用法:
    python3 extract_stein.py <BV号或视频URL> [-o 输出目录] [--cookie "SESSDATA=..."] [--delay 0.3]

输出（保存到输出目录，文件名取自视频标题）:
    <标题>_graph.json   完整分支图（节点、选项、条件、数值动作、隐藏变量）
    <标题>_quiz.json    推断出的问卷结构（题目/选项分值/结果区间，尽力而为）
    终端同时打印可读摘要。

匿名即可访问公开视频；若遇 -412 风控或需要登录的视频，用 --cookie 传入浏览器里的 SESSDATA。
"""
import argparse
import hashlib
import json
import os
import re
import sys
import time
import subprocess
from urllib.parse import urlencode

import requests

API_VIEW = "https://api.bilibili.com/x/web-interface/view"
API_PLAYER = "https://api.bilibili.com/x/player/v2"
API_EDGE = "https://api.bilibili.com/x/stein/edgeinfo_v2"

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/120.0 Safari/537.36")


def parse_bvid(text: str) -> str:
    m = re.search(r"(BV[0-9A-Za-z]{10})", text)
    if not m:
        sys.exit(f"无法从输入中解析 BV 号: {text}")
    return m.group(1)


class SteinExtractor:
    def __init__(self, bvid: str, cookie: str = "", delay: float = 0.3, retries: int = 3):
        self.bvid = bvid
        self.delay = delay
        self.retries = retries
        self.s = requests.Session()
        self.s.headers.update({"User-Agent": UA, "Referer": "https://www.bilibili.com"})
        if cookie:
            self.s.headers["Cookie"] = cookie

    def _get(self, url: str, params: dict) -> dict:
        last = None
        for i in range(self.retries):
            try:
                r = self.s.get(url, params=params, timeout=15)
                if r.status_code == 412:
                    raise RuntimeError("触发B站风控(-412)。请降低频率(--delay 1)，"
                                       "或用 --cookie 传入登录后的 SESSDATA 再试。")
                j = r.json()
                if j.get("code") == 0:
                    return j["data"]
                last = f"code={j.get('code')} message={j.get('message')}"
            except RuntimeError:
                raise
            except Exception as e:  # 网络抖动等
                last = str(e)
            time.sleep(1 + i)
        raise RuntimeError(f"请求失败 {url}: {last}")

    # ---------- 第一步：视频基本信息 ----------
    def get_view(self) -> dict:
        d = self._get(API_VIEW, {"bvid": self.bvid})
        if not d.get("stein_guide_cid"):
            sys.exit("该视频不是互动视频（无 stein_guide_cid），无法提取分支图。")
        return d

    # ---------- 第二步：互动图版本号 ----------
    def get_graph_version(self, cid: int) -> int:
        d = self._get(API_PLAYER, {"bvid": self.bvid, "cid": cid})
        gv = (d.get("interaction") or {}).get("graph_version")
        if not gv:
            sys.exit("未拿到 graph_version，该视频可能不是互动视频或需要登录。")
        return gv

    # ---------- 第三步：遍历分支图 ----------
    def get_edge(self, gv: int, edge_id: int | None) -> dict:
        params = {"bvid": self.bvid, "graph_version": gv}
        if edge_id is not None:
            params["edge_id"] = edge_id
        return self._get(API_EDGE, params)

    def crawl(self, gv: int) -> dict:
        nodes, hidden_vars, queue = {}, [], [None]
        while queue:
            eid = queue.pop(0)
            data = self.get_edge(gv, eid)
            real = data["edge_id"]
            if real in nodes:
                continue
            if data.get("hidden_vars"):
                hidden_vars = data["hidden_vars"]
            choices = []
            for q in (data.get("edges") or {}).get("questions", []):
                for c in q.get("choices", []):
                    choices.append({
                        "question_title": q.get("title") or "",
                        "option": c.get("option") or "",
                        "to_edge_id": c.get("id"),
                        "to_cid": c.get("cid"),
                        "condition": c.get("condition") or "",
                        "native_action": c.get("native_action") or "",
                        "is_default": c.get("is_default", 0),
                    })
                    if c.get("id") not in nodes:
                        queue.append(c.get("id"))
            nodes[real] = {
                "edge_id": real,
                "title": data.get("title") or "",
                "is_leaf": data.get("is_leaf", 0),
                "story": [{"title": s.get("title"), "cid": s.get("cid")}
                          for s in data.get("story_list", [])],
                "choices": choices,
            }
            print(f"\r已遍历 {len(nodes)} 个节点...", end="", flush=True)
            time.sleep(self.delay)
        print()
        return {"nodes": nodes, "hidden_vars": hidden_vars}


# ---------- 分析与推断 ----------
RE_DELTA = re.compile(r"\$(\w+)\s*=\s*\$\1\s*([+-])\s*([\d.]+)")
RE_RANGE = re.compile(r"\$(\w+)\s*>=\s*([\d.]+)\s*&&\s*\$\1\s*<=\s*([\d.]+)")


def parse_delta(action: str):
    m = RE_DELTA.search(action or "")
    if m:
        v = float(m.group(3)) * (1 if m.group(2) == "+" else -1)
        return m.group(1), v
    return None, None


def parse_range(cond: str):
    m = RE_RANGE.search(cond or "")
    if m:
        return m.group(1), float(m.group(2)), float(m.group(3))
    return None, None, None


def analyze(graph: dict) -> dict:
    nodes = graph["nodes"]
    var_names = {v["id_v2"].lstrip("$"): v.get("name", "") for v in graph["hidden_vars"]}

    # 1) 去重题目：选项内容(文本+动作+条件)完全相同的节点视为同一道题
    groups = {}
    for n in nodes.values():
        if not n["choices"]:
            continue
        key = tuple(sorted((c["option"], c["native_action"], c["condition"])
                           for c in n["choices"]))
        groups.setdefault(key, []).append(n["title"])
    questions = []
    for key, titles in groups.items():
        opts = []
        for opt, action, cond in key:
            var, delta = parse_delta(action)
            nav = bool(re.match(r"^（.*）$", opt.strip())) and not action  # （查看更多选项）（返回上层）等
            opts.append({"text": opt, "var": var, "var_name": var_names.get(var, ""),
                         "delta": delta, "condition": cond, "is_nav": nav,
                         "raw_action": action})
        questions.append({"node_titles": sorted(set(titles)), "options": opts})

    # 2) 结果节点及其判定条件（结果视频的真实 cid 在指向它的边上，story_list 对叶子不可靠）
    results = []
    for n in nodes.values():
        incoming = []
        for m in nodes.values():
            for c in m["choices"]:
                if c["to_edge_id"] == n["edge_id"]:
                    var, lo, hi = parse_range(c["condition"])
                    incoming.append({"condition": c["condition"], "var": var,
                                     "var_name": var_names.get(var, ""),
                                     "min": lo, "max": hi, "to_cid": c["to_cid"]})
        if n["is_leaf"] == 1 or not n["choices"]:
            edge_cids = sorted({x["to_cid"] for x in incoming if x.get("to_cid")})
            results.append({"edge_id": n["edge_id"], "title": n["title"],
                            "cids": edge_cids or [s["cid"] for s in n["story"]],
                            "rules": incoming})

    # 3) 各结果的路径数（迭代式后序遍历，防深链递归溢出；遇环跳过回边）
    CAP = 10 ** 7
    children = {eid: [c["to_edge_id"] for c in n["choices"]]
                for eid, n in nodes.items()}
    leaf_set = {r["edge_id"] for r in results}
    root = min(nodes)
    memo, visiting, stack = {}, set(), [(root, False)]
    while stack:
        eid, done = stack.pop()
        if done:
            if eid in leaf_set or not children.get(eid):
                res = {eid: 1}
            else:
                res = {}
                for ch in children[eid]:
                    for leaf, k in memo.get(ch, {}).items():
                        res[leaf] = min(CAP, res.get(leaf, 0) + k)
            memo[eid] = res
            visiting.discard(eid)
        else:
            if eid in memo:
                continue
            visiting.add(eid)
            stack.append((eid, True))
            for ch in children.get(eid, []):
                if ch not in memo and ch not in visiting:
                    stack.append((ch, False))
    dist = memo.get(root, {})
    for r in results:
        r["path_count"] = dist.get(r["edge_id"], 0)

    return {"variable_names": var_names, "questions": questions, "results": results,
            "total_paths_capped": min(CAP, sum(dist.values()))}


def safe_name(t: str) -> str:
    return re.sub(r'[\\/:*?"<>|\s]+', "_", t)[:60]


def main():
    ap = argparse.ArgumentParser(description="提取B站互动视频分支逻辑图")
    ap.add_argument("video", help="BV号或视频URL")
    ap.add_argument("-o", "--out", default=".", help="输出目录")
    ap.add_argument("--cookie", default="", help='登录Cookie，如 "SESSDATA=xxx"（可选）')
    ap.add_argument("--delay", type=float, default=0.3, help="每次请求间隔秒数")
    args = ap.parse_args()

    bvid = parse_bvid(args.video)
    os.makedirs(args.out, exist_ok=True)
    ex = SteinExtractor(bvid, cookie=args.cookie, delay=args.delay)

    view = ex.get_view()
    title = view["title"]
    print(f"视频: {title}\nUP主: {view['owner']['name']} (mid={view['owner']['mid']})")
    cid = view["pages"][0]["cid"]
    gv = ex.get_graph_version(cid)
    print(f"graph_version: {gv}")

    graph = ex.crawl(gv)
    meta = {"bvid": bvid, "title": title, "up": view["owner"]["name"],
            "mid": view["owner"]["mid"], "graph_version": gv,
            "url": f"https://www.bilibili.com/video/{bvid}"}
    graph_out = {"meta": meta, "hidden_vars": graph["hidden_vars"],
                 "nodes": graph["nodes"]}
    base = f"{args.out.rstrip('/')}/{safe_name(title)}"
    with open(f"{base}_graph.json", "w", encoding="utf-8") as f:
        json.dump(graph_out, f, ensure_ascii=False, indent=2)

    summary = analyze(graph)
    quiz = {"meta": meta, **summary}
    with open(f"{base}_quiz.json", "w", encoding="utf-8") as f:
        json.dump(quiz, f, ensure_ascii=False, indent=2)

    # ---- 终端摘要 & Markdown 报告 ----
    n_q = len(summary["questions"])
    n_r = len(summary["results"])
    
    md_lines = [f"# {title} 互动视频拆解报告", ""]
    md_lines.append(f"- **BV号**: {bvid}")
    md_lines.append(f"- **UP主**: {view['owner']['name']} (mid={view['owner']['mid']})")
    md_lines.append(f"- **图版本**: {gv}")
    md_lines.append(f"- **统计**: 节点 {len(graph['nodes'])} 个 | 去重题 {n_q} 道 | 结果 {n_r} 个 | 路径 {summary['total_paths_capped']}")
    
    if summary["variable_names"]:
        md_lines.append("\n## 隐藏计分变量")
        for k, v in summary["variable_names"].items():
            md_lines.append(f"- `{k}` : **{v}**")
            
    md_lines.append("\n## 去重后的题目与选项")
    print(f"\n节点 {len(graph['nodes'])} 个 | 去重后题目 {n_q} 道 | 结果 {n_r} 个")
    for i, q in enumerate(summary["questions"], 1):
        scored = any(o["delta"] for o in q["options"])
        title_str = " / ".join(q["node_titles"])
        md_lines.append(f"### [题 {i}] {title_str} {'*(计分题)*' if scored else ''}")
        for o in q["options"]:
            mark = f" → **{o['var_name'] or o['var']} {o['delta']:+.0f}**" if o["delta"] else ""
            cond = f" [条件: `{o['condition']}`]" if o["condition"] else ""
            nav = " [导航]" if o.get("is_nav") else ""
            md_lines.append(f"- {o['text']}{mark}{cond}{nav}")
            print(f"  - {o['text']}{mark}{cond}{nav}")

    md_lines.append("\n## 结果判定与结局节点 (Leaf)")
    for r in summary["results"]:
        rules = [x for x in r["rules"] if x["condition"]]
        if rules:
            x = rules[0]
            rng = f"{x['var_name'] or x['var']} ∈ [{x['min']:.0f}, {x['max']:.0f}]"
        else:
            rng = "无条件边"
        md_lines.append(f"### 结局标题: {r['title']}")
        md_lines.append(f"**判定条件**: {rng}")
        md_lines.append(f"**到达路径数**: {r['path_count']}")
        md_lines.append(f"**关联视频片段 (CID)**: `{r['cids']}`")
        md_lines.append("\n🛑 **这是一个结局节点 (Leaf)**\n")
        print(f"  {r['title']}: {rng} | cids={r['cids']}")

    report_path = f"{base}_report.md"
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("\n".join(md_lines))
    print(f"\n已保存报告: {report_path}")

    # ---- 自动下载结局的真实视频/截图 ----
    print("\n== 开始自动提取结局视频 ==")
    cids_to_fetch = set()
    for r in summary["results"]:
        cids_to_fetch.update(r["cids"])
        
    for cid in cids_to_fetch:
        play_url_api = f"https://api.bilibili.com/x/player/playurl?bvid={bvid}&cid={cid}&qn=32&fnval=1"
        try:
            res = ex.s.get(play_url_api, timeout=10).json()
            if res.get('code') == 0:
                p_url = res['data']['durl'][0]['url']
                out_path = f"{args.out.rstrip('/')}/结局_{cid}.mp4"
                print(f"Downloading video for CID {cid}...")
                cmd = ['ffmpeg', '-y', '-user_agent', UA, '-headers', f"Referer: https://www.bilibili.com/video/{bvid}/", '-i', p_url, '-c', 'copy', out_path]
                subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                print(f"Saved {out_path}")
            else:
                print(f"Failed to get playurl for {cid}: {res}")
        except Exception as e:
            print(f"Exception downloading {cid}: {e}")



if __name__ == "__main__":
    main()
