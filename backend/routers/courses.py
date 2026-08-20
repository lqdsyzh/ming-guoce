from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional

from database import get_db
from models.course import (
    Language, Course, Lesson, LessonContent, Vocabulary, GrammarRule,
    SpeakingExercise, ListeningExercise, CourseLevel, LessonType,
)
from models.learning import UserCourse, UserLesson
from routers.auth import get_current_user
from models.user import User
from schemas.schemas import (
    LanguageResponse, CourseResponse, LessonResponse, LessonDetailResponse,
    VocabularyResponse, GrammarRuleResponse, SpeakingExerciseResponse,
    ListeningExerciseResponse,
)

router = APIRouter(prefix="/api", tags=["courses"])


# --- Languages ---
@router.get("/languages", response_model=List[LanguageResponse])
def get_languages(db: Session = Depends(get_db)):
    return db.query(Language).filter(Language.is_active == True).all()


# --- Courses ---
@router.get("/courses", response_model=List[CourseResponse])
def get_courses(
    language_id: Optional[int] = None,
    level: Optional[str] = None,
    user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Course).filter(Course.is_published == True)
    if language_id:
        query = query.filter(Course.language_id == language_id)
    if level:
        query = query.filter(Course.level == CourseLevel[level.upper()])

    courses = query.order_by(Course.sort_order).all()

    result = []
    # Get user progress
    user_courses = {}
    if user:
        ucs = db.query(UserCourse).filter(UserCourse.user_id == user.id).all()
        user_courses = {uc.course_id: uc.progress_percent for uc in ucs}

    for c in courses:
        cr = CourseResponse(
            id=c.id,
            language_id=c.language_id,
            title=c.title,
            description=c.description,
            level=c.level,
            cover_image=c.cover_image,
            total_lessons=c.total_lessons,
            estimated_hours=c.estimated_hours,
            is_published=c.is_published,
            level_name=c.level.value,
            language_name=c.language.name if c.language else "",
            progress_percent=user_courses.get(c.id, 0.0),
        )
        result.append(cr)
    return result


@router.get("/courses/{course_id}", response_model=CourseResponse)
def get_course_detail(
    course_id: int,
    user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    course = db.query(Course).options(joinedload(Course.language)).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="课程不存在")

    progress = 0.0
    if user:
        uc = db.query(UserCourse).filter(
            UserCourse.user_id == user.id, UserCourse.course_id == course_id
        ).first()
        if uc:
            progress = uc.progress_percent

    return CourseResponse(
        id=course.id,
        language_id=course.language_id,
        title=course.title,
        description=course.description,
        level=course.level,
        cover_image=course.cover_image,
        total_lessons=course.total_lessons,
        estimated_hours=course.estimated_hours,
        is_published=course.is_published,
        level_name=course.level.value,
        language_name=course.language.name if course.language else "",
        progress_percent=progress,
    )


# --- Lessons ---
@router.get("/courses/{course_id}/lessons", response_model=List[LessonResponse])
def get_lessons(
    course_id: int,
    user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="课程不存在")

    lessons = db.query(Lesson).filter(Lesson.course_id == course_id).order_by(Lesson.sort_order).all()

    user_lessons = {}
    if user:
        uls = db.query(UserLesson).filter(UserLesson.user_id == user.id).all()
        user_lessons = {ul.lesson_id: ul for ul in uls}

    result = []
    for lesson in lessons:
        ul = user_lessons.get(lesson.id)
        result.append(LessonResponse(
            id=lesson.id,
            course_id=lesson.course_id,
            title=lesson.title,
            description=lesson.description,
            lesson_type=lesson.lesson_type,
            sort_order=lesson.sort_order,
            xp_reward=lesson.xp_reward,
            estimated_minutes=lesson.estimated_minutes,
            is_free=lesson.is_free,
            is_completed=ul.is_completed if ul else False,
            user_score=ul.score if ul else None,
            user_xp_earned=ul.xp_earned if ul else 0,
        ))
    return result


@router.get("/lessons/{lesson_id}", response_model=LessonDetailResponse)
def get_lesson_detail(
    lesson_id: int,
    user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="课时不存在")

    contents = db.query(LessonContent).filter(
        LessonContent.lesson_id == lesson_id
    ).order_by(LessonContent.sort_order).all()

    vocabulary = db.query(Vocabulary).filter(Vocabulary.lesson_id == lesson_id).all()
    grammar = db.query(GrammarRule).filter(GrammarRule.lesson_id == lesson_id).all()
    speaking = db.query(SpeakingExercise).filter(SpeakingExercise.lesson_id == lesson_id).all()
    listening = db.query(ListeningExercise).filter(ListeningExercise.lesson_id == lesson_id).all()

    # If user, update vocabulary familiarity
    if user:
        from models.learning import UserVocabulary
        for v in vocabulary:
            uv = db.query(UserVocabulary).filter(
                UserVocabulary.user_id == user.id,
                UserVocabulary.vocabulary_id == v.id,
            ).first()
            v._familiarity = uv.familiarity if uv else 0

    return LessonDetailResponse(
        id=lesson.id,
        course_id=lesson.course_id,
        title=lesson.title,
        description=lesson.description,
        lesson_type=lesson.lesson_type,
        sort_order=lesson.sort_order,
        xp_reward=lesson.xp_reward,
        estimated_minutes=lesson.estimated_minutes,
        contents=[{"id": c.id, "type": c.content_type, "data": c.content_data, "order": c.sort_order} for c in contents],
        vocabulary=[VocabularyResponse(
            id=v.id, word=v.word, translation=v.translation,
            pronunciation=v.pronunciation, audio_url=v.audio_url,
            example_sentence=v.example_sentence, difficulty=v.difficulty,
            part_of_speech=v.part_of_speech,
            familiarity=getattr(v, '_familiarity', 0),
        ) for v in vocabulary],
        grammar_rules=[GrammarRuleResponse(
            id=g.id, title=g.title, explanation=g.explanation,
            examples=g.examples, difficulty=g.difficulty,
        ) for g in grammar],
        speaking_exercises=[SpeakingExerciseResponse(
            id=s.id, phrase=s.phrase, translation=s.translation,
            audio_url=s.audio_url, reference_text=s.reference_text,
            difficulty=s.difficulty,
        ) for s in speaking],
        listening_exercises=[ListeningExerciseResponse(
            id=l.id, audio_url=l.audio_url, transcript=l.transcript,
            translation=l.translation, questions=l.questions,
            difficulty=l.difficulty,
        ) for l in listening],
    )


@router.get("/vocabulary", response_model=List[VocabularyResponse])
def get_vocabulary(
    language_id: Optional[int] = None,
    difficulty: Optional[int] = None,
    limit: int = Query(default=20, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Vocabulary)
    if language_id:
        query = query.filter(Vocabulary.language_id == language_id)
    if difficulty:
        query = query.filter(Vocabulary.difficulty == difficulty)
    items = query.limit(limit).all()
    return [VocabularyResponse(
        id=v.id, word=v.word, translation=v.translation,
        pronunciation=v.pronunciation, audio_url=v.audio_url,
        example_sentence=v.example_sentence, difficulty=v.difficulty,
        part_of_speech=v.part_of_speech,
    ) for v in items]