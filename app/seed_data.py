from sqlalchemy.orm import Session
from app.models import ShopItem, Attribute, BossBattle

DEFAULT_ATTRIBUTES = [
    "Strength",
    "Intellect",
    "Vitality",
    "Agility",
    "Charisma",
    "Focus"
]

DEFAULT_SHOP_ITEMS = [
    # Gear
    {
        "name": "Iron Greatsword",
        "description": "A heavy forged blade that empowers the wielder's physical discipline.",
        "cost_gold": 120,
        "cost_gems": 0,
        "item_type": "gear",
        "stat_bonus": "+5 Strength",
        "icon": "sword",
        "rarity": "common"
    },
    {
        "name": "Archmage Spellbook",
        "description": "Ancient codex containing theorems of deep computation and focus.",
        "cost_gold": 180,
        "cost_gems": 0,
        "item_type": "gear",
        "stat_bonus": "+8 Intellect",
        "icon": "book-open",
        "rarity": "rare"
    },
    {
        "name": "Cloak of the Shadow Stalker",
        "description": "Woven from twilight silks to hasten rapid task execution.",
        "cost_gold": 200,
        "cost_gems": 0,
        "item_type": "gear",
        "stat_bonus": "+7 Agility",
        "icon": "wind",
        "rarity": "rare"
    },
    {
        "name": "Crown of Resplendence",
        "description": "Emits an aura of quiet confidence in social and presentation arenas.",
        "cost_gold": 320,
        "cost_gems": 5,
        "item_type": "gear",
        "stat_bonus": "+10 Charisma",
        "icon": "crown",
        "rarity": "epic"
    },
    {
        "name": "Chronos Hourglass",
        "description": "Manipulates the flow of attention during deep focus sessions.",
        "cost_gold": 400,
        "cost_gems": 8,
        "item_type": "gear",
        "stat_bonus": "+12 Focus",
        "icon": "hourglass",
        "rarity": "epic"
    },
    {
        "name": "Infinity Blade of Mastery",
        "description": "Legendary relic forged by ancient productivity titans.",
        "cost_gold": 850,
        "cost_gems": 25,
        "item_type": "gear",
        "stat_bonus": "+15 All Stats",
        "icon": "sparkles",
        "rarity": "legendary"
    },
    # Potions & Consumables
    {
        "name": "Minor Health Potion",
        "description": "Restores 50 HP immediately.",
        "cost_gold": 35,
        "cost_gems": 0,
        "item_type": "potion",
        "stat_bonus": "Heal 50 HP",
        "icon": "heart",
        "rarity": "common"
    },
    {
        "name": "Full Rejuvenation Elixir",
        "description": "Restores maximum HP and refreshes mental energy.",
        "cost_gold": 75,
        "cost_gems": 0,
        "item_type": "potion",
        "stat_bonus": "Full HP Heal",
        "icon": "flask-conical",
        "rarity": "rare"
    },
    {
        "name": "Streak Guardian Shield",
        "description": "Protects your active daily streak from breaking for one missed day.",
        "cost_gold": 150,
        "cost_gems": 2,
        "item_type": "streak_freeze",
        "stat_bonus": "Streak Protection",
        "icon": "shield-alert",
        "rarity": "rare"
    },
    {
        "name": "Scroll of Instant Insight",
        "description": "Instantly awards 150 XP towards your next level.",
        "cost_gold": 220,
        "cost_gems": 3,
        "item_type": "potion",
        "stat_bonus": "+150 XP",
        "icon": "scroll",
        "rarity": "epic"
    },
    # Badges & Themes
    {
        "name": "Cyberpunk Neon Theme",
        "description": "Unlocks high-contrast neon styling for your command interface.",
        "cost_gold": 250,
        "cost_gems": 5,
        "item_type": "theme",
        "stat_bonus": "Theme: Cyberpunk",
        "icon": "palette",
        "rarity": "rare"
    },
    {
        "name": "Golden Dragon Slayer Badge",
        "description": "Prestige medal commemorating mastery over procrastination.",
        "cost_gold": 500,
        "cost_gems": 15,
        "item_type": "badge",
        "stat_bonus": "Title: Dragon Slayer",
        "icon": "shield-check",
        "rarity": "legendary"
    }
]

def seed_database_items(db: Session):
    existing = db.query(ShopItem).count()
    if existing == 0:
        for item_data in DEFAULT_SHOP_ITEMS:
            item = ShopItem(**item_data)
            db.add(item)
        db.commit()

def initialize_user_rpg_state(db: Session, user_id: int):
    """Initializes attributes and active boss battle for a newly registered user."""
    # 1. Attributes
    for attr_name in DEFAULT_ATTRIBUTES:
        attr = Attribute(user_id=user_id, name=attr_name, level=1, current_xp=0)
        db.add(attr)
    
    # 2. Starting Boss
    boss = BossBattle(
        user_id=user_id,
        boss_name="Procrastination Drake",
        boss_title="Scourge of the Unfinished Tasks",
        max_hp=400,
        current_hp=400,
        avatar="dragon",
        reward_gold=250,
        reward_gems=15,
        reward_xp=350,
        is_defeated=False
    )
    db.add(boss)
    db.commit()
