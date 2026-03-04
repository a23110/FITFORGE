/**
 * Active Workout Mode - Core Tracking Logic
 * Handles the session timer, exercise progression, set tracking, and saving sessions.
 */

let workoutTimerInterval = null;
let totalSeconds = 0;
let currentRoutine = null;
let sessionExercises = []; // Stores the state of each exercise (completed sets, notes, etc.)
let restTimerInterval = null;
let isPaused = false;
let pauseStartTime = 0;
let totalPausedSeconds = 0;
let exercisePRs = {}; // Stores max_weight and max_reps for current exercises

// DOM Elements
const overlay = document.getElementById('activeWorkoutOverlay');
const timerDisplay = document.getElementById('workoutTimer');
const workoutExercisesList = document.getElementById('workoutExercisesList');
const restOverlay = document.getElementById('restOverlay');
const restCountdown = document.getElementById('restCountdown');

// Buttons
const finishBtn = document.getElementById('finishWorkoutBtn');
const cancelBtn = document.getElementById('cancelWorkoutBtn');
const skipRestBtn = document.getElementById('skipRestBtn');

// Pause Modal Elements
const pauseBtn = document.getElementById('pauseWorkoutBtn');
const resumeBtn = document.getElementById('resumeWorkoutBtn');
const pauseOverlay = document.getElementById('pauseOverlay');

// ─── INIT: Session Persistence ───────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const saved = localStorage.getItem('fitforge_active_session');
    if (saved) {
        console.log("Found active session in persistence. Resuming...");
        try {
            const session = JSON.parse(saved);
            // Re-inflate session state
            currentRoutine = session;
            sessionExercises = session.exercises || [];
            totalSeconds = session.totalSeconds || 0;

            // If it was already running, show overlay
            overlay.style.display = 'flex';
            document.body.style.overflow = 'hidden';

            startWorkoutTimer();
            renderAllExercises();
            fetchPRsForRoutine(sessionExercises);
        } catch (e) {
            console.error("Failed to parse saved session:", e);
            localStorage.removeItem('fitforge_active_session');
        }
    }
});

function saveSessionToStorage() {
    if (!currentRoutine) return;
    const sessionToSave = {
        ...currentRoutine,
        exercises: sessionExercises,
        totalSeconds: totalSeconds,
        lastUpdated: Date.now()
    };
    localStorage.setItem('fitforge_active_session', JSON.stringify(sessionToSave));
}


/**
 * Initialize the Active Workout session
 * @param {Object|Number} routine - The routine object OR routine ID
 */
async function startActiveWorkout(routine) {
    let routineData = routine;

    // If only ID is passed, fetch the full routine
    if (typeof routine === 'number' || typeof routine === 'string') {
        try {
            const response = await fetch(`/api/routines/${routine}`);
            if (!response.ok) throw new Error("Failed to fetch routine");
            routineData = await response.json();
        } catch (error) {
            console.error("Error starting workout:", error);
            alert("Could not load routine details.");
            return;
        }
    }

    if (!routineData || !routineData.exercises || routineData.exercises.length === 0) {
        alert("Cannot start an empty routine. Please add exercises first.");
        return;
    }


    currentRoutine = routineData;
    totalSeconds = 0;

    // Initialize session exercises state
    sessionExercises = routineData.exercises.map(ex => {
        const targetSets = parseInt(ex.sets || 3);
        const setDetails = [];
        for (let i = 0; i < targetSets; i++) {
            setDetails.push({
                weight: "",
                reps: ex.reps || "8-12",
                completed: false
            });
        }

        return {
            id: ex.id,
            exercise_id: ex.exercise_id,
            exercise_name: ex.exercise_name,
            target_sets: targetSets,
            rest: ex.rest || "60s",
            set_type: ex.set_type || "Normal",
            superset_id: ex.superset_id || null,
            sets_completed: 0,
            sets: setDetails, // Per-set data
            notes: "",
            completed: false
        };
    });

    // --- Note: Order is maintained as per user request ---
    // (Previous compound prioritization logic removed)


    // Show overlay and start timer
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    isPaused = false;
    totalPausedSeconds = 0;
    pauseOverlay.style.display = 'none';

    // Pre-fetch PRs and extra details (like images) for all exercises
    await enhanceExerciseData(sessionExercises);

    console.log("Workout started with enhanced data");

    console.log("Workout started");
    console.log("Exercises loaded:", sessionExercises);

    startWorkoutTimer();
    renderAllExercises();
    saveSessionToStorage(); // Initial save
}

