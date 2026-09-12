from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    
    level = Column(Integer, default=1)
    current_xp = Column(Integer, default=0)
    gold = Column(Integer, default=100)  # Starting bonus
    gems = Column(Integer, default=10)
    hp = Column(Integer, default=100)
    max_hp = Column(Integer, default=100)
    
    streak_count = Column(Integer, default=1)
    longest_streak = Column(Integer, default=1)
    last_active_date = Column(String(20), default="")
    
    avatar = Column(String(50), default="knight")
    title = Column(String(100), default="Novice Adventurer")
    theme = Column(String(50), default="dark-fantasy")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    quests = relationship("Quest", back_populates="user", cascade="all, delete-orphan")
    attributes = relationship("Attribute", back_populates="user", cascade="all, delete-orphan")
    inventory = relationship("UserInventory", back_populates="user", cascade="all, delete-orphan")
    boss_battles = relationship("BossBattle", back_populates="user", cascade="all, delete-orphan")
    activity_logs = relationship("ActivityLog", back_populates="user", cascade="all, delete-orphan")


class Attribute(Base):
    __tablename__ = "attributes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(50), nullable=False)  # Strength, Intellect, Vitality, Agility, Charisma, Focus
    level = Column(Integer, default=1)
    current_xp = Column(Integer, default=0)
    
    user = relationship("User", back_populates="attributes")


class Quest(Base):
    __tablename__ = "quests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, default="")
    category = Column(String(50), default="General")
    difficulty = Column(String(20), default="Medium")  # Trivial, Easy, Medium, Hard, Epic
    xp_reward = Column(Integer, default=50)
    gold_reward = Column(Integer, default=20)
    attribute_target = Column(String(50), default="Intellect")  # Strength, Intellect, Vitality, etc.
    
    is_completed = Column(Boolean, default=False)
    recurrence = Column(String(20), default="once")  # once, daily, weekly
    due_date = Column(String(30), default="")
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="quests")


class ShopItem(Base):
    __tablename__ = "shop_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, default="")
    cost_gold = Column(Integer, default=0)
    cost_gems = Column(Integer, default=0)
    item_type = Column(String(30), nullable=False)  # gear, potion, theme, badge, streak_freeze
    stat_bonus = Column(String(100), default="")    # e.g., "+5 Strength", "+10 Intellect", "Heal 50 HP"
    icon = Column(String(50), default="sword")
    rarity = Column(String(20), default="common")  # common, rare, epic, legendary


class UserInventory(Base):
    __tablename__ = "user_inventory"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    item_id = Column(Integer, ForeignKey("shop_items.id", ondelete="CASCADE"), nullable=False)
    is_equipped = Column(Boolean, default=False)
    quantity = Column(Integer, default=1)
    acquired_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="inventory")
    item = relationship("ShopItem")


class BossBattle(Base):
    __tablename__ = "boss_battles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    boss_name = Column(String(100), default="Procrastination Dragon")
    boss_title = Column(String(100), default="Devourer of Deadlines")
    max_hp = Column(Integer, default=500)
    current_hp = Column(Integer, default=500)
    avatar = Column(String(50), default="dragon")
    reward_gold = Column(Integer, default=200)
    reward_gems = Column(Integer, default=25)
    reward_xp = Column(Integer, default=300)
    is_defeated = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="boss_battles")


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    action_type = Column(String(50), nullable=False)  # quest_complete, level_up, boss_damage, item_buy
    description = Column(Text, nullable=False)
    xp_gained = Column(Integer, default=0)
    gold_gained = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="activity_logs")
