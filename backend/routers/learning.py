from datetime import datetime, date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List

from database import get_db
from models.course import Course, Lesson, Vocabulary
from models.learning import (
    UserCourse, UserLesson, UserVocabulary, LearningSession, UserStreak,
)
from models.user import User
from models.achievement import Achievement, UserAchievement
from routers.auth import get_current_user
from schemas.schemas import (
    LessonCompleteRequest, UserProgressResponse, LearningSessionResponse,
    VocabularyResponse, AchievementResponse,
)
from services.achievement import check_and_unlock_achievements

router = APIRouter(prefix="/api/learning", tags=["learning"])


@router.post("/courses/{course_id}/enroll")
def enroll_course(
    course_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="课程不存在")

    existing = db.query(UserCourse).filter(
        UserCourse.user_id == user.id, UserCourse.course_id == course_id
    ).first()
    if existing:
        return {"message": "已报名该课程", "enrolled": True}

    uc = UserCourse(user_id=user.id, course_id=course_id)
    db.add(uc)
    db.commit()
    return {"message": "报名成功", "enrolled": True}


@router.post("/lessons/{lesson_id}/complete")
def complete_lesson(
    lesson_id: int,
    data: LessonCompleteRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="课时不存在")

    # Update or create user lesson record
    ul = db.query(UserLesson).filter(
        UserLesson.user_id == user.id, UserLesson.lesson_id == lesson_id
    ).first()

    if ul:
        ul.is_completed = True
        ul.score = data.score
        ul.xp_earned = (ul.xp_earned or 0) + data.xp_earned
        ul.attempts = (ul.attempts or 0) + 1
        ul.completed_at = datetime.utcnow()
    else:
        ul = UserLesson(
            user_id=user.id, lesson_id=lesson_id,
            is_completed=True, score=data.score,
            xp_earned=data.xp_earned, attempts=1,
            completed_at=datetime.utcnow(),
        )
        db.add(ul)

    # Update course progress
    course = db.query(Course).filter(Course.id == lesson.course_id).first()
    if course:
        uc = db.query(UserCourse).filter(
            UserCourse.user_id == user.id, UserCourse.course_id == course.id
        ).first()
        if uc:
            total_lessons = db.query(Lesson).filter(Lesson.course_id == course.id).count()
            completed = db.query(UserLesson).filter(
                UserLesson.user_id == user.id,
                UserLesson.is_completed == True,
                Lesson.course_id == course.id,
            ).join(Lesson, UserLesson.lesson_id == Lesson.id).count()
            uc.progress_percent = min(100.0, (completed / total_lessons) * 100) if total_lessons > 0 else 0
            uc.last_accessed_at = datetime.utcnow()

    # Record learning session
    if data.duration_minutes > 0:
        session = LearningSession(
            user_id=user.id,
            duration_minutes=data.duration_minutes,
            xp_earned=data.xp_earned,
            lessons_completed=1,
            session_date=datetime.utcnow(),
        )
        db.add(session)

    # Update streak
    _update_streak(user.id, db)

    db.commit()

    # Check achievements
    new_achievements = check_and_unlock_achievements(user.id, db)

    return {
        "message": "课时完成",
        "xp_earned": data.xp_earned,
        "score": data.score,
        "new_achievements": [
            AchievementResponse(
                id=a.achievement_id,
                badge=a.achievement.badge,
                title=a.achievement.title,
                description=a.achievement.description,
                icon_url=a.achievement.icon_url,
                xp_reward=a.achievement.xp_reward,
                earned=True,
                earned_at=a.earned_at,
                is_new=a.is_new,
            ) for a in new_achievements
        ] if new_achievements else [],
    }


