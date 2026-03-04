/**
 * training.js — FitForge Training Protocols
 * Static protocol data + tag-filter chip UI
 */

"use strict";

// ─── Protocol Data ─────────────────────────────────────────
const PROTOCOLS = [
    {
        id: 1,
        emoji: "⚡",
        title: "Tabata HIIT",
        subtitle: "Maximum calorie burn in minimum time using 20s on / 10s off intervals.",
        tags: ["hiit", "cardio"],
        badge: "hiit",
        badgeLabel: "HIIT",
        duration: "20 min",
        exercises: [
            { exerciseId: "burpee", sets: 1, reps: "20s" },
            { exerciseId: "jump_squat", sets: 1, reps: "20s" },
            { exerciseId: "mountain_climber", sets: 1, reps: "20s" },
            { exerciseId: "high_knees", sets: 1, reps: "20s" }
        ],
        steps: [
            "5 min dynamic warm-up.",
            "Perform 8 rounds: 20 sec effort, 10 sec rest.",
            "Circuit: Burpees → Jump Squats → Mountain Climbers → High Knees.",
            "Rest 1 min between full sets (4 sets total)."
        ]
    },
    {
        id: 2,
        emoji: "🧘",
        title: "Morning Mobility Flow",
        subtitle: "Full-body joint mobility routine to reduce stiffness and improve range of motion.",
        tags: ["mobility", "stretching"],
        badge: "mobility",
        badgeLabel: "Mobility",
        duration: "25 min",
        exercises: [
            { exerciseId: "cat_cow_stretch", sets: 1, reps: "10" },
            { exerciseId: "hip_rotations_90_90", sets: 2, reps: "60s" },
            { exerciseId: "thoracic_spine_rotations", sets: 1, reps: "10" },
            { exerciseId: "deep_lunge_overhead_reach", sets: 1, reps: "8 per side" },
            { exerciseId: "worlds_greatest_stretch", sets: 1, reps: "5 per side" }
        ],
        steps: [
            "Cat-Cow stretch — 10 reps.",
            "90/90 hip rotations — 60 sec per side.",
            "Thoracic spine rotations — 10 reps.",
            "Deep lunge with overhead reach — 8 reps per side.",
            "World's Greatest Stretch — 5 reps per side."
        ]
    },
    {
        id: 3,
        emoji: "💪",
        title: "5×5 Strength Circuit",
        subtitle: "Classic compound movement circuit for building raw strength across all major muscle groups.",
        tags: ["strength"],
        badge: "strength",
        badgeLabel: "Strength",
        duration: "45 min",
        exercises: [
            { exerciseId: "barbell_squat", sets: 5, reps: "5" },
            { exerciseId: "barbell_bench_press", sets: 5, reps: "5" },
            { exerciseId: "barbell_deadlift", sets: 1, reps: "5" },
            { exerciseId: "barbell_row", sets: 5, reps: "5" },
            { exerciseId: "barbell_overhead_press", sets: 5, reps: "5" }
        ],
        steps: [
            "Barbell Back Squat — 5 sets × 5 reps.",
            "Barbell Bench Press — 5 sets × 5 reps.",
            "Barbell Deadlift — 1 set × 5 reps (Strength Focus).",
            "Bent-Over Row — 5 sets × 5 reps.",
            "Overhead Press — 5 sets × 5 reps."
        ]
    },
    {
        id: 4,
        emoji: "🌿",
        title: "Deep Flexibility Stretching",
        subtitle: "30-minute static stretching sequence targeting posterior chain and hip flexors.",
        tags: ["stretching", "mobility"],
        badge: "stretching",
        badgeLabel: "Stretching",
        duration: "30 min",
        exercises: [
            { exerciseId: "foam_roll_back", sets: 1, reps: "45s" },
            { exerciseId: "standing_hamstring_stretch", sets: 1, reps: "60s per leg" },
            { exerciseId: "seated_forward_fold", sets: 1, reps: "90s" },
            { exerciseId: "figure_four_stretch", sets: 1, reps: "90s per side" }
        ],
        steps: [
            "Foam roll the entire back — 45 sec.",
            "Hamstring stretch — 60 sec per leg.",
            "Seated forward fold — 90 sec hold.",
            "Figure-four stretch — 90 sec per side."
        ]
    },
    {
        id: 5,
        emoji: "🏃",
        title: "Zone 2 Cardio Protocol",
        subtitle: "Low-intensity continuous training to build your aerobic base and fat oxidation capacity.",
        tags: ["cardio"],
        badge: "cardio",
        badgeLabel: "Cardio",
        duration: "40–60 min",
        exercises: [
            { exerciseId: "zone_2_cardio", sets: 1, reps: "40 min" }
        ],
        steps: [
            "Target 60–70% of max heart rate.",
            "5 min walk light jog warm-up.",
            "Maintain conversation-pace for 30–50 min.",
            "Choose: jog, cycle, row, swim, or elliptical."
        ]
    },
    {
        id: 6,
        emoji: "🔥",
        title: "AMRAP Circuit",
        subtitle: "As Many Rounds As Possible — test your work capacity with a timed bodyweight circuit.",
        tags: ["hiit", "strength", "cardio"],
        badge: "hiit",
        badgeLabel: "HIIT",
        duration: "30 min",
        exercises: [
            { exerciseId: "push_up", sets: 1, reps: "10" },
            { exerciseId: "air_squat", sets: 1, reps: "15" },
            { exerciseId: "pull_up", sets: 1, reps: "5" },
            { exerciseId: "sit_up", sets: 1, reps: "20" }
        ],
        steps: [
            "Set a 20-minute timer.",
            "AMRAP: 10 Push-Ups, 15 Air Squats, 5 Pull-Ups, 20 Sit-Ups.",
            "Maintain form — record your rounds."
        ]
    },
    {
        id: 7,
        emoji: "🧱",
        title: "Upper Body Push Circuit",
        subtitle: "Hypertrophy-focused circuit hitting chest, shoulders, and triceps with minimal rest.",
        tags: ["strength"],
        badge: "strength",
        badgeLabel: "Strength",
        duration: "35 min",
        exercises: [
            { exerciseId: "incline_dumbbell_press", sets: 4, reps: "10" },
            { exerciseId: "dumbbell_lateral_raise", sets: 3, reps: "15" },
            { exerciseId: "cable_chest_fly", sets: 3, reps: "12" },
            { exerciseId: "dumbbell_tricep_extension", sets: 3, reps: "12" },
            { exerciseId: "push_up", sets: 2, reps: "max" }
        ],
        steps: [
            "Incline Dumbbell Press — 4 × 10.",
            "Lateral Raises — 3 × 15.",
            "Cable Flyes — 3 × 12.",
            "Tricep Extension — 3 × 12.",
            "Push-Up finisher — max reps × 2 sets."
        ]
    },
    {
        id: 8,
        emoji: "🦵",
        title: "Lower Body Mobility & Power",
        subtitle: "Combine hip mobility drills with plyometric exercises for athletic lower body development.",
        tags: ["mobility", "strength", "hiit"],
        badge: "mobility",
        badgeLabel: "Mobility",
        duration: "40 min",
        exercises: [
            { exerciseId: "box_jump", sets: 4, reps: "6" },
            { exerciseId: "bulgarian_split_squat", sets: 3, reps: "10 per leg" },
            { exerciseId: "nordic_hamstring_curl", sets: 3, reps: "6" },
            { exerciseId: "lateral_band_walk", sets: 3, reps: "20" },
            { exerciseId: "standing_calf_raise", sets: 3, reps: "20" }
        ],
        steps: [
            "Box Jumps — 4 × 6.",
            "Bulgarian Split Squat — 3 × 10 per leg.",
            "Nordic Hamstring Curls — 3 × 6.",
            "Lateral band walks — 3 × 20.",
            "Standing calf raises — 3 × 20."
        ]
    },
    {
        id: 9,
        emoji: "🧊",
        title: "Active Recovery Protocol",
        subtitle: "Low-intensity movement and breath work to accelerate recovery on rest days.",
        tags: ["mobility", "stretching", "cardio"],
        badge: "stretching",
        badgeLabel: "Stretching",
        duration: "20 min",
        exercises: [
            { exerciseId: "easy_walk", sets: 1, reps: "5 min" },
            { exerciseId: "foam_roll_full_body", sets: 1, reps: "5 min" },
            { exerciseId: "joint_rotations", sets: 1, reps: "3 min" }
        ],
        steps: [
            "5 min easy walk or light cycling.",
            "Foam roll quads, IT band, and upper back.",
            "Full-body joint rotations: ankles, knees, hips, shoulders."
        ]
    },
    {
        id: 10,
        emoji: "🏋️",
        title: "Posterior Chain Builder",
        subtitle: "Target your back, glutes, and hamstrings with this deadlift-focused protocol.",
        tags: ["strength"],
        badge: "strength",
        badgeLabel: "Strength",
        duration: "50 min",
        exercises: [
            { exerciseId: "barbell_deadlift", sets: 5, reps: "3" },
            { exerciseId: "romanian_deadlift", sets: 3, reps: "10" },
            { exerciseId: "cable_pull_through", sets: 3, reps: "15" },
            { exerciseId: "hip_thrust", sets: 3, reps: "12" },
            { exerciseId: "cable_face_pull", sets: 3, reps: "15" }
        ],
        steps: [
            "Conventional Deadlift — 5 × 3.",
            "Romanian Deadlift — 3 × 10.",
            "Cable Pull-Throughs — 3 × 15.",
            "Hip Thrust — 3 × 12.",
            "Face Pulls — 3 × 15."
        ]
    }
];

