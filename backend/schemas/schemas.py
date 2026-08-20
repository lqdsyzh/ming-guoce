from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any
from datetime import datetime
from models.course import CourseLevel, LessonType
from models.community import ForumTopic
from models.achievement import Badge


# --- Auth ---
class UserRegister(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: str = Field(min_length=5, max_length=100)
    password: str = Field(min_length=6, max_length=100)
    nickname: Optional[str] = ""
    native_language: Optional[str] = "zh"


class UserLogin(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


# --- User ---
class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    nickname: str
    avatar_url: str
    bio: str
    native_language: str
    created_at: datetime

    class Config:
        from_attributes = True


class UserProfileUpdate(BaseModel):
    nickname: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    native_language: Optional[str] = None


# --- Language ---
class LanguageResponse(BaseModel):
    id: int
    code: str
    name: str
    native_name: str
    flag_emoji: str
    is_active: bool

    class Config:
        from_attributes = True


# --- Course ---
class CourseResponse(BaseModel):
    id: int
    language_id: int
    title: str
    description: str
    level: CourseLevel
    cover_image: str
    total_lessons: int
    estimated_hours: float
    is_published: bool
    level_name: str = ""
    language_name: str = ""
    progress_percent: Optional[float] = 0.0

    class Config:
        from_attributes = True


class LessonResponse(BaseModel):
    id: int
    course_id: int
    title: str
    description: str
    lesson_type: LessonType
    sort_order: int
    xp_reward: int
    estimated_minutes: int
    is_free: bool
    is_completed: Optional[bool] = False
    user_score: Optional[float] = None
    user_xp_earned: Optional[int] = 0

    class Config:
        from_attributes = True


class LessonDetailResponse(BaseModel):
    id: int
    course_id: int
    title: str
    description: str
    lesson_type: LessonType
    sort_order: int
    xp_reward: int
    estimated_minutes: int
    contents: List[Any] = []
    vocabulary: List[Any] = []
    grammar_rules: List[Any] = []
    speaking_exercises: List[Any] = []
    listening_exercises: List[Any] = []

    class Config:
        from_attributes = True


class VocabularyResponse(BaseModel):
    id: int
    word: str
    translation: str
    pronunciation: str
    audio_url: str
    example_sentence: str
    difficulty: int
    part_of_speech: str
    familiarity: Optional[int] = 0

    class Config:
        from_attributes = True


class GrammarRuleResponse(BaseModel):
    id: int
    title: str
    explanation: str
    examples: str
    difficulty: int

    class Config:
        from_attributes = True


class SpeakingExerciseResponse(BaseModel):
    id: int
    phrase: str
    translation: str
    audio_url: str
    reference_text: str
    difficulty: int

    class Config:
        from_attributes = True


class ListeningExerciseResponse(BaseModel):
    id: int
    audio_url: str
    transcript: str
    translation: str
    questions: str
    difficulty: int

    class Config:
        from_attributes = True


# --- Learning ---
class LessonCompleteRequest(BaseModel):
    score: Optional[float] = None
    xp_earned: Optional[int] = 10
    duration_minutes: Optional[int] = 0


class UserProgressResponse(BaseModel):
    total_courses: int = 0
    completed_lessons: int = 0
    total_lessons: int = 0
    total_xp: int = 0
    current_streak: int = 0
    longest_streak: int = 0
    total_study_days: int = 0
    recent_sessions: List[Any] = []

    class Config:
        from_attributes = True


class LearningSessionResponse(BaseModel):
    id: int
    date: datetime
    duration_minutes: int
    xp_earned: int
    lessons_completed: int

    class Config:
        from_attributes = True


# --- Community ---
class PostCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    content: str = Field(min_length=1)
    topic: ForumTopic = ForumTopic.GENERAL
    language_id: Optional[int] = None


class PostResponse(BaseModel):
    id: int
    user_id: int
    title: str
    content: str
    topic: ForumTopic
    language_id: Optional[int]
    view_count: int
    like_count: int
    comment_count: int
    is_pinned: bool
    author_name: str = ""
    author_avatar: str = ""
    created_at: datetime
    is_liked: Optional[bool] = False

    class Config:
        from_attributes = True


class CommentCreate(BaseModel):
    content: str = Field(min_length=1)
    parent_id: Optional[int] = None


class CommentResponse(BaseModel):
    id: int
    post_id: int
    user_id: int
    content: str
    parent_id: Optional[int]
    like_count: int
    author_name: str = ""
    author_avatar: str = ""
    created_at: datetime

    class Config:
        from_attributes = True


# --- Achievement ---
class AchievementResponse(BaseModel):
    id: int
    badge: Badge
    title: str
    description: str
    icon_url: str
    xp_reward: int
    earned: bool = False
    earned_at: Optional[datetime] = None
    is_new: Optional[bool] = False

    class Config:
        from_attributes = True


# --- Recommendation ---
class RecommendationResponse(BaseModel):
    course: CourseResponse
    reason: str = ""
    match_score: float = 0.0