async function enhanceExerciseData(exercises) {
    exercisePRs = {};
    for (const ex of exercises) {
        try {
            const res = await fetch(`/api/exercises/${ex.exercise_id}`);
            if (res.ok) {
                const data = await res.json();
                // Update image if missing
                if (!ex.image && data.image_url) {
                    ex.image = data.image_url;
                }
                // Update PRs
                const perfRes = await fetch(`/api/exercises/${ex.exercise_id}/performance`);
                if (perfRes.ok) {
                    const perfData = await perfRes.json();
                    exercisePRs[ex.exercise_id] = {
                        max_weight: perfData.stats.max_weight || 0,
                        max_reps: perfData.stats.max_reps || 0
                    };
                }
            }
        } catch (e) {
            console.error("Enhancement failed for", ex.exercise_id, e);
        }
    }
    renderAllExercises(); // Re-render with images
    saveSessionToStorage();
}

function pauseWorkout() {
    if (isPaused) return;
    isPaused = true;
    pauseStartTime = Date.now();
    pauseOverlay.style.display = 'flex';
    // Clear intervals to stop timers
    if (workoutTimerInterval) clearInterval(workoutTimerInterval);
    if (restTimerInterval) clearInterval(restTimerInterval);
}

function resumeWorkout() {
    if (!isPaused) return;
    isPaused = false;
    totalPausedSeconds += Math.floor((Date.now() - pauseStartTime) / 1000);
    pauseOverlay.style.display = 'none';

    // Resume timers
    startWorkoutTimer();
    // Resume rest timer if it was active (we'd need more state to resume exactly, 
    // but for simplicity we'll just let the user skip it or start a fresh one if they were resting)
}

function startWorkoutTimer() {
    if (workoutTimerInterval) clearInterval(workoutTimerInterval);
    workoutTimerInterval = setInterval(() => {
        totalSeconds++;
        const hrs = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
        const mins = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
        const secs = String(totalSeconds % 60).padStart(2, '0');
        timerDisplay.textContent = `${hrs}:${mins}:${secs}`;
    }, 1000);
}

function renderAllExercises() {
    if (!workoutExercisesList) return;
    workoutExercisesList.innerHTML = '';

    if (sessionExercises.length === 0) {
        workoutExercisesList.innerHTML = '<div class="alert alert-info">This workout contains no exercises.</div>';
        return;
    }

    sessionExercises.forEach((ex, idx) => {
        const cardWrap = document.createElement('div');
        cardWrap.id = `ex-card-${idx}`;
        workoutExercisesList.appendChild(cardWrap);
        renderExerciseCard(idx);
    });
}

