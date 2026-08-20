from sqlalchemy.orm import Session
from sqlalchemy import desc
from models.course import Course, CourseLevel
from models.learning import UserCourse, UserLesson
from models.user import User
from typing import List, Tuple


def get_recommendations(user_id: int, db: Session, limit: int = 6) -> List[Tuple[Course, float, str]]:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return []

    # Get user's enrolled courses
    enrolled_course_ids = [
        uc.course_id for uc in db.query(UserCourse).filter(UserCourse.user_id == user_id).all()
    ]

    # Get user's completed lessons per course
    completed_lessons = db.query(UserLesson).filter(
        UserLesson.user_id == user_id,
        UserLesson.is_completed == True,
    ).count()

    # Determine user level based on completed lessons
    if completed_lessons < 5:
        user_level = CourseLevel.BEGINNER
    elif completed_lessons < 15:
        user_level = CourseLevel.ELEMENTARY
    elif completed_lessons < 30:
        user_level = CourseLevel.INTERMEDIATE
    elif completed_lessons < 50:
        user_level = CourseLevel.UPPER_INTERMEDIATE
    elif completed_lessons < 80:
        user_level = CourseLevel.ADVANCED
    else:
        user_level = CourseLevel.MASTER

    level_order = {
        CourseLevel.BEGINNER: 0, CourseLevel.ELEMENTARY: 1,
        CourseLevel.INTERMEDIATE: 2, CourseLevel.UPPER_INTERMEDIATE: 3,
        CourseLevel.ADVANCED: 4, CourseLevel.MASTER: 5,
    }

    # Get recommendations
    candidates = db.query(Course).filter(
        Course.is_published == True,
        ~Course.id.in_(enrolled_course_ids) if enrolled_course_ids else True,
    ).all()

    scored = []
    for course in candidates:
        score = 0.0
        reason = ""

        # Level match
        level_diff = abs(level_order.get(course.level, 0) - level_order.get(user_level, 0))
        if level_diff == 0:
            score += 0.5
            reason = "符合你当前的学习水平"
        elif level_diff == 1:
            score += 0.3
            reason = "略微超出当前水平，适合挑战提升"
        else:
            score += 0.1
            reason = "拓展学习新领域"

        # Same language preference
        if course.language_id:
            enrolled_langs = set(
                c.language_id for c in db.query(Course).filter(
                    Course.id.in_(enrolled_course_ids)
                ).all() if c.language_id
            )
            if course.language_id in enrolled_langs:
                score += 0.2
                reason = "继续深入学习你正在学习的语言"

        scored.append((course, score, reason))

    scored.sort(key=lambda x: x[1], reverse=True)
    return scored[:limit]