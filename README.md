# ⚔️ Life RPG - Turn Daily Tasks into an Epic Progression System

[![Python 3.9+](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688.svg)](https://fastapi.tiangolo.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Life RPG** is a full-stack gamified productivity web platform that solves the "delayed gratification" dilemma of real-world tasks. By translating daily study sessions, workouts, and habits into immediate Experience Points (XP), Gold, Character Attribute upgrades, and Boss Monster Raid Strikes, Life RPG turns mundane productivity into an engaging role-playing experience.

---

## 🌟 Key Features

### 1. 🛡️ User Authentication & Security
- Secure signup and login with hashed passwords (`bcrypt`) and JWT (JSON Web Tokens).
- Strict user data isolation: users only see and modify their personal quests, stats, and inventory.
- Real SQLite/PostgreSQL relational database persistence (no mock or `localStorage`-only data).

### 2. ⚡ Non-Linear RPG Progression Engine
- Dynamic non-linear leveling curve:
  $$\text{XP Required for Level } L = \lfloor 100 \times L^{1.4} \rfloor$$
- Server-side validation for all reward calculations to prevent stat cheating.
- Celebratory Level-Up fanfare modal with automatic HP recovery, maximum HP boosts, and reward drops.

### 3. 📊 Character Attributes (Stats)
- Real-world tasks boost specific character stats:
  - **Strength**: Fitness, gym workouts, sports, physical discipline.
  - **Intellect**: Coding, reading books, studying algorithms, logic.
  - **Vitality**: Sleep, hydration, healthy meals, wellness.
  - **Agility**: Quick chores, errands, speed tasks.
  - **Charisma**: Networking, presentations, social activities.
  - **Focus**: Deep work blocks, meditation, distraction-free studying.

### 4. 🔥 Daily Streaks & Multipliers
- Daily consecutive activity tracking.
- Streak bonuses scaling up to **$1.5\times$** on all XP and Gold rewards.
- **Streak Guardian Shield** item available in the Bazaar to prevent streak resets.

### 5. 🪙 Economy, Shop & Inventory
- Earn Gold and Gems by conquering quests.
- Spend currency in the **Adventurer's Bazaar** on:
  - **Equippable Gear**: Swords, Spellbooks, Hourglasses, and Cloaks boosting character stats.
  - **Consumables**: Health Potions, Elixirs, Scrolls of Insight.
  - **Cosmetics & Badges**: Unlockable prestige titles and themes.

### 6. 🐲 Dungeon Boss Raids
- Battle epic monsters (e.g. *Procrastination Drake*, *The Distraction Gorgon*).
- Completing tasks automatically unleashes tactical strikes against the active raid boss.
- Slaying bosses grants massive XP, Gold, and rare Gems.

### 7. 🎮 Alive, Tactile & Celebratory UX
- **Synthesized 8-Bit Audio (Web Audio API)**: Zero-latency sound effects for quest completions, coins, level-ups, and error alerts with a mute toggle.
- **Micro-Interactions**: Floating combat numbers (`+60 XP`, `+25 Gold`), canvas confetti explosions, and responsive glowing UI cards.
- **Keyboard Shortcuts**:
  - `N`: Quick-open Forge Quest modal.
  - `1 - 5`: Switch between tabs (Quests, Attributes, Shop, Boss, Chronicle).
  - `Esc`: Close any active dialog or modal.

---

## 🛠️ Architecture & Tech Stack

```
life-rpg/
├── app/
│   ├── config.py             # Environment configurations
│   ├── database.py           # SQLAlchemy database session & engine
│   ├── models.py             # Relational Database Models (User, Quest, Attribute, ShopItem, etc.)
│   ├── schemas.py            # Pydantic v2 validation models
│   ├── auth.py               # Password hashing & JWT token validation
│   ├── progression.py        # Non-linear leveling formulas & reward math
│   ├── seed_data.py          # Starter quests & shop items catalog
│   ├── routers/              # Modular API endpoints
│   │   ├── auth_router.py
│   │   ├── quest_router.py
│   │   ├── character_router.py
│   │   ├── shop_router.py
│   │   └── boss_router.py
│   └── main.py               # FastAPI application entrypoint & static mount
├── static/                   # Tactical Single Page Application
│   ├── css/style.css         # Dark fantasy styling, animations, floating text
│   ├── js/sound.js           # Web Audio API 8-bit sound synthesizer
│   ├── js/api.js             # REST API Client wrapper with JWT interceptor
│   ├── js/app.js             # Reactive UI controller & micro-interactions
│   └── index.html            # Semantic, accessible HTML5 SPA interface
├── tests/
│   └── test_app.py           # Automated unit & integration tests
├── Dockerfile                # Production container deployment
├── render.yaml               # Render 1-click deployment Blueprint
├── Procfile                  # Railway / Heroku process configuration
├── requirements.txt          # Python dependencies
└── .env.example              # Environment variables template
```

---

## 🚀 Getting Started Locally

### Prerequisites
- Python 3.9 or higher
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/life-rpg.git
cd life-rpg
```

### 2. Create and Activate Virtual Environment
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Setup Environment Variables
```bash
cp .env.example .env
```

### 5. Run the Application
```bash
uvicorn app.main:app --reload --port 8000
```
Open your browser and navigate to **`http://localhost:8000`**.
Interactive API documentation is available at **`http://localhost:8000/docs`**.

### 6. Run Automated Tests
```bash
PYTHONPATH=. pytest tests/
```

---

## 🌐 Live Deployment Guide

### Option A: 1-Click Deploy on Render (Recommended)
1. Push your repository to GitHub.
2. Sign in to [Render](https://render.com).
3. Click **New +** $\rightarrow$ **Web Service** and connect your GitHub repo.
4. Set:
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Click **Deploy Web Service**. Your app is live with an SSL HTTPS URL!

### Option B: Deploy on Railway
1. Sign in to [Railway.app](https://railway.app).
2. Click **New Project** $\rightarrow$ **Deploy from GitHub repo**.
3. Railway automatically detects the `Procfile` / `Dockerfile` and deploys the app in seconds.

---

## 📹 Video Walkthrough Outline (90–180 Seconds)

1. **[0:00 - 0:20] User Signup & Login**: Create a hero account; demonstrate JWT token issuance and initial status bars (HP, XP, Gold, Streak).
2. **[0:20 - 0:45] Quest Creation & CRUD**: Create a custom Quest (e.g. *Learn Dynamic Programming*, Difficulty: *Hard*, Attribute: *Intellect*).
3. **[0:45 - 1:15] Quest Completion & Level-Up**: Complete quests; highlight the 8-bit sound effects, floating `+XP / +Gold` combat numbers, Boss damage, and trigger the Level-Up celebration modal with confetti fireworks.
4. **[1:15 - 1:40] Shop & Inventory**: Visit the Bazaar, buy an item (e.g. *Archmage Spellbook* or *Health Potion*), equip it, and show the inventory state update.
5. **[1:40 - 2:00] Database Persistence Verification**: Refresh the browser page (`F5`) to prove that all data, stats, inventory, and completed quests persist directly in the backend database.

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
