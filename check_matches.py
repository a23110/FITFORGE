import json
import difflib

def find_closest():
    with open('data/exercises.json', 'r', encoding='utf-8') as f:
        exercises = json.load(f)
    ids = [ex['id'] for ex in exercises]
    
    intended = [
        "barbell_back_squat", "barbell_bench_press", "barbell_deadlift", "barbell_row", "barbell_overhead_press",
        "burpees", "jump_squats", "mountain_climbers", "high_knees", "cat_cow_stretch", "hip_rotations_90_90",
        "thoracic_spine_rotations", "deep_lunge_overhead_reach", "worlds_greatest_stretch", "foam_roll_back",
        "standing_hamstring_stretch", "seated_forward_fold", "figure_four_stretch", "zone_2_cardio", "push_up",
        "air_squat", "pull_up", "sit_up", "incline_dumbbell_press", "dumbbell_lateral_raise", "cable_chest_fly",
        "dumbbell_tricep_extension", "box_jump", "bulgarian_split_squat", "nordic_hamstring_curl", "lateral_band_walk",
        "standing_calf_raise", "romanian_deadlift", "cable_pull_through", "hip_thrust", "cable_face_pull",
        "easy_walk", "foam_roll_full_body", "joint_rotations"
    ]
    
    results = {}
    for name in intended:
        matches = difflib.get_close_matches(name, ids, n=1, cutoff=0.5)
        results[name] = matches[0] if matches else "MISSING"
        
    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    find_closest()
