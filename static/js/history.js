/**
 * history.js — FitForge Workout History
 * Fetches /api/history and handles session detail modal
 */

"use strict";

document.addEventListener("DOMContentLoaded", initHistory);

async function initHistory() {
    const spinner = document.getElementById("historySpinner");
    const empty = document.getElementById("historyEmpty");
    const content = document.getElementById("historyContent");
    const list = document.getElementById("historyList");

    try {
        const res = await fetch("/api/history");
        const logs = await res.json();

        spinner.style.display = "none";

        if (!logs || logs.length === 0) {
            empty.style.display = "block";
            return;
        }

        content.style.display = "block";
        renderHistoryList(logs, list);
    } catch (e) {
        spinner.style.display = "none";
        console.error("History load failed:", e);
    }

    // Modal close
    document.getElementById("detailClose").onclick = closeDetail;
    document.getElementById("detailModal").onclick = (e) => {
        if (e.target.id === "detailModal") closeDetail();
    };
}

function renderHistoryList(logs, container) {
    container.innerHTML = "";
    logs.forEach(log => {
        const card = document.createElement("div");
        card.className = "history-card";
        card.onclick = () => openDetail(log.id);

        const duration = formatDuration(log.notes); // Try to extract duration from notes "Completed in 00:30:15"

        card.innerHTML = `
            <div class="history-info">
                <h3>${escHtml(log.routine_name)}</h3>
                <div class="history-date">
                    <i class="far fa-calendar-alt"></i>
                    ${fmtDateShort(log.logged_at)}
                </div>
            </div>
            <div class="history-stats">
                <div class="history-stat">
                    <span>${log.exercise_count || 0}</span>
                    <label>Exercises</label>
                </div>
                <div class="history-stat">
                    <span>${log.total_sets || 0}</span>
                    <label>Sets</label>
                </div>
                <div class="history-stat">
                    <span>${duration}</span>
                    <label>Duration</label>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

async function openDetail(logId) {
    const modal = document.getElementById("detailModal");
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";

    try {
        const res = await fetch(`/api/history/${logId}`);
        const data = await res.json();
        renderDetail(data);
    } catch (e) {
        console.error("Detail load failed:", e);
    }
}

function renderDetail(data) {
    document.getElementById("modalRoutineName").textContent = data.routine_name;
    document.getElementById("modalDate").textContent = fmtDateFull(data.logged_at);

    // Duration extraction from notes if present
    const duration = formatDuration(data.notes);
    document.getElementById("modalDuration").textContent = duration;

    const totalSets = data.sets.length;
    document.getElementById("modalTotalSets").textContent = totalSets;

    if (data.paused_duration > 0) {
        const pStat = document.getElementById("modalPausedStat");
        pStat.style.display = "block";
        document.getElementById("modalPausedTime").textContent = Math.floor(data.paused_duration / 60) + "m";
    } else {
        document.getElementById("modalPausedStat").style.display = "none";
    }

    // Notes
    const notesBox = document.getElementById("modalNotesContainer");
    if (data.notes && !data.notes.startsWith("Completed in")) {
        notesBox.style.display = "block";
        document.getElementById("modalNotes").textContent = data.notes;
    } else {
        notesBox.style.display = "none";
    }

    // Exercises
    const exList = document.getElementById("modalExList");
    exList.innerHTML = "";

    data.exercises.forEach(ex => {
        const card = document.createElement("div");
        card.className = "detail-ex-card";

        // Find sets for this exercise
        const exSets = data.sets.filter(s => s.exercise_id === ex.exercise_id);
        const prs = data.prs.filter(p => p.exercise_id === ex.exercise_id);

        card.innerHTML = `
            <div class="detail-ex-header">
                <div>
                    <span class="detail-ex-name">${escHtml(ex.exercise_name)}</span>
                    <span class="detail-ex-summary">${ex.set_type !== 'Normal' ? ` • ${ex.set_type}` : ''}</span>
                </div>
                <a href="/exercise/${ex.exercise_id}/stats" class="btn btn-sm btn-outline">Stats</a>
            </div>
            <div class="detail-sets-grid">
                ${exSets.map((s, i) => {
            const isPR = prs.some(p => p.value === s.weight || p.value === s.reps);
            return `
                        <div class="detail-set-chip ${s.set_type.toLowerCase().includes('warmup') ? 'warmup' : ''} ${isPR ? 'pr' : ''}">
                            Set ${i + 1}: <strong>${s.weight}kg</strong> × ${s.reps}
                            ${isPR ? ' <i class="fas fa-crown"></i>' : ''}
                        </div>
                    `;
        }).join('')}
            </div>
        `;
        exList.appendChild(card);
    });
}

function closeDetail() {
    document.getElementById("detailModal").style.display = "none";
    document.body.style.overflow = "auto";
}

// ─── Utils ─────────────────────────────────────────────────
function formatDuration(notes) {
    if (!notes) return "—";
    const match = notes.match(/(\d{2}:\d{2}:\d{2})/);
    return match ? match[1] : "—";
}

function escHtml(str) {
    return String(str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function fmtDateShort(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function fmtDateFull(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
        hour: "2-digit", minute: "2-digit"
    });
}
