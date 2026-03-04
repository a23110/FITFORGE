/**
 * exercise_stats.js — FitForge Performance Tracking
 * Fetches /api/exercises/<id>/performance and renders progression charts
 */

"use strict";

document.addEventListener("DOMContentLoaded", initStats);

async function initStats() {
    const exId = document.documentElement.getAttribute("data-exercise-id");
    const spinner = document.getElementById("statsSpinner");
    const empty = document.getElementById("statsEmpty");
    const content = document.getElementById("statsContent");

    if (!exId) {
        spinner.style.display = "none";
        empty.style.display = "block";
        return;
    }

    try {
        const res = await fetch(`/api/exercises/${exId}/performance`);
        const data = await res.json();

        spinner.style.display = "none";

        if (!data.history || data.history.length === 0) {
            empty.style.display = "block";
            return;
        }

        content.style.display = "block";
        renderPerformance(data);
    } catch (e) {
        spinner.style.display = "none";
        console.error("Stats load failed:", e);
    }
}

function renderPerformance(data) {
    // 1. Update Header
    // Note: We don't have the exercise name in performance API yet, 
    // but the history rows contain it if we joined. Let's assume we fetch it or join it.
    // For now, let's look at the first history entry if available.
    // Actually, I'll just keep the generic title or try to find it.

    // 2. Update Quick Stats
    document.getElementById("statMaxWeight").textContent = `${data.stats.max_weight ?? 0}kg`;
    document.getElementById("statMaxReps").textContent = data.stats.max_reps ?? 0;
    document.getElementById("statTotalSessions").textContent = data.stats.total_sessions ?? 0;

    const oneRm = data.prs.find(p => p.record_type === '1rm');
    document.getElementById("statMax1RM").textContent = oneRm ? `${Math.round(oneRm.value)}kg` : "—";

    // 3. Render Charts
    renderWeightChart(data.history);
    renderVolumeChart(data.history);

    // 4. Render PR Table
    const tbody = document.getElementById("prTableBody");
    tbody.innerHTML = "";
    data.prs.forEach(pr => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><span class="record-type-badge badge-${pr.record_type}">${pr.record_type.replace('_', ' ')}</span></td>
            <td><strong>${Math.round(pr.value * 10) / 10}${pr.record_type === 'reps' ? '' : 'kg'}</strong></td>
            <td>${fmtDate(pr.date_achieved)}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderWeightChart(history) {
    const ctx = document.getElementById("weightChart");

    // Group by date to get the best weight of that session
    const dailyBests = {};
    history.forEach(h => {
        const date = h.date.split(' ')[0];
        if (!dailyBests[date] || h.weight > dailyBests[date]) {
            dailyBests[date] = h.weight;
        }
    });

    const labels = Object.keys(dailyBests).sort();
    const values = labels.map(l => dailyBests[l]);

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Max Weight',
                data: values,
                borderColor: '#00e5a0',
                backgroundColor: 'rgba(0, 229, 160, 0.1)',
                borderWidth: 3,
                tension: 0.3,
                fill: true,
                pointBackgroundColor: '#00e5a0',
                pointRadius: 4
            }]
        },
        options: chartOptions
    });
}

function renderVolumeChart(history) {
    const ctx = document.getElementById("volumeChart");

    // Total volume per session
    const dailyVolume = {};
    history.forEach(h => {
        const date = h.date.split(' ')[0];
        const vol = h.weight * h.reps;
        dailyVolume[date] = (dailyVolume[date] || 0) + vol;
    });

    const labels = Object.keys(dailyVolume).sort();
    const values = labels.map(l => dailyVolume[l]);

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Volume',
                data: values,
                backgroundColor: 'rgba(124, 107, 255, 0.6)',
                borderColor: '#7c6bff',
                borderWidth: 1,
                borderRadius: 6
            }]
        },
        options: chartOptions
    });
}

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { display: false }
    },
    scales: {
        x: {
            grid: { display: false },
            ticks: { color: "#8791a8" }
        },
        y: {
            grid: { color: "rgba(255, 255, 255, 0.05)" },
            ticks: { color: "#8791a8" }
        }
    }
};

function fmtDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
