/**
 * Calisthenics Hub - Frontend Logic
 * Handles filtering and rendering of bodyweight exercises.
 */

document.addEventListener('DOMContentLoaded', () => {
    initFilters();
    loadExercises();
});

let allExercises = [];
let movementFilter = "";
let goalFilter = "";

function initFilters() {
    const movementChips = document.querySelectorAll('#movementFilters .chip');
    const goalChips = document.querySelectorAll('#goalFilters .chip');

    movementChips.forEach(chip => {
        chip.addEventListener('click', () => {
            movementChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            movementFilter = chip.dataset.filter;
            filterAndRender();
        });
    });

    goalChips.forEach(chip => {
        chip.addEventListener('click', () => {
            goalChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            goalFilter = chip.dataset.filter;
            filterAndRender();
        });
    });
}

async function loadExercises() {
    try {
        const response = await fetch('/api/exercises?tag=calisthenics');
        allExercises = await response.json();
        filterAndRender();
    } catch (error) {
        console.error('Error fetching calisthenics exercises:', error);
    }
}

function filterAndRender() {
    const beginnerGrid = document.getElementById('beginnerGrid');
    const intermediateGrid = document.getElementById('intermediateGrid');
    const advancedGrid = document.getElementById('advancedGrid');

    // Clean grids
    beginnerGrid.innerHTML = "";
    intermediateGrid.innerHTML = "";
    advancedGrid.innerHTML = "";

    const filtered = allExercises.filter(ex => {
        const matchesMovement = !movementFilter ||
            (ex.tags && ex.tags.some(t => t.toLowerCase() === movementFilter.toLowerCase()));
        const matchesGoal = !goalFilter ||
            (ex.tags && ex.tags.some(t => t.toLowerCase() === goalFilter.toLowerCase()));
        return matchesMovement && matchesGoal;
    });

    filtered.forEach(ex => {
        const card = createExerciseCard(ex);
        if (ex.difficulty.toLowerCase() === 'beginner') {
            beginnerGrid.appendChild(card);
        } else if (ex.difficulty.toLowerCase() === 'intermediate') {
            intermediateGrid.appendChild(card);
        } else if (ex.difficulty.toLowerCase() === 'advanced') {
            advancedGrid.appendChild(card);
        }
    });

    // Check for empty sections
    handleEmptySections([beginnerGrid, intermediateGrid, advancedGrid]);
}

function createExerciseCard(ex) {
    const div = document.createElement('div');
    div.className = 'cali-card';

    // Icon selection based on tags/name
    let iconClass = "fas fa-person-running";
    if (ex.name.toLowerCase().includes('pushup')) iconClass = "fas fa-hand-holding";
    if (ex.name.toLowerCase().includes('pullup')) iconClass = "fas fa-angles-up";
    if (ex.name.toLowerCase().includes('squat')) iconClass = "fas fa-person-arrow-down-to-line";

    div.innerHTML = `
        <div class="cali-card-header">
            <i class="${iconClass}"></i>
            <img src="${ex.image}" alt="${ex.name}" style="position:absolute; width:100%; height:100%; object-fit:contain; opacity:0.1;">
        </div>
        <div class="cali-card-content">
            <h3>${ex.name}</h3>
            <div class="cali-info">
                <span><i class="fas fa-dumbbell"></i> ${ex.muscle_group}</span>
            </div>
            <p class="cali-instructions">${ex.instructions}</p>
            <div class="tag-list">
                ${ex.tags.slice(0, 3).map(t => `<span class="mini-tag">${t}</span>`).join('')}
            </div>
        </div>
        <div class="cali-footer">
            <span class="rep-suggestion">${ex.reps || 'Sets of 10'}</span>
            <button class="btn-outline btn-sm" onclick="showDetails(${ex.id})">Details</button>
        </div>
    `;
    return div;
}

function handleEmptySections(grids) {
    grids.forEach(grid => {
        if (grid.children.length === 0) {
            grid.innerHTML = `<div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #666;">
                                <p>No exercises match the selected filters for this level.</p>
                              </div>`;
        }
    });
}

function showDetails(id) {
    // For now just alert or redirect to full exercise page if it exists
    window.location.href = `/exercises?id=${id}`;
}
