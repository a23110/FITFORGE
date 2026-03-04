/**
 * routines.js — FitForge Routine Builder
 * Full CRUD for routines + exercise picker modal
 */

"use strict";

// ─── State ────────────────────────────────────────────────
let routines = [];
let activeRoutineId = null;
let allExercises = [];
let pickerDebounceTimer = null;
let wizardState = {
    step: 1,
    goal: "strength",
    level: "beginner",
    equipment: ["Barbell", "Dumbbell", "Machine"],
    muscles: ["Chest", "Back", "Legs"],
    suggestions: []
};

// ─── DOM refs ─────────────────────────────────────────────
const routineList = document.getElementById("routineList");
const routineListSpinner = document.getElementById("routineListSpinner");
const routineListEmpty = document.getElementById("routineListEmpty");
const editorIdle = document.getElementById("editorIdle");
const editorActive = document.getElementById("editorActive");
const routineNameInput = document.getElementById("routineName");
const routineDescInput = document.getElementById("routineDesc");
const routineExList = document.getElementById("routineExList");
const exCount = document.getElementById("exCount");
const exEmpty = document.getElementById("exEmpty");

// Modals
const pickerModal = document.getElementById("pickerModal");
const pickerSearch = document.getElementById("pickerSearch");
const pickerMuscle = document.getElementById("pickerMuscle");
const pickerList = document.getElementById("pickerList");
const pickerSpinner = document.getElementById("pickerSpinner");

// Wizard Refs
const wizardModal = document.getElementById("wizardModal");
const wizardNextBtn = document.getElementById("wizardNextBtn");
const wizardBackBtn = document.getElementById("wizardBackBtn");
const wizardFinishBtn = document.getElementById("wizardFinishBtn");
const wizardRoutineName = document.getElementById("wizardRoutineName");
const suggestedPreview = document.getElementById("suggestedPreview");
const suggestSpinner = document.getElementById("suggestSpinner");

// ─── Init ──────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    loadRoutines();
    preloadExercises();
    bindEvents();
});

// ─── Data fetchers ─────────────────────────────────────────
async function loadRoutines() {
    routineListSpinner.style.display = "block";
    try {
        const res = await fetch("/api/routines");
        routines = await res.json();
        renderRoutineList();
    } catch (e) {
        showToast("Failed to load routines.", "error");
    }
    routineListSpinner.style.display = "none";
}

async function preloadExercises() {
    try {
        const res = await fetch("/api/exercises");
        allExercises = await res.json();
    } catch (e) {
        console.warn("Could not preload exercises.");
    }
}

async function loadRoutineDetail(id) {
    try {
        const res = await fetch(`/api/routines/${id}`);
        return await res.json();
    } catch (e) {
        showToast("Failed to load routine.", "error");
        return null;
    }
}

// ─── Render: Routine List ──────────────────────────────────
function renderRoutineList() {
    routineList.innerHTML = "";
    if (routines.length === 0) {
        routineListEmpty.style.display = "block";
        return;
    }
    routineListEmpty.style.display = "none";
    routines.forEach(r => {
        const li = document.createElement("li");
        li.className = "routine-item" + (r.id === activeRoutineId ? " active" : "");
        li.dataset.id = r.id;
        li.innerHTML = `
            <div class="routine-item-info">
                <strong>${r.name}</strong>
                <small>${r.exercises ? r.exercises.length : 0} exercises</small>
            </div>
            <div class="routine-item-actions">
                <button class="btn btn-primary btn-sm btn-start" onclick="event.stopPropagation(); window.startActiveWorkout(${r.id})">
                    ▶ Start
                </button>
            </div>
        `;
        li.addEventListener("click", () => openRoutine(r.id));
        routineList.appendChild(li);
    });
}

// ─── Open/Edit Routine ─────────────────────────────────────
async function openRoutine(id) {
    activeRoutineId = id;
    renderRoutineList(); // refresh active highlight
    const routine = await loadRoutineDetail(id);
    if (!routine) return;
    editorIdle.style.display = "none";
    editorActive.style.display = "flex";
    routineNameInput.value = routine.name;
    routineDescInput.value = routine.description || "";
    renderExercises(routine.exercises);
}

