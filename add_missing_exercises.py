import json

missing_exercises = [
    {"id": "hip_rotations_90_90", "name": "90/90 Hip Rotations", "muscle_group": "Mobility", "equipment": "None", "difficulty": "Beginner", "tags": ["mobility", "hips"]},
    {"id": "thoracic_spine_rotations", "name": "Thoracic Spine Rotations", "muscle_group": "Mobility", "equipment": "None", "difficulty": "Beginner", "tags": ["mobility", "back"]},
    {"id": "deep_lunge_overhead_reach", "name": "Deep Lunge with Overhead Reach", "muscle_group": "Mobility", "equipment": "None", "difficulty": "Beginner", "tags": ["mobility", "full_body"]},
    {"id": "foam_roll_back", "name": "Foam Roll: Upper Back", "muscle_group": "Recovery", "equipment": "Foam Roller", "difficulty": "Beginner", "tags": ["recovery", "back"]},
    {"id": "standing_hamstring_stretch", "name": "Standing Hamstring Stretch", "muscle_group": "Stretching", "equipment": "None", "difficulty": "Beginner", "tags": ["stretching", "legs"]},
    {"id": "seated_forward_fold", "name": "Seated Forward Fold", "muscle_group": "Stretching", "equipment": "None", "difficulty": "Beginner", "tags": ["stretching", "legs"]},
    {"id": "figure_four_stretch", "name": "Figure-Four Stretch", "muscle_group": "Stretching", "equipment": "None", "difficulty": "Beginner", "tags": ["stretching", "hips"]},
    {"id": "zone_2_cardio", "name": "Zone 2 Cardio (Steady State)", "muscle_group": "Cardio", "equipment": "Various", "difficulty": "Beginner", "tags": ["cardio", "endurance"]},
    {"id": "hip_thrust", "name": "Hip Thrust", "muscle_group": "Legs", "equipment": "Barbell", "difficulty": "Intermediate", "tags": ["strength", "glutes", "compound"]},
    {"id": "easy_walk", "name": "Easy Walk / Active Recovery", "muscle_group": "Recovery", "equipment": "None", "difficulty": "Beginner", "tags": ["recovery", "cardio"]},
    {"id": "foam_roll_full_body", "name": "Foam Roll: Full Body", "muscle_group": "Recovery", "equipment": "Foam Roller", "difficulty": "Beginner", "tags": ["recovery", "full_body"]},
    {"id": "joint_rotations", "name": "Joint Rotations (Warmup)", "muscle_group": "Mobility", "equipment": "None", "difficulty": "Beginner", "tags": ["mobility", "warmup"]},
    {"id": "cat_cow_stretch", "name": "Cat-Cow Stretch", "muscle_group": "Mobility", "equipment": "None", "difficulty": "Beginner", "tags": ["mobility", "back"]},
    {"id": "bulgarian_split_squat", "name": "Bulgarian Split Squat", "muscle_group": "Legs", "equipment": "Dumbbell", "difficulty": "Intermediate", "tags": ["strength", "legs", "compound"]},
    {"id": "lateral_band_walk", "name": "Lateral Band Walk", "muscle_group": "Legs", "equipment": "Resistance Band", "difficulty": "Beginner", "tags": ["strength", "hips", "isolation"]}
]

def add_missing():
    with open('data/exercises.json', 'r', encoding='utf-8') as f:
        exercises = json.load(f)
    
    existing_ids = {ex['id'] for ex in exercises}
    
    added_count = 0
    for me in missing_exercises:
        if me['id'] not in existing_ids:
            # Add default properties
            me.update({
                "primary_muscle": me["muscle_group"],
                "secondary_muscles": [],
                "movement_type": "Other",
                "instructions": f"Perform {me['name']} as part of your protocol.",
                "rep_or_hold_suggestions": "As required",
                "reps": "As required",
                "sets": "3",
                "media": {"thumbnail": "/static/images/placeholder.svg", "video": ""},
                "image": "/static/images/placeholder.svg"
            })
            exercises.append(me)
            added_count += 1
            
    with open('data/exercises.json', 'w', encoding='utf-8') as f:
        json.dump(exercises, f, indent=2)
    print(f"Added {added_count} missing exercises to exercises.json")

if __name__ == "__main__":
    add_missing()
