/**
 * exercises.js — FitForge Exercise Library
 * Priority-aware browsing, instant search, and mobile-first filters.
 */

"use strict";

let allExercises = [];
let filteredExercises = [];
let searchDebounceTimer = null;
let activeFilters = {
    muscle: "",
    difficulty: "",
    equipment: "",
    q: ""
};

// DOM Refs
const exerciseGrid = document.getElementById("exerciseGrid");
const exerciseSpinner = document.getElementById("exerciseSpinner");
const searchInput = document.getElementById("searchInput");
const filterSheet = document.getElementById("filterSheet");
const openFiltersBtn = document.getElementById("openFiltersBtn");
const closeFiltersBtn = document.getElementById("closeFiltersBtn");
const filterBackdrop = document.getElementById("filterBackdrop");
const applyFiltersBtn = document.getElementById("applyFiltersBtn");

document.addEventListener("DOMContentLoaded", () => {
    fetchExercises();
    bindEvents();
});

async function fetchExercises() {
    if (exerciseSpinner) exerciseSpinner.style.display = "block";
    try {
        const res = await fetch("/api/exercises");
        allExercises = await res.json();
        applyFilters(false); // Initial render
    } catch (e) {
        console.error("Failed to fetch exercises", e);
    }
    if (exerciseSpinner) exerciseSpinner.style.display = "none";
}

function bindEvents() {
    // Search
    searchInput?.addEventListener("input", (e) => {
        activeFilters.q = e.target.value.toLowerCase().trim();
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => applyFilters(), 300);
    });

    // Bottom Sheet
    openFiltersBtn?.addEventListener("click", () => filterSheet.classList.add("open"));
    closeFiltersBtn?.addEventListener("click", () => filterSheet.classList.remove("open"));
    filterBackdrop?.addEventListener("click", () => filterSheet.classList.remove("open"));
    applyFiltersBtn?.addEventListener("click", () => {
        applyFilters();
        filterSheet.classList.remove("open");
    });

    // Chips
    setupChips("muscleChips", "muscle");
    setupChips("difficultyChips", "difficulty");
    setupChips("equipmentChips", "equipment");
}

function setupChips(containerId, filterKey) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.addEventListener("click", (e) => {
        const chip = e.target.closest(".chip");
        if (!chip) return;

        container.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        activeFilters[filterKey] = chip.dataset.value || "";
    });
}

function applyFilters() {
    filteredExercises = allExercises.filter(ex => {
        const matchM = !activeFilters.muscle || ex.muscle_group === activeFilters.muscle;
        const matchD = !activeFilters.difficulty || ex.difficulty === activeFilters.difficulty;
        const matchE = !activeFilters.equipment || ex.equipment.toLowerCase().includes(activeFilters.equipment.toLowerCase());
        const matchQ = !activeFilters.q || ex.name.toLowerCase().includes(activeFilters.q);
        return matchM && matchD && matchE && matchQ;
    });

    renderExercises();
}

function renderExercises() {
    if (!exerciseGrid) return;
    exerciseGrid.innerHTML = "";
    if (filteredExercises.length === 0) {
        renderEmpty();
        return;
    }

    filteredExercises.forEach(ex => {
        const card = document.createElement("article");
        card.className = "exercise-card card";
        card.innerHTML = `
            <div class="exercise-header">
                <div>
                    <h3 class="exercise-name">${escHtml(ex.name)}</h3>
                    <div style="display:flex;gap:4px;margin-top:4px;">
                        <span class="badge badge-accent">${escHtml(ex.muscle_group)}</span>
                        <span class="badge badge-${ex.difficulty.toLowerCase()}">${escHtml(ex.difficulty)}</span>
                    </div>
                </div>
            </div>
            
            <p class="exercise-meta">Requires: <strong>${escHtml(ex.equipment)}</strong></p>
            
            <div class="exercise-actions">
                <button class="btn btn-primary" onclick="quickAddExercise(${ex.id}, '${escHtml(ex.name)}')">
                    + Add
                </button>
                <button class="btn btn-secondary" onclick="viewDetails(${ex.id})">
                    Details
                </button>
            </div>
        `;
        exerciseGrid.appendChild(card);
    });
}

function renderEmpty() {
    exerciseGrid.innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1;">
            <div class="empty-icon">🔍</div>
            <h3>No exercises found</h3>
            <p>Try adjusting your search or filters.</p>
        </div>
    `;
}

// Global actions
window.quickAddExercise = (id, name) => {
    // For now, redirect to routines or handle routine context
    showToast(`Added ${name} to session! Go to Routines to save permanently.`, "success");
};

window.viewDetails = (id) => {
    const ex = allExercises.find(e => e.id === id);
    if (!ex) return;
    alert(`Exercise: ${ex.name}\n\nEquipment: ${ex.equipment}\nDifficulty: ${ex.difficulty}\n\nInstructions: ${ex.instructions || "Contact trainer for details."}`);
};

function escHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function showToast(message, type = "success") {
    const t = document.createElement("div");
    t.className = "toast";
    if (type === "error") {
        t.style.borderColor = "var(--clr-danger)";
        t.style.color = "var(--clr-danger)";
    }
    t.textContent = message;
    document.body.appendChild(t);
    setTimeout(() => {
        t.style.opacity = "0";
        setTimeout(() => t.remove(), 500);
    }, 3000);
}
