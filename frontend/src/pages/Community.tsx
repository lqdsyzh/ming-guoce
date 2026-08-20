import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import type { Post, Language } from '../types';

const topicLabels: Record<string, string> = {
  general: '综合讨论', study_group: '学习小组', question: '提问求助',
  resource: '资源分享', showcase: '学习展示', daily_check_in: '每日打卡',
};

const topicColors: Record<string, string> = {
  general: 'bg-gray-100 text-gray-600',
  study_group: 'bg-blue-100 text-blue-600',
  question: 'bg-orange-100 text-orange-600',
  resource: 'bg-green-100 text-green-600',
  showcase: 'bg-purple-100 text-purple-600',
  daily_check_in: 'bg-pink-100 text-pink-600',
};

export default function Community() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [topic, setTopic] = useState('');
  const [sort, setSort] = useState('latest');
  const [showCreate, setShowCreate] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', topic: 'general', language_id: 0 });
  const [creating, setCreating] = useState(false);

  const fetchPosts = () => {
    setLoading(true);
    api.getPosts({ topic: topic || undefined, sort, page: 1 })
      .then(setPosts)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    api.getLanguages().then(setLanguages).catch(() => {});
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [topic, sort]);

  const handleCreatePost = async () => {
    if (!newPost.title || !newPost.content) return;
    setCreating(true);
    try {
      await api.createPost({
        title: newPost.title,
        content: newPost.content,
        topic: newPost.topic,
        language_id: newPost.language_id || undefined,
      });
      setNewPost({ title: '', content: '', topic: 'general', language_id: 0 });
      setShowCreate(false);
      fetchPosts();
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  const handleLike = async (postId: number) => {
    try {
      const res = await api.likePost(postId);
      setPosts(posts.map(p => p.id === postId ? { ...p, is_liked: res.liked, like_count: res.like_count } : p));
    } catch (e) {}
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">社区</h1>
          <p className="text-gray-500 mt-1">与学习者交流互动，分享学习心得</p>
        </div>
        {user && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            {showCreate ? '取消' : '发布帖子'}
          </button>
        )}
      </div>

      {/* Create Post */}
      {showCreate && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">发布新帖子</h2>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="标题"
              value={newPost.title}
              onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
            <textarea
              placeholder="内容..."
              value={newPost.content}
              onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
              rows={4}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
            />
            <div className="flex space-x-4">
              <select
                value={newPost.topic}
                onChange={(e) => setNewPost({ ...newPost, topic: e.target.value })}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                {Object.entries(topicLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <select
                value={newPost.language_id}
                onChange={(e) => setNewPost({ ...newPost, language_id: Number(e.target.value) })}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value={0}>全部语言</option>
                {languages.map((l) => (
                  <option key={l.id} value={l.id}>{l.flag_emoji} {l.name}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleCreatePost}
              disabled={creating || !newPost.title || !newPost.content}
              className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {creating ? '发布中...' : '发布'}
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setTopic('')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              !topic ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            全部
          </button>
          {Object.entries(topicLabels).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTopic(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                topic === key ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex space-x-2 mt-2 sm:mt-0">
          <button
            onClick={() => setSort('latest')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              sort === 'latest' ? 'bg-gray-200 text-gray-700' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
            }`}
          >
            最新
          </button>
          <button
            onClick={() => setSort('hot')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              sort === 'hot' ? 'bg-gray-200 text-gray-700' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
            }`}
          >
            热门
          </button>
        </div>
      </div>

      {/* Posts */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${topicColors[post.topic] || 'bg-gray-100 text-gray-600'}`}>
                      {topicLabels[post.topic] || post.topic}
                    </span>
                    {post.is_pinned && <span className="text-xs text-red-500">📌 置顶</span>}
                  </div>
                  <Link to={`/community/${post.id}`} className="block">
                    <h3 className="text-lg font-semibold text-gray-900 hover:text-indigo-600 transition-colors">
                      {post.title}
                    </h3>
                  </Link>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{post.content}</p>
                  <div className="flex items-center space-x-4 mt-3 text-xs text-gray-400">
                    <span className="flex items-center space-x-1">
                      <span className="w-5 h-5 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-[10px] font-medium">
                        {post.author_name[0]?.toUpperCase() || '?'}
                      </span>
                      <span>{post.author_name}</span>
                    </span>
                    <span>{new Date(post.created_at).toLocaleDateString('zh-CN')}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4 mt-3 pt-3 border-t border-gray-50 text-xs text-gray-400">
                <button
                  onClick={() => handleLike(post.id)}
                  className={`flex items-center space-x-1 transition-colors ${post.is_liked ? 'text-red-500' : 'hover:text-red-500'}`}
                >
                  <span>{post.is_liked ? '❤️' : '🤍'}</span>
                  <span>{post.like_count}</span>
                </button>
                <span className="flex items-center space-x-1">💬 {post.comment_count}</span>
                <span className="flex items-center space-x-1">👁 {post.view_count}</span>
              </div>
            </div>
          ))}
          {posts.length === 0 && (
            <div className="text-center py-20 text-gray-500">
              暂无帖子，成为第一个发布的人吧！
            </div>
          )}
        </div>
      )}
    </div>
  );
}