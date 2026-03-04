"""
FITNESS WEBSITE - Flask Backend
================================
Main application entry point. Serves HTML pages and provides
JSON API endpoints for exercises, nutrition, workout generation,
routines (CRUD), workout logging, and analytics.
"""

import json
import os
from flask import Flask, render_template, jsonify, request, session, redirect, url_for, flash
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
from flask_cors import CORS
import database
import random

# ---------------------------------------------------------------------------
# Exercise Selection Logic & Priority Lists
# ---------------------------------------------------------------------------
MAINSTREAM_COMPOUNDS = [
    "Barbell Bench Press", "Dumbbell Bench Press", "Push-Up", "Machine Chest Press", "Incline Bench Press", 
    "Barbell Squat", "Dumbbell Squat", "Machine Leg Press", "Barbell Lunge", "Dumbbell Lunge",
    "Barbell Deadlift", "Dumbbell Deadlift", "Barbell Row", "Dumbbell Row", "Pull-Up", "Chin-Up",
    "Barbell Overhead Press", "Dumbbell Shoulder Press", "Machine Shoulder Press",
    "Barbell Hip Thrust", "Dumbbell Hip Thrust"
]

COMMON_ACCESSORIES = [
    "Barbell Lateral Raise", "Dumbbell Lateral Raise", "Cable Lateral Raise",
    "Cable Tricep Pushdown", "Barbell Tricep Extension", "Dumbbell Tricep Extension",
    "Barbell Bicep Curl", "Dumbbell Bicep Curl", "Cable Bicep Curl", "Hammer Curl",
    "Machine Leg Extension", "Machine Leg Curl", "Cable Face Pull", "Barbell Calf Raise", "Dumbbell Calf Raise"
]

NICHE_EXCLUDES = [
    "Zercher", "Tempo", "Paused", "Archer", "Handstand", "Muscle-Up", "Pistol Squat"
]

# PPL Movement Classifications
PPL_MAPPING = {
    "Push": ["Chest", "Shoulders", "Arms"], # Shoulders (Front/Side), Triceps
    "Pull": ["Back", "Arms"], # Back, Rear Delts, Biceps
    "Legs": ["Legs"], # Quads, Hamstrings, Glutes, Calves
    "Core": ["Core"]
}

PUSH_SUBGROUPS = ["Chest", "Shoulders", "Triceps"]
PULL_SUBGROUPS = ["Back", "Biceps", "Rear Delts"]
LEGS_SUBGROUPS = ["Quads", "Hamstrings", "Glutes", "Calves"]

# Volume Targets per Week (Sets)
VOLUME_TARGETS = {
    "beginner": {"min": 8, "max": 12},
    "intermediate": {"min": 10, "max": 16},
    "advanced": {"min": 12, "max": 20}
}

def get_ppl_category(ex):
    """Categorize exercise into Push, Pull, or Legs based on muscle and movement."""
    muscle = ex["muscle_group"]
    name = ex["name"].lower()
    
    # Specific Tricep/Bicep check (as they are in 'Arms')
    if muscle == "Arms":
        if any(w in name for w in ["tricep", "extension", "dip", "pressdown"]): return "Push"
        if any(w in name for w in ["curl", "bicep", "chin"]): return "Pull"
    
    if muscle in ["Chest", "Shoulders"]: return "Push"
    if muscle in ["Back"]: return "Pull"
    if muscle in ["Legs"]: return "Legs"
    if muscle in ["Core"]: return "Core"
    return "Other"

def detect_split(days, selected_groups=None):
    """Automatically determine the optimal split based on days and focus."""
    # If user selected specific muscles, adapt
    if selected_groups and len(selected_groups) < 4:
        # e.g. Just Chest & Shoulders -> 3 days -> Push/Push/Push
        # We'll just distribute them nicely
        return ["Custom Focus"] * days

    if days == 2: return ["Upper Body", "Lower Body"]
    if days == 3: return ["Push", "Pull", "Legs"]
    if days == 4: return ["Upper Body", "Lower Body", "Upper Body", "Lower Body"]
    if days >= 5: return ["Push", "Pull", "Legs", "Push", "Pull", "Legs"][:days]
    return ["Full Body"] * days

