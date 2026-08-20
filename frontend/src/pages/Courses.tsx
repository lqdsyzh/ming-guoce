import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import type { Language, Course } from '../types';

const levelColors: Record<string, string> = {
  beginner: 'bg-green-100 text-green-700',
  elementary: 'bg-blue-100 text-blue-700',
  intermediate: 'bg-yellow-100 text-yellow-700',
  upper_intermediate: 'bg-orange-100 text-orange-700',
  advanced: 'bg-red-100 text-red-700',
  master: 'bg-purple-100 text-purple-700',
};

const levelLabels: Record<string, string> = {
  beginner: '入门',
  elementary: '初级',
  intermediate: '中级',
  upper_intermediate: '中高级',
  advanced: '高级',
  master: '精通',
};

export default function Courses() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [languages, setLanguages] = useState<Language[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const selectedLang = searchParams.get('language') || '';
  const selectedLevel = searchParams.get('level') || '';

  useEffect(() => {
    api.getLanguages().then(setLanguages).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params: any = {};
    if (selectedLang) {
      const lang = languages.find((l) => l.code === selectedLang);
      if (lang) params.language_id = lang.id;
    }
    if (selectedLevel) params.level = selectedLevel;
    api.getCourses(params).then(setCourses).finally(() => setLoading(false));
  }, [selectedLang, selectedLevel, languages]);

  const getFlag = (code: string) => {
    const map: Record<string, string> = { en: '🇺🇸', ja: '🇯🇵', ko: '🇰🇷', fr: '🇫🇷', de: '🇩🇪', es: '🇪🇸' };
    return map[code] || '🌍';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">课程中心</h1>
        <p className="text-gray-500">选择课程，开始你的学习之旅</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-8">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSearchParams({})}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              !selectedLang ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            全部语言
          </button>
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                const params: Record<string, string> = {};
                if (selectedLevel) params.level = selectedLevel;
                params.language = lang.code;
                setSearchParams(params);
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedLang === lang.code ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {lang.flag_emoji} {lang.name}
            </button>
          ))}
        </div>
      </div>

      {/* Level Filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => {
            const params: Record<string, string> = {};
            if (selectedLang) params.language = selectedLang;
            setSearchParams(params);
          }}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            !selectedLevel ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
          }`}
        >
          全部级别
        </button>
        {Object.entries(levelLabels).map(([key, label]) => (
          <button
            key={key}
            onClick={() => {
              const params: Record<string, string> = {};
              if (selectedLang) params.language = selectedLang;
              params.level = key;
              setSearchParams(params);
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              selectedLevel === key ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Course Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Link
              key={course.id}
              to={`/courses/${course.id}`}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1"
            >
              <div className="h-40 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <span className="text-6xl">{getFlag(course.language_name === 'English' ? 'en' : course.language_name === 'Japanese' ? 'ja' : course.language_name === 'Korean' ? 'ko' : '')}</span>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">{course.language_name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${levelColors[course.level] || 'bg-gray-100 text-gray-700'}`}>
                    {levelLabels[course.level] || course.level}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{course.title}</h3>
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{course.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{course.total_lessons} 课时</span>
                  <span>约 {course.estimated_hours} 小时</span>
                </div>
                {course.progress_percent > 0 && (
                  <div className="mt-3">
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${course.progress_percent}%` }}></div>
                    </div>
                    <p className="text-xs text-indigo-600 mt-1">进度 {Math.round(course.progress_percent)}%</p>
                  </div>
                )}
              </div>
            </Link>
          ))}
          {courses.length === 0 && (
            <div className="col-span-full text-center py-20 text-gray-500">
              暂无课程，请选择其他筛选条件
            </div>
          )}
        </div>
      )}
    </div>
  );
}