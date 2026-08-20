import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import type { Recommendation } from '../types';

const features = [
  { icon: '📚', title: '分级课程体系', desc: '从入门到精通，科学分级的学习路径' },
  { icon: '🎯', title: '互动式学习', desc: '单词记忆、语法练习、口语跟读、听力训练' },
  { icon: '📊', title: '进度追踪', desc: '实时追踪学习进度，可视化成长轨迹' },
  { icon: '🤖', title: '个性化推荐', desc: 'AI智能推荐适合你的学习内容' },
  { icon: '👥', title: '社区交流', desc: '与学习者交流互动，分享学习心得' },
  { icon: '🏆', title: '成就激励', desc: '完成挑战获得成就徽章，持续激发动力' },
];

const languages_display = [
  { code: 'en', name: 'English', native: 'English', flag: '🇺🇸', color: 'bg-blue-50 border-blue-200' },
  { code: 'ja', name: 'Japanese', native: '日本語', flag: '🇯🇵', color: 'bg-red-50 border-red-200' },
  { code: 'ko', name: 'Korean', native: '한국어', flag: '🇰🇷', color: 'bg-green-50 border-green-200' },
  { code: 'fr', name: 'French', native: 'Français', flag: '🇫🇷', color: 'bg-indigo-50 border-indigo-200' },
  { code: 'de', name: 'German', native: 'Deutsch', flag: '🇩🇪', color: 'bg-yellow-50 border-yellow-200' },
  { code: 'es', name: 'Spanish', native: 'Español', flag: '🇪🇸', color: 'bg-orange-50 border-orange-200' },
];

export default function Home() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [stats, setStats] = useState({ total_xp: 0, completed_lessons: 0, vocabulary_mastered: 0, achievements_earned: 0 });

  useEffect(() => {
    if (user) {
      api.getRecommendations().then(setRecommendations).catch(() => {});
      api.getUserStats().then(setStats).catch(() => {});
    }
  }, [user]);

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white">
        <div className="max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6">开启你的多语种学习之旅</h1>
            <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
              涵盖英语、日语、韩语等主流语言，沉浸式学习体验，让语言学习更高效、更有趣
            </p>
            <div className="flex justify-center space-x-4">
              <Link
                to="/courses"
                className="px-8 py-3 bg-white text-indigo-600 font-semibold rounded-full hover:bg-indigo-50 transition-colors"
              >
                开始学习
              </Link>
              {!user && (
                <Link
                  to="/register"
                  className="px-8 py-3 bg-indigo-500 text-white font-semibold rounded-full hover:bg-indigo-400 transition-colors"
                >
                  免费注册
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Languages */}
      <section className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-10">选择你想学习的语言</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {languages_display.map((lang) => (
            <Link
              key={lang.code}
              to={`/courses?language=${lang.code}`}
              className={`${lang.color} border-2 rounded-xl p-6 text-center hover:shadow-lg transition-all hover:-translate-y-1`}
            >
              <div className="text-4xl mb-2">{lang.flag}</div>
              <div className="font-semibold text-gray-900">{lang.native}</div>
              <div className="text-sm text-gray-500">{lang.name}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-10">平台特色</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div key={i} className="p-6 border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* User Stats */}
      {user && (
        <section className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-10">我的学习概况</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-indigo-50 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-indigo-600">{stats.total_xp}</div>
              <div className="text-sm text-gray-600 mt-1">总经验值</div>
            </div>
            <div className="bg-green-50 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-green-600">{stats.completed_lessons}</div>
              <div className="text-sm text-gray-600 mt-1">已完成课时</div>
            </div>
            <div className="bg-purple-50 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-purple-600">{stats.vocabulary_mastered}</div>
              <div className="text-sm text-gray-600 mt-1">已掌握词汇</div>
            </div>
            <div className="bg-amber-50 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-amber-600">{stats.achievements_earned}</div>
              <div className="text-sm text-gray-600 mt-1">获得成就</div>
            </div>
          </div>

          {recommendations.length > 0 && (
            <div className="mt-12">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">推荐课程</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {recommendations.slice(0, 3).map((rec) => (
                  <Link
                    key={rec.course.id}
                    to={`/courses/${rec.course.id}`}
                    className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="text-2xl mb-2">
                      {rec.course.language_name === 'English' ? '🇺🇸' :
                       rec.course.language_name === 'Japanese' ? '🇯🇵' :
                       rec.course.language_name === 'Korean' ? '🇰🇷' : '🌍'}
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">{rec.course.title}</h4>
                    <p className="text-sm text-gray-500 mb-2">{rec.course.language_name} · {rec.course.level_name}</p>
                    <p className="text-xs text-indigo-600">{rec.reason}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* CTA */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold mb-4">准备好开始了吗？</h2>
          <p className="text-lg text-indigo-100 mb-8">加入LinguaLearn，开启你的语言学习之旅</p>
          <Link
            to={user ? "/courses" : "/register"}
            className="inline-block px-10 py-4 bg-white text-indigo-600 font-semibold rounded-full hover:bg-indigo-50 transition-colors text-lg"
          >
            {user ? '浏览课程' : '免费注册'}
          </Link>
        </div>
      </section>
    </div>
  );
}