function renderExerciseCard(exIdx) {
    const ex = sessionExercises[exIdx];
    const cardWrap = document.getElementById(`ex-card-${exIdx}`);
    if (!cardWrap) return;

    // Check for superset partner
    let partner = null;
    if (ex.superset_id) {
        partner = sessionExercises.find(oe => oe.id === ex.superset_id);
    }

    let summaryHtml = `<div id="ex-summary-${exIdx}" class="exercise-summary" ${ex.collapsed ? 'style="display:flex;"' : ''}>
        <i class="fas fa-check-circle"></i> ${ex.sets_completed} / ${ex.target_sets} sets completed
    </div>`;

    let html = `
        <div class="exercise-card ${ex.collapsed ? 'collapsed' : ''}">
            <div class="card-header">
                <div style="display:flex; align-items:center; gap:var(--sp-md); width:100%;">
                    <div class="ex-icon-small" style="width:40px; height:40px; border-radius:8px; background:rgba(255,255,255,0.05); display:flex; align-items:center; justify-content:center; overflow:hidden;">
                        <img src="${ex.image || '/static/images/placeholder.svg'}" alt="" style="width:100%; height:100%; object-fit:cover; opacity:0.7;">
                    </div>
                    <div style="flex:1;">
                        <h2 style="margin:0; font-size:1.1rem;">
                            <div style="display:flex; justify-content:space-between; width:100%; align-items:center;">
                                <span>${escHtml(ex.exercise_name)}</span>
                                <button class="expand-btn" style="${ex.collapsed ? 'display:block;' : 'display:none;'}" onclick="toggleCollapse(${exIdx})">Expand <i class="fas fa-chevron-down"></i></button>
                            </div>
                        </h2>
                        ${summaryHtml}
                    </div>
                </div>
            </div>
            <div class="set-tracking" id="setTracker-${exIdx}">
    `;

    // If superset
    if (partner) {
        html += `<h3 class="superset-partner-title" style="margin-top:1rem; color:var(--clr-accent);">Superset Partner: ${escHtml(partner.exercise_name)}</h3>`;
    }

    for (let i = 0; i < ex.target_sets; i++) {
        const set = ex.sets[i];
        const isCompleted = set.completed;

        // PR Logic
        const pr = exercisePRs[ex.exercise_id];
        let prBadge = "";
        let isPrPotential = false;

        if (pr && set.weight > 0) {
            if (parseFloat(set.weight) > pr.max_weight) {
                isPrPotential = true;
                prBadge = '<span class="pr-badge-live">NEW WEIGHT PR!</span>';
            } else if (parseFloat(set.weight) === pr.max_weight && parseInt(set.reps) > pr.max_reps) {
                isPrPotential = true;
                prBadge = '<span class="pr-badge-live">NEW REPS PR!</span>';
            }
        }

        const setType = set.type || ex.set_type || 'Normal';
        let typeCode = 'N';
        let typeLabel = '';
        if (setType !== 'Normal') {
            typeCode = setType.charAt(0).toUpperCase();
            typeLabel = `<span class="set-type-badge set-type-${typeCode}" onclick="cycleSetType(${exIdx}, ${i})">${typeCode}</span>`;
        } else {
            typeLabel = `<span class="set-type-badge" onclick="cycleSetType(${exIdx}, ${i})" style="background:rgba(255,255,255,0.05);">N</span>`;
        }

        html += `
            <div class="set-row ${isCompleted ? 'completed' : ''} ${isPrPotential ? 'pr-potential' : ''}">
                <div class="set-label">
                    Set ${i + 1} ${typeLabel}
                    ${prBadge}
                </div>
                <div class="set-details">
                    <div class="input-group">
                        <button class="adjust-btn" onclick="adjustValue(${exIdx}, ${i}, 'weight', -2.5, event)">-2.5</button>
                        <input type="number" class="set-input weight-input" placeholder="kg" 
                               value="${set.weight}" onchange="updateSetData(${exIdx}, ${i}, 'weight', this.value)">
                        <button class="adjust-btn" onclick="adjustValue(${exIdx}, ${i}, 'weight', 2.5, event)">+2.5</button>
                    </div>
                    <span class="set-sep">×</span>
                    <div class="input-group">
                        <button class="adjust-btn" onclick="adjustValue(${exIdx}, ${i}, 'reps', -1, event)">-</button>
                        <input type="number" class="set-input reps-input" placeholder="reps" 
                               value="${parseInt(set.reps) || 0}" onchange="updateSetData(${exIdx}, ${i}, 'reps', this.value)">
                        <button class="adjust-btn" onclick="adjustValue(${exIdx}, ${i}, 'reps', 1, event)">+</button>
                    </div>
                </div>
                <div class="check-btn" onclick="toggleSet(${exIdx}, ${i})">
                    <i class="fas fa-check"></i>
                </div>
            </div>
        `;
    }

    html += `
                <button class="btn btn-outline btn-sm full-width" style="margin-top:var(--sp-md);" onclick="addSet(${exIdx})">
                    <i class="fas fa-plus"></i> Add Set
                </button>
            </div>
            <div class="exercise-notes">
                <textarea placeholder="Add notes for this exercise..." onchange="updateNotes(${exIdx}, this.value)">${ex.notes || ""}</textarea>
            </div>
        </div>
    `;

    cardWrap.innerHTML = html;
}

function adjustValue(exIdx, setIdx, field, delta, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    const set = sessionExercises[exIdx].sets[setIdx];
    let currentVal = parseFloat(set[field]) || 0;
    let newVal = currentVal + delta;
    if (newVal < 0) newVal = 0;

    // Format appropriately: keep decimals for weight, integer for reps
    if (field === 'weight') {
        set[field] = Math.round(newVal * 100) / 100;
    } else {
        set[field] = Math.max(1, Math.round(newVal));
    }

    saveSessionToStorage();
    renderExerciseCard(exIdx);
}

function updateSetData(exIdx, setIdx, field, value) {
    const set = sessionExercises[exIdx].sets[setIdx];
    set[field] = value;
    saveSessionToStorage();
    // Don't re-render everything to avoid losing focus on input
}

function toggleSet(exIdx, setIdx) {
    const ex = sessionExercises[exIdx];
    const set = ex.sets[setIdx];
    set.completed = !set.completed;

    // Update sets_completed count
    ex.sets_completed = ex.sets.filter(s => s.completed).length;

    if (set.completed && setIdx < ex.target_sets - 1) {
        startRestTimer(ex.rest);
    }

    saveSessionToStorage();
    renderExerciseCard(exIdx);
}

function updateNotes(exIdx, val) {
    sessionExercises[exIdx].notes = val;
    saveSessionToStorage();
}

