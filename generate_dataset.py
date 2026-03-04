import json
import random

def generate_exercises():
    exercises = []
    unique_names = set()

    def add_ex(name, p_muscle, s_muscles, equip, m_type, diff, inst, tags, reps, thumb="/static/images/placeholder.svg"):
        if name in unique_names:
            return
        unique_names.add(name)
        
        exercises.append({
            "id": len(exercises) + 1,
            "name": name,
            "primary_muscle": p_muscle,
            "muscle_group": p_muscle,
            "secondary_muscles": s_muscles,
            "equipment": equip,
            "movement_type": m_type,
            "difficulty": diff,
            "instructions": inst,
            "tags": list(set(tags)),
            "rep_or_hold_suggestions": reps,
            "reps": reps,
            "sets": "3",
            "media": {"thumbnail": thumb, "video": ""},
            "image": thumb
        })

    # BASE DATA (The core movements)
    base_movements = [
        # Chest
        ("Bench Press", "Chest", ["Shoulders", "Triceps"], "Push", ["strength", "chest", "compound"]),
        ("Chest Fly", "Chest", ["Shoulders"], "Push", ["strength", "chest", "isolation"]),
        ("Push-Up", "Chest", ["Shoulders", "Triceps"], "Push", ["calisthenics", "bodyweight", "basics"]),
        ("Chest Press", "Chest", ["Triceps"], "Push", ["machine", "chest"]),
        
        # Back
        ("Row", "Back", ["Biceps", "Rear Delts"], "Pull", ["strength", "back", "horizontal"]),
        ("Lat Pulldown", "Back", ["Biceps"], "Pull", ["machine", "back", "vertical"]),
        ("Pull-Up", "Back", ["Biceps"], "Pull", ["calisthenics", "back", "vertical"]),
        ("Chin-Up", "Arms", ["Back"], "Pull", ["calisthenics", "arms", "biceps"]),
        ("Deadlift", "Back", ["Legs", "Glutes", "Grip"], "Pull", ["strength", "back", "posterior"]),
        ("Shrug", "Shoulders", ["Traps"], "Pull", ["strength", "traps"]),
        
        # Legs
        ("Squat", "Legs", ["Glutes", "Lower Back"], "Legs", ["strength", "legs", "compound"]),
        ("Leg Press", "Legs", ["Glutes"], "Legs", ["machine", "legs"]),
        ("Lunge", "Legs", ["Glutes"], "Legs", ["strength", "legs"]),
        ("Leg Extension", "Legs", [], "Legs", ["machine", "legs", "isolation"]),
        ("Leg Curl", "Legs", [], "Legs", ["machine", "legs", "isolation"]),
        ("Calf Raise", "Legs", [], "Legs", ["strength", "legs", "isolation"]),
        ("Glute Bridge", "Legs", ["Glutes"], "Legs", ["bodyweight", "glutes"]),
        
        # Shoulders
        ("Overhead Press", "Shoulders", ["Triceps"], "Push", ["strength", "shoulders"]),
        ("Lateral Raise", "Shoulders", [], "Push", ["strength", "shoulders", "isolation"]),
        ("Front Raise", "Shoulders", [], "Push", ["strength", "shoulders", "isolation"]),
        ("Face Pull", "Shoulders", ["Back"], "Pull", ["cable", "shoulders", "posture"]),
        
        # Arms
        ("Bicep Curl", "Arms", [], "Pull", ["strength", "arms", "biceps"]),
        ("Hammer Curl", "Arms", ["Forearms"], "Pull", ["strength", "arms", "biceps"]),
        ("Tricep Extension", "Arms", [], "Push", ["strength", "arms", "triceps"]),
        ("Tricep Pushdown", "Arms", [], "Push", ["cable", "arms", "triceps"]),
        ("Dips", "Chest", ["Triceps"], "Push", ["calisthenics", "push"]),
        
        # Core
        ("Plank", "Core", ["Shoulders"], "Hold", ["core", "abs"]),
        ("Crunch", "Core", [], "Core", ["core", "abs"]),
        ("Leg Raise", "Core", ["Hips"], "Core", ["core", "abs"]),
        ("Russian Twist", "Core", ["Obliques"], "Core", ["core", "abs", "obliques"]),
        ("V-Sit", "Core", ["Abs"], "Hold", ["core", "abs", "skill"]),
        ("Hanging Knee Raise", "Core", ["Abs"], "Core", ["core", "abs", "calisthenics"]),
        ("Bird Dog", "Core", ["Lower Back"], "Hold", ["core", "mobility"]),
        ("Dead Bug", "Core", ["Abs"], "Core", ["core", "abs", "stability"]),
        ("Side Plank", "Core", ["Obliques"], "Hold", ["core", "obliques"]),
        
        # Mobility / Cardio / HIIT
        ("Burpee", "Full Body", ["Cardio"], "HIIT", ["hiit", "bodyweight"]),
        ("Mountain Climber", "Core", ["Cardio"], "HIIT", ["hiit", "core"]),
        ("Cat-Cow", "Full Body", [], "Mobility", ["mobility", "warmup", "spine"]),
        ("World's Greatest Stretch", "Full Body", [], "Mobility", ["mobility", "warmup"]),
        ("Kettlebell Swing", "Full Body", ["Glutes", "Back"], "HIIT", ["hiit", "kettlebell", "power"]),
        ("Box Jump", "Legs", ["Quads"], "HIIT", ["hiit", "power", "plyometrics"]),
        ("Jumping Jack", "Full Body", ["Cardio"], "HIIT", ["hiit", "cardio"]),
        ("Battle Ropes", "Arms", ["Shoulders"], "HIIT", ["hiit", "conditioning"])
    ]

    # Variation rules
    equipments = ["Barbell", "Dumbbell", "Kettlebell", "Cable", "Machine", "Resistance Band", "None"]
    angles = ["Flat", "Incline", "Decline"]
    positions = ["Standing", "Seated", "Lying", "Kneeling"]
    widths = ["Wide Grip", "Narrow Grip", "Standard"]
    grips = ["Underhand", "Neutral", "Overhand"]
    tempos = ["Standard", "Pause", "Slow Eccentric", "Explosive"]
    sides = ["Bilateral", "Single Arm", "Alternating"]

    # 1. GENERATE BASE STAPLES FIRST
    for name, muscle, secondary, m_type, tags in base_movements:
        # Default equipment for base
        if "calisthenics" in tags: equip = "None"
        elif "machine" in tags: equip = "Machine"
        elif "cable" in tags: equip = "Cable"
        elif "strength" in tags: equip = "Barbell"
        else: equip = "None"
        
        display_name = f"{equip} {name}" if equip != "None" else name
        add_ex(display_name.strip(), muscle, secondary, equip, m_type, "Beginner", f"Standard {display_name} for {muscle}.", tags + [equip.lower()], "10-12 reps")

    # 2. GENERATE COMBINATORIAL VARIATIONS
    for base_name, muscle, secondary, m_type, base_tags in base_movements:
        if len(exercises) >= 1000: break
        
        # Filter equipments that make sense for the movement
        valid_equips = []
        if "strength" in base_tags or "machine" in base_tags or "cable" in base_tags:
            valid_equips = ["Barbell", "Dumbbell", "Kettlebell", "Cable", "Machine", "Resistance Band"]
            if "Bench Press" in base_name: valid_equips = ["Barbell", "Dumbbell", "Kettlebell", "Cable", "Machine"]
        elif "calisthenics" in base_tags:
            valid_equips = ["None", "Weighted", "Band Assisted"]
            
        for equip in valid_equips:
            # Angles for specific moves
            move_angles = ["Flat"]
            if any(x in base_name for x in ["Bench Press", "Chest Fly", "Chest Press", "Row"]):
                move_angles = angles
            
            for angle in move_angles:
                # Grips for specific moves
                move_grips = ["Standard"]
                if any(x in base_name for x in ["Row", "Lat Pulldown", "Curl", "Extension", "Pushdown", "Overhead Press"]):
                    move_grips = grips
                
                for grip in move_grips:
                    # Sides
                    move_sides = ["Bilateral"]
                    if equip in ["Dumbbell", "Kettlebell", "Cable"]:
                        move_sides = sides
                    
                    for side in move_sides:
                        # Build name
                        name_parts = []
                        if angle != "Flat": name_parts.append(angle)
                        if grip != "Standard": name_parts.append(grip)
                        if side != "Bilateral": name_parts.append(side)
                        if equip != "None": name_parts.append(equip)
                        name_parts.append(base_name)
                        
                        full_name = " ".join(name_parts)
                       
                        # Difficulty
                        diff = "Beginner"
                        if "Advanced" in base_tags or side != "Bilateral" or angle in ["Incline", "Decline"]:
                            diff = "Intermediate"
                        
                        # Tags
                        tags = base_tags + [equip.lower(), angle.lower(), grip.lower(), side.lower()]
                        
                        # Instructions
                        instr = f"{full_name} focusing on {muscle}."
                        if side != "Bilateral": instr += " Perform reps on each side."
                        if grip == "Neutral": instr += " Use a palms-facing-each-other grip."
                        
                        add_ex(full_name, muscle, secondary, equip, m_type, diff, instr, tags, "8-12 reps")

    # 3. TEMPO / STYLE OVERLAYS
    current_pool = list(exercises)
    for ex in current_pool:
        if len(exercises) >= 1000: break
        
        # Only add variations for "Standard" or base moves to avoid "Pause Single Arm Incline Neutral Grip..."
        if any(t in ex['name'] for t in ["Pause", "Slow", "Explosive"]): continue
        
        for tempo in ["Pause", "Slow Eccentric", "Explosive"]:
            if len(exercises) >= 1000: break
            
            new_name = f"{tempo} {ex['name']}"
            new_tags = ex['tags'] + [tempo.lower(), "tempo"]
            new_instr = f"{ex['instructions']} Incorporate {tempo.lower()} control to increase intensity."
            
            add_ex(new_name, ex['primary_muscle'], ex['secondary_muscles'], ex['equipment'], ex['movement_type'], "Intermediate", new_instr, new_tags, ex['rep_or_hold_suggestions'])

    # 4. CALISTHENICS PROGRESSIONS (Hardcoded high quality)
    cali_pro = [
        ("Archer Push-Up", "Chest", ["Arms"], "None", "Push", "Advanced", "Weight shifted to one arm.", ["calisthenics", "skill", "unilateral"], "5 per side"),
        ("Pseudo Planche Push-Up", "Shoulders", ["Chest"], "None", "Push", "Advanced", "Leaning forward for shoulder intensity.", ["calisthenics", "planche"], "8 reps"),
        ("One Arm Push-Up", "Chest", ["Core"], "None", "Push", "Pro", "The ultimate horizontal push skill.", ["calisthenics", "pro", "mastery"], "3 per side"),
        ("Tuck Front Lever", "Back", ["Core"], "Pull-up Bar", "Hold", "Advanced", "Static hold with knees tucked.", ["calisthenics", "back", "lever"], "15s hold"),
        ("Advanced Tuck Front Lever", "Back", ["Core"], "Pull-up Bar", "Hold", "Advanced", "Static hold with back flat.", ["calisthenics", "back", "lever"], "10s hold"),
        ("Full Front Lever", "Back", ["Core"], "Pull-up Bar", "Hold", "Pro", "Full body horizontal hang.", ["calisthenics", "pro", "lever"], "5s hold"),
        ("Tuck Planche", "Shoulders", ["Core"], "Parallettes", "Hold", "Advanced", "Holding body off ground with knees tucked.", ["calisthenics", "skill"], "10s hold"),
        ("Straddle Planche", "Shoulders", ["Core"], "Parallettes", "Hold", "Pro", "Holding body with legs spread.", ["calisthenics", "pro"], "5s hold"),
        ("Full Planche", "Shoulders", ["Core"], "Parallettes", "Hold", "Pro", "The king of calisthenics push.", ["calisthenics", "pro"], "3s hold")
    ]
    
    for a in cali_pro:
        add_ex(*a)

    # Final writing
    with open("data/exercises.json", "w") as f:
        json.dump(exercises, f, indent=2)
    print(f"Generated {len(exercises)} unique exercises.")

    # Synchronize workout_rules.json
    try:
        with open("data/workout_rules.json", "r") as f:
            rules = json.load(f)
        
        # Build mapping
        mg_map = {
            "Chest": [], "Back": [], "Shoulders": [], "Arms": [], "Legs": [], "Core": []
        }
        for ex in exercises:
            mg = ex["primary_muscle"]
            if mg in mg_map:
                mg_map[mg].append(ex["id"])
        
        rules["muscle_group_exercises"] = mg_map
        
        with open("data/workout_rules.json", "w") as f:
            json.dump(rules, f, indent=2)
        print("Synchronized workout_rules.json with new exercise IDs.")
    except Exception as e:
        print(f"Non-critical error syncing rules: {e}")

if __name__ == "__main__":
    generate_exercises()
