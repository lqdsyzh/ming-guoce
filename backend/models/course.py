from sqlalchemy import (
    Column, Integer, String, DateTime, Boolean, Text, ForeignKey, Enum, Float,
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from database import Base


class CourseLevel(enum.Enum):
    BEGINNER = "beginner"
    ELEMENTARY = "elementary"
    INTERMEDIATE = "intermediate"
    UPPER_INTERMEDIATE = "upper_intermediate"
    ADVANCED = "advanced"
    MASTER = "master"


class LessonType(enum.Enum):
    VOCABULARY = "vocabulary"
    GRAMMAR = "grammar"
    SPEAKING = "speaking"
    LISTENING = "listening"
    REVIEW = "review"
    QUIZ = "quiz"


class Language(Base):
    __tablename__ = "languages"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(10), unique=True, index=True, nullable=False)
    name = Column(String(50), nullable=False)
    native_name = Column(String(50), nullable=False)
    flag_emoji = Column(String(10), default="")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    courses = relationship("Course", back_populates="language")


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    language_id = Column(Integer, ForeignKey("languages.id"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, default="")
    level = Column(Enum(CourseLevel), nullable=False, default=CourseLevel.BEGINNER)
    cover_image = Column(String(255), default="")
    total_lessons = Column(Integer, default=0)
    estimated_hours = Column(Float, default=0)
    is_published = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    language = relationship("Language", back_populates="courses")
    lessons = relationship("Lesson", back_populates="course", order_by="Lesson.sort_order")


class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, default="")
    lesson_type = Column(Enum(LessonType), nullable=False)
    sort_order = Column(Integer, default=0)
    xp_reward = Column(Integer, default=10)
    estimated_minutes = Column(Integer, default=10)
    is_free = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    course = relationship("Course", back_populates="lessons")
    contents = relationship("LessonContent", back_populates="lesson", order_by="LessonContent.sort_order")


class LessonContent(Base):
    __tablename__ = "lesson_contents"

    id = Column(Integer, primary_key=True, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=False)
    content_type = Column(String(50), nullable=False)  # text, image, audio, video, quiz
    content_data = Column(Text, nullable=False)  # JSON string
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    lesson = relationship("Lesson", back_populates="contents")


class Vocabulary(Base):
    __tablename__ = "vocabulary"

    id = Column(Integer, primary_key=True, index=True)
    language_id = Column(Integer, ForeignKey("languages.id"), nullable=False)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=True)
    word = Column(String(100), nullable=False)
    translation = Column(String(200), nullable=False)
    pronunciation = Column(String(200), default="")
    audio_url = Column(String(255), default="")
    example_sentence = Column(Text, default="")
    difficulty = Column(Integer, default=1)  # 1-5
    part_of_speech = Column(String(50), default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class GrammarRule(Base):
    __tablename__ = "grammar_rules"

    id = Column(Integer, primary_key=True, index=True)
    language_id = Column(Integer, ForeignKey("languages.id"), nullable=False)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=True)
    title = Column(String(200), nullable=False)
    explanation = Column(Text, nullable=False)
    examples = Column(Text, default="")  # JSON array
    difficulty = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class SpeakingExercise(Base):
    __tablename__ = "speaking_exercises"

    id = Column(Integer, primary_key=True, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=False)
    phrase = Column(String(500), nullable=False)
    translation = Column(String(500), nullable=False)
    audio_url = Column(String(255), default="")
    reference_text = Column(Text, default="")
    difficulty = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ListeningExercise(Base):
    __tablename__ = "listening_exercises"

    id = Column(Integer, primary_key=True, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=False)
    audio_url = Column(String(255), nullable=False)
    transcript = Column(Text, nullable=False)
    translation = Column(Text, default="")
    questions = Column(Text, default="")  # JSON array
    difficulty = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())