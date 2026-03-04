/**
 * workout.js — Workout Plan Generator
 * =====================================
 * Submits form preferences to the Flask /api/workout endpoint,
 * then renders a dynamic day-by-day plan with collapsible day cards.
 */

(function () {

  // ─── DOM References ───────────────────────────────────────────
  const form = document.getElementById('workoutForm');
  const genBtn = document.getElementById('generateBtn');
  const loading = document.getElementById('workoutLoading');
  const errorBox = document.getElementById('workoutError');
  const errorMsg = document.getElementById('workoutErrorMsg');
  const placeholder = document.getElementById('planPlaceholder');
  const results = document.getElementById('workoutResults');
  const planTitle = document.getElementById('planTitle');
  const planMeta = document.getElementById('planMeta');
  const planNote = document.getElementById('planNote');
  const dayCards = document.getElementById('dayCards');
  const btnSaveToRoutines = document.getElementById('btnSaveToRoutines');

  let currentWorkoutData = null;

  // ─── Form Submit ──────────────────────────────────────────────
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    clearErrors();

    // Read form values
    const goal = document.getElementById('goalSelect').value;
    const level = document.getElementById('levelSelect').value;
    const daysEl = document.querySelector('input[name="days"]:checked');
    const days = daysEl ? parseInt(daysEl.value) : null;

    // Collect selected equipment
    const eqCheckboxes = document.querySelectorAll('input[name="equipment"]:checked');
    const equipments = Array.from(eqCheckboxes).map(function (cb) { return cb.value; });

    // Collect selected muscle groups
    const muscleCheckboxes = document.querySelectorAll('input[name="muscle_groups"]:checked');
    const muscleGroups = Array.from(muscleCheckboxes).map(function (cb) { return cb.value; });

    // Validate
    let valid = true;
    if (!goal) { showError('errGoal', document.getElementById('goalSelect')); valid = false; }
    if (!level) { showError('errLevel', document.getElementById('levelSelect')); valid = false; }
    if (!days) { showError('errDays', null); valid = false; }
    if (!valid) return;

    // Show loading
    showLoading(true);

    // POST to API
    fetch('/api/workout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        goal: goal,
        level: level,
        days: days,
        equipment: equipments,
        muscle_groups: muscleGroups
      })
    })
      .then(function (res) {
        if (!res.ok) return res.json().then(function (d) { throw new Error(d.error || 'Server error'); });
        return res.json();
      })
      .then(function (data) {
        showLoading(false);
        currentWorkoutData = data;
        renderPlan(data);
      })
      .catch(function (err) {
        showLoading(false);
        errorMsg.textContent = err.message || 'Failed to generate plan. Make sure the Flask server is running.';
        errorBox.style.display = 'flex';
      });
  });

  // ─── Render Plan ──────────────────────────────────────────────
  function renderPlan(data) {
    // Update header
    planTitle.textContent = data.goal + ' Plan — ' + data.level + ' · ' + data.days_per_week + ' Days/Week';

    // Meta pills
    planMeta.innerHTML = `
      <div class="plan-meta-item">🏋️ <span>Goal: <strong>${data.goal}</strong></span></div>
      <div class="plan-meta-item">📊 <span>Level: <strong>${data.level}</strong></span></div>
      <div class="plan-meta-item">📅 <span>Days: <strong>${data.days_per_week}/week</strong></span></div>
      <div class="plan-meta-item">⏱️ <span>Rest: <strong>${data.rest_between_sets}</strong></span></div>
    `;

    // Notes
    planNote.innerHTML = `
      <strong>📌 Schedule:</strong> ${data.rest_between_days}<br />
      ${data.cardio_note ? '<strong>🏃 Cardio:</strong> ' + data.cardio_note : ''}
    `;

    // Volume Summary
    let volumeHtml = '';
    if (data.volume_summary) {
      volumeHtml = `
                <div class="volume-summary">
                    <div class="volume-summary-header">
                        <h4>📈 Weekly Volume Summary</h4>
                        <p>Total weighted sets per muscle group</p>
                    </div>
                    <div class="volume-grid">
            `;

      for (const [muscle, stats] of Object.entries(data.volume_summary)) {
        const statusClass = stats.status.toLowerCase();
        volumeHtml += `
                    <div class="volume-item">
                        <span class="volume-muscle">${muscle}</span>
                        <div class="volume-bar-container">
                            <span class="volume-count"><strong>${stats.total_sets}</strong> sets</span>
                            <span class="volume-status status-${statusClass}">${stats.status}</span>
                        </div>
                    </div>
                `;
      }
      volumeHtml += `</div></div>`;
    }

    // Day cards
    dayCards.innerHTML = volumeHtml;
    data.plan.forEach(function (day, idx) {
      const card = document.createElement('div');
      card.className = 'day-card' + (idx === 0 ? ' open' : '');

      const exList = day.exercises.map(function (ex, i) {
        return `
          <div class="plan-exercise-row">
            <div class="plan-ex-num">${i + 1}</div>
            <div class="plan-ex-name">${ex.name}</div>
            <div class="plan-ex-detail">
              <span>Sets: <strong>${ex.sets}</strong></span>
              <span>Reps: <strong>${ex.reps}</strong></span>
            </div>
          </div>
        `;
      }).join('');

      const noExercises = day.exercises.length === 0
        ? '<p style="color:var(--clr-text-muted);font-size:0.875rem;padding:var(--sp-sm) 0;">No specific exercises — perform your best compound movements for this focus area.</p>'
        : '';

      card.innerHTML = `
        <div class="day-card-header">
          <div class="day-card-title">
            <div class="day-number-badge">${day.day}</div>
            <div>
              <div class="day-focus">${day.focus}</div>
              <div class="day-exercise-count">${day.exercises.length} exercise${day.exercises.length !== 1 ? 's' : ''}</div>
            </div>
          </div>
          <span class="day-toggle-icon">▼</span>
        </div>
        <div class="day-exercise-list">
          ${exList}
          ${noExercises}
        </div>
      `;

      // Toggle accordion
      card.querySelector('.day-card-header').addEventListener('click', function () {
        card.classList.toggle('open');
      });

      dayCards.appendChild(card);
    });

    // Show results, hide placeholder
    placeholder.style.display = 'none';
    if (btnSaveToRoutines) {
      btnSaveToRoutines.style.display = 'flex';
      btnSaveToRoutines.innerHTML = '💾 Save to Routines';
      btnSaveToRoutines.disabled = false;
    }
    results.classList.add('show');
    results.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ─── Helpers ──────────────────────────────────────────────────
  function showLoading(show) {
    loading.style.display = show ? 'block' : 'none';
    genBtn.disabled = show;
    genBtn.textContent = show ? 'Generating...' : '⚡ Generate Workout Plan';
    errorBox.style.display = 'none';
    if (show) {
      placeholder.style.display = 'none';
      results.classList.remove('show');
    }
  }

  function showError(errId, inputEl) {
    const errEl = document.getElementById(errId);
    if (errEl) errEl.classList.add('show');
    if (inputEl) inputEl.classList.add('error');
  }

  function clearErrors() {
    document.querySelectorAll('.form-error').forEach(function (el) { el.classList.remove('show'); });
    document.querySelectorAll('.form-select').forEach(function (el) { el.classList.remove('error'); });
    errorBox.style.display = 'none';
  }

  // ─── Save to Routines ─────────────────────────────────────────
  if (btnSaveToRoutines) {
    btnSaveToRoutines.addEventListener('click', async function () {
      if (!currentWorkoutData || !currentWorkoutData.plan) return;

      const btn = this;
      btn.disabled = true;
      btn.innerHTML = '⏳ Saving...';

      try {
        let savedCount = 0;
        for (const day of currentWorkoutData.plan) {
          if (!day.exercises || day.exercises.length === 0) continue;

          const routineName = `${currentWorkoutData.goal} - ${day.label} (${day.focus})`;
          const desc = `${currentWorkoutData.level} level split generated via Workout Builder.`;

          // 1. Create a new routine
          const res = await fetch('/api/routines', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: routineName, description: desc })
          });

          if (!res.ok) throw new Error('Failed to create routine');
          const routine = await res.json();

          // 2. Add exercises to the routine
          for (const ex of day.exercises) {
            await fetch(`/api/routines/${routine.id}/exercises`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                exercise_id: ex.id,
                exercise_name: ex.name,
                sets: parseInt(ex.sets),
                reps: ex.reps,
                rest: ex.rest,
                set_type: "Normal"
              })
            });
          }
          savedCount++;
        }

        btn.innerHTML = `✅ Saved ${savedCount} Routines!`;
        setTimeout(() => {
          btn.innerHTML = '💾 Save to Routines';
          btn.disabled = false;
        }, 3000);

        // Show a custom toast if available (FitForge includes showToast in some files, but we'll inject a quick one if it's missing)
        if (typeof showToast === 'function') {
          showToast(`Successfully saved ${savedCount} routines!`);
        } else {
          alert(`Successfully saved ${savedCount} workout days to your routines! You can view them on the Routines page.`);
        }

      } catch (err) {
        console.error(err);
        btn.innerHTML = '❌ Error Saving';
        setTimeout(() => {
          btn.innerHTML = '💾 Save to Routines';
          btn.disabled = false;
        }, 3000);
        alert('There was an error saving your workouts to routines. Please try again.');
      }
    });
  }

})();