def get_exercise_priority(ex, recent_ids):
    """Calculate sorting priority: 0 (Highest) to 4 (Lowest)."""
    if str(ex["id"]) in [str(rid) for rid in recent_ids]:
        return 0
    if ex["name"] in MAINSTREAM_COMPOUNDS:
        return 1
    if ex["name"] in COMMON_ACCESSORIES:
        return 2
    if any(niche in ex["name"] for niche in NICHE_EXCLUDES):
        return 4
    return 3

# ---------------------------------------------------------------------------
# App Configuration
# ---------------------------------------------------------------------------
app = Flask(__name__)
app.secret_key = "fitforge_secure_key_123" # In production, use environment variable
CORS(app)  # Enable Cross-Origin requests for the API

# Absolute path to the data directory
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

# Init DB on startup
with app.app_context():
    database.init_db()


# ---------------------------------------------------------------------------
# Helper: Load JSON data file
# ---------------------------------------------------------------------------
def load_json(filename):
    """Load and return contents of a JSON file from the data directory."""
    filepath = os.path.join(DATA_DIR, filename)
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)


# ---------------------------------------------------------------------------
# Middleware: Authentication
# ---------------------------------------------------------------------------
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user_id" not in session:
            return redirect(url_for("login"))
        return f(*args, **kwargs)
    return decorated_function


# ---------------------------------------------------------------------------
# Page Routes — serve HTML templates
# ---------------------------------------------------------------------------

@app.route("/")
@app.route("/home")
def home():
    if "user_id" in session:
        return render_template("index.html", user=session.get("username"))
    return render_template("index.html")


# ---------------------------------------------------------------------------
# Auth Routes
# ---------------------------------------------------------------------------
@app.route("/signup", methods=["GET", "POST"])
def signup():
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "")
        confirm_password = request.form.get("confirm_password", "")

        if not username or not password:
            flash("Username and password are required.", "error")
            return render_template("signup.html")
        
        if len(password) < 6:
            flash("Password must be at least 6 characters.", "error")
            return render_template("signup.html")

        if password != confirm_password:
            flash("Passwords do not match.", "error")
            return render_template("signup.html")

        if database.get_user_by_username(username):
            flash("Username already exists.", "error")
            return render_template("signup.html")

        password_hash = generate_password_hash(password)
        database.create_user(username, password_hash)
        flash("Signup successful! Please log in.", "success")
        return redirect(url_for("login"))

    return render_template("signup.html")


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "")

        user = database.get_user_by_username(username)
        if user and check_password_hash(user["password_hash"], password):
            session["user_id"] = user["id"]
            session["username"] = user["username"]
            return redirect(url_for("home"))
        
        flash("Invalid username or password.", "error")
        return render_template("login.html")

    return render_template("login.html")


@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login"))


@app.route("/calculators")
@app.route("/calculators/bmi")
@app.route("/calculators/bodyfat")
def calculators():
    return render_template("calculators.html")


@app.route("/exercises")
def exercises():
    return render_template("exercises.html")


@app.route("/workout")
@app.route("/workout-generator")
def workout():
    return render_template("workout.html")


@app.route("/nutrition")
def nutrition():
    return render_template("nutrition.html")


@app.route("/routines")
@login_required
def routines():
    return render_template("routines.html", user=session.get("username"))


@app.route("/analytics")
@login_required
def analytics():
    return render_template("analytics.html", user=session.get("username"))


@app.route("/training")
@login_required
def training():
    return render_template("training.html", user=session.get("username"))


@app.route("/calisthenics")
def calisthenics():
    return render_template("calisthenics.html")


@app.route("/history")
@login_required
def history():
    return render_template("history.html", user=session.get("username"))


@app.route("/exercise/<exercise_id>/stats")
@login_required
def exercise_stats(exercise_id):
    return render_template("exercise_stats.html", exercise_id=exercise_id, user=session.get("username"))


