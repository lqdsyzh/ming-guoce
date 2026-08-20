import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import type { Achievement, UserStats } from '../types';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ nickname: '', bio: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getAchievements().then(setAchievements).catch(() => {});
    api.getUserStats().then(setStats).catch(() => {});
  }, []);

  useEffect(() => {
    if (user) {
      setForm({ nickname: user.nickname || '', bio: user.bio || '' });
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await api.updateProfile(form);
      updateUser(updated);
      setEditing(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Profile Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-8">
        <div className="flex items-start space-x-6">
          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-3xl font-bold flex-shrink-0">
            {(user.nickname || user.username)[0].toUpperCase()}
          </div>
          <div className="flex-1">
            {editing ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={form.nickname}
                  onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="昵称"
                />
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  placeholder="个人简介"
                />
                <div className="flex space-x-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    {saving ? '保存中...' : '保存'}
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{user.nickname || user.username}</h1>
                <p className="text-gray-500">@{user.username}</p>
                <p className="text-gray-600 mt-2">{user.bio || '这个人很懒，什么都没写...'}</p>
                <button
                  onClick={() => setEditing(true)}
                  className="mt-3 text-sm text-indigo-600 hover:text-indigo-800"
                >
                  编辑资料 →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
            <div className="text-2xl font-bold text-indigo-600">{stats.total_xp}</div>
            <div className="text-sm text-gray-500">总经验值</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.completed_lessons}</div>
            <div className="text-sm text-gray-500">已完成课时</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.vocabulary_mastered}</div>
            <div className="text-sm text-gray-500">已掌握词汇</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
            <div className="text-2xl font-bold text-amber-600">{stats.achievements_earned}</div>
            <div className="text-sm text-gray-500">获得成就</div>
          </div>
        </div>
      )}

      {/* Achievements */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">🏆 成就徽章</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {achievements.map((a) => (
            <div
              key={a.id}
              className={`border rounded-xl p-4 text-center transition-all ${
                a.earned
                  ? 'border-yellow-200 bg-yellow-50 hover:shadow-md'
                  : 'border-gray-100 bg-gray-50 opacity-60'
              }`}
            >
              <div className="text-3xl mb-2">{a.earned ? '🏅' : '🔒'}</div>
              <div className="font-medium text-sm text-gray-900">{a.title}</div>
              <div className="text-xs text-gray-500 mt-1">{a.description}</div>
              {a.earned && a.earned_at && (
                <div className="text-xs text-gray-400 mt-2">
                  {new Date(a.earned_at).toLocaleDateString('zh-CN')}
                </div>
              )}
              {!a.earned && (
                <div className="text-xs text-indigo-500 mt-2">+{a.xp_reward} XP</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}