from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List
from datetime import datetime

# Auth Schemas
class UserSignup(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    username_or_email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    username: str

# User & Character Schemas
class AttributeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    level: int
    current_xp: int
    xp_to_next_level: int

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: str
    level: int
    current_xp: int
    xp_to_next_level: int
    gold: int
    gems: int
    hp: int
    max_hp: int
    streak_count: int
    longest_streak: int
    avatar: str
    title: str
    theme: str
    created_at: datetime
    attributes: List[AttributeOut] = []

class UpdateProfile(BaseModel):
    avatar: Optional[str] = None
    title: Optional[str] = None
    theme: Optional[str] = None

# Quest Schemas
class QuestCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = ""
    category: Optional[str] = "General"
    difficulty: Optional[str] = "Medium"  # Trivial, Easy, Medium, Hard, Epic
    attribute_target: Optional[str] = "Intellect"
    recurrence: Optional[str] = "once"
    due_date: Optional[str] = ""

class QuestUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    difficulty: Optional[str] = None
    attribute_target: Optional[str] = None
    recurrence: Optional[str] = None
    due_date: Optional[str] = None

class QuestOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    title: str
    description: str
    category: str
    difficulty: str
    xp_reward: int
    gold_reward: int
    attribute_target: str
    is_completed: bool
    recurrence: str
    due_date: str
    completed_at: Optional[datetime] = None
    created_at: datetime

class QuestCompleteResponse(BaseModel):
    quest: QuestOut
    xp_gained: int
    gold_gained: int
    leveled_up: bool
    new_level: int
    attribute_leveled_up: bool
    attribute_name: str
    attribute_level: int
    boss_damage_dealt: int
    boss_defeated: bool
    streak_active: bool
    current_streak: int

# Shop & Inventory Schemas
class ShopItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str
    cost_gold: int
    cost_gems: int
    item_type: str
    stat_bonus: str
    icon: str
    rarity: str

class InventoryItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    item: ShopItemOut
    is_equipped: bool
    quantity: int
    acquired_at: datetime

class BossBattleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    boss_name: str
    boss_title: str
    max_hp: int
    current_hp: int
    avatar: str
    reward_gold: int
    reward_gems: int
    reward_xp: int
    is_defeated: bool

class ActivityLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    action_type: str
    description: str
    xp_gained: int
    gold_gained: int
    created_at: datetime
