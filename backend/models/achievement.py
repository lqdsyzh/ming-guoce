from sqlalchemy import (
    Column, Integer, String, DateTime, Boolean, Text, ForeignKey, Enum, JSON,
)
from sqlalchemy.sql import func
import enum
from database import Base


class Badge(enum.Enum):
    FIRST_LESSON = "first_lesson"
    QUICK_LEARNER = "quick_learner"
    STREAK_3 = "streak_3"
    STREAK_7 = "streak_7"
    STREAK_30 = "streak_30"
    STREAK_100 = "streak_100"
    VOCAB_100 = "vocab_100"
    VOCAB_500 = "vocab_500"
    VOCAB_1000 = "vocab_1000"
    PERFECT_SCORE = "perfect_score"
    COURSE_COMPLETE = "course_complete"
    ALL_BEGINNER = "all_beginner"
    SOCIAL_BUTTERFLY = "social_butterfly"
    HELPER = "helper"
    EARLY_BIRD = "early_bird"
    WEEKEND_WARRIOR = "weekend_warrior"


class Achievement(Base):
    __tablename__ = "achievements"

    id = Column(Integer, primary_key=True, index=True)
    badge = Column(Enum(Badge), unique=True, nullable=False)
    title = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    icon_url = Column(String(255), default="")
    xp_reward = Column(Integer, default=0)
    condition_type = Column(String(50), nullable=False)  # streak, lesson, vocab, etc.
    condition_value = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class UserAchievement(Base):
    __tablename__ = "user_achievements"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    achievement_id = Column(Integer, ForeignKey("achievements.id"), nullable=False)
    earned_at = Column(DateTime(timezone=True), server_default=func.now())
    is_new = Column(Boolean, default=True)