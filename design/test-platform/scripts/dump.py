import sqlite3, json

def dump():
    conn = sqlite3.connect('prisma/dev.db')
    cursor = conn.cursor()
    cursor.execute('SELECT id, text, "order", testId FROM Question')
    questions = []
    for row in cursor.fetchall():
        cursor.execute('SELECT id, text, scores FROM Option WHERE questionId = ?', (row[0],))
        options = [{'id': o[0], 'text': o[1], 'scores': o[2]} for o in cursor.fetchall()]
        questions.append({'id': row[0], 'text': row[1], 'order': row[2], 'testId': row[3], 'options': options})

    cursor.execute('SELECT id, title, desc, quote, imageUrl, condition, testId FROM ResultConfig')
    results = [{'id': r[0], 'title': r[1], 'desc': r[2], 'quote': r[3], 'imageUrl': r[4], 'condition': r[5], 'testId': r[6]} for r in cursor.fetchall()]
    
    cursor.execute('SELECT id, testId, baseCount, danmakuSpeed, danmakuOpacity, danmakuContent FROM GlobalConfig')
    configs = [{'id': r[0], 'testId': r[1], 'baseCount': r[2], 'danmakuSpeed': r[3], 'danmakuOpacity': r[4], 'danmakuContent': r[5]} for r in cursor.fetchall()]

    with open('dump.json', 'w', encoding='utf-8') as f:
        json.dump({'questions': questions, 'results': results, 'configs': configs}, f, ensure_ascii=False)
    print('Dumped successfully!')

dump()
