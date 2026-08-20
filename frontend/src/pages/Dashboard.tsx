import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import type { UserProgress, Achievement, Recommendation } from '../types';

export default function Dashboard() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [courseProgress, setCourseProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getProgress(),
      api.getAchievements(),
      api.getRecommendations(),
      api.getCourseProgress(),
    ]).then(([p, a, r, c]) => {
      setProgress(p);
      setAchievements(a);
      setRecommendations(r);
      setCourseProgress(c);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">学习中心</h1>
        <p className="text-gray-500 mt-1">欢迎回来，{user?.nickname || user?.username}！继续你的学习之旅</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-2xl font-bold text-indigo-600">{progress?.total_xp || 0}</div>
          <div className="text-sm text-gray-500">总经验值</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-2xl font-bold text-green-600">{progress?.completed_lessons || 0}</div>
          <div className="text-sm text-gray-500">已完成课时</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-orange-600">{progress?.current_streak || 0}</span>
            <span className="text-sm text-orange-500">🔥</span>
          </div>
          <div className="text-sm text-gray-500">连续学习天数</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-2xl font-bold text-purple-600">{achievements.filter(a => a.earned).length}</div>
          <div className="text-sm text-gray-500">获得成就</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Course Progress */}
        <div className="lg:col-span-2 space-y-6">
          {/* Course Progress */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">课程进度</h2>
            {courseProgress.length > 0 ? (
              <div className="space-y-4">
                {courseProgress.map((cp) => (
                  <Link key={cp.course_id} to={`/courses/${cp.course_id}`} className="block">
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <span className="font-medium text-gray-900 text-sm">{cp.course_title}</span>
                        <span className="text-xs text-gray-400 ml-2">{cp.language_name}</span>
                      </div>
                      <span className="text-sm font-medium text-indigo-600">{Math.round(cp.progress_percent)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div className="bg-indigo-600 h-2.5 rounded-full transition-all" style={{ width: `${cp.progress_percent}%` }}></div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">还没有报名任何课程</p>
                <Link to="/courses" className="text-indigo-600 hover:text-indigo-800 font-medium">
                  浏览课程 →
                </Link>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">最近学习记录</h2>
            {progress?.recent_sessions && progress.recent_sessions.length > 0 ? (
              <div className="space-y-3">
                {progress.recent_sessions.map((s) => (
                  <div key={s.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-sm">📚</div>
                      <div>
                        <div className="text-sm text-gray-900">学习了 {s.lessons_completed} 课时</div>
                        <div className="text-xs text-gray-400">{new Date(s.date).toLocaleDateString('zh-CN')}</div>
                      </div>
                    </div>
                    <div className="text-sm text-indigo-600">+{s.xp_earned} XP</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                还没有学习记录，开始你的第一课吧！
              </div>
            )}
          </div>
        </div>

        {/* Right: Achievements & Recommendations */}
        <div className="space-y-6">
          {/* Achievements */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">成就徽章</h2>
              <Link to="/profile" className="text-sm text-indigo-600 hover:text-indigo-800">查看全部</Link>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {achievements.slice(0, 9).map((a) => (
                <div
                  key={a.id}
                  className={`text-center p-2 rounded-lg ${
                    a.earned ? 'bg-yellow-50' : 'bg-gray-50 opacity-50'
                  }`}
                  title={a.description}
                >
                  <div className="text-2xl mb-1">{a.earned ? '🏅' : '🔒'}</div>
                  <div className="text-xs text-gray-600 truncate">{a.title}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">推荐课程</h2>
            <div className="space-y-3">
              {recommendations.length > 0 ? (
                recommendations.slice(0, 4).map((rec) => (
                  <Link
                    key={rec.course.id}
                    to={`/courses/${rec.course.id}`}
                    className="block p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-gray-900 text-sm">{rec.course.title}</div>
                    <div className="text-xs text-gray-400 mt-1">{rec.reason}</div>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">暂无推荐</p>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">快捷入口</h2>
            <div className="space-y-2">
              <Link to="/courses" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <span className="text-xl">📚</span>
                <span className="text-sm text-gray-700">浏览课程</span>
              </Link>
              <Link to="/community" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <span className="text-xl">👥</span>
                <span className="text-sm text-gray-700">社区交流</span>
              </Link>
              <Link to="/profile" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <span className="text-xl">👤</span>
                <span className="text-sm text-gray-700">个人中心</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}