# ---------------------------------------------------------------------------
# API: Exercises
# ---------------------------------------------------------------------------
@app.route("/api/exercises")
def api_exercises():
    exercises_data = load_json("exercises.json")

    muscle = request.args.get("muscle_group", "").strip()
    difficulty = request.args.get("difficulty", "").strip()
    equipment = request.args.get("equipment", "").strip()
    tag = request.args.get("tag", "").strip().lower()
    search = request.args.get("q", "").strip().lower()

    if muscle:
        exercises_data = [e for e in exercises_data if e["muscle_group"].lower() == muscle.lower()]
    if difficulty:
        exercises_data = [e for e in exercises_data if e["difficulty"].lower() == difficulty.lower()]
    if equipment:
        exercises_data = [e for e in exercises_data if equipment.lower() in e["equipment"].lower()]
    if tag:
        exercises_data = [e for e in exercises_data if "tags" in e and tag in [t.lower() for t in e["tags"]]]
    if search:
        exercises_data = [e for e in exercises_data if search in e["name"].lower()]

    # Apply Prioritization & Sorting
    user_id = session.get("user_id")
    recent_ids = database.get_recent_exercises(user_id, limit=12) if user_id else []
    exercises_data.sort(key=lambda x: (get_exercise_priority(x, recent_ids), x["name"]))

    return jsonify(exercises_data)


@app.route("/api/exercises/<exercise_id>")
def api_exercise_detail(exercise_id):
    exercises_data = load_json("exercises.json")
    for ex in exercises_data:
        if str(ex["id"]) == str(exercise_id):
            return jsonify(ex)
    return jsonify({"error": "Exercise not found"}), 404


# ---------------------------------------------------------------------------
# API: Nutrition
# ---------------------------------------------------------------------------
@app.route("/api/nutrition")
def api_nutrition():
    nutrition_data = load_json("nutrition.json")
    category = request.args.get("category", "").strip()
    if category and category in nutrition_data:
        return jsonify({category: nutrition_data[category]})
    return jsonify(nutrition_data)


