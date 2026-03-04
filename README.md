# 💪 FitForge — Fitness Website

A complete, fully functional fitness website built with **HTML + CSS + Vanilla JS** on the front end and **Python Flask** on the back end. No frameworks, no build tools — just run one command and you're live.

---

## 🚀 Quick Start

### Prerequisites
- Python 3.8 or later  
- `pip` (Python package manager)

### 1. Install dependencies
```bash
pip install -r requirements.txt
```

### 2. Run the server
```bash
python app.py
```

### 3. Open in your browser
```
http://127.0.0.1:5000
```

---

## 📁 Project Structure

```
FITNESS WEBSITE/
├── app.py                     # Flask server — routes + API endpoints
├── requirements.txt           # Python dependencies (Flask, flask-cors)
├── README.md
│
├── data/
│   ├── exercises.json         # 35+ exercises with full metadata
│   ├── nutrition.json         # Foods organized by 4 categories
│   └── workout_rules.json     # Rule matrix for workout plan generation
│
├── static/
│   ├── css/
│   │   ├── main.css           # Design system: variables, nav, footer, utilities
│   │   ├── home.css           # Home page hero + feature cards
│   │   ├── calculators.css    # BMI + body fat calculator styles
│   │   ├── exercises.css      # Exercise library card grid + filters
│   │   ├── workout.css        # Workout generator form + plan output
│   │   └── nutrition.css      # Nutrition tabs + food cards
│   ├── js/
│   │   ├── nav.js             # Mobile hamburger menu toggle
│   │   ├── bmi.js             # BMI calculator (metric + imperial)
│   │   ├── bodyfat.js         # Body fat calculator (U.S. Navy formula)
│   │   ├── exercises.js       # Exercise library — fetch, filter, render
│   │   ├── workout.js         # Workout generator — API call + plan render
│   │   └── nutrition.js       # Nutrition guide — tabs + food cards
│   └── images/                # Image assets (extendable)
│
└── templates/
    ├── index.html             # Home page
    ├── calculators.html       # BMI + Body Fat calculators
    ├── exercises.html         # Exercise library
    ├── workout.html           # Workout generator
    └── nutrition.html         # Nutrition guide
```

---

## 🌟 Features

| Feature | Details |
|---|---|
| **BMI Calculator** | Metric & Imperial support. Color-coded result (Underweight / Normal / Overweight / Obese) with animated scale marker. |
| **Body Fat Estimator** | U.S. Navy circumference formula. Gender-specific (male/female). Category classification. |
| **Exercise Library** | 35+ exercises across 6 muscle groups. Filter by muscle group, difficulty, or search by name/keyword. |
| **Workout Generator** | Select goal (Muscle Gain / Fat Loss / Strength), level (Beginner / Intermediate / Advanced), days/week (3–5), and focus muscle groups. Generates a full week plan with sets/reps/rest. |
| **Nutrition Guide** | 4 food categories: Muscle Gain, Fat Loss, High Protein Vegetarian, Budget Friendly — with protein, calories, benefits, and best-time-to-eat for every food. |

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/exercises` | All exercises. Filter: `?muscle_group=Chest&difficulty=Beginner` |
| `GET` | `/api/nutrition` | All nutrition data. Filter: `?category=muscle_gain` |
| `POST` | `/api/workout` | Generate plan. Body: `{ goal, level, days, muscle_groups }` |

### Example: Generate a workout plan
```bash
curl -X POST http://127.0.0.1:5000/api/workout \
  -H "Content-Type: application/json" \
  -d '{"goal": "fat_loss", "level": "beginner", "days": 3, "muscle_groups": []}'
```

---

## 🔧 Extending the Database

### Adding new exercises
Open `data/exercises.json` and append an entry following this schema:
```json
{
  "id": 36,
  "name": "Your Exercise Name",
  "muscle_group": "Chest",          
  "equipment": "Dumbbells",
  "difficulty": "Beginner",
  "instructions": "Step-by-step instructions here.",
  "sets": "3",
  "reps": "10-12",
  "image": "/static/images/your-image.svg"
}
```
Valid `muscle_group` values: `Chest`, `Back`, `Shoulders`, `Arms`, `Legs`, `Core`  
Valid `difficulty` values: `Beginner`, `Intermediate`, `Advanced`

### Adding new foods
Open `data/nutrition.json` and add to one of the four arrays:
```json
{
  "name": "Food Name",
  "protein_g": 25,
  "calories_per_100g": 200,
  "benefits": "Why this food is great for your goal.",
  "best_time": "Post-workout"
}
```

### Migrating to a real database (SQLite)
1. Install `flask-sqlalchemy`: `pip install flask-sqlalchemy`
2. Define models in `app.py` mirroring the JSON structures
3. Seed from the existing JSON files on first run
4. Replace `load_json()` calls with SQLAlchemy queries

---

## 🎨 Customization

- **Colors**: All colors are CSS variables in `static/css/main.css` under `:root`. Change `--clr-accent` to rebrand the entire site instantly.
- **Fonts**: The Inter font import is at the top of `main.css`. Swap it for any Google Font.
- **Adding pages**: Create a new template in `templates/`, add a Flask route in `app.py`, and add a nav link in all templates.

---

## 🛡️ Disclaimer
The BMI and body fat calculators are informational tools only. Consult a healthcare professional for medical advice.
