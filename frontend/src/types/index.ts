export interface User {
  id: number;
  username: string;
  email: string;
  nickname: string;
  avatar_url: string;
  bio: string;
  native_language: string;
  created_at: string;
}

export interface Language {
  id: number;
  code: string;
  name: string;
  native_name: string;
  flag_emoji: string;
  is_active: boolean;
}

export interface Course {
  id: number;
  language_id: number;
  title: string;
  description: string;
  level: string;
  cover_image: string;
  total_lessons: number;
  estimated_hours: number;
  is_published: boolean;
  level_name: string;
  language_name: string;
  progress_percent: number;
}

export interface Lesson {
  id: number;
  course_id: number;
  title: string;
  description: string;
  lesson_type: string;
  sort_order: number;
  xp_reward: number;
  estimated_minutes: number;
  is_free: boolean;
  is_completed: boolean;
  user_score: number | null;
  user_xp_earned: number;
}

export interface LessonDetail {
  id: number;
  course_id: number;
  title: string;
  description: string;
  lesson_type: string;
  sort_order: number;
  xp_reward: number;
  estimated_minutes: number;
  contents: LessonContent[];
  vocabulary: Vocabulary[];
  grammar_rules: GrammarRule[];
  speaking_exercises: SpeakingExercise[];
  listening_exercises: ListeningExercise[];
}

export interface LessonContent {
  id: number;
  type: string;
  data: string;
  order: number;
}

export interface Vocabulary {
  id: number;
  word: string;
  translation: string;
  pronunciation: string;
  audio_url: string;
  example_sentence: string;
  difficulty: number;
  part_of_speech: string;
  familiarity?: number;
}

export interface GrammarRule {
  id: number;
  title: string;
  explanation: string;
  examples: string;
  difficulty: number;
}

export interface SpeakingExercise {
  id: number;
  phrase: string;
  translation: string;
  audio_url: string;
  reference_text: string;
  difficulty: number;
}

export interface ListeningExercise {
  id: number;
  audio_url: string;
  transcript: string;
  translation: string;
  questions: string;
  difficulty: number;
}

export interface UserProgress {
  total_courses: number;
  completed_lessons: number;
  total_lessons: number;
  total_xp: number;
  current_streak: number;
  longest_streak: number;
  total_study_days: number;
  recent_sessions: LearningSession[];
}

export interface LearningSession {
  id: number;
  date: string;
  duration_minutes: number;
  xp_earned: number;
  lessons_completed: number;
}

export interface Post {
  id: number;
  user_id: number;
  title: string;
  content: string;
  topic: string;
  language_id: number | null;
  view_count: number;
  like_count: number;
  comment_count: number;
  is_pinned: boolean;
  author_name: string;
  author_avatar: string;
  created_at: string;
  is_liked: boolean;
}

export interface Comment {
  id: number;
  post_id: number;
  user_id: number;
  content: string;
  parent_id: number | null;
  like_count: number;
  author_name: string;
  author_avatar: string;
  created_at: string;
}

export interface Achievement {
  id: number;
  badge: string;
  title: string;
  description: string;
  icon_url: string;
  xp_reward: number;
  earned: boolean;
  earned_at: string | null;
  is_new: boolean;
}

export interface Recommendation {
  course: Course;
  reason: string;
  match_score: number;
}

export interface UserStats {
  total_xp: number;
  completed_lessons: number;
  vocabulary_mastered: number;
  achievements_earned: number;
}