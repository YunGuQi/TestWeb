import json, pathlib

with open('dump.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

city_questions = [q for q in data['questions'] if q['testId'] == 'city-personality']
city_results = [r for r in data['results'] if r['testId'] == 'city-personality']
configs = data.get('configs', [])

# Build TS constant strings
q_lines = []
for q in city_questions:
    opts = []
    for o in q['options']:
        opts.append(f"    {{ text: {json.dumps(o['text'], ensure_ascii=False)}, scores: {json.dumps(o['scores'], ensure_ascii=False)} }}")
    q_lines.append(
        f"  {{ order: {q['order']}, text: {json.dumps(q['text'], ensure_ascii=False)}, testId: 'city-personality', options: [\n" +
        ',\n'.join(opts) +
        "\n  ]}"
    )

r_lines = []
for r in city_results:
    r_lines.append(
        f"  {{ testId: 'city-personality', title: {json.dumps(r['title'], ensure_ascii=False)}, desc: {json.dumps(r['desc'], ensure_ascii=False)}, quote: {json.dumps(r['quote'], ensure_ascii=False)}, imageUrl: {json.dumps(r['imageUrl'], ensure_ascii=False)}, condition: {json.dumps(r['condition'], ensure_ascii=False)} }}"
    )

# Configs
emo_config = next((c for c in configs if c['testId'] == 'emotional-friction'), None)
city_config = next((c for c in configs if c['testId'] == 'city-personality'), None)

with open('scripts/seed_constants.ts', 'w', encoding='utf-8') as f:
    f.write("// 自动生成 - 城市测试完整数据\n")
    f.write("export const CITY_QUESTIONS: any[] = [\n")
    f.write(',\n'.join(q_lines))
    f.write("\n];\n\n")
    f.write("export const CITY_RESULTS: any[] = [\n")
    f.write(',\n'.join(r_lines))
    f.write("\n];\n\n")
    if emo_config:
        dc = json.dumps(emo_config['danmakuContent'], ensure_ascii=False)
        f.write(f"export const EMO_DANMAKU = {dc};\n")
    if city_config:
        dc2 = json.dumps(city_config['danmakuContent'], ensure_ascii=False)
        f.write(f"export const CITY_DANMAKU = {dc2};\n")

print("Done! seed_constants.ts written")
print(f"city_questions: {len(city_questions)}, city_results: {len(city_results)}")
