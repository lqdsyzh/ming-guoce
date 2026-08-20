import json
import enum
from datetime import datetime

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, SessionLocal, Base
from models.course import (
    Language, Course, Lesson, LessonContent, LessonType, CourseLevel,
    Vocabulary, GrammarRule, SpeakingExercise, ListeningExercise,
)
from models.achievement import Achievement, Badge
from models.user import User

from routers import auth, courses, learning, community, users

app = FastAPI(title="LinguaLearn API", description="多语种在线学习平台", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(courses.router)
app.include_router(learning.router)
app.include_router(community.router)
app.include_router(users.router)


@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)
    seed_data()


def seed_data():
    """Seed initial data for the platform."""
    db = SessionLocal()
    try:
        # Check if data already exists
        if db.query(Language).count() > 0:
            return

        # --- Languages ---
        en = Language(code="en", name="English", native_name="English", flag_emoji="🇺🇸")
        ja = Language(code="ja", name="Japanese", native_name="日本語", flag_emoji="🇯🇵")
        ko = Language(code="ko", name="Korean", native_name="한국어", flag_emoji="🇰🇷")
        fr = Language(code="fr", name="French", native_name="Français", flag_emoji="🇫🇷")
        de = Language(code="de", name="German", native_name="Deutsch", flag_emoji="🇩🇪")
        es = Language(code="es", name="Spanish", native_name="Español", flag_emoji="🇪🇸")
        db.add_all([en, ja, ko, fr, de, es])
        db.commit()

        # --- Courses for English ---
        courses_data = [
            (en, CourseLevel.BEGINNER, "英语入门基础", "从零开始学习英语，掌握基础词汇和日常会话", 20, 15),
            (en, CourseLevel.ELEMENTARY, "初级英语进阶", "巩固基础，学习更多实用表达", 25, 20),
            (en, CourseLevel.INTERMEDIATE, "中级英语提升", "提升英语综合能力，流利日常交流", 30, 25),
            (en, CourseLevel.ADVANCED, "高级英语精通", "精通英语，学术与商务场景全覆盖", 35, 30),
        ]
        courses = []
        for lang, level, title, desc, lessons, hours in courses_data:
            c = Course(
                language_id=lang.id, title=title, description=desc,
                level=level, total_lessons=lessons, estimated_hours=hours,
                sort_order=len(courses),
            )
            db.add(c)
            courses.append(c)
        db.commit()

        # --- Courses for Japanese ---
        ja_courses = [
            (ja, CourseLevel.BEGINNER, "日语入门基础", "从五十音图开始，掌握日语基础", 20, 15),
            (ja, CourseLevel.ELEMENTARY, "初级日语进阶", "学习基本语法和日常会话", 25, 20),
            (ja, CourseLevel.INTERMEDIATE, "中级日语提升", "深入学习日语表达和文化", 30, 25),
        ]
        for lang, level, title, desc, lessons, hours in ja_courses:
            c = Course(
                language_id=lang.id, title=title, description=desc,
                level=level, total_lessons=lessons, estimated_hours=hours,
                sort_order=0,
            )
            db.add(c)
            courses.append(c)
        db.commit()

        # --- Courses for Korean ---
        ko_courses = [
            (ko, CourseLevel.BEGINNER, "韩语入门基础", "从韩语字母开始，掌握韩语基础", 20, 15),
            (ko, CourseLevel.ELEMENTARY, "初级韩语进阶", "学习基本语法和日常表达", 25, 20),
            (ko, CourseLevel.INTERMEDIATE, "中级韩语提升", "深入韩语学习和文化理解", 30, 25),
        ]
        for lang, level, title, desc, lessons, hours in ko_courses:
            c = Course(
                language_id=lang.id, title=title, description=desc,
                level=level, total_lessons=lessons, estimated_hours=hours,
                sort_order=0,
            )
            db.add(c)
        db.commit()

        # --- Lessons for English Beginner ---
        eng_beginner = db.query(Course).filter(
            Course.language_id == en.id, Course.level == CourseLevel.BEGINNER
        ).first()

        lesson_defs = [
            ("字母与发音", "学习26个英文字母和基本发音规则", LessonType.VOCABULARY, 1, 10, 15),
            ("基础问候语", "学习打招呼和自我介绍", LessonType.VOCABULARY, 2, 10, 10),
            ("数字与时间", "学习数字表达和时间说法", LessonType.VOCABULARY, 3, 10, 10),
            ("基本语法：be动词", "掌握be动词的用法", LessonType.GRAMMAR, 4, 15, 12),
            ("日常动词入门", "学习常用动词和简单句", LessonType.VOCABULARY, 5, 10, 10),
            ("口语跟读：自我介绍", "练习自我介绍的口语表达", LessonType.SPEAKING, 6, 15, 10),
            ("听力训练：日常对话", "练习听懂简单日常对话", LessonType.LISTENING, 7, 15, 10),
            ("颜色与描述", "学习颜色词汇和描述性语言", LessonType.VOCABULARY, 8, 10, 10),
            ("基本语法：一般现在时", "掌握一般现在时的用法", LessonType.GRAMMAR, 9, 15, 12),
            ("综合复习", "复习前9课内容", LessonType.REVIEW, 10, 20, 15),
        ]

        english_lessons = []
        for title, desc, ltype, order, xp, minutes in lesson_defs:
            lesson = Lesson(
                course_id=eng_beginner.id, title=title, description=desc,
                lesson_type=ltype, sort_order=order, xp_reward=xp,
                estimated_minutes=minutes,
            )
            db.add(lesson)
            english_lessons.append(lesson)
        db.commit()

        # --- Vocabulary for English Beginner ---
        vocab_data = [
            ("hello", "你好", "/həˈloʊ/", "Hello, how are you?", 1, "interjection"),
            ("goodbye", "再见", "/ɡʊdˈbaɪ/", "Goodbye, see you tomorrow!", 1, "interjection"),
            ("thank you", "谢谢", "/θæŋk juː/", "Thank you very much!", 1, "phrase"),
            ("yes", "是的", "/jɛs/", "Yes, I understand.", 1, "adverb"),
            ("no", "不", "/noʊ/", "No, thank you.", 1, "adverb"),
            ("please", "请", "/pliːz/", "Please help me.", 1, "adverb"),
            ("sorry", "对不起", "/ˈsɒri/", "I'm sorry.", 1, "adjective"),
            ("name", "名字", "/neɪm/", "My name is John.", 1, "noun"),
            ("friend", "朋友", "/frɛnd/", "She is my friend.", 1, "noun"),
            ("water", "水", "/ˈwɔːtər/", "I need some water.", 1, "noun"),
            ("book", "书", "/bʊk/", "This is a good book.", 1, "noun"),
            ("school", "学校", "/skuːl/", "I go to school.", 1, "noun"),
            ("teacher", "老师", "/ˈtiːtʃər/", "She is a teacher.", 1, "noun"),
            ("student", "学生", "/ˈstuːdənt/", "He is a student.", 1, "noun"),
            ("family", "家庭", "/ˈfæməli/", "I love my family.", 1, "noun"),
        ]
        for word, trans, pron, example, diff, pos in vocab_data:
            db.add(Vocabulary(
                language_id=en.id, lesson_id=english_lessons[0].id,
                word=word, translation=trans, pronunciation=pron,
                example_sentence=example, difficulty=diff, part_of_speech=pos,
            ))
        db.commit()

        # More vocabulary for lesson 2 (greetings)
        greetings = [
            ("good morning", "早上好", "/ɡʊd ˈmɔːrnɪŋ/", "Good morning, everyone!", 1, "phrase"),
            ("good afternoon", "下午好", "/ɡʊd æftərˈnuːn/", "Good afternoon, class.", 1, "phrase"),
            ("good evening", "晚上好", "/ɡʊd ˈiːvnɪŋ/", "Good evening, mom.", 1, "phrase"),
            ("how are you", "你好吗", "/haʊ ɑːr juː/", "How are you today?", 1, "phrase"),
            ("I'm fine", "我很好", "/aɪm faɪn/", "I'm fine, thank you.", 1, "phrase"),
            ("nice to meet you", "很高兴认识你", "/naɪs tuː miːt juː/", "Nice to meet you too!", 1, "phrase"),
        ]
        for word, trans, pron, example, diff, pos in greetings:
            db.add(Vocabulary(
                language_id=en.id, lesson_id=english_lessons[1].id,
                word=word, translation=trans, pronunciation=pron,
                example_sentence=example, difficulty=diff, part_of_speech=pos,
            ))
        db.commit()

        # Numbers vocabulary
        numbers = [
            ("one", "一", "/wʌn/", "I have one book.", 1, "numeral"),
            ("two", "二", "/tuː/", "Two apples, please.", 1, "numeral"),
            ("three", "三", "/θriː/", "Three cats.", 1, "numeral"),
            ("four", "四", "/fɔːr/", "Four seasons.", 1, "numeral"),
            ("five", "五", "/faɪv/", "Five fingers.", 1, "numeral"),
            ("ten", "十", "/tɛn/", "Ten students.", 1, "numeral"),
            ("hundred", "百", "/ˈhʌndrəd/", "One hundred dollars.", 2, "numeral"),
            ("time", "时间", "/taɪm/", "What time is it?", 1, "noun"),
            ("today", "今天", "/təˈdeɪ/", "Today is Monday.", 1, "noun"),
            ("tomorrow", "明天", "/təˈmɔːroʊ/", "See you tomorrow.", 1, "noun"),
        ]
        for word, trans, pron, example, diff, pos in numbers:
            db.add(Vocabulary(
                language_id=en.id, lesson_id=english_lessons[2].id,
                word=word, translation=trans, pronunciation=pron,
                example_sentence=example, difficulty=diff, part_of_speech=pos,
            ))
        db.commit()

        # --- Grammar Rules ---
        grammar_data = [
            ("be动词：am/is/are", "be动词用于表示状态或身份。\n- I **am** a student.\n- She **is** a teacher.\n- They **are** friends.\n\n肯定句：主语 + be动词 + 其他\n否定句：主语 + be动词 + not + 其他\n疑问句：Be动词 + 主语 + 其他？",
             '["I am happy.", "She is not here.", "Are you ready?"]', 1, english_lessons[3].id),
            ("一般现在时", "一般现在时表示经常发生的动作或普遍真理。\n\n动词变化：\n- 第三人称单数加 -s/-es\n- 其他情况用动词原形\n\n肯定句：主语 + 动词(+s/es) + 其他\n否定句：主语 + don't/doesn't + 动词原形\n疑问句：Do/Does + 主语 + 动词原形？",
             '["I eat breakfast every day.", "She reads books.", "They don\'t like coffee."]', 2, english_lessons[8].id),
        ]
        for title, explanation, examples, diff, lesson_id in grammar_data:
            db.add(GrammarRule(
                language_id=en.id, lesson_id=lesson_id,
                title=title, explanation=explanation,
                examples=examples, difficulty=diff,
            ))
        db.commit()

        # --- Speaking Exercises ---
        speaking_data = [
            ("Hello! My name is [name]. Nice to meet you!",
             "你好！我叫[name]。很高兴认识你！",
             "", 1, english_lessons[5].id),
            ("Good morning! How are you today?",
             "早上好！你今天怎么样？",
             "", 1, english_lessons[5].id),
            ("I am from [country]. I am a student.",
             "我来自[国家]。我是一名学生。",
             "", 1, english_lessons[5].id),
        ]
        for phrase, trans, audio, diff, lesson_id in speaking_data:
            db.add(SpeakingExercise(
                lesson_id=lesson_id, phrase=phrase,
                translation=trans, audio_url=audio,
                reference_text=phrase, difficulty=diff,
            ))
        db.commit()

        # --- Listening Exercises ---
        listening_data = [
            ("", "A: Hello! How are you?\nB: I'm fine, thank you! And you?\nA: I'm great, thanks!",
             "A：你好！你好吗？\nB：我很好，谢谢！你呢？\nA：我很好，谢谢！",
             '[{"question": "How is B feeling?", "options": ["Sad", "Fine", "Tired", "Angry"], "answer": 1}, {"question": "What does A say at the end?", "options": ["Goodbye", "I\'m great, thanks", "I\'m tired", "See you"], "answer": 1}]',
             1, english_lessons[6].id),
        ]
        for audio, transcript, translation, questions, diff, lesson_id in listening_data:
            db.add(ListeningExercise(
                lesson_id=lesson_id, audio_url=audio,
                transcript=transcript, translation=translation,
                questions=questions, difficulty=diff,
            ))
        db.commit()

        # --- Japanese Course: Lessons ---
        ja_beginner = db.query(Course).filter(
            Course.language_id == ja.id, Course.level == CourseLevel.BEGINNER
        ).first()

        ja_lessons_data = [
            ("五十音图：平假名", "学习日语平假名（あいうえお）", LessonType.VOCABULARY, 1, 15, 20),
            ("五十音图：片假名", "学习日语片假名（アイウエオ）", LessonType.VOCABULARY, 2, 15, 20),
            ("基础问候语", "学习日语日常问候", LessonType.VOCABULARY, 3, 10, 10),
            ("基本语法：です/ます", "掌握敬体基本句型", LessonType.GRAMMAR, 4, 15, 12),
            ("数字与量词", "学习日语数字和量词表达", LessonType.VOCABULARY, 5, 10, 12),
            ("口语跟读：自我介绍", "练习日语自我介绍", LessonType.SPEAKING, 6, 15, 10),
            ("听力训练：简单对话", "练习听懂日语简单对话", LessonType.LISTENING, 7, 15, 10),
        ]
        ja_lessons = []
        for title, desc, ltype, order, xp, minutes in ja_lessons_data:
            lesson = Lesson(
                course_id=ja_beginner.id, title=title, description=desc,
                lesson_type=ltype, sort_order=order, xp_reward=xp,
                estimated_minutes=minutes,
            )
            db.add(lesson)
            ja_lessons.append(lesson)
        db.commit()

        # Japanese vocabulary
        ja_vocab = [
            ("こんにちは", "你好", "konnichiwa", "こんにちは、元気ですか？", 1, "问候"),
            ("ありがとう", "谢谢", "arigatou", "ありがとうございます。", 1, "问候"),
            ("すみません", "对不起/打扰了", "sumimasen", "すみません、駅はどこですか？", 1, "短语"),
            ("はい", "是的", "hai", "はい、そうです。", 1, "副词"),
            ("いいえ", "不", "iie", "いいえ、違います。", 1, "副词"),
            ("さようなら", "再见", "sayounara", "さようなら、また明日。", 1, "问候"),
            ("おはよう", "早上好", "ohayou", "おはようございます。", 1, "问候"),
            ("おやすみ", "晚安", "oyasumi", "おやすみなさい。", 1, "问候"),
        ]
        for word, trans, pron, example, diff, pos in ja_vocab:
            db.add(Vocabulary(
                language_id=ja.id, lesson_id=ja_lessons[2].id,
                word=word, translation=trans, pronunciation=pron,
                example_sentence=example, difficulty=diff, part_of_speech=pos,
            ))
        db.commit()

        # Japanese grammar
        db.add(GrammarRule(
            language_id=ja.id, lesson_id=ja_lessons[3].id,
            title="です/ます体",
            explanation="日语敬体（丁寧体）的基本形式。\n\n**名詞文：**\n- 〜は〜です（肯定）\n- 〜は〜ではありません（否定）\n- 〜は〜ですか？（疑问）\n\n**動詞文：**\n- 〜ます（肯定）\n- 〜ません（否定）\n\n例：\n- 私は学生です。\n- これは本です。\n- コーヒーを飲みます。",
            examples='["私は学生です。", "これは本ではありません。", "毎日勉強します。"]',
            difficulty=1,
        ))
        db.commit()

        # --- Korean Course: Lessons ---
        ko_beginner = db.query(Course).filter(
            Course.language_id == ko.id, Course.level == CourseLevel.BEGINNER
        ).first()

        ko_lessons_data = [
            ("韩语字母：元音", "学习韩语基本元音（ㅏㅓㅗㅜ等）", LessonType.VOCABULARY, 1, 15, 20),
            ("韩语字母：辅音", "学习韩语基本辅音（ㄱㄴㄷㄹ等）", LessonType.VOCABULARY, 2, 15, 20),
            ("基础问候语", "学习韩语日常问候", LessonType.VOCABULARY, 3, 10, 10),
            ("基本语法：입니다/있습니다", "掌握韩语基本句型", LessonType.GRAMMAR, 4, 15, 12),
            ("数字与计数", "学习韩语数字和计数单位", LessonType.VOCABULARY, 5, 10, 12),
            ("口语跟读：自我介绍", "练习韩语自我介绍", LessonType.SPEAKING, 6, 15, 10),
            ("听力训练：日常对话", "练习听懂韩语日常对话", LessonType.LISTENING, 7, 15, 10),
        ]
        ko_lessons = []
        for title, desc, ltype, order, xp, minutes in ko_lessons_data:
            lesson = Lesson(
                course_id=ko_beginner.id, title=title, description=desc,
                lesson_type=ltype, sort_order=order, xp_reward=xp,
                estimated_minutes=minutes,
            )
            db.add(lesson)
            ko_lessons.append(lesson)
        db.commit()

        # Korean vocabulary
        ko_vocab = [
            ("안녕하세요", "你好", "annyeonghaseyo", "안녕하세요, 만나서 반갑습니다.", 1, "问候"),
            ("감사합니다", "谢谢", "gamsahamnida", "감사합니다, 도와주셔서.", 1, "问候"),
            ("죄송합니다", "对不起", "joesonghamnida", "죄송합니다, 늦었습니다.", 1, "短语"),
            ("네", "是的", "ne", "네, 맞습니다.", 1, "副词"),
            ("아니요", "不", "aniyo", "아니요, 괜찮습니다.", 1, "副词"),
            ("안녕히 계세요", "再见", "annyeonghi gyeseyo", "안녕히 계세요, 내일 봐요.", 1, "问候"),
            ("사랑해요", "我爱你", "saranghaeyo", "사랑해요, 행복해요.", 1, "动词"),
            ("물", "水", "mul", "물 좀 주세요.", 1, "名词"),
        ]
        for word, trans, pron, example, diff, pos in ko_vocab:
            db.add(Vocabulary(
                language_id=ko.id, lesson_id=ko_lessons[2].id,
                word=word, translation=trans, pronunciation=pron,
                example_sentence=example, difficulty=diff, part_of_speech=pos,
            ))
        db.commit()

        # Korean grammar
        db.add(GrammarRule(
            language_id=ko.id, lesson_id=ko_lessons[3].id,
            title="입니다/있습니다 句型",
            explanation="韩语基本句型结构。\n\n**名词+입니다**（是...）\n- 저는 학생입니다.（我是学生。）\n\n**名词+이/가 있습니다**（有...）\n- 책이 있습니다.（有书。）\n\n**否定：**名词+이/가 아닙니다（不是...）\n- 이것은 책이 아닙니다.（这不是书。）",
            examples='["저는 학생입니다.", "책이 있습니다.", "이것은 아닙니다."]',
            difficulty=1,
        ))
        db.commit()

        # --- Lesson Contents for English Beginner Lesson 1 ---
        db.add(LessonContent(
            lesson_id=english_lessons[0].id,
            content_type="text",
            content_data=json.dumps({
                "title": "欢迎来到英语入门课程",
                "body": "在这节课中，我们将学习26个英文字母和它们的发音。\n\n英语字母分为元音（Vowels）和辅音（Consonants）。\n\n**元音字母：** A, E, I, O, U\n**辅音字母：** 其余21个字母",
            }),
            sort_order=1,
        ))
        db.add(LessonContent(
            lesson_id=english_lessons[0].id,
            content_type="text",
            content_data=json.dumps({
                "title": "字母发音表",
                "body": "A /eɪ/ - 苹果 Apple\nB /biː/ - 球 Ball\nC /siː/ - 猫 Cat\nD /diː/ - 狗 Dog\nE /iː/ - 蛋 Egg\n\n每个字母都有大小写两种形式，句子开头和专有名词要大写。",
            }),
            sort_order=2,
        ))
        db.add(LessonContent(
            lesson_id=english_lessons[0].id,
            content_type="quiz",
            content_data=json.dumps({
                "question": "英语字母表有多少个字母？",
                "options": ["24个", "26个", "28个", "30个"],
                "answer": 1,
            }),
            sort_order=3,
        ))
        db.commit()

        # Lesson content for lesson 2 (greetings)
        db.add(LessonContent(
            lesson_id=english_lessons[1].id,
            content_type="text",
            content_data=json.dumps({
                "title": "日常问候语",
                "body": "学习以下基本问候语：\n\n1. **Hello!** - 你好！\n2. **Good morning!** - 早上好！\n3. **Good afternoon!** - 下午好！\n4. **Good evening!** - 晚上好！\n5. **How are you?** - 你好吗？\n6. **I'm fine, thank you.** - 我很好，谢谢。\n7. **Nice to meet you!** - 很高兴认识你！",
            }),
            sort_order=1,
        ))
        db.add(LessonContent(
            lesson_id=english_lessons[1].id,
            content_type="quiz",
            content_data=json.dumps({
                "question": "\"Good morning\" 应该在什么时间使用？",
                "options": ["下午", "晚上", "早上", "午夜"],
                "answer": 2,
            }),
            sort_order=2,
        ))
        db.commit()

        # --- Achievements ---
        achievements = [
            (Badge.FIRST_LESSON, "第一步", "完成第一节课", "lesson", 1, 50),
            (Badge.QUICK_LEARNER, "快速学习者", "一周内完成5节课", "lesson", 5, 100),
            (Badge.STREAK_3, "坚持3天", "连续学习3天", "streak", 3, 50),
            (Badge.STREAK_7, "坚持7天", "连续学习7天", "streak", 7, 150),
            (Badge.STREAK_30, "坚持30天", "连续学习30天", "streak", 30, 500),
            (Badge.STREAK_100, "坚持100天", "连续学习100天", "streak", 100, 2000),
            (Badge.VOCAB_100, "词汇达人", "掌握100个词汇", "vocab", 100, 200),
            (Badge.VOCAB_500, "词汇大师", "掌握500个词汇", "vocab", 500, 800),
            (Badge.VOCAB_1000, "词汇收藏家", "掌握1000个词汇", "vocab", 1000, 2000),
            (Badge.PERFECT_SCORE, "完美主义者", "获得5次满分", "score", 5, 200),
            (Badge.COURSE_COMPLETE, "课程毕业", "完成一门完整课程", "course", 1, 300),
            (Badge.SOCIAL_BUTTERFLY, "社交蝴蝶", "在社区发布5个帖子", "post", 5, 150),
            (Badge.HELPER, "热心助人", "获得10个帖子点赞", "post", 10, 200),
        ]

        for badge, title, desc, cond_type, cond_val, xp in achievements:
            db.add(Achievement(
                badge=badge, title=title, description=desc,
                condition_type=cond_type, condition_value=cond_val,
                xp_reward=xp,
            ))
        db.commit()

        print("✅ Seed data created successfully!")
    except Exception as e:
        print(f"Seed data error: {e}")
    finally:
        db.close()


@app.get("/")
def root():
    return {
        "name": "LinguaLearn API",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "auth": "/api/auth",
            "courses": "/api/courses",
            "learning": "/api/learning",
            "community": "/api/community",
            "users": "/api/users",
        },
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)