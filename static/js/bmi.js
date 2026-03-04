/**
 * bmi.js — BMI Calculator Logic
 * ================================
 * Supports both metric (kg/cm) and imperial (lbs/ft+in) units.
 * Calculates BMI = weight(kg) / height(m)²
 * Displays color-coded result card with animated scale indicator.
 */

(function () {

    // ─── DOM References ───────────────────────────────────────────
    const form = document.getElementById('bmiForm');
    const metricBtn = document.getElementById('bmiMetricBtn');
    const imperialBtn = document.getElementById('bmiImperialBtn');
    const metricFields = document.getElementById('bmiMetricFields');
    const imperialFields = document.getElementById('bmiImperialFields');
    const resultWrap = document.getElementById('bmiResult');
    const resultCard = document.getElementById('bmiResultCard');
    const bmiValue = document.getElementById('bmiValue');
    const bmiCategory = document.getElementById('bmiCategory');
    const bmiDescription = document.getElementById('bmiDescription');
    const bmiMarker = document.getElementById('bmiMarker');
    const bmiInfoTable = document.getElementById('bmiInfoTable');

    // Current unit mode: 'metric' or 'imperial'
    let currentUnit = 'metric';

    // ─── Unit Toggle ──────────────────────────────────────────────
    metricBtn.addEventListener('click', function () {
        currentUnit = 'metric';
        metricBtn.classList.add('active');
        imperialBtn.classList.remove('active');
        metricFields.style.display = 'block';
        imperialFields.style.display = 'none';
        clearErrors();
    });

    imperialBtn.addEventListener('click', function () {
        currentUnit = 'imperial';
        imperialBtn.classList.add('active');
        metricBtn.classList.remove('active');
        metricFields.style.display = 'none';
        imperialFields.style.display = 'block';
        clearErrors();
    });

    // ─── Form Submit ──────────────────────────────────────────────
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        clearErrors();

        let weightKg, heightM;
        let valid = true;

        if (currentUnit === 'metric') {
            const weightInput = document.getElementById('bmiWeightKg');
            const heightInput = document.getElementById('bmiHeightCm');
            const w = parseFloat(weightInput.value);
            const h = parseFloat(heightInput.value);

            if (isNaN(w) || w < 1 || w > 500) {
                showError('errBmiWeightKg', weightInput);
                valid = false;
            }
            if (isNaN(h) || h < 50 || h > 300) {
                showError('errBmiHeightCm', heightInput);
                valid = false;
            }

            if (!valid) return;
            weightKg = w;
            heightM = h / 100;

        } else {
            const wInput = document.getElementById('bmiWeightLb');
            const ftInput = document.getElementById('bmiHeightFt');
            const inInput = document.getElementById('bmiHeightIn');
            const w = parseFloat(wInput.value);
            const ft = parseFloat(ftInput.value) || 0;
            const ins = parseFloat(inInput.value) || 0;

            if (isNaN(w) || w < 1 || w > 1100) {
                showError('errBmiWeightLb', wInput);
                valid = false;
            }
            if (ft < 1 || ft > 9) {
                showError('errBmiHeightImp', ftInput);
                valid = false;
            }

            if (!valid) return;
            weightKg = w * 0.453592;
            heightM = ((ft * 12) + ins) * 0.0254;
        }

        // ─── Calculate BMI ────────────────────────────────────────
        const bmi = weightKg / (heightM * heightM);
        displayBMIResult(bmi, weightKg, heightM);
    });

    // ─── Display Result ───────────────────────────────────────────
    function displayBMIResult(bmi, weightKg, heightM) {
        const rounded = bmi.toFixed(1);

        // Determine category
        let category, description, cssClass;
        if (bmi < 18.5) {
            category = 'Underweight';
            description = 'Your BMI indicates you may be underweight. Consider speaking with a healthcare provider about healthy weight gain strategies.';
            cssClass = 'underweight';
        } else if (bmi < 25) {
            category = 'Normal Weight';
            description = 'Great! Your BMI falls within the healthy range. Maintain your weight through balanced nutrition and regular exercise.';
            cssClass = 'normal';
        } else if (bmi < 30) {
            category = 'Overweight';
            description = 'Your BMI suggests you may be overweight. A combination of regular exercise and a calorie-controlled diet can help.';
            cssClass = 'overweight';
        } else {
            category = 'Obese';
            description = 'Your BMI falls in the obese range. It is recommended to consult a healthcare provider for a personalized weight management plan.';
            cssClass = 'obese';
        }

        // Update card
        bmiValue.textContent = rounded;
        bmiCategory.textContent = category;
        bmiDescription.textContent = description;

        // Update card color class
        resultCard.className = 'result-card ' + cssClass;

        // Position BMI marker on scale (18.5–40 range mapped to 0–100%)
        const minBMI = 10, maxBMI = 40;
        const pct = Math.min(Math.max(((bmi - minBMI) / (maxBMI - minBMI)) * 100, 2), 98);
        bmiMarker.style.left = pct + '%';

        // Build info table
        const idealMinKg = 18.5 * heightM * heightM;
        const idealMaxKg = 24.9 * heightM * heightM;

        bmiInfoTable.innerHTML = `
      <div class="info-row">
        <div class="label">Your BMI</div>
        <div class="value">${rounded}</div>
      </div>
      <div class="info-row">
        <div class="label">Category</div>
        <div class="value">${category}</div>
      </div>
      <div class="info-row">
        <div class="label">Healthy Weight Range</div>
        <div class="value">${idealMinKg.toFixed(1)}–${idealMaxKg.toFixed(1)} kg</div>
      </div>
      <div class="info-row">
        <div class="label">Height</div>
        <div class="value">${(heightM * 100).toFixed(1)} cm</div>
      </div>
    `;

        // Show result
        resultWrap.classList.add('show');
        resultWrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // ─── Helpers ──────────────────────────────────────────────────
    function showError(errId, inputEl) {
        document.getElementById(errId).classList.add('show');
        if (inputEl) inputEl.classList.add('error');
    }

    function clearErrors() {
        document.querySelectorAll('.form-error').forEach(function (el) {
            el.classList.remove('show');
        });
        document.querySelectorAll('.form-input').forEach(function (el) {
            el.classList.remove('error');
        });
    }

})();
