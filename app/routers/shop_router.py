from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import User, ShopItem, UserInventory, ActivityLog
from app.schemas import ShopItemOut, InventoryItemOut
from app.auth import get_current_user
from app.progression import apply_xp_and_level_up

router = APIRouter(prefix="/api/shop", tags=["Shop & Economy"])

@router.get("/items", response_model=List[ShopItemOut])
def list_shop_items(db: Session = Depends(get_db)):
    return db.query(ShopItem).all()

@router.get("/inventory", response_model=List[InventoryItemOut])
def get_user_inventory(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(UserInventory).filter(UserInventory.user_id == current_user.id).all()

@router.post("/buy/{item_id}", response_model=InventoryItemOut)
def buy_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = db.query(ShopItem).filter(ShopItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    # Check currency
    if current_user.gold < item.cost_gold:
        raise HTTPException(status_code=400, detail=f"Insufficient gold! Needs {item.cost_gold} Gold.")
    if current_user.gems < item.cost_gems:
        raise HTTPException(status_code=400, detail=f"Insufficient gems! Needs {item.cost_gems} Gems.")

    # Deduct currency
    current_user.gold -= item.cost_gold
    current_user.gems -= item.cost_gems

    # Check if user already owns this item (for gear/themes, usually 1 copy; for potions, stack quantity)
    inv_item = db.query(UserInventory).filter(
        UserInventory.user_id == current_user.id,
        UserInventory.item_id == item.id
    ).first()

    if inv_item:
        inv_item.quantity += 1
    else:
        inv_item = UserInventory(
            user_id=current_user.id,
            item_id=item.id,
            is_equipped=False,
            quantity=1
        )
        db.add(inv_item)

    # Log purchase
    log = ActivityLog(
        user_id=current_user.id,
        action_type="item_buy",
        description=f"Purchased '{item.name}' for {item.cost_gold} Gold / {item.cost_gems} Gems",
        xp_gained=0,
        gold_gained=-item.cost_gold
    )
    db.add(log)

    db.commit()
    db.refresh(inv_item)
    return inv_item

@router.post("/equip/{inventory_id}")
def toggle_equip_item(
    inventory_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    inv_item = db.query(UserInventory).filter(
        UserInventory.id == inventory_id,
        UserInventory.user_id == current_user.id
    ).first()
    if not inv_item:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    if inv_item.item.item_type not in ["gear", "theme", "badge"]:
        raise HTTPException(status_code=400, detail="Only gear, themes, and badges can be equipped")

    inv_item.is_equipped = not inv_item.is_equipped

    # If theme or badge, update user profile representation
    if inv_item.is_equipped:
        if inv_item.item.item_type == "theme":
            if "Cyberpunk" in inv_item.item.name:
                current_user.theme = "cyberpunk"
            else:
                current_user.theme = "dark-fantasy"
        elif inv_item.item.item_type == "badge":
            current_user.title = inv_item.item.name

    db.commit()
    return {
        "success": True,
        "is_equipped": inv_item.is_equipped,
        "message": f"{'Equipped' if inv_item.is_equipped else 'Unequipped'} {inv_item.item.name}"
    }

@router.post("/use/{inventory_id}")
def use_consumable(
    inventory_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    inv_item = db.query(UserInventory).filter(
        UserInventory.id == inventory_id,
        UserInventory.user_id == current_user.id
    ).first()
    if not inv_item or inv_item.quantity <= 0:
        raise HTTPException(status_code=404, detail="Item not available in inventory")

    item = inv_item.item
    message = ""

    if "Heal 50 HP" in item.stat_bonus:
        current_user.hp = min(current_user.max_hp, current_user.hp + 50)
        message = "Healed 50 HP!"
    elif "Full HP Heal" in item.stat_bonus:
        current_user.hp = current_user.max_hp
        message = "Restored full HP!"
    elif "+150 XP" in item.stat_bonus:
        leveled, new_lvl = apply_xp_and_level_up(current_user, 150)
        message = f"Gained 150 XP! {'Level up!' if leveled else ''}"
    elif "Streak Protection" in item.stat_bonus:
        message = "Streak shield activated! Your streak is secured."
    else:
        message = f"Used {item.name}!"

    inv_item.quantity -= 1
    if inv_item.quantity == 0:
        db.delete(inv_item)

    db.commit()
    db.refresh(current_user)

    return {
        "success": True,
        "message": message,
        "user_hp": current_user.hp,
        "user_max_hp": current_user.max_hp,
        "user_level": current_user.level,
        "user_xp": current_user.current_xp
    }
