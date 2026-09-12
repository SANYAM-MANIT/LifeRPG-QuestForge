# ⚔️ Life RPG - Gamify Your Studies & Habits

> **Project by**: Sanyam Jain & Vedik Bandi  
> **Institute**: Maulana Azad National Institute of Technology (MANIT), Bhopal  
> **Tech Stack**: Python (FastAPI), SQLite / SQLAlchemy, Tailwind CSS, Web Audio API

A full-stack web application built to solve the delayed-gratification problem of student life by turning real-world tasks (coding, study sessions, gym workouts, habits) into an interactive RPG progression game.

---

## 💡 About The Project
As students, we often struggle with procrastination because real-world rewards take weeks or months to show up (like studying for end-sem exams or working out). Video games solve this with immediate feedback loops: $+50\text{ XP}$, level-up fanfare, and loot. 

**Life RPG** bridges this gap by turning your daily to-do list into a role-playing adventure with non-linear leveling math, 6 core character attributes, an in-game item shop, and dungeon boss battles.

---

## 🚀 Key Systems & Features

### 1. 🛡️ User Authentication & Session Security
- User signup and login with secure password hashing (`bcrypt`) and JWT (JSON Web Tokens).
- Real SQLite relational database persistence on the backend (not mock or `localStorage`-only data).
- Strict user isolation: users only access and modify their own quests and inventory.

### 2. ⚡ Non-Linear RPG Progression Engine
- Dynamic non-linear leveling formula calculated strictly on the backend to prevent client-side cheating:
  $$\text{XP Required for Level } L = \lfloor 100 \times L^{1.4} \rfloor$$
- Full HP heal, maximum HP increase ($+10$), and bonus gold awarded on every Level-Up.
- Celebratory Level-Up fanfare modal with canvas confetti fireworks.

### 3. 📊 6 Character Attributes
- Categorized real-life tasks level up specific character stats:
  - **Intellect**: Coding, algorithms, reading textbooks, problem solving.
  - **Strength**: Gym workouts, cardio, physical fitness.
  - **Vitality**: Sleep schedule, hydration, nutrition, recovery.
  - **Agility**: Fast daily chores, quick responsiveness, errands.
  - **Charisma**: Presentations, group projects, networking.
  - **Focus**: Deep work blocks, no-distraction study sessions.

### 4. 🔥 Daily Streaks & Multipliers
- Tracks consecutive days of activity.
- Active streaks award a progressive multiplier (up to $1.6\times$) on XP and Gold earnings.
- Streak Guardian Shield available in the shop to protect against accidental streak resets.

### 5. 🪙 Adventurer's Bazaar (Shop & Inventory)
- Earn Gold and Gems by conquering quests.
- Buy equippable weapons, spellbooks, health potions, streak shields, and titles.
- Equip gear in your inventory to customize your hero loadout.

### 6. 🐲 Dungeon Boss Raids
- Battle raid bosses (e.g. *Procrastination Drake*, *The Distraction Gorgon*).
- Completing tasks automatically unleashes tactical strikes against the boss.
- Defeating bosses grants rare gems, gold pouches, and legendary loot drops.

### 7. 🔊 Tactile Web Audio SFX & UI
- Synthesized 8-bit retro sound effects using the native Web Audio API (quest complete chime, coin clink, level-up fanfare, hit impact, error buzz).
- Floating combat damage numbers (`+100 XP`, `+45 Gold`).
- Responsive layout across Mobile, Tablet, and Desktop.
- Keyboard shortcuts: `N` (Forge Quest), `1-5` (Switch Tabs), `Esc` (Close Modals).

---

## 🛠️ Tech Stack

- **Backend**: Python 3.9+, FastAPI, Uvicorn
- **Database**: SQLite, SQLAlchemy ORM
- **Auth & Security**: Passlib (Bcrypt), PyJWT, Pydantic v2
- **Frontend**: HTML5, Tailwind CSS, Lucide Icons, Canvas Confetti
- **Audio**: Web Audio API (Synthesized 8-bit Audio)
- **Testing**: Pytest, HTTPX

---

## 📁 Project Structure

```
life-rpg/
├── app/
│   ├── config.py             # Environment configurations
│   ├── database.py           # SQLAlchemy session and engine
│   ├── models.py             # Relational Database Models (User, Quest, Attribute, Item, Boss)
│   ├── schemas.py            # Pydantic v2 schemas
│   ├── auth.py               # Bcrypt hashing & JWT token validation
│   ├── progression.py        # Non-linear leveling logic & streak math
│   ├── seed_data.py          # Starter quests & shop catalog
│   ├── routers/              # REST API Routes
│   │   ├── auth_router.py
│   │   ├── quest_router.py
│   │   ├── character_router.py
│   │   ├── shop_router.py
│   │   └── boss_router.py
│   └── main.py               # FastAPI app entrypoint & static mount
├── static/
│   ├── css/style.css         # Dark fantasy styling & animations
│   ├── js/sound.js           # 8-bit Web Audio synthesizer
│   ├── js/api.js             # REST API Client wrapper
│   ├── js/app.js             # Reactive Single Page App controller
│   └── index.html            # Responsive HTML5 UI & Student Landing Page
├── tests/
│   └── test_app.py           # Automated unit test suite
├── Dockerfile                # Docker container build
├── render.yaml               # Render 1-click deploy blueprint
├── Procfile                  # Railway / Heroku process definition
├── requirements.txt          # Python dependencies
├── .env.example              # Environment variables template
├── demo_walkthrough_script.md# Step-by-step 90-180s video guide
└── README.md
```

---

## 🏃‍♂️ Running Locally

1. **Clone & Enter the project:**
   ```bash
   git clone https://github.com/your-username/life-rpg.git
   cd life-rpg
   ```

2. **Create and activate a virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate   # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Start the FastAPI server:**
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   Open **`http://localhost:8000`** in your web browser.
   Interactive API documentation is live at **`http://localhost:8000/docs`**.

5. **Run automated tests:**
   ```bash
   PYTHONPATH=. pytest tests/
   ```

---

## 🌐 Live Deployment Instructions

### Free Deploy on Render:
1. Push this repository to GitHub.
2. Log in to [Render](https://render.com) and click **New +** $\rightarrow$ **Web Service**.
3. Select your GitHub repository.
4. Set Build Command to `pip install -r requirements.txt` and Start Command to `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
5. Click **Deploy Web Service** to get your live public URL!

---

## 📜 Evaluation & Video Script
A complete 90–180 second screen recording demonstration script is available in [`demo_walkthrough_script.md`](./demo_walkthrough_script.md).