# ---------------------------------------------------------------------------
# API: Workout Generator
# ---------------------------------------------------------------------------
@app.route("/api/workout", methods=["POST"])
def api_workout():
    data = request.get_json()

    goal = data.get("goal", "muscle_gain").lower().replace(" ", "_")
    level = data.get("level", "beginner").lower()
    days = int(data.get("days", 3))
    selected_groups = data.get("muscle_groups", [])

    if days < 3:
        days = 3
    elif days > 5:
        days = 5

    rules = load_json("workout_rules.json")
    exercises_data = load_json("exercises.json")

    try:
        rule_set = rules["goals"][goal][level][f"days_{days}"]
    except KeyError:
        return jsonify({"error": "Invalid combination of goal, level, or days."}), 400

    split = rule_set["split"]
    sets_per_exercise = rule_set["sets_per_exercise"]
    reps = rule_set["reps"]
    rest = rule_set["rest_between_sets"]
    rest_days_note = rule_set["rest_between_days"]

    exercise_ids_by_group = rules["muscle_group_exercises"]
    exercise_by_id = {e["id"]: e for e in exercises_data}

    import random

    def get_exercises_for_groups(groups, limit=4, equipment_filter=None, level="beginner"):
        result = []
        pool = []
        for group in groups:
            ids = exercise_ids_by_group.get(group, [])
            for eid in ids:
                if eid in exercise_by_id:
                    ex = exercise_by_id[eid]
                    
                    # Equipment Check
                    if equipment_filter:
                        matched = any(eq.lower() in ex["equipment"].lower() for eq in equipment_filter)
                        if not matched and ex["equipment"].lower() not in ["none", "bodyweight"]:
                            continue

                    # Experience Check
                    priority = get_exercise_priority(ex, [])
                    if level == "beginner":
                        if priority == 4: continue # No niche
                        if "machine" not in ex["equipment"].lower() and priority > 1: continue # Prefer compounds/machines
                    
                    pool.append(ex)
        
        # Priority Based Picking
        random.shuffle(pool)
        pool.sort(key=lambda x: get_exercise_priority(x, []))
        
        for ex in pool[:limit]:
            result.append({
                "id": ex["id"],
                "name": ex["name"],
                "muscle_group": ex["muscle_group"],
                "equipment": ex["equipment"],
                "difficulty": ex["difficulty"],
                "sets": str(sets_per_exercise),
                "reps": reps,
                "rest": rest
            })
        return result

    def split_to_groups(split_name):
        mapping = {
            "Push": ["Chest", "Shoulders", "Arms"],
            "Pull": ["Back", "Arms"],
            "Legs": ["Legs", "Core"],
            "Upper Body": ["Chest", "Back", "Shoulders", "Arms"],
            "Lower Body": ["Legs", "Core"],
            "Full Body": ["Chest", "Back", "Legs", "Shoulders", "Core"],
        }
        return mapping.get(split_name, ["Chest", "Back", "Legs"])

    # 1. NEW: Auto-Structure Split based on days
    split = detect_split(days, selected_groups)
    
    # 2. Volume Target Setup
    targets = VOLUME_TARGETS.get(level, VOLUME_TARGETS["beginner"])
    target_sets_per_muscle = (targets["min"] + targets["max"]) // 2
    
    # Count frequency of each muscle group in the split
    frequency = {}
    for day_split in split:
        gs = split_to_groups(day_split)
        for g in gs:
            frequency[g] = frequency.get(g, 0) + 1
            
    week_plan = []
    muscle_volume_tracker = {} # Track total weighted sets per muscle {muscle: 0.0}

    for i, day_split in enumerate(split):
        groups = split_to_groups(day_split)
        
        # If user manually selects muscle focus, adapt
        if selected_groups:
            if day_split == "Custom Focus":
                groups = list(selected_groups)
            else:
                filtered = [g for g in groups if g in selected_groups]
                if filtered:
                    groups = filtered

        # 3. Intelligent Exercise Selection for the Day
        day_pool = []
        for g in groups:
            ids = exercise_ids_by_group.get(g, [])
            for eid in ids:
                if eid in exercise_by_id:
                    ex = exercise_by_id[eid]
                    
                    # Equipment Check
                    if data.get("equipment"):
                        matched = any(eq.lower() in ex["equipment"].lower() for eq in data.get("equipment"))
                        if not matched and ex["equipment"].lower() not in ["none", "bodyweight"]:
                            continue

                    # Experience Check
                    priority = get_exercise_priority(ex, [])
                    if level == "beginner":
                        if priority == 4: continue # No niche
                        if "machine" not in ex["equipment"].lower() and priority > 1: continue 
                    
                    # PPL Categorization Filter
                    if day_split in ["Push", "Pull", "Legs"]:
                        if get_ppl_category(ex) != day_split:
                            continue
                            
                    day_pool.append(ex)

        # 4. Apply Balancing Rules (Compound First, No Overload)
        selected_for_day = []
        # Sort: Compounds (Priority 1) -> Accessories (Priority 2)
        random.shuffle(day_pool)
        day_pool.sort(key=lambda x: get_exercise_priority(x, []))
        
        # Rule: Vertical vs Horizontal Balance for Pull
        has_vertical = False
        has_horizontal = False
        
        # Rule: No more than 2 pressing compounds for Push day
        press_count = 0
        
        # Rule: Prevent redundant isolation stacking (max 2 per muscle)
        muscle_isolation_count = {}
        
        muscle_in_session_count = {}

        for ex in day_pool:
            if len(selected_for_day) >= 6: break
            
            # Pattern checks
            lower_name = ex["name"].lower()
            tags = [t.lower() for t in ex.get("tags", [])]
            is_press = any(w in lower_name for w in ["press", "bench", "push"]) or "press" in tags
            is_vertical = any(w in lower_name for w in ["pull", "chin", "lat"]) or "vertical pull" in tags
            is_horizontal = any(w in lower_name for w in ["row"]) or "horizontal pull" in tags
            is_isolation = "isolation" in tags
            is_compound = "compound" in tags
            
            # Enforce 1 primary compound
            if len(selected_for_day) == 0 and not is_compound and any("compound" in [t.lower() for t in e.get("tags", [])] for e in day_pool):
                 # Skip isolations if we haven't picked a compound yet and there is one available
                 continue

            if day_split == "Push":
                if is_press and is_compound:
                     if press_count >= 2: continue
                     press_count += 1
            
            if day_split == "Pull":
                if is_vertical and has_vertical and is_compound: continue
                if is_horizontal and has_horizontal and is_compound: continue
                if is_vertical: has_vertical = True
                if is_horizontal: has_horizontal = True
                
            muscle = ex["muscle_group"]
            
            if is_isolation:
                if muscle_isolation_count.get(muscle, 0) >= 2: continue
                muscle_isolation_count[muscle] = muscle_isolation_count.get(muscle, 0) + 1

            muscle_in_session_count[muscle] = muscle_in_session_count.get(muscle, 0) + 1
            selected_for_day.append(ex)

        # 5. Distribute Volume per Exercise
        final_day_exercises = []
        for ex in selected_for_day:
            muscle = ex["muscle_group"]
            freq = frequency.get(muscle, 1)
            count_in_session = muscle_in_session_count.get(muscle, 1)
            
            # Base sets needed for this muscle in this session
            sets_needed = target_sets_per_muscle / (freq * count_in_session)
            
            # Priority weighting: Compounds 1.0, others 0.5 (need twice as many sets of isolation to equal compound volume)
            is_compound = "compound" in [t.lower() for t in ex.get("tags", [])]
            priority = get_exercise_priority(ex, [])
            weight = 1.0 if is_compound or priority <= 1 else 0.5
            
            # Adjusted sets to hit volume
            adj_sets = round(sets_needed / weight)
            
            # Hard Minimums and Maximums per Session
            adj_sets = max(2, min(adj_sets, 8)) # Never more than 8 sets of one movement
            
            # Prevent Exceeding Weekly Maximum (20 sets) unless advanced
            current_vol = muscle_volume_tracker.get(muscle, 0)
            max_weekly_vol = targets["max"] if level != "advanced" else 24
            
            if (current_vol + (adj_sets * weight)) > max_weekly_vol:
                # Calculate how many sets we can actually afford
                afforded_sets = (max_weekly_vol - current_vol) / weight
                adj_sets = max(2, round(afforded_sets)) # Give at least 2 if we picked the exercise
            
            # Track volume (weighted)
            muscle_volume_tracker[muscle] = current_vol + (adj_sets * weight)

            final_day_exercises.append({
                "id": ex["id"],
                "name": ex["name"],
                "muscle_group": ex["muscle_group"],
                "equipment": ex["equipment"],
                "difficulty": ex["difficulty"],
                "sets": str(adj_sets),
                "reps": reps,
                "rest": rest
            })

        week_plan.append({
            "day": i + 1,
            "label": f"Day {i + 1}",
            "focus": day_split,
            "exercises": final_day_exercises
        })

    # Prepare Volume Summary
    volume_summary = {}
    for m, vol in muscle_volume_tracker.items():
        if vol < targets["min"]: status = "Low"
        elif vol > targets["max"] and level != "advanced": status = "High"
        elif vol > 24 and level == "advanced": status = "High"
        else: status = "Optimal"
        
        volume_summary[m] = {
            "total_sets": round(vol, 1),
            "status": status
        }

    cardio_note = rules["cardio_recommendations"].get(goal, "")

    return jsonify({
        "goal": goal.replace("_", " ").title(),
        "level": level.title(),
        "days_per_week": days,
        "rest_between_sets": rest,
        "rest_between_days": rest_days_note,
        "cardio_note": cardio_note,
        "plan": week_plan,
        "volume_summary": volume_summary
    })


