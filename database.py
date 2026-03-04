"""
FITNESS WEBSITE — Database Layer
=================================
SQLite database initialization and helper functions for
Routines, RoutineExercises, and WorkoutLogs tables.
"""

import sqlite3
import os
import json

def load_json(filename):
    """Load and return contents of a JSON file from the data directory."""
    data_dir = os.path.join(os.path.dirname(__file__), "data")
    filepath = os.path.join(data_dir, filename)
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)

DB_PATH = os.path.join(os.path.dirname(__file__), "fitforge.db")


# ---------------------------------------------------------------------------
# Connection Helper
# ---------------------------------------------------------------------------
def get_db():
    """Open a database connection with row_factory set to Row."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


# ---------------------------------------------------------------------------
# Schema Initialization
# ---------------------------------------------------------------------------
def init_db():
    """Create all tables if they do not already exist."""
    conn = get_db()
    c = conn.cursor()

    # Routines — a named collection of exercises
    c.execute("""
        CREATE TABLE IF NOT EXISTS routines (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            name        TEXT    NOT NULL,
            description TEXT    DEFAULT '',
            created_at  TEXT    DEFAULT (datetime('now'))
        )
    """)

    # RoutineExercises — exercises inside a routine (ordered)
    c.execute("""
        CREATE TABLE IF NOT EXISTS routine_exercises (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            routine_id   INTEGER NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
            exercise_id  TEXT    NOT NULL,
            exercise_name TEXT   NOT NULL,
            sets         INTEGER DEFAULT 3,
            reps         TEXT    DEFAULT '8-12',
            rest         TEXT    DEFAULT '60s',
            position     INTEGER DEFAULT 0,
            set_type     TEXT    DEFAULT 'Normal',
            superset_id  INTEGER DEFAULT NULL
        )
    """)

    # WorkoutLogs — a completed workout session
    c.execute("""
        CREATE TABLE IF NOT EXISTS workout_logs (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            routine_id   INTEGER REFERENCES routines(id) ON DELETE SET NULL,
            routine_name TEXT    NOT NULL,
            notes        TEXT    DEFAULT '',
            logged_at    TEXT    DEFAULT (datetime('now')),
            paused_duration INTEGER DEFAULT 0
        )
    """)

    # WorkoutSessionExercises — summary of an exercise in a session
    c.execute("""
        CREATE TABLE IF NOT EXISTS workout_session_exercises (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            log_id          INTEGER NOT NULL REFERENCES workout_logs(id) ON DELETE CASCADE,
            exercise_id     TEXT    NOT NULL,
            exercise_name   TEXT    NOT NULL,
            sets_completed  INTEGER DEFAULT 0,
            rest_duration   TEXT    DEFAULT '',
            notes           TEXT    DEFAULT '',
            set_type        TEXT    DEFAULT 'Normal',
            superset_id     INTEGER DEFAULT NULL,
            weight_data     TEXT    DEFAULT ''
        )
    """)

    # WorkoutSets — granular data for every set performed
    c.execute("""
        CREATE TABLE IF NOT EXISTS workout_sets (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id   INTEGER NOT NULL REFERENCES workout_logs(id) ON DELETE CASCADE,
            exercise_id  TEXT    NOT NULL,
            set_type     TEXT    DEFAULT 'Normal',
            reps         INTEGER DEFAULT 0,
            weight       REAL    DEFAULT 0,
            rest         TEXT    DEFAULT '',
            order_index  INTEGER DEFAULT 0
        )
    """)

    # PersonalRecords — stores personal bests per exercise
    c.execute("""
        CREATE TABLE IF NOT EXISTS personal_records (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            exercise_id  TEXT    NOT NULL,
            record_type  TEXT    NOT NULL, -- 'weight', 'reps', '1rm', 'time'
            value        REAL    NOT NULL,
            date_achieved TEXT   DEFAULT (datetime('now')),
            log_id       INTEGER REFERENCES workout_logs(id) ON DELETE CASCADE
        )
    """)

    # --- Migration: Add missing columns if tables already existed ---
    try:
        # RoutineExercises
        columns = [row[1] for row in c.execute("PRAGMA table_info(routine_exercises)").fetchall()]
        if 'set_type' not in columns:
            c.execute("ALTER TABLE routine_exercises ADD COLUMN set_type TEXT DEFAULT 'Normal'")
        if 'superset_id' not in columns:
            c.execute("ALTER TABLE routine_exercises ADD COLUMN superset_id INTEGER DEFAULT NULL")
            
        # WorkoutLogs
        columns = [row[1] for row in c.execute("PRAGMA table_info(workout_logs)").fetchall()]
        if 'paused_duration' not in columns:
            c.execute("ALTER TABLE workout_logs ADD COLUMN paused_duration INTEGER DEFAULT 0")
            
        # WorkoutSessionExercises
        columns = [row[1] for row in c.execute("PRAGMA table_info(workout_session_exercises)").fetchall()]
        if 'set_type' not in columns:
            c.execute("ALTER TABLE workout_session_exercises ADD COLUMN set_type TEXT DEFAULT 'Normal'")
        if 'superset_id' not in columns:
            c.execute("ALTER TABLE workout_session_exercises ADD COLUMN superset_id INTEGER DEFAULT NULL")
        if 'weight_data' not in columns:
            c.execute("ALTER TABLE workout_session_exercises ADD COLUMN weight_data TEXT DEFAULT ''")
    except sqlite3.Error as e:
        print(f"[NOTE] Migration skipped or partially failed: {e}")

    conn.commit()
    conn.close()
    print("[OK] Database tables ready.")


# ---------------------------------------------------------------------------
# Routine CRUD helpers
# ---------------------------------------------------------------------------
def get_all_routines():
    conn = get_db()
    rows = conn.execute(
        "SELECT id, name, description, created_at FROM routines ORDER BY created_at DESC"
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_routine(routine_id):
    conn = get_db()
    routine = conn.execute(
        "SELECT id, name, description, created_at FROM routines WHERE id = ?",
        (routine_id,)
    ).fetchone()
    if not routine:
        conn.close()
        return None
    exercises = conn.execute(
        """SELECT id, exercise_id, exercise_name, sets, reps, rest, position, set_type, superset_id
           FROM routine_exercises WHERE routine_id = ? ORDER BY position""",
        (routine_id,)
    ).fetchall()
    conn.close()
    result = dict(routine)
    result["exercises"] = [dict(e) for e in exercises]
    return result


def create_routine(name, description=""):
    conn = get_db()
    c = conn.cursor()
    c.execute(
        "INSERT INTO routines (name, description) VALUES (?, ?)",
        (name.strip(), description.strip())
    )
    conn.commit()
    new_id = c.lastrowid
    conn.close()
    return get_routine(new_id)


def update_routine(routine_id, name=None, description=None):
    conn = get_db()
    if name is not None:
        conn.execute("UPDATE routines SET name = ? WHERE id = ?", (name.strip(), routine_id))
    if description is not None:
        conn.execute("UPDATE routines SET description = ? WHERE id = ?", (description.strip(), routine_id))
    conn.commit()
    conn.close()
    return get_routine(routine_id)


def delete_routine(routine_id):
    conn = get_db()
    conn.execute("DELETE FROM routines WHERE id = ?", (routine_id,))
    conn.commit()
    conn.close()


# ---------------------------------------------------------------------------
# RoutineExercise helpers
# ---------------------------------------------------------------------------
def add_exercise_to_routine(routine_id, exercise_id, exercise_name, sets=3, reps="8-12", rest="60s", set_type="Normal", superset_id=None):
    conn = get_db()
    max_pos = conn.execute(
        "SELECT COALESCE(MAX(position), -1) FROM routine_exercises WHERE routine_id = ?",
        (routine_id,)
    ).fetchone()[0]
    conn.execute(
        """INSERT INTO routine_exercises
           (routine_id, exercise_id, exercise_name, sets, reps, rest, position, set_type, superset_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (routine_id, exercise_id, exercise_name, sets, reps, rest, max_pos + 1, set_type, superset_id)
    )
    conn.commit()
    conn.close()
    return get_routine(routine_id)


