import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import type { Course, Lesson } from '../types';

const levelLabels: Record<string, string> = {
  beginner: '入门', elementary: '初级', intermediate: '中级',
  upper_intermediate: '中高级', advanced: '高级', master: '精通',
};

const typeIcons: Record<string, string> = {
  vocabulary: '📖', grammar: '📝', speaking: '🎤', listening: '🎧', review: '🔄', quiz: '✍️',
};

const typeLabels: Record<string, string> = {
  vocabulary: '词汇', grammar: '语法', speaking: '口语', listening: '听力', review: '复习', quiz: '测验',
};

export default function CourseDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      api.getCourseDetail(Number(id)),
      api.getLessons(Number(id)),
    ]).then(([c, l]) => {
      setCourse(c);
      setLessons(l);
    }).finally(() => setLoading(false));
  }, [id]);

  const handleEnroll = async () => {
    if (!id || !user) return;
    setEnrolling(true);
    try {
      await api.enrollCourse(Number(id));
      const c = await api.getCourseDetail(Number(id));
      setCourse(c);
    } catch (e) {
      console.error(e);
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!course) {
    return <div className="text-center py-20 text-gray-500">课程不存在</div>;
  }

  const completedCount = lessons.filter((l) => l.is_completed).length;
  const progress = course.progress_percent || (course.total_lessons > 0 ? (completedCount / course.total_lessons) * 100 : 0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Course Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-8">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-3">
              <span className="text-xs px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-full font-medium">
                {course.language_name}
              </span>
              <span className="text-xs px-2.5 py-0.5 bg-gray-100 text-gray-700 rounded-full font-medium">
                {levelLabels[course.level] || course.level}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">{course.title}</h1>
            <p className="text-gray-600 mb-4">{course.description}</p>
            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <span>📚 {course.total_lessons} 课时</span>
              <span>⏱ 约 {course.estimated_hours} 小时</span>
              {completedCount > 0 && <span>✅ 已完成 {completedCount} 课</span>}
            </div>
          </div>
        </div>

        {/* Progress */}
        {user && (
          <div className="mt-6">
            {progress > 0 ? (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">学习进度</span>
                  <span className="text-indigo-600 font-medium">{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div className="bg-indigo-600 h-3 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
            ) : (
              <button
                onClick={handleEnroll}
                disabled={enrolling}
                className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {enrolling ? '报名中...' : '报名学习'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Lessons */}
      <h2 className="text-xl font-semibold text-gray-900 mb-4">课程大纲</h2>
      <div className="space-y-3">
        {lessons.map((lesson, index) => (
          <Link
            key={lesson.id}
            to={user ? `/lessons/${lesson.id}` : '/login'}
            className={`block bg-white rounded-xl border ${
              lesson.is_completed ? 'border-green-200 bg-green-50/50' : 'border-gray-200'
            } p-5 hover:shadow-md transition-all`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                  lesson.is_completed ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  {lesson.is_completed ? '✅' : typeIcons[lesson.lesson_type] || '📖'}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-400">第 {index + 1} 课</span>
                    <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">
                      {typeLabels[lesson.lesson_type] || lesson.lesson_type}
                    </span>
                    {lesson.is_completed && lesson.user_score && (
                      <span className="text-xs text-green-600">得分 {lesson.user_score}</span>
                    )}
                  </div>
                  <h3 className="font-medium text-gray-900">{lesson.title}</h3>
                  <p className="text-sm text-gray-500">{lesson.description}</p>
                </div>
              </div>
              <div className="text-right text-sm text-gray-400">
                <div>+{lesson.xp_reward} XP</div>
                <div>{lesson.estimated_minutes} 分钟</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}