# ---------------------------------------------------------------------------
# API: Routines — Collection
# ---------------------------------------------------------------------------
@app.route("/api/routines", methods=["GET", "POST"])
def api_routines():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    if request.method == "GET":
        return jsonify(database.get_all_routines(user_id))

    # POST — create new routine
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"error": "Routine name is required."}), 400
    description = (data.get("description") or "").strip()
    routine = database.create_routine(name, user_id, description)
    return jsonify(routine), 201


# ---------------------------------------------------------------------------
# API: Routines — Single Item
# ---------------------------------------------------------------------------
@app.route("/api/routines/<int:routine_id>", methods=["GET", "PUT", "DELETE"])
def api_routine_detail(routine_id):
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    routine = database.get_routine(routine_id, user_id)
    if not routine:
        return jsonify({"error": "Routine not found or unauthorized."}), 404

    if request.method == "GET":
        return jsonify(routine)

    if request.method == "PUT":
        data = request.get_json() or {}
        updated = database.update_routine(
            routine_id,
            user_id,
            name=data.get("name"),
            description=data.get("description")
        )
        return jsonify(updated)

    if request.method == "DELETE":
        database.delete_routine(routine_id, user_id)
        return jsonify({"message": "Routine deleted."})


# ---------------------------------------------------------------------------
# API: Routine Suggestions
# ---------------------------------------------------------------------------
@app.route("/api/routines/suggest", methods=["POST"])
def api_routine_suggest():
    data = request.get_json() or {}
    level = data.get("level", "beginner").lower()
    equipment = data.get("equipment", [])
    muscles = data.get("muscles", ["Chest", "Back", "Legs", "Shoulders", "Arms"])

    exercises_data = load_json("exercises.json")
    exercise_by_id = {e["id"]: e for e in exercises_data}
    rules = load_json("workout_rules.json")
    exercise_ids_by_group = rules["muscle_group_exercises"]

    suggested = []
    import random

    # PRIORITY STRUCTURE PER MUSCLE GROUP:
    # 1. Primary Compound (tag: compound)
    # 2. Secondary Compound/Hinge (tag: compound or hinge)
    # 3. Accessory (tag: isolation)
    
    for m in muscles:
        ids = exercise_ids_by_group.get(m, [])
        group_pool = [exercise_by_id[eid] for eid in ids if eid in exercise_by_id]
        
        # Filter by equipment
        if equipment:
            group_pool = [
                ex for ex in group_pool 
                if any(eq.lower() in ex["equipment"].lower() for eq in equipment) 
                or ex["equipment"].lower() in ["none", "bodyweight"]
            ]

        # Advanced Mode: Include skills
        if level != "advanced":
            group_pool = [ex for ex in group_pool if "skill" not in [t.lower() for t in ex.get("tags", [])]]

        # Categorize
        primaries = [ex for ex in group_pool if "compound" in [t.lower() for t in ex.get("tags", [])]]
        secondaries = [ex for ex in group_pool if "hinge" in [t.lower() for t in ex.get("tags", [])] or ("compound" in [t.lower() for t in ex.get("tags", [])] and ex not in primaries)]
        accessories = [ex for ex in group_pool if "isolation" in [t.lower() for t in ex.get("tags", [])]]
        skills = [ex for ex in group_pool if "skill" in [t.lower() for t in ex.get("tags", [])]]

        random.shuffle(primaries)
        random.shuffle(secondaries)
        random.shuffle(accessories)
        random.shuffle(skills)

        muscle_selections = []
        
        # Pick 1 Primary
        if primaries:
            muscle_selections.append(primaries[0])
        elif secondaries: # Fallback
            muscle_selections.append(secondaries[0])
            secondaries.pop(0)

        # Pick 1 Secondary
        if secondaries:
            muscle_selections.append(secondaries[0])
        elif accessories: # Fallback
            muscle_selections.append(accessories[0])
            accessories.pop(0)

        # Pick 1 Accessory
        if accessories:
            muscle_selections.append(accessories[0])

        # Advanced: Add 1 Skill or Accessory
        if level == "advanced":
            if skills:
                muscle_selections.append(skills[0])
            elif accessories:
                muscle_selections.append(accessories[0])

        # Balance: No more than 3-4 per muscle group in a single routine
        suggested.extend(muscle_selections[:4])

    # Final balance: Cap routine at 8-10 exercises total and prioritize compounds
    suggested.sort(key=lambda x: 0 if "compound" in [t.lower() for t in x.get("tags", [])] else 1)
    
    # Randomly cap to 8 but keep compounds first
    if len(suggested) > 8:
        compounds = [ex for ex in suggested if "compound" in [t.lower() for t in ex.get("tags", [])]]
        others = [ex for ex in suggested if "compound" not in [t.lower() for t in ex.get("tags", [])]]
        suggested = (compounds + others)[:8]

    return jsonify([{
        "exercise_id": ex["id"],
        "exercise_name": ex["name"],
        "muscle_group": ex["muscle_group"],
        "sets": 3,
        "reps": "8-12",
        "rest": "60s",
        "set_type": "Drop Set" if level == "advanced" and random.random() > 0.7 and "isolation" in [t.lower() for t in ex.get("tags", [])] else "Normal"
    } for ex in suggested])