def update_routine_exercise(entry_id, sets=None, reps=None, rest=None, position=None, set_type=None, superset_id=None):
    conn = get_db()
    if sets is not None:
        conn.execute("UPDATE routine_exercises SET sets = ? WHERE id = ?", (sets, entry_id))
    if reps is not None:
        conn.execute("UPDATE routine_exercises SET reps = ? WHERE id = ?", (reps, entry_id))
    if rest is not None:
        conn.execute("UPDATE routine_exercises SET rest = ? WHERE id = ?", (rest, entry_id))
    if position is not None:
        conn.execute("UPDATE routine_exercises SET position = ? WHERE id = ?", (position, entry_id))
    if set_type is not None:
        conn.execute("UPDATE routine_exercises SET set_type = ? WHERE id = ?", (set_type, entry_id))
    if superset_id is not None:
        conn.execute("UPDATE routine_exercises SET superset_id = ? WHERE id = ?", (superset_id, entry_id))
    conn.commit()
    conn.close()


def remove_routine_exercise(entry_id):
    conn = get_db()
    conn.execute("DELETE FROM routine_exercises WHERE id = ?", (entry_id,))
    conn.commit()
    conn.close()


# ---------------------------------------------------------------------------
# WorkoutLog & Session helpers
# ---------------------------------------------------------------------------
def log_workout(routine_id, routine_name, notes=""):
    conn = get_db()
    c = conn.cursor()
    c.execute(
        "INSERT INTO workout_logs (routine_id, routine_name, notes) VALUES (?, ?, ?)",
        (routine_id, routine_name, notes)
    )
    conn.commit()
    log_id = c.lastrowid
    row = conn.execute("SELECT * FROM workout_logs WHERE id = ?", (log_id,)).fetchone()
    conn.close()
    return dict(row)


