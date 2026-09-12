import math
from datetime import datetime, date

DIFFICULTY_REWARDS = {
    "Trivial": {"xp": 20, "gold": 10, "boss_damage": 15},
    "Easy": {"xp": 35, "gold": 15, "boss_damage": 30},
    "Medium": {"xp": 60, "gold": 25, "boss_damage": 50},
    "Hard": {"xp": 100, "gold": 45, "boss_damage": 90},
    "Epic": {"xp": 200, "gold": 90, "boss_damage": 180},
}

# Non-linear leveling formula: XP = floor(100 * level^1.4)
def get_xp_for_level(level: int) -> int:
    if level < 1:
        return 100
    return int(math.floor(100 * math.pow(level, 1.4)))

# Attribute leveling formula: XP = floor(40 * level^1.3)
def get_attribute_xp_for_level(level: int) -> int:
    if level < 1:
        return 40
    return int(math.floor(40 * math.pow(level, 1.3)))

def get_streak_multiplier(streak: int) -> float:
    if streak >= 30:
        return 1.6
    elif streak >= 14:
        return 1.4
    elif streak >= 7:
        return 1.25
    elif streak >= 3:
        return 1.1
    return 1.0

def process_streak_update(user) -> bool:
    """Updates user's streak based on today's date."""
    today_str = date.today().isoformat()
    if not user.last_active_date:
        user.last_active_date = today_str
        user.streak_count = 1
        user.longest_streak = max(user.longest_streak, 1)
        return True

    if user.last_active_date == today_str:
        # Already active today
        return False

    try:
        last_date = datetime.strptime(user.last_active_date, "%Y-%m-%d").date()
        delta = (date.today() - last_date).days
        if delta == 1:
            user.streak_count += 1
            if user.streak_count > user.longest_streak:
                user.longest_streak = user.streak_count
        elif delta > 1:
            # Streak broken, reset to 1
            user.streak_count = 1
        user.last_active_date = today_str
        return True
    except Exception:
        user.last_active_date = today_str
        user.streak_count = 1
        return True

def apply_xp_and_level_up(user, xp_amount: int) -> tuple[bool, int]:
    """Applies XP to user and handles non-linear level ups. Returns (leveled_up, new_level)."""
    user.current_xp += xp_amount
    leveled_up = False
    
    while True:
        req_xp = get_xp_for_level(user.level)
        if user.current_xp >= req_xp:
            user.current_xp -= req_xp
            user.level += 1
            user.max_hp += 10
            user.hp = user.max_hp  # Full heal on level up
            user.gold += user.level * 20  # Level up bonus gold
            user.gems += 2  # Level up bonus gems
            leveled_up = True
        else:
            break
            
    return (leveled_up, user.level)

def apply_attribute_xp(attr, xp_amount: int) -> tuple[bool, int]:
    """Applies XP to a specific attribute. Returns (leveled_up, new_level)."""
    attr.current_xp += xp_amount
    leveled_up = False
    
    while True:
        req_xp = get_attribute_xp_for_level(attr.level)
        if attr.current_xp >= req_xp:
            attr.current_xp -= req_xp
            attr.level += 1
            leveled_up = True
        else:
            break
            
    return (leveled_up, attr.level)