function addSet(exIdx) {
    const ex = sessionExercises[exIdx];
    // Copy weight from previous set if exists
    const prevWeight = ex.sets.length > 0 ? ex.sets[ex.sets.length - 1].weight : "";

    ex.sets.push({
        weight: prevWeight,
        reps: "", // Modern app behavior: leave reps empty for user input
        completed: false
    });
    ex.target_sets = ex.sets.length;

    saveSessionToStorage();
    renderExerciseCard(exIdx);
}

function cycleSetType(exIdx, setIdx) {
    const set = sessionExercises[exIdx].sets[setIdx];
    const currentType = set.type || sessionExercises[exIdx].set_type || 'Normal';
    const currentIndex = SET_TYPES.indexOf(currentType);
    const nextIndex = (currentIndex + 1) % SET_TYPES.length;
    set.type = SET_TYPES[nextIndex];

    saveSessionToStorage();
    renderExerciseCard(exIdx);
}

const SET_TYPES = ['Normal', 'Warmup', 'Drop Set', 'Superset', 'Failure'];

function cycleSetType(exIdx, setIdx) {
    const set = sessionExercises[exIdx].sets[setIdx];
    let currentType = set.type || sessionExercises[exIdx].set_type || 'Normal';

    let nextIndex = (SET_TYPES.indexOf(currentType) + 1) % SET_TYPES.length;
    set.type = SET_TYPES[nextIndex];

    renderExerciseCard(exIdx);
}

function toggleCollapse(exIdx) {
    sessionExercises[exIdx].collapsed = !sessionExercises[exIdx].collapsed;
    renderExerciseCard(exIdx);
}

function updateSetData(exIdx, setIdx, field, value) {
    sessionExercises[exIdx].sets[setIdx][field] = value;
    // Re-render to show PR potential if weight/reps changed
    renderExerciseCard(exIdx);
}

/**
 * Add a new set to the current exercise session
 */
function addSet(exIdx) {
    const ex = sessionExercises[exIdx];
    // Find the last set to copy from, regardless of completion status
    const lastSet = ex.sets.length > 0 ? ex.sets[ex.sets.length - 1] : null;

    ex.sets.push({
        weight: lastSet ? lastSet.weight : "",
        reps: "", // Rule: leave reps empty for new sets
        type: lastSet ? (lastSet.type || "Normal") : "Normal",
        completed: false
    });
    ex.target_sets++;
    renderExerciseCard(exIdx);
}

function toggleSet(exIdx, setIdx) {
    const ex = sessionExercises[exIdx];
    if (!ex.sets[setIdx].completed) {
        // Mark completed
        ex.sets[setIdx].completed = true;
        ex.sets_completed = ex.sets.filter(s => s.completed).length;

        // Visual feedback
        renderExerciseCard(exIdx);

        // ── Smart Set Creation ──
        const isLastSet = setIdx === ex.target_sets - 1;

        // ── Auto Collapse ──
        if (ex.sets_completed === ex.target_sets) {
            setTimeout(() => {
                ex.collapsed = true;
                renderExerciseCard(exIdx);
            }, 600);
        }

        const isLastEx = exIdx === sessionExercises.length - 1;

        // Trigger rest timer
        let hasUnfinishedPartner = false;
        if (ex.superset_id) {
            const partnerIndex = sessionExercises.findIndex(oe => oe.id === ex.superset_id);
            if (partnerIndex > exIdx) hasUnfinishedPartner = true;
        }

        if ((!isLastSet || !isLastEx || ex.sets_completed === ex.target_sets) && !hasUnfinishedPartner) {
            startRestTimer(ex.rest);
        }
    } else {
        // Unmark
        ex.sets[setIdx].completed = false;
        ex.collapsed = false; // Uncollapse if they uncheck
        ex.sets_completed = ex.sets.filter(s => s.completed).length;
        renderExerciseCard(exIdx);
    }
}

function startRestTimer(durationStr) {
    let seconds = parseInt(durationStr) || 60;
    if (durationStr.includes('m')) seconds *= 60; // Handle '1m' etc.

    restOverlay.style.display = 'flex';
    restCountdown.textContent = seconds;

    if (restTimerInterval) clearInterval(restTimerInterval);
    restTimerInterval = setInterval(() => {
        seconds--;
        restCountdown.textContent = seconds;
        if (seconds <= 0) {
            closeRestTimer();
        }
    }, 1000);
}

function closeRestTimer() {
    clearInterval(restTimerInterval);
    restOverlay.style.display = 'none';
}

// Event Listeners
skipRestBtn.addEventListener('click', closeRestTimer);
pauseBtn.addEventListener('click', pauseWorkout);
resumeBtn.addEventListener('click', resumeWorkout);

