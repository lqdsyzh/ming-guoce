from sqlalchemy.orm import Session
from models.achievement import Achievement, UserAchievement, Badge
from models.learning import UserLesson, UserStreak, UserVocabulary, LearningSession
from models.user import User
from models.community import Post
from typing import List


def check_and_unlock_achievements(user_id: int, db: Session) -> List[UserAchievement]:
    """Check all achievement conditions and unlock any newly earned ones."""
    unlocked = []
    achievements = db.query(Achievement).all()

    for achievement in achievements:
        # Check if already earned
        existing = db.query(UserAchievement).filter(
            UserAchievement.user_id == user_id,
            UserAchievement.achievement_id == achievement.id,
        ).first()

        if existing:
            continue

        earned = _check_condition(user_id, achievement, db)
        if earned:
            ua = UserAchievement(user_id=user_id, achievement_id=achievement.id, is_new=True)
            db.add(ua)
            unlocked.append(ua)

    db.commit()
    return unlocked


def _check_condition(user_id: int, achievement: Achievement, db: Session) -> bool:
    condition_map = {
        "streak": _check_streak,
        "lesson": _check_lesson_count,
        "vocab": _check_vocab_count,
        "score": _check_perfect_score,
        "course": _check_course_complete,
        "post": _check_post_count,
        "session": _check_session_count,
    }

    checker = condition_map.get(achievement.condition_type)
    if checker:
        return checker(user_id, achievement.condition_value, db)
    return False


def _check_streak(user_id: int, target: int, db: Session) -> bool:
    streak = db.query(UserStreak).filter(UserStreak.user_id == user_id).first()
    return streak is not None and streak.current_streak >= target


def _check_lesson_count(user_id: int, target: int, db: Session) -> bool:
    count = db.query(UserLesson).filter(
        UserLesson.user_id == user_id,
        UserLesson.is_completed == True,
    ).count()
    return count >= target


def _check_vocab_count(user_id: int, target: int, db: Session) -> bool:
    count = db.query(UserVocabulary).filter(
        UserVocabulary.user_id == user_id,
        UserVocabulary.familiarity >= 3,
    ).count()
    return count >= target


def _check_perfect_score(user_id: int, target: int, db: Session) -> bool:
    count = db.query(UserLesson).filter(
        UserLesson.user_id == user_id,
        UserLesson.is_completed == True,
        UserLesson.score == 100,
    ).count()
    return count >= target


def _check_course_complete(user_id: int, target: int, db: Session) -> bool:
    from models.learning import UserCourse
    count = db.query(UserCourse).filter(
        UserCourse.user_id == user_id,
        UserCourse.progress_percent == 100,
    ).count()
    return count >= target


def _check_post_count(user_id: int, target: int, db: Session) -> bool:
    count = db.query(Post).filter(Post.user_id == user_id).count()
    return count >= target


def _check_session_count(user_id: int, target: int, db: Session) -> bool:
    count = db.query(LearningSession).filter(
        LearningSession.user_id == user_id,
    ).count()
    return count >= target