from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, BossBattle
from app.schemas import BossBattleOut
from app.auth import get_current_user

router = APIRouter(prefix="/api/boss", tags=["Boss Dungeons"])

BOSS_TIERS = [
    {
        "name": "Procrastination Drake",
        "title": "Scourge of the Unfinished Tasks",
        "max_hp": 400,
        "avatar": "dragon",
        "reward_gold": 250,
        "reward_gems": 15,
        "reward_xp": 350
    },
    {
        "name": "The Distraction Gorgon",
        "title": "Stoner of Deep Focus",
        "max_hp": 750,
        "avatar": "skull",
        "reward_gold": 450,
        "reward_gems": 25,
        "reward_xp": 600
    },
    {
        "name": "Burnout Colossus",
        "title": "Titan of Mental Fatigue",
        "max_hp": 1200,
        "avatar": "flame",
        "reward_gold": 800,
        "reward_gems": 50,
        "reward_xp": 1000
    }
]

@router.get("", response_model=BossBattleOut)
def get_current_boss(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    boss = db.query(BossBattle).filter(
        BossBattle.user_id == current_user.id
    ).order_by(BossBattle.id.desc()).first()

    if not boss:
        # Create first boss
        tier_data = BOSS_TIERS[0]
        boss = BossBattle(
            user_id=current_user.id,
            boss_name=tier_data["name"],
            boss_title=tier_data["title"],
            max_hp=tier_data["max_hp"],
            current_hp=tier_data["max_hp"],
            avatar=tier_data["avatar"],
            reward_gold=tier_data["reward_gold"],
            reward_gems=tier_data["reward_gems"],
            reward_xp=tier_data["reward_xp"],
            is_defeated=False
        )
        db.add(boss)
        db.commit()
        db.refresh(boss)

    return boss

@router.post("/respawn", response_model=BossBattleOut)
def summon_next_boss(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Count defeated bosses to determine next tier
    defeated_count = db.query(BossBattle).filter(
        BossBattle.user_id == current_user.id,
        BossBattle.is_defeated == True
    ).count()

    tier_idx = (defeated_count) % len(BOSS_TIERS)
    tier_data = BOSS_TIERS[tier_idx]
    
    # Scale multiplier based on defeated cycles
    multiplier = 1.0 + (defeated_count // len(BOSS_TIERS)) * 0.5
    hp_scaled = int(tier_data["max_hp"] * multiplier)

    new_boss = BossBattle(
        user_id=current_user.id,
        boss_name=f"{tier_data['name']} (Tier {defeated_count + 1})",
        boss_title=tier_data["title"],
        max_hp=hp_scaled,
        current_hp=hp_scaled,
        avatar=tier_data["avatar"],
        reward_gold=int(tier_data["reward_gold"] * multiplier),
        reward_gems=int(tier_data["reward_gems"] * multiplier),
        reward_xp=int(tier_data["reward_xp"] * multiplier),
        is_defeated=False
    )
    db.add(new_boss)
    db.commit()
    db.refresh(new_boss)
    return new_boss