@router.post("/vocabulary/{vocab_id}/review")
def review_vocabulary(
    vocab_id: int,
    familiarity: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    vocab = db.query(Vocabulary).filter(Vocabulary.id == vocab_id).first()
    if not vocab:
        raise HTTPException(status_code=404, detail="词汇不存在")

    from datetime import timedelta
    uv = db.query(UserVocabulary).filter(
        UserVocabulary.user_id == user.id,
        UserVocabulary.vocabulary_id == vocab_id,
    ).first()

    if uv:
        uv.familiarity = min(5, familiarity)
        uv.review_count = (uv.review_count or 0) + 1
        uv.last_reviewed_at = datetime.utcnow()
        # Spaced repetition: next review based on familiarity
        intervals = [1, 2, 4, 7, 14, 30]
        uv.next_review_at = datetime.utcnow() + timedelta(days=intervals[min(familiarity, 5)])
    else:
        uv = UserVocabulary(
            user_id=user.id, vocabulary_id=vocab_id,
            familiarity=min(5, familiarity), review_count=1,
            last_reviewed_at=datetime.utcnow(),
            next_review_at=datetime.utcnow() + timedelta(days=1),
        )
        db.add(uv)

    db.commit()
    return {"message": "复习完成", "familiarity": uv.familiarity}


@router.get("/progress", response_model=UserProgressResponse)
def get_progress(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Total courses enrolled
    total_courses = db.query(UserCourse).filter(UserCourse.user_id == user.id).count()

    # Total completed lessons
    completed_lessons = db.query(UserLesson).filter(
        UserLesson.user_id == user.id,
        UserLesson.is_completed == True,
    ).count()

    # Total available lessons
    total_lessons = db.query(Lesson).count()

    # Total XP
    total_xp = db.query(func.coalesce(func.sum(UserLesson.xp_earned), 0)).filter(
        UserLesson.user_id == user.id,
    ).scalar()

    # Streak info
    streak = db.query(UserStreak).filter(UserStreak.user_id == user.id).first()

    # Recent sessions
    recent = db.query(LearningSession).filter(
        LearningSession.user_id == user.id,
    ).order_by(desc(LearningSession.session_date)).limit(7).all()

    return UserProgressResponse(
        total_courses=total_courses,
        completed_lessons=completed_lessons,
        total_lessons=total_lessons,
        total_xp=total_xp or 0,
        current_streak=streak.current_streak if streak else 0,
        longest_streak=streak.longest_streak if streak else 0,
        total_study_days=streak.total_days if streak else 0,
        recent_sessions=[
            LearningSessionResponse(
                id=s.id,
                date=s.session_date,
                duration_minutes=s.duration_minutes,
                xp_earned=s.xp_earned,
                lessons_completed=s.lessons_completed,
            ) for s in recent
        ],
    )


@router.get("/progress/courses", response_model=List[dict])
def get_course_progress(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_courses = db.query(UserCourse).filter(
        UserCourse.user_id == user.id,
    ).all()

    result = []
    for uc in user_courses:
        course = db.query(Course).filter(Course.id == uc.course_id).first()
        if course:
            result.append({
                "course_id": course.id,
                "course_title": course.title,
                "language_name": course.language.name if course.language else "",
                "progress_percent": uc.progress_percent,
                "started_at": uc.started_at.isoformat() if uc.started_at else None,
                "last_accessed_at": uc.last_accessed_at.isoformat() if uc.last_accessed_at else None,
            })
    return result


@router.get("/streak", response_model=dict)
def get_streak(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    streak = db.query(UserStreak).filter(UserStreak.user_id == user.id).first()
    return {
        "current_streak": streak.current_streak if streak else 0,
        "longest_streak": streak.longest_streak if streak else 0,
        "total_days": streak.total_days if streak else 0,
        "last_active_date": streak.last_active_date.isoformat() if streak and streak.last_active_date else None,
    }


def _update_streak(user_id: int, db: Session):
    today = date.today()
    streak = db.query(UserStreak).filter(UserStreak.user_id == user_id).first()

    if not streak:
        streak = UserStreak(
            user_id=user_id,
            current_streak=1,
            longest_streak=1,
            last_active_date=datetime(today.year, today.month, today.day),
            total_days=1,
        )
        db.add(streak)
        return

    last_active = streak.last_active_date.date() if streak.last_active_date else None

    if last_active == today:
        return  # Already counted today

    yesterday = datetime(today.year, today.month, today.day) - __import__('datetime').timedelta(days=1)
    if last_active and last_active == yesterday.date():
        streak.current_streak += 1
    else:
        streak.current_streak = 1

    streak.total_days += 1
    streak.longest_streak = max(streak.longest_streak, streak.current_streak)
    streak.last_active_date = datetime(today.year, today.month, today.day)