# ---------------------------------------------------------------------------
# API: Add Exercise to Routine
# ---------------------------------------------------------------------------
@app.route("/api/routines/<int:routine_id>/exercises", methods=["POST"])
def api_routine_add_exercise(routine_id):
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    if not database.get_routine(routine_id, user_id):
        return jsonify({"error": "Routine not found or unauthorized."}), 404

    data = request.get_json() or {}
    exercise_id = data.get("exercise_id", "")
    exercise_name = data.get("exercise_name", "")
    if not exercise_id or not exercise_name:
        return jsonify({"error": "exercise_id and exercise_name are required."}), 400
    updated = database.add_exercise_to_routine(
        routine_id,
        user_id,
        exercise_id=exercise_id,
        exercise_name=exercise_name,
        sets=data.get("sets", 3),
        reps=data.get("reps", "8-12"),
        rest=data.get("rest", "60s"),
        set_type=data.get("set_type", "Normal"),
        superset_id=data.get("superset_id")
    )
    return jsonify(updated), 201


# ---------------------------------------------------------------------------
# API: Update / Remove RoutineExercise entry
# ---------------------------------------------------------------------------
@app.route("/api/routine-exercises/<int:entry_id>", methods=["PUT", "DELETE"])
def api_routine_exercise(entry_id):
    if request.method == "PUT":
        data = request.get_json() or {}
        database.update_routine_exercise(
            entry_id,
            sets=data.get("sets"),
            reps=data.get("reps"),
            rest=data.get("rest"),
            position=data.get("position"),
            set_type=data.get("set_type"),
            superset_id=data.get("superset_id")
        )
        return jsonify({"message": "Updated."})

    database.remove_routine_exercise(entry_id)
    return jsonify({"message": "Removed."})


