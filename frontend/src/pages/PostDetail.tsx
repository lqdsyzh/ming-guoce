import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import type { Post, Comment } from '../types';

export default function PostDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = () => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      api.getPost(Number(id)),
      api.getComments(Number(id)),
    ]).then(([p, c]) => {
      setPost(p);
      setComments(c);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleLike = async () => {
    if (!post) return;
    try {
      const res = await api.likePost(post.id);
      setPost({ ...post, is_liked: res.liked, like_count: res.like_count });
    } catch (e) {}
  };

  const handleComment = async () => {
    if (!id || !commentText.trim()) return;
    setSubmitting(true);
    try {
      await api.createComment(Number(id), { content: commentText });
      setCommentText('');
      fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!post) {
    return <div className="text-center py-20 text-gray-500">帖子不存在</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <Link to="/community" className="text-sm text-indigo-600 hover:text-indigo-800 mb-4 inline-block">
        ← 返回社区
      </Link>

      {/* Post */}
      <div className="bg-white rounded-xl border border-gray-200 p-8 mb-6">
        <div className="flex items-center space-x-2 mb-3">
          <span className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-medium">
            {post.author_name[0]?.toUpperCase() || '?'}
          </span>
          <span className="font-medium text-gray-900">{post.author_name}</span>
          <span className="text-sm text-gray-400">{new Date(post.created_at).toLocaleDateString('zh-CN')}</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{post.title}</h1>
        <div className="text-gray-700 leading-relaxed whitespace-pre-line">{post.content}</div>
        <div className="flex items-center space-x-4 mt-6 pt-4 border-t border-gray-100">
          <button
            onClick={handleLike}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm transition-colors ${
              post.is_liked ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
            }`}
          >
            <span>{post.is_liked ? '❤️' : '🤍'}</span>
            <span>{post.like_count}</span>
          </button>
          <span className="text-sm text-gray-400">💬 {post.comment_count} 条评论</span>
          <span className="text-sm text-gray-400">👁 {post.view_count} 次浏览</span>
        </div>
      </div>

      {/* Comments */}
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">评论 ({comments.length})</h2>

        {user && (
          <div className="flex space-x-3 mb-6">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="写下你的评论..."
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleComment()}
            />
            <button
              onClick={handleComment}
              disabled={submitting || !commentText.trim()}
              className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? '发送中...' : '发送'}
            </button>
          </div>
        )}

        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex space-x-3 p-4 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-medium text-sm flex-shrink-0">
                {comment.author_name[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-medium text-gray-900 text-sm">{comment.author_name}</span>
                  <span className="text-xs text-gray-400">{new Date(comment.created_at).toLocaleDateString('zh-CN')}</span>
                </div>
                <p className="text-gray-700 text-sm">{comment.content}</p>
              </div>
            </div>
          ))}
          {comments.length === 0 && (
            <p className="text-center text-gray-500 py-6">暂无评论，来说点什么吧</p>
          )}
        </div>
      </div>
    </div>
  );
}