# FitForge 💪

### A Modern Fitness Training & Workout Tracking Platform

![Python](https://img.shields.io/badge/Python-3.x-blue)
![Flask](https://img.shields.io/badge/Flask-Web%20Framework-green)
![License](https://img.shields.io/badge/License-MIT-yellow)
![Status](https://img.shields.io/badge/Status-Active-brightgreen)

**FitForge** is a full-featured fitness web platform designed to help users build workouts, explore exercises, track progress, and analyze training data.

The project combines **workout planning, exercise libraries, analytics, and nutrition guidance** into a single web application — functioning as a lightweight alternative to training apps like **Hevy** or **Strong**.

---

# 🚀 Live Demo

If deployed on Render:

```
https://fitforge.onrender.com
```

---

# ✨ Features

## 🧮 Fitness Calculators

Quick health estimation tools.

* **BMI Calculator**
* **Body Fat Percentage Calculator**

Provides instant results using scientifically accepted formulas.

---

## 🏋️ Exercise Library

A large exercise database organized by:

* Muscle group
* Equipment type
* Training style

Supported equipment:

* Barbell
* Dumbbells
* Machines
* Cables
* Resistance Bands
* Kettlebells
* Bodyweight

Users can browse exercises and add them directly to workout routines.

---

## 🤸 Calisthenics Training Section

Bodyweight exercises categorized by difficulty:

* Beginner
* Intermediate
* Advanced

Includes progressions inspired by calisthenics systems such as:

* Pull-up progressions
* Push-up progressions
* Advanced bodyweight strength movements

---

## 🧠 Workout Generator

Automatically generates structured workouts based on:

* Training goals
* Experience level
* Muscle groups
* Available equipment

Example goals:

* Strength
* Hypertrophy
* General fitness
* Calisthenics progression

---

## 📋 Routine Builder

Users can create **unlimited custom routines**.

Features include:

* Add exercises from the exercise library
* Log sets, reps, and weight
* Track workout progress
* Modify routines anytime

Supported set types:

* Warm-up sets
* Normal sets
* Drop sets
* Supersets
* Failure sets

---

## 📊 Training Analytics

Track workout activity and training patterns.

Analytics include:

* Most trained muscle groups
* Most frequent exercises
* Workout statistics

This helps users analyze and optimize their training.

---

## 🥗 Nutrition Guide

A basic nutrition reference section with foods ideal for:

* Muscle gain
* Fat loss
* General fitness

Includes macronutrient insights and food recommendations.

---

## 👤 User Accounts

FitForge supports **multi-user authentication**.

Users can:

* Sign up with username and password
* Log in securely
* Access personal routines and workout history
* View their own analytics

Each user’s data is isolated using `user_id` to ensure privacy.

---

# 🧰 Tech Stack

## Backend

* **Python**
* **Flask**

## Frontend

* HTML
* CSS
* JavaScript

## Database

* SQLite

## Deployment

* Gunicorn
* Render

---

# 📂 Project Structure

```
FITFORGE
│
├── app.py                # Main Flask application
├── database.py           # Database logic
├── generate_dataset.py   # Exercise dataset generator
├── requirements.txt      # Python dependencies
│
├── data/                 # Exercise datasets
│
├── templates/            # HTML templates
│   ├── login.html
│   ├── signup.html
│   ├── workout.html
│   └── routines.html
│
├── static/               # CSS, JS, images
│
└── fitforge.db           # SQLite database
```

---

# ⚙️ Local Installation

### 1️⃣ Clone the repository

```
git clone https://github.com/a23110/FITFORGE.git
cd FITFORGE
```

---

### 2️⃣ Create a virtual environment

```
python -m venv venv
```

Activate it:

**Windows**

```
venv\Scripts\activate
```

**Mac/Linux**

```
source venv/bin/activate
```

---

### 3️⃣ Install dependencies

```
pip install -r requirements.txt
```

---

### 4️⃣ Run the application

```
python app.py
```

Open:

```
http://127.0.0.1:5000
```

---

# 🌍 Deployment

The application can be deployed using **Render**.

### Build Command

```
pip install -r requirements.txt
```

### Start Command

```
gunicorn app:app
```


# 🔒 Security

Security measures implemented:

* Password hashing using `werkzeug.security`
* Session-based authentication
* User data isolation using `user_id`

Each user only sees their own routines, workouts, and analytics.



# 📈 Future Improvements

Planned improvements include:

* 📅 Workout calendar & streak tracking
* 📊 Progress graphs
* 🎥 Exercise demonstration videos
* 📱 Mobile-first UI
* 👥 Social training sharing



# 📜 License

This project is licensed under the **MIT License**.



# 👨‍💻 Author

**Armaan Sadat**

GitHub
https://github.com/a23110


