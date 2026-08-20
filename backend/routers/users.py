from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List

from database import get_db
from models.user import User
from models.achievement import Achievement, UserAchievement, Badge
from models.learning import UserVocabulary, UserLesson
from routers.auth import get_current_user
from schemas.schemas import (
    UserResponse, UserProfileUpdate, AchievementResponse, VocabularyResponse,
)
from services.recommendation import get_recommendations
from schemas.schemas import RecommendationResponse, CourseResponse

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/profile", response_model=UserResponse)
def get_profile(user: User = Depends(get_current_user)):
    return user


@router.put("/profile", response_model=UserResponse)
def update_profile(
    data: UserProfileUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    update_data = data.model_dump(exclude_none=True)
    for key, value in update_data.items():
        setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return user


@router.get("/achievements", response_model=List[AchievementResponse])
def get_achievements(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    all_achievements = db.query(Achievement).all()
    user_achievements = {
        ua.achievement_id: ua
        for ua in db.query(UserAchievement).filter(UserAchievement.user_id == user.id).all()
    }

    result = []
    for a in all_achievements:
        ua = user_achievements.get(a.id)
        result.append(AchievementResponse(
            id=a.id, badge=a.badge, title=a.title,
            description=a.description, icon_url=a.icon_url,
            xp_reward=a.xp_reward,
            earned=ua is not None,
            earned_at=ua.earned_at if ua else None,
            is_new=ua.is_new if ua else False,
        ))

    # Mark new achievements as seen
    for ua in user_achievements.values():
        if ua.is_new:
            ua.is_new = False
    db.commit()

    return result


@router.get("/vocabulary/review", response_model=List[VocabularyResponse])
def get_review_vocabulary(
    limit: int = 20,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from datetime import datetime, timedelta
    from models.course import Vocabulary

    # Get vocabulary due for review
    subq = db.query(UserVocabulary.vocabulary_id).filter(
        UserVocabulary.user_id == user.id,
        UserVocabulary.next_review_at <= datetime.utcnow(),
    ).subquery()

    items = db.query(Vocabulary).filter(Vocabulary.id.in_(subq)).limit(limit).all()

    # If not enough due items, get new vocabulary
    if len(items) < limit:
        existing_ids = [
            uv.vocabulary_id for uv in db.query(UserVocabulary).filter(
                UserVocabulary.user_id == user.id
            ).all()
        ]
        new_items = db.query(Vocabulary).filter(
            ~Vocabulary.id.in_(existing_ids) if existing_ids else True,
        ).limit(limit - len(items)).all()
        items.extend(new_items)

    return [VocabularyResponse(
        id=v.id, word=v.word, translation=v.translation,
        pronunciation=v.pronunciation, audio_url=v.audio_url,
        example_sentence=v.example_sentence, difficulty=v.difficulty,
        part_of_speech=v.part_of_speech,
    ) for v in items]


@router.get("/recommendations", response_model=List[RecommendationResponse])
def get_recommendations_endpoint(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    recommendations = get_recommendations(user.id, db)
    result = []
    for course, score, reason in recommendations:
        cr = CourseResponse(
            id=course.id, language_id=course.language_id, title=course.title,
            description=course.description, level=course.level,
            cover_image=course.cover_image, total_lessons=course.total_lessons,
            estimated_hours=course.estimated_hours, is_published=course.is_published,
            level_name=course.level.value,
            language_name=course.language.name if course.language else "",
        )
        result.append(RecommendationResponse(course=cr, reason=reason, match_score=score))
    return result


@router.get("/stats")
def get_user_stats(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Total XP
    total_xp = db.query(func.coalesce(func.sum(UserLesson.xp_earned), 0)).filter(
        UserLesson.user_id == user.id,
    ).scalar()

    # Completed lessons
    completed = db.query(UserLesson).filter(
        UserLesson.user_id == user.id, UserLesson.is_completed == True,
    ).count()

    # Vocabulary mastered
    vocab_mastered = db.query(UserVocabulary).filter(
        UserVocabulary.user_id == user.id, UserVocabulary.familiarity >= 4,
    ).count()

    # Achievements earned
    achievements = db.query(UserAchievement).filter(
        UserAchievement.user_id == user.id,
    ).count()

    return {
        "total_xp": total_xp or 0,
        "completed_lessons": completed,
        "vocabulary_mastered": vocab_mastered,
        "achievements_earned": achievements,
    }