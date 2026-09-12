from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Quest, Attribute
from app.schemas import UserSignup, UserLogin, Token, UserOut, AttributeOut
from app.auth import get_password_hash, verify_password, create_access_token, get_current_user
from app.seed_data import initialize_user_rpg_state
from app.progression import get_xp_for_level, get_attribute_xp_for_level

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

def format_user_out(user: User, db: Session) -> dict:
    attrs = db.query(Attribute).filter(Attribute.user_id == user.id).all()
    formatted_attrs = []
    for a in attrs:
        formatted_attrs.append(AttributeOut(
            id=a.id,
            name=a.name,
            level=a.level,
            current_xp=a.current_xp,
            xp_to_next_level=get_attribute_xp_for_level(a.level)
        ))
    
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "level": user.level,
        "current_xp": user.current_xp,
        "xp_to_next_level": get_xp_for_level(user.level),
        "gold": user.gold,
        "gems": user.gems,
        "hp": user.hp,
        "max_hp": user.max_hp,
        "streak_count": user.streak_count,
        "longest_streak": user.longest_streak,
        "avatar": user.avatar,
        "title": user.title,
        "theme": user.theme,
        "created_at": user.created_at,
        "attributes": formatted_attrs
    }

@router.post("/signup", response_model=dict, status_code=status.HTTP_201_CREATED)
def signup(user_data: UserSignup, db: Session = Depends(get_db)):
    # Check if username or email already exists
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(status_code=400, detail="Username is already taken")
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Email is already registered")

    # Create new user
    hashed_pwd = get_password_hash(user_data.password)
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_pwd,
        gold=100,
        gems=10,
        hp=100,
        max_hp=100,
        streak_count=1,
        longest_streak=1
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Initialize RPG attributes & boss
    initialize_user_rpg_state(db, new_user.id)

    # Seed starter quests
    starter_quests = [
        Quest(
            user_id=new_user.id,
            title="Read 10 Pages of a Book or Textbook",
            description="Fuel your mind with new knowledge to boost your intellect.",
            category="Study",
            difficulty="Easy",
            xp_reward=35,
            gold_reward=15,
            attribute_target="Intellect",
            recurrence="daily"
        ),
        Quest(
            user_id=new_user.id,
            title="30-Minute Gym or Home Workout",
            description="Exercise physically to build discipline and physical strength.",
            category="Fitness",
            difficulty="Medium",
            xp_reward=60,
            gold_reward=25,
            attribute_target="Strength",
            recurrence="daily"
        ),
        Quest(
            user_id=new_user.id,
            title="Drink 2 Litres of Water & Sleep on Time",
            description="Maintain baseline biological recovery to fortify your vitality.",
            category="Health",
            difficulty="Trivial",
            xp_reward=20,
            gold_reward=10,
            attribute_target="Vitality",
            recurrence="daily"
        ),
        Quest(
            user_id=new_user.id,
            title="Deep Work: 45 Mins with No Social Media",
            description="Lock in without distractions to boost your focus stat.",
            category="Productivity",
            difficulty="Hard",
            xp_reward=100,
            gold_reward=45,
            attribute_target="Focus",
            recurrence="once"
        )
    ]
    for q in starter_quests:
        db.add(q)
    db.commit()

    token = create_access_token(data={"sub": str(new_user.id), "username": new_user.username})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": format_user_out(new_user, db)
    }

@router.post("/login", response_model=dict)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(
        (User.username == login_data.username_or_email) | (User.email == login_data.username_or_email)
    ).first()

    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password"
        )

    token = create_access_token(data={"sub": str(user.id), "username": user.username})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": format_user_out(user, db)
    }

@router.get("/me", response_model=UserOut)
def get_current_user_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return format_user_out(current_user, db)