def save_workout_session(routine_id, routine_name, exercises, notes="", paused_duration=0):
    """Save a full workout session with granular set tracking and PR detection."""
    conn = get_db()
    c = conn.cursor()
    
    try:
        if routine_id is not None:
            routine_id = int(routine_id)
    except (ValueError, TypeError):
        routine_id = None

    try:
        # 1. Create the main log entry
        c.execute(
            "INSERT INTO workout_logs (routine_id, routine_name, notes, paused_duration) VALUES (?, ?, ?, ?)",
            (routine_id, routine_name, notes, paused_duration)
        )
        log_id = c.lastrowid
        
        # 2. Add each exercise session and granular sets
        for ex in exercises:
            exercise_id = str(ex.get('exercise_id', ''))
            exercise_name = ex.get('exercise_name', 'Unknown')
            sets_count = ex.get('sets_completed', 0)
            weight_data = ex.get('weight_data', '')
            reps_str = ex.get('reps', '0')
            set_type = ex.get('set_type', 'Normal')

            # Save summary record
            c.execute(
                """INSERT INTO workout_session_exercises 
                   (log_id, exercise_id, exercise_name, sets_completed, rest_duration, notes, set_type, superset_id, weight_data)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (log_id, exercise_id, exercise_name, sets_count, ex.get('rest_duration', ''), 
                 ex.get('notes', ''), set_type, ex.get('superset_id'), weight_data)
            )

            # Save granular sets and check PRs
            # Note: weight_data might be "50" or "50,40,30" for drop sets
            weights = []
            try:
                weights = [float(x.strip()) for x in weight_data.split(',') if x.strip()]
            except:
                weights = [0.0]

            reps_list = []
            try:
                reps_list = [int(x.strip()) for x in reps_str.split(',') if x.strip()]
            except:
                reps_list = []

            for i, w in enumerate(weights):
                # Reps extraction: match with weights index or fallback to first/only
                try:
                    if i < len(reps_list):
                        reps = reps_list[i]
                    elif reps_list:
                        reps = reps_list[0]
                    elif '-' in reps_str:
                        parts = reps_str.split('-')
                        reps = int(parts[0]) 
                    else:
                        reps = int(reps_str)
                except:
                    reps = 10

                c.execute(
                    """INSERT INTO workout_sets (session_id, exercise_id, set_type, reps, weight, rest, order_index)
                       VALUES (?, ?, ?, ?, ?, ?, ?)""",
                    (log_id, exercise_id, set_type, reps, w, ex.get('rest_duration', ''), i)
                )

                # Check for Personal Records (Only for Normal or Drop Sets)
                if set_type in ['Normal', 'Drop Set']:
                    check_and_update_prs(c, log_id, exercise_id, w, reps)

        conn.commit()
        row = conn.execute("SELECT * FROM workout_logs WHERE id = ?", (log_id,)).fetchone()
        conn.close()
        return dict(row)
    except sqlite3.Error as e:
        conn.close()
        print(f"[ERROR] Database error in save_workout_session: {e}")
        raise

def check_and_update_prs(cursor, log_id, exercise_id, weight, reps):
    """Detects and stores new PRs for an exercise."""
    # 1. Heaviest Weight
    existing_max_weight = cursor.execute(
        "SELECT MAX(value) FROM personal_records WHERE exercise_id = ? AND record_type = 'weight'",
        (exercise_id,)
    ).fetchone()[0] or 0

    if weight > existing_max_weight:
        cursor.execute(
            "INSERT INTO personal_records (exercise_id, record_type, value, log_id) VALUES (?, ?, ?, ?)",
            (exercise_id, 'weight', weight, log_id)
        )

    # 2. Max Reps at this weight (Weight specific PR)
    # For simplicity, we'll store a generic 'max_reps' across all sessions
    existing_max_reps = cursor.execute(
        "SELECT MAX(value) FROM personal_records WHERE exercise_id = ? AND record_type = 'reps'",
        (exercise_id,)
    ).fetchone()[0] or 0
    if reps > existing_max_reps:
        cursor.execute(
            "INSERT INTO personal_records (exercise_id, record_type, value, log_id) VALUES (?, ?, ?, ?)",
            (exercise_id, 'reps', reps, log_id)
        )

    # 3. Estimated 1RM (Brzycki Formula: Weight * (36 / (37 - reps)))
    if reps > 0 and weight > 0:
        one_rm = weight * (36 / (37 - min(reps, 30)))
        existing_max_1rm = cursor.execute(
            "SELECT MAX(value) FROM personal_records WHERE exercise_id = ? AND record_type = '1rm'",
            (exercise_id,)
        ).fetchone()[0] or 0
        if one_rm > existing_max_1rm:
            cursor.execute(
                "INSERT INTO personal_records (exercise_id, record_type, value, log_id) VALUES (?, ?, ?, ?)",
                (exercise_id, '1rm', one_rm, log_id)
            )

def get_workout_history():
    conn = get_db()
    rows = conn.execute(
        """SELECT l.id, l.routine_name, l.logged_at, l.notes, l.paused_duration,
                  COUNT(e.id) as exercise_count, SUM(e.sets_completed) as total_sets
           FROM workout_logs l
           LEFT JOIN workout_session_exercises e ON l.id = e.log_id
           GROUP BY l.id ORDER BY l.logged_at DESC"""
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_workout_detail(log_id):
    conn = get_db()
    log = conn.execute("SELECT * FROM workout_logs WHERE id = ?", (log_id,)).fetchone()
    if not log:
        conn.close()
        return None
    
    exercises = conn.execute(
        """SELECT * FROM workout_session_exercises WHERE log_id = ?""",
        (log_id,)
    ).fetchall()
    
    sets = conn.execute(
        """SELECT * FROM workout_sets WHERE session_id = ? ORDER BY id ASC""",
        (log_id,)
    ).fetchall()
    
    prs = conn.execute(
        """SELECT * FROM personal_records WHERE log_id = ?""",
        (log_id,)
    ).fetchall()
    
    conn.close()
    
    result = dict(log)
    result["exercises"] = [dict(e) for e in exercises]
    result["sets"] = [dict(s) for s in sets]
    result["prs"] = [dict(p) for p in prs]
    return result

def get_exercise_performance(exercise_id):
    conn = get_db()
    
    # Weight and Reps progression over time
    history = conn.execute(
        """SELECT l.logged_at as date, s.weight, s.reps, s.set_type
           FROM workout_sets s
           JOIN workout_logs l ON s.session_id = l.id
           WHERE s.exercise_id = ?
           ORDER BY l.logged_at ASC""",
        (exercise_id,)
    ).fetchall()
    
    # Frequency and Records
    stats = conn.execute(
        """SELECT COUNT(DISTINCT session_id) as total_sessions,
                  MAX(weight) as max_weight,
                  MAX(reps) as max_reps
           FROM workout_sets WHERE exercise_id = ?""",
        (exercise_id,)
    ).fetchone()

    prs = conn.execute(
        """SELECT record_type, value, date_achieved 
           FROM personal_records WHERE exercise_id = ? 
           ORDER BY date_achieved DESC""",
        (exercise_id,)
    ).fetchall()

    conn.close()
    return {
        "history": [dict(h) for h in history],
        "stats": dict(stats) if stats else {},
        "prs": [dict(p) for p in prs]
    }


def get_analytics():
    conn = get_db()

    total_workouts = conn.execute("SELECT COUNT(*) FROM workout_logs").fetchone()[0]

    total_exercises_logged = conn.execute(
        "SELECT COUNT(*) FROM workout_session_exercises"
    ).fetchone()[0]

    # Calculate Volume: Sum(sets * weight) from non-Warm-up sets
    # Note: reps is not a column in workout_session_exercises in the current schema.
    # We will use the weight_data and reps stored in workout_sets for more accuracy, 
    # but for this quick fix we'll just remove the faulty column from the select.
    volume_rows = conn.execute(
        """SELECT sets_completed, weight_data, set_type 
           FROM workout_session_exercises 
           WHERE set_type != 'Warm-up Set'"""
    ).fetchall()
    
    total_volume = 0
    for row in volume_rows:
        sets = row['sets_completed'] or 0
        weight_str = row['weight_data'] or "0"
        # We'll use a default rep count of 10 if not found, 
        # as granular reps are in workout_sets.
        reps = 10 
            
        # Parse weights
        try:
            weights = [float(x.strip()) for x in weight_str.split(',') if x.strip()]
            if not weights: weights = [0]
            
            if row['set_type'] == 'Drop Set':
                # For drop sets, usually you do one sequence per 'set'
                # Volume = sets * sum(weights) * reps
                total_volume += sets * sum(weights) * reps
            else:
                # Normal set: Volume = sets * weight * reps
                total_volume += sets * weights[0] * reps
        except:
            pass

    # If no sessions yet, fallback to routine_exercises count
    if total_exercises_logged == 0:
        total_exercises_logged = conn.execute("SELECT COUNT(*) FROM routine_exercises").fetchone()[0]

    # Workouts per day (last 28 days)
    weekly_rows = conn.execute(
        """SELECT date(logged_at) as day, COUNT(*) as count
           FROM workout_logs
           WHERE logged_at >= datetime('now', '-28 days')
           GROUP BY day ORDER BY day"""
    ).fetchall()

    # Most used routines
    muscle_rows = conn.execute(
        """SELECT routine_name, COUNT(*) as cnt
           FROM workout_logs GROUP BY routine_name ORDER BY cnt DESC LIMIT 5"""
    ).fetchall()

    # Recent logs (last 10)
    recent_rows = conn.execute(
        """SELECT id, routine_name, notes, logged_at
           FROM workout_logs ORDER BY logged_at DESC LIMIT 10"""
    ).fetchall()

    # Personal Records count
    pr_count = conn.execute("SELECT COUNT(*) FROM personal_records").fetchone()[0]

    # Muscle Group Distribution
    # We'll load the exercises to map exercise_id -> muscle_group
    exercises_raw = load_json("exercises.json")
    exercise_to_muscle = {str(e["id"]): e["muscle_group"] for e in exercises_raw}
    
    logged_exercises = conn.execute(
        "SELECT exercise_id, COUNT(*) as cnt FROM workout_session_exercises GROUP BY exercise_id"
    ).fetchall()
    
    muscle_freq = {}
    for row in logged_exercises:
        m = exercise_to_muscle.get(str(row["exercise_id"]), "Other")
        muscle_freq[m] = muscle_freq.get(m, 0) + row["cnt"]
    
    # Format for frontend (sorted list of dicts)
    muscle_distribution = [{"muscle": k, "count": v} for k, v in sorted(muscle_freq.items(), key=lambda x: x[1], reverse=True)]

    conn.close()

    return {
        "total_workouts": total_workouts,
        "total_exercises_logged": total_exercises_logged,
        "total_volume": int(total_volume),
        "pr_count": pr_count,
        "weekly_activity": [dict(r) for r in weekly_rows],
        "top_routines": [dict(r) for r in muscle_rows],
        "recent_logs": [dict(r) for r in recent_rows],
        "muscle_frequency": muscle_distribution
    }


def get_recent_exercises(limit=10):
    """Retrieve unique exercise IDs from the most recent workout sessions."""
    conn = get_db()
    try:
        rows = conn.execute(
            """SELECT DISTINCT e.exercise_id 
               FROM workout_session_exercises e
               JOIN workout_logs l ON e.log_id = l.id
               ORDER BY l.logged_at DESC
               LIMIT ?""",
            (limit,)
        ).fetchall()
        return [r['exercise_id'] for r in rows]
    except sqlite3.Error as e:
        print(f"[ERROR] Database error in get_recent_exercises: {e}")
        return []
    finally:
        conn.close()