// ─── State ─────────────────────────────────────────────────
let activeTag = "";

// ─── Init ──────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    renderProtocols();
    bindChips();
});

// ─── Render ────────────────────────────────────────────────
function renderProtocols() {
    const grid = document.getElementById("protocolsGrid");
    const empty = document.getElementById("protocolEmpty");
    const count = document.getElementById("protocolCount");

    const filtered = activeTag
        ? PROTOCOLS.filter(p => p.tags.includes(activeTag))
        : PROTOCOLS;

    count.textContent = `${filtered.length} protocol${filtered.length !== 1 ? "s" : ""}`;

    if (filtered.length === 0) {
        grid.innerHTML = "";
        empty.style.display = "block";
        return;
    }
    empty.style.display = "none";

    grid.innerHTML = filtered.map(p => `
        <article class="protocol-card">
            <div class="protocol-card-header">
                <span class="protocol-emoji">${p.emoji}</span>
                <h2 class="protocol-title">${p.title}</h2>
                <p class="protocol-subtitle">${p.subtitle}</p>
            </div>
            <div class="protocol-meta">
                <span class="protocol-badge badge-${p.badge}">${p.badgeLabel}</span>
                <span class="protocol-duration">⏱ ${p.duration}</span>
            </div>
            <div class="protocol-body">
                <div class="protocol-steps-label">Steps</div>
                <ol class="protocol-steps">
                    ${p.steps.map(s => `<li class="protocol-step">${s}</li>`).join("")}
                </ol>
            </div>
            <div class="protocol-footer">
                <div class="protocol-tags">
                    ${p.tags.map(t => `<span class="tag-chip">${t}</span>`).join("")}
                </div>
                <button class="btn btn-primary btn-sm" onclick="startProtocol(${p.id})">
                    ▶ Start Protocol
                </button>
            </div>
        </article>
    `).join("");
}

