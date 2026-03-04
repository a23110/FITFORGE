/**
 * analytics.js — FitForge Analytics Dashboard
 * Fetches /api/analytics and renders stat cards + Chart.js charts
 */

"use strict";

document.addEventListener("DOMContentLoaded", loadAnalytics);

async function loadAnalytics() {
    const spinner = document.getElementById("analyticsSpinner");
    spinner.style.display = "block";

    try {
        const res = await fetch("/api/analytics");
        const data = await res.json();
        spinner.style.display = "none";
        renderStats(data);
        renderCharts(data);
        renderRecentLogs(data.recent_logs);
    } catch (e) {
        spinner.style.display = "none";
        console.error("Analytics load failed:", e);
    }
}

// ─── Stat Cards ────────────────────────────────────────────
function renderStats(data) {
    document.getElementById("statTotalWorkouts").textContent = data.total_workouts ?? 0;
    document.getElementById("statTotalExercises").textContent = data.total_exercises_logged ?? 0;
    document.getElementById("statTotalVolume").textContent = (data.total_volume ?? 0).toLocaleString();
    document.getElementById("statPRCount").textContent = data.pr_count ?? 0;

    const topRoutine = data.top_routines?.[0]?.routine_name ?? "—";
    document.getElementById("statTopRoutine").textContent =
        topRoutine.length > 12 ? topRoutine.substring(0, 11) + "…" : topRoutine;

    // Workouts this week (last 7 days from weekly_activity)
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const thisWeek = (data.weekly_activity || []).filter(d => new Date(d.day) >= weekAgo)
        .reduce((sum, d) => sum + d.count, 0);
    document.getElementById("statThisWeek").textContent = thisWeek;

    // Show CTA if no data
    if (data.total_workouts === 0) {
        document.getElementById("logCta").style.display = "block";
        document.getElementById("chartsGrid").style.display = "none";
    }
}

// ─── Charts ────────────────────────────────────────────────
function renderCharts(data) {
    const accent = "#00e5a0";
    const accent2 = "#7c6bff";
    const border = "#2a3040";
    const textMuted = "#8791a8";
    const palette = ["#00e5a0", "#7c6bff", "#38b6ff", "#ffa938", "#ff5c5c", "#e8eaf0"];

    Chart.defaults.color = textMuted;
    Chart.defaults.borderColor = border;

    // ── Weekly Activity Bar Chart ──
    const weeklyCtx = document.getElementById("weeklyChart");
    if (weeklyCtx) {
        const labels = [];
        const counts = [];

        // Build last 28 days labels
        const today = new Date();
        const activityMap = {};
        (data.weekly_activity || []).forEach(d => { activityMap[d.day] = d.count; });

        for (let i = 27; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const key = d.toISOString().slice(0, 10);
            const label = d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
            labels.push(i % 4 === 0 ? label : "");
            counts.push(activityMap[key] || 0);
        }

        new Chart(weeklyCtx, {
            type: "bar",
            data: {
                labels,
                datasets: [{
                    label: "Workouts",
                    data: counts,
                    backgroundColor: counts.map(c => c > 0 ? "rgba(0,229,160,0.7)" : "rgba(42,48,64,0.6)"),
                    borderColor: counts.map(c => c > 0 ? accent : border),
                    borderWidth: 1,
                    borderRadius: 4,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            title: (items) => {
                                const i = items[0].dataIndex;
                                const d = new Date(today);
                                d.setDate(d.getDate() - (27 - i));
                                return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
                            }
                        }
                    }
                },
                scales: {
                    x: { grid: { display: false }, ticks: { maxRotation: 0 } },
                    y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: border } }
                }
            }
        });
    }

    // ── Top Routines Doughnut ──
    const routineCtx = document.getElementById("routineChart");
    if (routineCtx) {
        const topRoutines = (data.top_routines || []).slice(0, 6);

        if (topRoutines.length === 0) {
            const parent = routineCtx.parentElement;
            parent.innerHTML = `<p style="text-align:center;color:var(--clr-text-muted);padding:var(--sp-xl);">Log workouts to see your top routines here.</p>`;
        } else {
            new Chart(routineCtx, {
                type: "doughnut",
                data: {
                    labels: topRoutines.map(r => r.routine_name),
                    datasets: [{
                        data: topRoutines.map(r => r.cnt),
                        backgroundColor: palette.slice(0, topRoutines.length).map(c => c + "cc"),
                        borderColor: palette.slice(0, topRoutines.length),
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: "65%",
                    plugins: {
                        legend: {
                            position: "bottom",
                            labels: { padding: 12, boxWidth: 12, font: { size: 11 } }
                        }
                    }
                }
            });
        }
    }

    // ── Muscle Distribution Radar Chart ──
    const muscleCtx = document.getElementById("muscleChart");
    if (muscleCtx && data.muscle_frequency) {
        const labels = data.muscle_frequency.map(m => m.muscle);
        const values = data.muscle_frequency.map(m => m.count);

        new Chart(muscleCtx, {
            type: "radar",
            data: {
                labels,
                datasets: [{
                    label: "Sets Logged",
                    data: values,
                    backgroundColor: "rgba(0, 229, 160, 0.2)",
                    borderColor: accent,
                    pointBackgroundColor: accent,
                    pointBorderColor: "#fff",
                    pointHoverBackgroundColor: "#fff",
                    pointHoverBorderColor: accent
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: { color: border },
                        grid: { color: border },
                        pointLabels: { color: textMuted, font: { size: 11 } },
                        ticks: { display: false, stepSize: 1 }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }
}

// ─── Recent Logs Table ─────────────────────────────────────
function renderRecentLogs(logs) {
    const tbody = document.getElementById("logTableBody");
    const empty = document.getElementById("recentEmpty");
    const table = document.getElementById("logTable");

    if (!logs || logs.length === 0) {
        table.style.display = "none";
        empty.style.display = "block";
        return;
    }

    logs.forEach((log, idx) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>#${log.id}</td>
            <td>${escHtml(log.routine_name)}</td>
            <td>${escHtml(log.notes || "—")}</td>
            <td class="log-date">${fmtDateTime(log.logged_at)}</td>
        `;
        tbody.appendChild(tr);
    });
}

// ─── Utils ─────────────────────────────────────────────────
function escHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function fmtDateTime(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleString("en-GB", {
        day: "numeric", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit"
    });
}