function renderExercises(exercises) {
    routineExList.innerHTML = "";
    exCount.textContent = exercises.length;
    if (exercises.length === 0) {
        exEmpty.style.display = "block";
        return;
    }
    exEmpty.style.display = "none";
    exercises.forEach((ex, idx) => {
        const li = document.createElement("li");
        li.className = "rex-item";
        li.dataset.id = ex.id;

        // Build superset options (exclude self)
        let supersetOptions = '<option value="">None</option>';
        exercises.forEach(otherEx => {
            if (otherEx.id !== ex.id) {
                const selected = ex.superset_id === otherEx.id ? 'selected' : '';
                supersetOptions += `<option value="${otherEx.id}" ${selected}>${escHtml(otherEx.exercise_name)}</option>`;
            }
        });

        li.innerHTML = `
            <div class="rex-order">
                <button onclick="moveExercise(${ex.id}, ${idx}, -1)" title="Move up">▲</button>
                <button onclick="moveExercise(${ex.id}, ${idx}, 1)"  title="Move down">▼</button>
            </div>
            <div class="rex-info">
                <div class="rex-name">${escHtml(ex.exercise_name)} ${ex.set_type !== 'Normal' ? `<span class="badge badge-sm">${ex.set_type}</span>` : ''}</div>
                <div class="rex-params">
                    <label class="rex-param">
                        Sets
                        <input type="number" min="1" max="20" value="${ex.sets}"
                            onchange="updateParam(${ex.id}, 'sets', this.value)" />
                    </label>
                    <label class="rex-param">
                        Reps
                        <input type="text" maxlength="8" value="${escHtml(ex.reps)}"
                            onchange="updateParam(${ex.id}, 'reps', this.value)" />
                    </label>
                    <label class="rex-param">
                        Rest
                        <input type="text" maxlength="8" value="${escHtml(ex.rest)}"
                            onchange="updateParam(${ex.id}, 'rest', this.value)" />
                    </label>
                    <label class="rex-param">
                        Type
                        <select onchange="updateParam(${ex.id}, 'set_type', this.value)">
                            <option value="Normal" ${ex.set_type === 'Normal' ? 'selected' : ''}>Normal</option>
                            <option value="Warm-up Set" ${ex.set_type === 'Warm-up Set' ? 'selected' : ''}>Warm-up</option>
                            <option value="Drop Set" ${ex.set_type === 'Drop Set' ? 'selected' : ''}>Drop Set</option>
                            <option value="Superset" ${ex.set_type === 'Superset' ? 'selected' : ''}>Superset</option>
                        </select>
                    </label>
                    <label class="rex-param">
                        Link
                        <select onchange="updateParam(${ex.id}, 'superset_id', this.value)">
                            ${supersetOptions}
                        </select>
                    </label>
                </div>
            </div>
            <button class="rex-remove" onclick="removeExercise(${ex.id})" title="Remove">✕</button>
        `;
        routineExList.appendChild(li);
    });
}

// ─── Exercise operations ───────────────────────────────────
async function removeExercise(entryId) {
    await fetch(`/api/routine-exercises/${entryId}`, { method: "DELETE" });
    openRoutine(activeRoutineId);
}

async function updateParam(entryId, field, value) {
    let payload = { [field]: value };
    if (field === "sets") payload.sets = parseInt(value);
    if (field === "superset_id") payload.superset_id = value ? parseInt(value) : null;

    await fetch(`/api/routine-exercises/${entryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    // If we changed set_type or superset_id, re-render to show badges/links correctly
    if (field === "set_type" || field === "superset_id") {
        openRoutine(activeRoutineId);
    }
}

async function moveExercise(entryId, currentIdx, direction) {
    const routine = await loadRoutineDetail(activeRoutineId);
    const exercises = routine.exercises;
    const newIdx = currentIdx + direction;
    if (newIdx < 0 || newIdx >= exercises.length) return;

    // Swap positions between the two items
    const thisEx = exercises[currentIdx];
    const thatEx = exercises[newIdx];
    await Promise.all([
        fetch(`/api/routine-exercises/${thisEx.id}`, {
            method: "PUT", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ position: newIdx })
        }),
        fetch(`/api/routine-exercises/${thatEx.id}`, {
            method: "PUT", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ position: currentIdx })
        })
    ]);
    openRoutine(activeRoutineId);
}

// ─── Routine CRUD ──────────────────────────────────────────
async function saveName() {
    const name = routineNameInput.value.trim();
    const desc = routineDescInput.value.trim();
    if (!name) { showToast("Name cannot be empty.", "error"); return; }
    await fetch(`/api/routines/${activeRoutineId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description: desc })
    });
    await loadRoutines();
    showToast("Routine saved!");
}

async function deleteRoutine() {
    if (!confirm("Delete this routine? This cannot be undone.")) return;
    await fetch(`/api/routines/${activeRoutineId}`, { method: "DELETE" });
    activeRoutineId = null;
    editorActive.style.display = "none";
    editorIdle.style.display = "block";
    await loadRoutines();
    showToast("Routine deleted.");
}