/**
 * Converts a static protocol into a "routine" format for the active workout engine.
 */
function startProtocol(id) {
    const p = PROTOCOLS.find(x => x.id === id);
    if (!p) return;

    console.log("Protocol selected:", p.title);

    // Initialise workout session object
    const session = {
        sessionId: 'sess_' + Date.now(),
        name: p.title,
        startTime: Date.now(),
        exercises: p.exercises.map(ex => ({
            exercise_id: ex.exerciseId,
            exercise_name: ex.exerciseId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            sets: ex.sets,
            reps: ex.reps,
            notes: "",
            completed: false
        }))
    };

    console.log("Workout session created:", session);

    // Save to localStorage so if they REFRESH, it's still there
    localStorage.setItem('fitforge_active_session', JSON.stringify(session));

    // Start workout in-place instead of redirecting
    console.log("Starting protocol in-place:", session.name);
    if (typeof startActiveWorkout === 'function') {
        startActiveWorkout(session);
    } else {
        console.warn("startActiveWorkout not found! Redirecting to /workout...");
        window.location.href = "/workout";
    }
}

// ─── Tag Chips ─────────────────────────────────────────────
function bindChips() {
    document.getElementById("tagChips").addEventListener("click", e => {
        const chip = e.target.closest(".chip");
        if (!chip) return;
        document.querySelectorAll("#tagChips .chip").forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        activeTag = chip.dataset.tag;
        renderProtocols();
    });
}

// Called from footer links
function filterTag(tag) {
    activeTag = tag;
    document.querySelectorAll("#tagChips .chip").forEach(c => {
        c.classList.toggle("active", c.dataset.tag === tag);
    });
    renderProtocols();
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function clearTag() {
    filterTag("");
}