cancelBtn.addEventListener('click', () => {
    if (confirm("Are you sure you want to cancel? Progress will not be saved.")) {
        closeWorkoutMode();
    }
});

// ─── Event Listeners ─────────────────────────────────────────
if (finishBtn) finishBtn.onclick = finishWorkout;
if (cancelBtn) cancelBtn.onclick = cancelWorkout;
if (pauseBtn) pauseBtn.onclick = pauseWorkout;
if (resumeBtn) resumeBtn.onclick = resumeWorkout;
if (skipRestBtn) skipRestBtn.onclick = () => {
    if (restTimerInterval) clearInterval(restTimerInterval);
    restOverlay.style.display = 'none';
};


async function finishWorkout() {
    const sessionData = {
        routine_id: currentRoutine.id,
        routine_name: currentRoutine.name,
        notes: `Completed in ${timerDisplay.textContent}${totalPausedSeconds > 0 ? ` (Paused ${Math.floor(totalPausedSeconds / 60)}m)` : ''}`,
        paused_duration: totalPausedSeconds,
        exercises: sessionExercises.map(ex => ({
            exercise_id: ex.exercise_id,
            exercise_name: ex.exercise_name,
            sets_completed: ex.sets_completed,
            rest_duration: ex.rest,
            notes: ex.notes,
            set_type: ex.set_type,
            superset_id: ex.superset_id,
            // Convert granular sets back to formats backend expects or improve backend to handle granular
            // For now, let's join weights for backward compatibility but also send granular sets if we want
            weight_data: ex.sets.filter(s => s.completed).map(s => s.weight || 0).join(','),
            reps: ex.sets.filter(s => s.completed).map(s => s.reps).join(','), // CSV reps if varied
            granular_sets: ex.sets.filter(s => s.completed)
        }))
    };

    try {
        const response = await fetch('/api/workout-sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sessionData)
        });

        if (response.ok) {
            console.log("Workout saved successfully");
            localStorage.removeItem('fitforge_active_session'); // Clear persistence
            alert("Workout saved successfully! Keep it up.");
            closeWorkoutMode();
            window.location.href = '/analytics';
        } else {
            alert("Failed to save workout. Please try again.");
        }
    } catch (error) {
        console.error("Error saving workout:", error);
        alert("Check your connection and try again.");
    }
}

function cancelWorkout() {
    if (confirm("Are you sure you want to cancel? Progress will be lost.")) {
        localStorage.removeItem('fitforge_active_session'); // Clear persistence
        closeWorkoutMode();
        window.location.href = '/training';
    }
}

function closeWorkoutMode() {
    clearInterval(workoutTimerInterval);
    overlay.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function escHtml(str) {
    return String(str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

// ─── Exercise Navigation ─────────────────────────────────────
let currentScrollIndex = 0;

function scrollToExercise(index) {
    if (index < 0 || index >= sessionExercises.length) return;
    currentScrollIndex = index;
    const card = document.getElementById(`ex-card-${index}`);
    if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function nextExercise() {
    if (currentScrollIndex < sessionExercises.length - 1) {
        scrollToExercise(currentScrollIndex + 1);
    }
}

function prevExercise() {
    if (currentScrollIndex > 0) {
        scrollToExercise(currentScrollIndex - 1);
    }
}

// Ensure these are globally accessible for inline onclicks
window.startActiveWorkout = startActiveWorkout;
window.toggleCollapse = (idx) => {
    sessionExercises[idx].collapsed = !sessionExercises[idx].collapsed;
    saveSessionToStorage();
    renderExerciseCard(idx);
};
window.toggleSet = toggleSet;
window.updateSetData = updateSetData;
window.updateNotes = updateNotes;
window.addSet = addSet;
window.cycleSetType = cycleSetType;
window.adjustValue = adjustValue;
window.nextExercise = nextExercise;
window.prevExercise = prevExercise;
window.finishWorkout = finishWorkout;
window.cancelWorkout = cancelWorkout;
window.pauseWorkout = pauseWorkout;
window.resumeWorkout = resumeWorkout;

// Expose functions to global scope
window.startActiveWorkout = startActiveWorkout;
window.toggleSet = toggleSet;
window.updateSetData = updateSetData;
window.adjustValue = adjustValue;
window.cycleSetType = cycleSetType;
window.toggleCollapse = (idx) => {
    sessionExercises[idx].collapsed = !sessionExercises[idx].collapsed;
    renderExerciseCard(idx);
};
window.addSet = addSet;
window.updateNotes = (idx, val) => {
    sessionExercises[idx].notes = val;
};

