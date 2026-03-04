import json
import os
import re

def slugify(name):
    s = name.lower()
    s = re.sub(r'[^a-z0-9]+', '_', s)
    return s.strip('_')

def migrate():
    data_dir = "data"
    ex_path = os.path.join(data_dir, "exercises.json")
    rules_path = os.path.join(data_dir, "workout_rules.json")

    with open(ex_path, 'r', encoding='utf-8') as f:
        exercises = json.load(f)

    # Create mapping
    id_map = {}
    for ex in exercises:
        old_id = ex['id']
        new_id = slugify(ex['name'])
        # Handle duplicates if any
        base_id = new_id
        counter = 1
        while new_id in id_map.values():
            new_id = f"{base_id}_{counter}"
            counter += 1
        
        id_map[old_id] = new_id
        ex['id'] = new_id

    # Update exercises.json
    with open(ex_path, 'w', encoding='utf-8') as f:
        json.dump(exercises, f, indent=2)
    print(f"Migrated {len(exercises)} exercises in exercises.json")

    # Update workout_rules.json
    with open(rules_path, 'r', encoding='utf-8') as f:
        rules = json.load(f)

    if "muscle_group_exercises" in rules:
        new_mge = {}
        for group, ids in rules["muscle_group_exercises"].items():
            new_mge[group] = [id_map.get(old_id, old_id) for old_id in ids]
        rules["muscle_group_exercises"] = new_mge

    with open(rules_path, 'w', encoding='utf-8') as f:
        json.dump(rules, f, indent=2)
    print("Updated workout_rules.json")

if __name__ == "__main__":
    migrate()
