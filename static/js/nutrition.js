/**
 * nutrition.js — Nutrition Guide
 * ================================
 * Fetches all nutrition data from /api/nutrition,
 * renders food cards by selected category tab,
 * and provides a footer helper function.
 */

(function () {

    // ─── State ────────────────────────────────────────────────────
    let allData = {};
    let activeCategory = 'muscle_gain';

    // ─── DOM References ───────────────────────────────────────────
    const foodGrid = document.getElementById('foodGrid');
    const spinner = document.getElementById('nutritionSpinner');
    const tabs = document.querySelectorAll('.nutrition-tab');
    const descIcon = document.getElementById('descIcon');
    const descTitle = document.getElementById('descTitle');
    const descText = document.getElementById('descText');

    // ─── Category Meta ────────────────────────────────────────────
    const categoryMeta = {
        muscle_gain: {
            icon: '💪',
            title: 'Muscle Gain Foods',
            text: 'High-protein, calorie-dense foods to fuel muscle growth and recovery.',
            emoji: ['🍗', '🥚', '🐟', '🥛', '🐠', '🍚', '🍠', '🥩']
        },
        fat_loss: {
            icon: '🔥',
            title: 'Fat Loss Foods',
            text: 'Low-calorie, high-fiber foods that keep you full and support a caloric deficit.',
            emoji: ['🥦', '🥬', '🧀', '🥑', '🍵', '🍎', '🦃', '🌾']
        },
        high_protein_vegetarian: {
            icon: '🌱',
            title: 'High Protein Vegetarian',
            text: 'Plant-powered protein sources for vegetarians and flexitarians.',
            emoji: ['🫛', '🫘', '🧆', '🥛', '🫘', '🫘', '🌾', '🌿']
        },
        budget_friendly: {
            icon: '💰',
            title: 'Budget Friendly Fitness Foods',
            text: 'Affordable, nutrient-packed foods that won\'t break the bank.',
            emoji: ['🥚', '🐟', '🥜', '🌾', '🫛', '🥛', '🥦', '🍌']
        }
    };

    // ─── Fetch all data on load ───────────────────────────────────
    fetch('/api/nutrition')
        .then(function (res) {
            if (!res.ok) throw new Error('Failed to load nutrition data');
            return res.json();
        })
        .then(function (data) {
            allData = data;
            spinner.style.display = 'none';
            renderCategory(activeCategory);
        })
        .catch(function (err) {
            spinner.style.display = 'none';
            foodGrid.innerHTML = `<div class="alert alert-danger">⚠️ Could not load nutrition data. Make sure the Flask server is running.</div>`;
            console.error(err);
        });

    // ─── Tab Clicks ───────────────────────────────────────────────
    tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
            tabs.forEach(function (t) { t.classList.remove('active'); });
            tab.classList.add('active');
            activeCategory = tab.dataset.category;
            renderCategory(activeCategory);
        });
    });

    // ─── Render Category ──────────────────────────────────────────
    function renderCategory(category) {
        const meta = categoryMeta[category] || categoryMeta.muscle_gain;
        const foods = allData[category] || [];
        const emojis = meta.emoji;

        // Update section description
        descIcon.textContent = meta.icon;
        descTitle.textContent = meta.title;
        descText.textContent = meta.text;

        // Clear grid, add animation class via re-insert
        foodGrid.style.opacity = '0';
        foodGrid.innerHTML = '';

        foods.forEach(function (food, idx) {
            const card = document.createElement('div');
            card.className = 'food-card';

            // Protein bar width (capped at max 35g = 100%)
            const barWidth = Math.min((food.protein_g / 35) * 100, 100).toFixed(0);
            const emoji = emojis[idx % emojis.length] || '🥗';

            card.innerHTML = `
        <div class="food-card-header">
          <h3 class="food-card-name">${food.name}</h3>
          <span class="food-emoji">${emoji}</span>
        </div>

        <!-- Macro stats -->
        <div class="food-macros">
          <div class="macro-pill">
            <div class="macro-value">${food.protein_g}g</div>
            <div class="macro-label">Protein</div>
          </div>
          <div class="macro-pill">
            <div class="macro-value">${food.calories_per_100g}</div>
            <div class="macro-label">Kcal/100g</div>
          </div>
        </div>

        <!-- Protein bar -->
        <div class="protein-bar-wrapper">
          <div class="protein-bar-label">
            <span>Protein density</span>
            <span>${food.protein_g}g / 100g</span>
          </div>
          <div class="protein-bar-track">
            <div class="protein-bar-fill" style="width: ${barWidth}%"></div>
          </div>
        </div>

        <!-- Benefits -->
        <p class="food-benefits">${food.benefits}</p>

        <!-- Best time -->
        <div class="food-time">
          ⏰ <span>Best time: <strong>${food.best_time}</strong></span>
        </div>
      `;

            foodGrid.appendChild(card);
        });

        // Fade in
        requestAnimationFrame(function () {
            foodGrid.style.transition = 'opacity 0.3s ease';
            foodGrid.style.opacity = '1';
        });
    }

    // ─── Global helper (used by footer links) ─────────────────────
    window.switchTab = function (category) {
        tabs.forEach(function (t) {
            t.classList.toggle('active', t.dataset.category === category);
        });
        activeCategory = category;
        renderCategory(category);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return false;
    };

})();
