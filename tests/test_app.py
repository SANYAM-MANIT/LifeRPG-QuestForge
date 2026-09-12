import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db
from app.seed_data import seed_database_items
from app.progression import get_xp_for_level, get_streak_multiplier, apply_xp_and_level_up
from app.models import User

# Test Database in-memory SQLite
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_life_rpg.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

@pytest.fixture(autouse=True, scope="module")
def setup_database():
    Base.metadata.create_all(bind=engine)
    with TestingSessionLocal() as db:
        seed_database_items(db)
    yield
    Base.metadata.drop_all(bind=engine)

def test_progression_math():
    # Non-linear XP scaling check
    xp_lvl_1 = get_xp_for_level(1)
    xp_lvl_2 = get_xp_for_level(2)
    xp_lvl_5 = get_xp_for_level(5)
    
    assert xp_lvl_1 == 100
    assert xp_lvl_2 > xp_lvl_1
    assert xp_lvl_5 > xp_lvl_2
    assert xp_lvl_5 == int(100 * (5 ** 1.4))

    # Streak multipliers
    assert get_streak_multiplier(1) == 1.0
    assert get_streak_multiplier(5) == 1.1
    assert get_streak_multiplier(10) == 1.25
    assert get_streak_multiplier(20) == 1.4

def test_auth_and_user_creation():
    # Signup
    signup_res = client.post("/api/auth/signup", json={
        "username": "student_hero",
        "email": "hero@example.com",
        "password": "password123"
    })
    assert signup_res.status_code == 201
    data = signup_res.json()
    assert "access_token" in data
    assert data["user"]["username"] == "student_hero"
    assert data["user"]["level"] == 1
    assert data["user"]["gold"] == 100

    # Login
    login_res = client.post("/api/auth/login", json={
        "username_or_email": "student_hero",
        "password": "password123"
    })
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]

    # Profile Me
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert len(me_res.json()["attributes"]) == 6

def test_quest_crud_and_progression():
    # Login
    login_res = client.post("/api/auth/login", json={
        "username_or_email": "student_hero",
        "password": "password123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create Quest
    quest_res = client.post("/api/quests", headers=headers, json={
        "title": "Study Binary Search Trees",
        "description": "Solve 3 medium tree problems",
        "category": "Study",
        "difficulty": "Hard",
        "attribute_target": "Intellect",
        "recurrence": "daily"
    })
    assert quest_res.status_code == 201
    quest_id = quest_res.json()["id"]

    # Complete Quest
    complete_res = client.post(f"/api/quests/{quest_id}/complete", headers=headers)
    assert complete_res.status_code == 200
    complete_data = complete_res.json()
    assert complete_data["xp_gained"] >= 100
    assert complete_data["boss_damage_dealt"] == 90
    assert complete_data["attribute_name"] == "Intellect"

def test_shop_and_inventory():
    login_res = client.post("/api/auth/login", json={
        "username_or_email": "student_hero",
        "password": "password123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Get Shop items
    items_res = client.get("/api/shop/items")
    assert items_res.status_code == 200
    items = items_res.json()
    assert len(items) > 0

    potion = next((i for i in items if i["item_type"] == "potion"), items[0])
    
    # Buy Item
    buy_res = client.post(f"/api/shop/buy/{potion['id']}", headers=headers)
    assert buy_res.status_code == 200
    inv_id = buy_res.json()["id"]

    # Consume Item
    use_res = client.post(f"/api/shop/use/{inv_id}", headers=headers)
    assert use_res.status_code == 200
    assert use_res.json()["success"] is True

def test_boss_battle_raid():
    login_res = client.post("/api/auth/login", json={
        "username_or_email": "student_hero",
        "password": "password123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Get Boss
    boss_res = client.get("/api/boss", headers=headers)
    assert boss_res.status_code == 200
    boss = boss_res.json()
    assert "boss_name" in boss
    assert boss["max_hp"] > 0