async function logWorkout() {
    const name = routineNameInput.value.trim() || "Workout";
    const res = await fetch("/api/workout-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ routine_id: activeRoutineId, routine_name: name })
    });
    if (res.ok) {
        showToast("✅ Workout logged! Check Analytics.");
    } else {
        showToast("Failed to log workout.", "error");
    }
}

// ─── Picker Modal ──────────────────────────────────────────
function openPicker() {
    pickerModal.style.display = "flex";
    renderPickerList(allExercises);
    pickerSearch.focus();
}

function closePicker() {
    pickerModal.style.display = "none";
    pickerSearch.value = "";
    pickerMuscle.value = "";
}

function renderPickerList(exercises) {
    pickerList.innerHTML = "";
    const filtered = filterPickerExercises(exercises);
    if (filtered.length === 0) {
        pickerList.innerHTML = `<li style="color:var(--clr-text-muted);text-align:center;padding:var(--sp-xl);">No exercises found</li>`;
        return;
    }
    filtered.forEach(ex => {
        const li = document.createElement("li");
        li.className = "picker-item";
        li.innerHTML = `
            <span class="picker-item-name">${escHtml(ex.name)}</span>
            <span class="picker-item-meta">${escHtml(ex.muscle_group)} · ${escHtml(ex.difficulty)}</span>
        `;
        li.addEventListener("click", () => addExerciseToRoutine(ex));
        pickerList.appendChild(li);
    });
}

function filterPickerExercises(exercises) {
    const q = pickerSearch.value.toLowerCase().trim();
    const muscle = pickerMuscle.value;

    let filtered = exercises.filter(ex => {
        const matchQ = !q || ex.name.toLowerCase().includes(q);
        const matchM = !muscle || ex.muscle_group === muscle;
        return matchQ && matchM;
    });

    // In routines.js picker, we don't have get_exercise_priority from Backend,
    // so we'll do a simple compound-first sort here too.
    const compounds = ["Squat", "Deadlift", "Bench Press", "Overhead Press", "Pull-Up", "Row", "Lunge", "Leg Press"];
    filtered.sort((a, b) => {
        const isAComp = compounds.some(c => a.name.includes(c));
        const isBComp = compounds.some(c => b.name.includes(c));
        if (isAComp && !isBComp) return -1;
        if (!isAComp && isBComp) return 1;
        return a.name.localeCompare(b.name);
    });

    return filtered;
}

async function addExerciseToRoutine(ex) {
    closePicker();
    await fetch(`/api/routines/${activeRoutineId}/exercises`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            exercise_id: ex.id,
            exercise_name: ex.name,
            sets: 3,
            reps: "8-12",
            rest: "60s"
        })
    });
    openRoutine(activeRoutineId);
    showToast(`Added ${ex.name}`);
}

// ─── New Routine Modal ─────────────────────────────────────
// ─── Routine Wizard Flow ──────────────────────────────────
function openWizard() {
    wizardModal.style.display = "flex";
    setWizardStep(1);
    wizardRoutineName.value = "";
}

function closeWizard() {
    wizardModal.style.display = "none";
}

function setWizardStep(n) {
    wizardState.step = n;
    document.querySelectorAll(".wizard-step").forEach(s => {
        s.classList.toggle("active", parseInt(s.dataset.step) === n);
    });

    wizardBackBtn.style.visibility = n === 1 ? "hidden" : "visible";

    if (n === 4) {
        wizardNextBtn.style.display = "none";
        wizardFinishBtn.style.display = "inline-flex";
        fetchSuggestions();
    } else {
        wizardNextBtn.style.display = "inline-flex";
        wizardFinishBtn.style.display = "none";
    }
}

async function fetchSuggestions() {
    suggestSpinner.style.display = "block";
    suggestedPreview.innerHTML = "";
    try {
        const res = await fetch("/api/routines/suggest", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                level: wizardState.level,
                goal: wizardState.goal,
                equipment: wizardState.equipment,
                muscles: wizardState.muscles
            })
        });
        wizardState.suggestions = await res.json();
        renderSuggestions();
    } catch (e) {
        suggestedPreview.innerHTML = `<p style="color:var(--clr-danger)">Failed to get suggestions. Please try again.</p>`;
    }
    suggestSpinner.style.display = "none";
}

