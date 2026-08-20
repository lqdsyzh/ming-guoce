const API_BASE = '/api';

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: '请求失败' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

// Auth
export const api = {
  // Auth
  register: (data: { username: string; email: string; password: string; nickname?: string; native_language?: string }) =>
    request<{ access_token: string; token_type: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  login: (data: { username: string; password: string }) =>
    request<{ access_token: string; token_type: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getMe: () => request<any>('/auth/me'),

  // Languages & Courses
  getLanguages: () => request<any[]>('/languages'),
  getCourses: (params?: { language_id?: number; level?: string }) => {
    const query = new URLSearchParams();
    if (params?.language_id) query.set('language_id', String(params.language_id));
    if (params?.level) query.set('level', params.level);
    const qs = query.toString();
    return request<any[]>(`/courses${qs ? `?${qs}` : ''}`);
  },
  getCourseDetail: (id: number) => request<any>(`/courses/${id}`),
  getLessons: (courseId: number) => request<any[]>(`/courses/${courseId}/lessons`),
  getLessonDetail: (lessonId: number) => request<any>(`/lessons/${lessonId}`),

  // Learning
  enrollCourse: (courseId: number) =>
    request<any>(`/learning/courses/${courseId}/enroll`, { method: 'POST' }),
  completeLesson: (lessonId: number, data: { score?: number; xp_earned?: number; duration_minutes?: number }) =>
    request<any>(`/learning/lessons/${lessonId}/complete`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  reviewVocabulary: (vocabId: number, familiarity: number) =>
    request<any>(`/learning/vocabulary/${vocabId}/review`, {
      method: 'POST',
      body: JSON.stringify({ familiarity }),
    }),
  getProgress: () => request<any>('/learning/progress'),
  getCourseProgress: () => request<any[]>('/learning/progress/courses'),
  getStreak: () => request<any>('/learning/streak'),

  // Community
  getPosts: (params?: { topic?: string; language_id?: number; sort?: string; page?: number }) => {
    const query = new URLSearchParams();
    if (params?.topic) query.set('topic', params.topic);
    if (params?.language_id) query.set('language_id', String(params.language_id));
    if (params?.sort) query.set('sort', params.sort);
    if (params?.page) query.set('page', String(params.page));
    return request<any[]>(`/community/posts?${query.toString()}`);
  },
  getPost: (id: number) => request<any>(`/community/posts/${id}`),
  createPost: (data: { title: string; content: string; topic: string; language_id?: number }) =>
    request<any>('/community/posts', { method: 'POST', body: JSON.stringify(data) }),
  likePost: (postId: number) =>
    request<any>(`/community/posts/${postId}/like`, { method: 'POST' }),
  getComments: (postId: number) => request<any[]>(`/community/posts/${postId}/comments`),
  createComment: (postId: number, data: { content: string; parent_id?: number }) =>
    request<any>(`/community/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Users
  getProfile: () => request<any>('/users/profile'),
  updateProfile: (data: any) =>
    request<any>('/users/profile', { method: 'PUT', body: JSON.stringify(data) }),
  getAchievements: () => request<any[]>('/users/achievements'),
  getReviewVocabulary: (limit?: number) =>
    request<any[]>(`/users/vocabulary/review${limit ? `?limit=${limit}` : ''}`),
  getRecommendations: () => request<any[]>('/users/recommendations'),
  getUserStats: () => request<any>('/users/stats'),
};