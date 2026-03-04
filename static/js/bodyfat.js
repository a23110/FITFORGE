/**
 * bodyfat.js — Body Fat Percentage Calculator
 * =============================================
 * Uses the U.S. Navy circumference method.
 *
 * Male formula:
 *   %BF = 495 / (1.0324 - 0.19077 * log10(waist - neck) + 0.15456 * log10(height)) - 450
 *
 * Female formula:
 *   %BF = 495 / (1.29579 - 0.35004 * log10(waist + hip - neck) + 0.22100 * log10(height)) - 450
 *
 * All measurements in centimetres.
 */

(function () {

    // ─── DOM References ───────────────────────────────────────────
    const form = document.getElementById('bfForm');
    const genderSel = document.getElementById('bfGender');
    const hipGroup = document.getElementById('bfHipGroup');
    const resultWrap = document.getElementById('bfResult');
    const resultCard = document.getElementById('bfResultCard');
    const bfValue = document.getElementById('bfValue');
    const bfCategory = document.getElementById('bfCategory');
    const bfDesc = document.getElementById('bfDescription');
    const bfInfoTable = document.getElementById('bfInfoTable');
    const bfRefItems = document.getElementById('bfRefItems');

    // ─── Body fat category tables ─────────────────────────────────
    const categoriesMale = [
        { max: 6, label: 'Essential Fat', desc: 'Minimum fat required for basic physiological functions. Not sustainable long-term.', cls: 'underweight' },
        { max: 14, label: 'Athletic', desc: 'Very low body fat typical of competitive athletes and bodybuilders.', cls: 'normal' },
        { max: 18, label: 'Fitness', desc: 'Excellent body composition. Lean, defined muscles with good cardiovascular health.', cls: 'normal' },
        { max: 25, label: 'Average', desc: 'Acceptable range for general health, though some reduction may improve fitness markers.', cls: 'overweight' },
        { max: Infinity, label: 'Obese', desc: 'High body fat associated with increased health risks. Diet and exercise intervention recommended.', cls: 'obese' }
    ];

    const categoriesFemale = [
        { max: 14, label: 'Essential Fat', desc: 'Below healthy minimum for women, which includes reproductive fat stores.', cls: 'underweight' },
        { max: 21, label: 'Athletic', desc: 'Very lean — typical of female athletes and those in intense training programs.', cls: 'normal' },
        { max: 25, label: 'Fitness', desc: 'Excellent body composition for women. Fit and healthy with good muscle definition.', cls: 'normal' },
        { max: 32, label: 'Average', desc: 'Acceptable health range for most women. Some reduction can improve fitness markers.', cls: 'overweight' },
        { max: Infinity, label: 'Obese', desc: 'High body fat associated with elevated health risks. Gradual diet and exercise changes recommended.', cls: 'obese' }
    ];

    // ─── Show/hide hip field based on gender ──────────────────────
    genderSel.addEventListener('change', function () {
        hipGroup.style.display = (this.value === 'female') ? 'block' : 'none';
    });

    // ─── Form Submit ──────────────────────────────────────────────
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        clearErrors();

        const gender = genderSel.value;
        const height = parseFloat(document.getElementById('bfHeight').value);
        const neck = parseFloat(document.getElementById('bfNeck').value);
        const waist = parseFloat(document.getElementById('bfWaist').value);
        const hip = parseFloat(document.getElementById('bfHip').value);

        let valid = true;

        // Validation
        if (!gender) {
            showError('errBfGender', genderSel);
            valid = false;
        }
        if (isNaN(height) || height < 100 || height > 250) {
            showError('errBfHeight', document.getElementById('bfHeight'));
            valid = false;
        }
        if (isNaN(neck) || neck < 20 || neck > 70) {
            showError('errBfNeck', document.getElementById('bfNeck'));
            valid = false;
        }
        if (isNaN(waist) || waist < 40 || waist > 200) {
            showError('errBfWaist', document.getElementById('bfWaist'));
            valid = false;
        }
        if (gender === 'female' && (isNaN(hip) || hip < 50 || hip > 200)) {
            showError('errBfHip', document.getElementById('bfHip'));
            valid = false;
        }
        // Navy formula requires waist > neck (male) or waist+hip > neck (female)
        if (valid && gender === 'male' && waist <= neck) {
            showError('errBfWaist', document.getElementById('bfWaist'));
            document.getElementById('errBfWaist').textContent = 'Waist must be larger than neck measurement';
            valid = false;
        }

        if (!valid) return;

        // ─── Calculate ────────────────────────────────────────────
        let bf;
        if (gender === 'male') {
            // U.S. Navy male formula
            const logDiff = Math.log10(waist - neck);
            const logHeight = Math.log10(height);
            bf = 495 / (1.0324 - 0.19077 * logDiff + 0.15456 * logHeight) - 450;
        } else {
            // U.S. Navy female formula
            const logSum = Math.log10(waist + hip - neck);
            const logHeight = Math.log10(height);
            bf = 495 / (1.29579 - 0.35004 * logSum + 0.22100 * logHeight) - 450;
        }

        // Clamp to realistic range
        bf = Math.min(Math.max(bf, 3), 65);
        displayResult(bf, gender, height, neck, waist, hip);
    });

    // ─── Display Result ───────────────────────────────────────────
    function displayResult(bf, gender, height, neck, waist, hip) {
        const rounded = bf.toFixed(1);
        const categories = gender === 'male' ? categoriesMale : categoriesFemale;

        // Find category
        let cat = categories[categories.length - 1];
        for (let i = 0; i < categories.length; i++) {
            if (bf < categories[i].max) {
                cat = categories[i];
                break;
            }
        }

        // Update card
        bfValue.textContent = rounded + '%';
        bfCategory.textContent = cat.label;
        bfDesc.textContent = cat.desc;
        resultCard.className = 'result-card ' + cat.cls;

        // Info table
        const leanMass = 100 - bf;
        bfInfoTable.innerHTML = `
      <div class="info-row">
        <div class="label">Body Fat</div>
        <div class="value">${rounded}%</div>
      </div>
      <div class="info-row">
        <div class="label">Lean Mass</div>
        <div class="value">${leanMass.toFixed(1)}%</div>
      </div>
      <div class="info-row">
        <div class="label">Category</div>
        <div class="value">${cat.label}</div>
      </div>
      <div class="info-row">
        <div class="label">Height</div>
        <div class="value">${height} cm</div>
      </div>
    `;

        // Reference guide
        const dotColors = { 'underweight': 'var(--clr-info)', 'normal': 'var(--clr-accent)', 'overweight': 'var(--clr-warning)', 'obese': 'var(--clr-danger)' };
        bfRefItems.innerHTML = categories.map(function (c) {
            const maxLabel = c.max === Infinity ? '+' : ('< ' + c.max + '%');
            return `
        <div class="bmi-ref-item">
          <div class="bmi-ref-dot" style="background:${dotColors[c.cls]}"></div>
          <span><strong>${c.label}</strong> — ${maxLabel}</span>
        </div>
      `;
        }).join('');

        // Show result
        resultWrap.classList.add('show');
        resultWrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // ─── Helpers ──────────────────────────────────────────────────
    function showError(errId, inputEl) {
        const errEl = document.getElementById(errId);
        if (errEl) errEl.classList.add('show');
        if (inputEl) inputEl.classList.add('error');
    }

    function clearErrors() {
        document.querySelectorAll('.form-error').forEach(function (el) {
            el.classList.remove('show');
        });
        // Reset error text for waist
        const waistErr = document.getElementById('errBfWaist');
        if (waistErr) waistErr.textContent = 'Enter waist measurement (40–200 cm)';
        document.querySelectorAll('#bfForm .form-input, #bfForm .form-select').forEach(function (el) {
            el.classList.remove('error');
        });
    }

})();