# ---------------------------------------------------------------------------
# API: Workout Logs & Sessions
# ---------------------------------------------------------------------------
@app.route("/api/workout-logs", methods=["POST"])
def api_log_workout():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json() or {}
    routine_id = data.get("routine_id")
    routine_name = (data.get("routine_name") or "").strip()
    if not routine_name:
        return jsonify({"error": "routine_name is required."}), 400
    log = database.log_workout(user_id, routine_id, routine_name, notes=data.get("notes", ""))
    return jsonify(log), 201


@app.route("/api/workout-sessions", methods=["POST"])
def api_save_session():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json() or {}
    routine_id = data.get("routine_id")
    routine_name = data.get("routine_name", "Custom Workout")
    exercises = data.get("exercises", [])
    if not exercises:
        return jsonify({"error": "Exercises are required."}), 400
    log = database.save_workout_session(
        user_id,
        routine_id, 
        routine_name, 
        exercises, 
        notes=data.get("notes", ""),
        paused_duration=data.get("paused_duration", 0)
    )
    return jsonify(log), 201


@app.route("/api/history")
def api_history():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify([]) # Return empty history if not logged in
    return jsonify(database.get_workout_history(user_id))


@app.route("/api/history/<int:log_id>")
def api_history_detail(log_id):
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    detail = database.get_workout_detail(log_id, user_id)
    if not detail:
        return jsonify({"error": "Log not found or unauthorized."}), 404
    return jsonify(detail)


@app.route("/api/exercises/<exercise_id>/performance")
def api_exercise_performance(exercise_id):
    user_id = session.get("user_id")
    if not user_id:
         return jsonify({"history": [], "stats": {}, "prs": []})
    return jsonify(database.get_exercise_performance(exercise_id, user_id))


# ---------------------------------------------------------------------------
# API: Analytics
# ---------------------------------------------------------------------------
@app.route("/api/analytics")
def api_analytics():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
    return jsonify(database.get_analytics(user_id))


# ---------------------------------------------------------------------------
# Entry Point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    print("=" * 50)
    print("  FITNESS WEBSITE — Flask Server")
    print("  Open: http://127.0.0.1:5000")
    print("=" * 50)
    app.run(debug=True, host="127.0.0.1", port=5000)