function renderSuggestions() {
    suggestedPreview.innerHTML = "";
    if (wizardState.suggestions.length === 0) {
        suggestedPreview.innerHTML = `<p>No exercises match your criteria. Try adding more equipment.</p>`;
        return;
    }
    wizardState.suggestions.forEach((ex, idx) => {
        const div = document.createElement("div");
        div.className = "suggestion-item card";
        div.style.padding = "var(--sp-sm) var(--sp-md)";
        div.style.marginBottom = "var(--sp-xs)";
        div.style.display = "flex";
        div.style.justifyContent = "space-between";
        div.style.alignItems = "center";
        div.innerHTML = `
            <span>${escHtml(ex.exercise_name)}</span>
            <small style="opacity:0.6">${escHtml(ex.muscle_group)}</small>
            <button onclick="removeSuggestion(${idx})" style="background:none;border:none;color:var(--clr-danger);cursor:pointer;">✕</button>
        `;
        suggestedPreview.appendChild(div);
    });
}

window.removeSuggestion = (idx) => {
    wizardState.suggestions.splice(idx, 1);
    renderSuggestions();
};

async function saveWizardRoutine() {
    const name = wizardRoutineName.value.trim() || "Suggested Routine";
    const res = await fetch("/api/routines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name: name,
            description: `Auto-generated ${wizardState.level} ${wizardState.goal} routine`
        })
    });
    const routine = await res.json();

    // Add all exercises
    for (const ex of wizardState.suggestions) {
        await fetch(`/api/routines/${routine.id}/exercises`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(ex)
        });
    }

    closeWizard();
    await loadRoutines();
    openRoutine(routine.id);
    showToast("Routine created with AI suggestions!");
}

// ─── Events ────────────────────────────────────────────────
function bindEvents() {
    document.getElementById("btnNewRoutine").addEventListener("click", openWizard);
    document.getElementById("btnSaveName").addEventListener("click", saveName);
    document.getElementById("btnDeleteRoutine").addEventListener("click", deleteRoutine);
    document.getElementById("btnAddExercise").addEventListener("click", openPicker);
    document.getElementById("btnLogWorkout").addEventListener("click", logWorkout);
    const btnStartEditorRoutine = document.getElementById("btnStartEditorRoutine");
    if (btnStartEditorRoutine) {
        btnStartEditorRoutine.addEventListener("click", () => {
            if (activeRoutineId) {
                window.startActiveWorkout(activeRoutineId);
            }
        });
    }

    // Wizard Navigation
    wizardNextBtn.addEventListener("click", () => setWizardStep(wizardState.step + 1));
    wizardBackBtn.addEventListener("click", () => setWizardStep(wizardState.step - 1));
    wizardFinishBtn.addEventListener("click", saveWizardRoutine);
    document.getElementById("wizardClose").addEventListener("click", closeWizard);
    document.getElementById("wizardModal").addEventListener("click", e => { if (e.target === wizardModal) closeWizard(); });

    // Step 1: Goal/Level
    setupWizardChips("goal", "data-goal");
    setupWizardChips("level", "data-level");

    // Step 2 & 3: Multi-select
    setupWizardMultiChips("wizardEquipment", "equipment", "data-eq");
    setupWizardMultiChips("wizardMuscles", "muscles", "data-muscle");

    // Picker events
    document.getElementById("pickerClose").addEventListener("click", closePicker);
    pickerModal.addEventListener("click", e => { if (e.target === pickerModal) closePicker(); });
    pickerSearch.addEventListener("input", () => {
        clearTimeout(pickerDebounceTimer);
        pickerDebounceTimer = setTimeout(() => renderPickerList(allExercises), 200);
    });
    pickerMuscle.addEventListener("change", () => renderPickerList(allExercises));
}

function setupWizardChips(stateKey, attr) {
    document.querySelectorAll(`[${attr}]`).forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(`[${attr}]`).forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            wizardState[stateKey] = btn.getAttribute(attr);
        });
    });
}

function setupWizardMultiChips(containerId, stateKey, attr) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.addEventListener("click", e => {
        const btn = e.target.closest(".chip");
        if (!btn) return;
        btn.classList.toggle("active");

        const selected = Array.from(container.querySelectorAll(".chip.active"))
            .map(b => b.getAttribute(attr));
        wizardState[stateKey] = selected;
    });
}

// ─── Utilities ─────────────────────────────────────────────
function showToast(message, type = "success") {
    const t = document.createElement("div");
    t.className = "toast";
    if (type === "error") {
        t.style.borderColor = "var(--clr-danger)";
        t.style.color = "var(--clr-danger)";
    }
    t.textContent = message;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
}

function escHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function fmtDate(isoStr) {
    if (!isoStr) return "";
    const d = new Date(isoStr);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
