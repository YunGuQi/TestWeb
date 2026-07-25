import json

with open('dump.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# 提取城市测试题目
city_questions = [q for q in data['questions'] if q['testId'] == 'city-personality']
city_results = [r for r in data['results'] if r['testId'] == 'city-personality']
configs = data.get('configs', [])

print(f"城市题目数量: {len(city_questions)}")
print(f"城市结果数量: {len(city_results)}")
print(f"Config数量: {len(configs)}")
for c in configs:
    print(f"  testId={c['testId']}, danmakuContent={c['danmakuContent'][:80]}...")

# 输出为 JSON 方便复制
output = {
    'city_questions': city_questions,
    'city_results': city_results,
    'configs': configs
}
with open('city_data.json', 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)
print("已写入 city_data.json")
