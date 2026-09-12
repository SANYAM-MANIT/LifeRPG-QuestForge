from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models import User, Quest, Attribute, BossBattle, ActivityLog
from app.schemas import QuestCreate, QuestUpdate, QuestOut, QuestCompleteResponse
from app.auth import get_current_user
from app.progression import (
    DIFFICULTY_REWARDS,
    get_streak_multiplier,
    process_streak_update,
    apply_xp_and_level_up,
    apply_attribute_xp
)

router = APIRouter(prefix="/api/quests", tags=["Quests"])

@router.get("", response_model=List[QuestOut])
def get_quests(
    status_filter: str = Query("all", enum=["all", "active", "completed"]),
    category: Optional[str] = None,
    difficulty: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Quest).filter(Quest.user_id == current_user.id)
    
    if status_filter == "active":
        query = query.filter(Quest.is_completed == False)
    elif status_filter == "completed":
        query = query.filter(Quest.is_completed == True)
        
    if category and category != "all":
        query = query.filter(Quest.category == category)
        
    if difficulty and difficulty != "all":
        query = query.filter(Quest.difficulty == difficulty)
        
    return query.order_by(Quest.is_completed.asc(), Quest.created_at.desc()).all()

@router.post("", response_model=QuestOut, status_code=status.HTTP_201_CREATED)
def create_quest(
    quest_data: QuestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    diff = quest_data.difficulty if quest_data.difficulty in DIFFICULTY_REWARDS else "Medium"
    rewards = DIFFICULTY_REWARDS[diff]

    new_quest = Quest(
        user_id=current_user.id,
        title=quest_data.title.strip(),
        description=quest_data.description or "",
        category=quest_data.category or "General",
        difficulty=diff,
        xp_reward=rewards["xp"],
        gold_reward=rewards["gold"],
        attribute_target=quest_data.attribute_target or "Intellect",
        recurrence=quest_data.recurrence or "once",
        due_date=quest_data.due_date or ""
    )
    db.add(new_quest)
    db.commit()
    db.refresh(new_quest)
    return new_quest

@router.put("/{quest_id}", response_model=QuestOut)
def update_quest(
    quest_id: int,
    quest_data: QuestUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    quest = db.query(Quest).filter(Quest.id == quest_id, Quest.user_id == current_user.id).first()
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")

    if quest_data.title is not None:
        quest.title = quest_data.title.strip()
    if quest_data.description is not None:
        quest.description = quest_data.description
    if quest_data.category is not None:
        quest.category = quest_data.category
    if quest_data.difficulty is not None and quest_data.difficulty in DIFFICULTY_REWARDS:
        quest.difficulty = quest_data.difficulty
        quest.xp_reward = DIFFICULTY_REWARDS[quest.difficulty]["xp"]
        quest.gold_reward = DIFFICULTY_REWARDS[quest.difficulty]["gold"]
    if quest_data.attribute_target is not None:
        quest.attribute_target = quest_data.attribute_target
    if quest_data.recurrence is not None:
        quest.recurrence = quest_data.recurrence
    if quest_data.due_date is not None:
        quest.due_date = quest_data.due_date

    db.commit()
    db.refresh(quest)
    return quest

@router.delete("/{quest_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_quest(
    quest_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    quest = db.query(Quest).filter(Quest.id == quest_id, Quest.user_id == current_user.id).first()
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")

    db.delete(quest)
    db.commit()
    return None

@router.post("/{quest_id}/complete", response_model=QuestCompleteResponse)
def complete_quest(
    quest_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    quest = db.query(Quest).filter(Quest.id == quest_id, Quest.user_id == current_user.id).first()
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")

    if quest.is_completed:
        raise HTTPException(status_code=400, detail="Quest is already marked completed")

    # 1. Update streak
    streak_updated = process_streak_update(current_user)
    multiplier = get_streak_multiplier(current_user.streak_count)

    # 2. Compute XP & Gold with multiplier
    final_xp = int(quest.xp_reward * multiplier)
    final_gold = int(quest.gold_reward * multiplier)

    # 3. Apply XP & check for level up
    leveled_up, new_level = apply_xp_and_level_up(current_user, final_xp)
    current_user.gold += final_gold

    # 4. Apply attribute XP
    attr = db.query(Attribute).filter(
        Attribute.user_id == current_user.id,
        Attribute.name == quest.attribute_target
    ).first()
    
    attr_leveled_up = False
    attr_level = 1
    if attr:
        attr_leveled_up, attr_level = apply_attribute_xp(attr, final_xp)

    # 5. Deal Boss damage
    diff_info = DIFFICULTY_REWARDS.get(quest.difficulty, {"boss_damage": 30})
    boss_damage = diff_info["boss_damage"]
    boss_defeated = False

    active_boss = db.query(BossBattle).filter(
        BossBattle.user_id == current_user.id,
        BossBattle.is_defeated == False
    ).first()

    if active_boss:
        active_boss.current_hp = max(0, active_boss.current_hp - boss_damage)
        if active_boss.current_hp == 0:
            active_boss.is_defeated = True
            boss_defeated = True
            # Award boss kill bonus
            current_user.gold += active_boss.reward_gold
            current_user.gems += active_boss.reward_gems
            apply_xp_and_level_up(current_user, active_boss.reward_xp)

    # 6. Mark quest completed
    quest.is_completed = True
    quest.completed_at = datetime.utcnow()

    # 7. Activity Log
    log = ActivityLog(
        user_id=current_user.id,
        action_type="quest_complete",
        description=f"Completed quest: '{quest.title}' (+{final_xp} XP, +{final_gold} Gold)",
        xp_gained=final_xp,
        gold_gained=final_gold
    )
    db.add(log)

    db.commit()
    db.refresh(quest)
    db.refresh(current_user)

    return QuestCompleteResponse(
        quest=quest,
        xp_gained=final_xp,
        gold_gained=final_gold,
        leveled_up=leveled_up,
        new_level=new_level,
        attribute_leveled_up=attr_leveled_up,
        attribute_name=quest.attribute_target,
        attribute_level=attr_level,
        boss_damage_dealt=boss_damage,
        boss_defeated=boss_defeated,
        streak_active=streak_updated,
        current_streak=current_user.streak_count
    )

@router.post("/{quest_id}/uncomplete", response_model=QuestOut)
def uncomplete_quest(
    quest_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    quest = db.query(Quest).filter(Quest.id == quest_id, Quest.user_id == current_user.id).first()
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")

    quest.is_completed = False
    quest.completed_at = None
    db.commit()
    db.refresh(quest)
    return quest
