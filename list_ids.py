import json
with open('data/exercises.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
    ids = [ex['id'] for ex in data]
    print(json.dumps(ids, indent=2))
