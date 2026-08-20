import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { LessonDetail } from '../types';

type Step = 'intro' | 'content' | 'vocabulary' | 'grammar' | 'speaking' | 'listening' | 'quiz' | 'complete';

export default function Lesson() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>('intro');
  const [currentContentIdx, setCurrentContentIdx] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [newAchievements, setNewAchievements] = useState<any[]>([]);
  const [vocabReview, setVocabReview] = useState<Record<number, number>>({});

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.getLessonDetail(Number(id)).then(setLesson).finally(() => setLoading(false));
  }, [id]);

  const quizContents = (lesson?.contents || []).filter((c) => c.type === 'quiz');
  const textContents = (lesson?.contents || []).filter((c) => c.type === 'text');

  const handleStart = () => {
    if (textContents.length > 0) {
      setStep('content');
    } else if (lesson?.vocabulary?.length) {
      setStep('vocabulary');
    } else if (lesson?.grammar_rules?.length) {
      setStep('grammar');
    } else if (lesson?.speaking_exercises?.length) {
      setStep('speaking');
    } else if (lesson?.listening_exercises?.length) {
      setStep('listening');
    } else if (quizContents.length > 0) {
      setStep('quiz');
    } else {
      handleComplete();
    }
  };

  const handleNextContent = () => {
    if (currentContentIdx < textContents.length - 1) {
      setCurrentContentIdx(currentContentIdx + 1);
    } else if (lesson?.vocabulary?.length) {
      setStep('vocabulary');
    } else if (lesson?.grammar_rules?.length) {
      setStep('grammar');
    } else if (lesson?.speaking_exercises?.length) {
      setStep('speaking');
    } else if (lesson?.listening_exercises?.length) {
      setStep('listening');
    } else if (quizContents.length > 0) {
      setStep('quiz');
    } else {
      handleComplete();
    }
  };

  const handleQuizAnswer = (quizIdx: number, answerIdx: number) => {
    setQuizAnswers({ ...quizAnswers, [quizIdx]: answerIdx });
  };

  const handleSubmitQuiz = () => {
    if (quizSubmitted) {
      moveAfterQuiz();
      return;
    }
    let correct = 0;
    quizContents.forEach((q, i) => {
      try {
        const data = JSON.parse(q.data);
        if (quizAnswers[i] === data.answer) correct++;
      } catch (e) {}
    });
    const quizScore = quizContents.length > 0 ? Math.round((correct / quizContents.length) * 100) : 100;
    setScore(quizScore);
    setQuizSubmitted(true);
  };

  const moveAfterQuiz = () => {
    handleComplete();
  };

  const handleComplete = async () => {
    if (completing || completed || !id) return;
    setCompleting(true);
    try {
      const res = await api.completeLesson(Number(id), {
        score: score || 100,
        xp_earned: lesson?.xp_reward || 10,
        duration_minutes: lesson?.estimated_minutes || 10,
      });
      setXpEarned(res.xp_earned || lesson?.xp_reward || 10);
      if (res.new_achievements?.length > 0) {
        setNewAchievements(res.new_achievements);
      }
      setCompleted(true);
      setStep('complete');
    } catch (e) {
      console.error(e);
    } finally {
      setCompleting(false);
    }
  };

  const handleVocabReview = async (vocabId: number, familiarity: number) => {
    setVocabReview({ ...vocabReview, [vocabId]: familiarity });
    try {
      await api.reviewVocabulary(vocabId, familiarity);
    } catch (e) {}
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!lesson) {
    return <div className="text-center py-20 text-gray-500">课时不存在</div>;
  }

  // --- Intro Step ---
  if (step === 'intro') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <div className="text-6xl mb-4">
            {lesson.lesson_type === 'vocabulary' ? '📖' :
             lesson.lesson_type === 'grammar' ? '📝' :
             lesson.lesson_type === 'speaking' ? '🎤' :
             lesson.lesson_type === 'listening' ? '🎧' : '📚'}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{lesson.title}</h1>
          <p className="text-gray-500 mb-6">{lesson.description}</p>
          <div className="flex justify-center space-x-6 mb-8 text-sm text-gray-500">
            <span>⏱ {lesson.estimated_minutes} 分钟</span>
            <span>⭐ +{lesson.xp_reward} XP</span>
          </div>
          <button
            onClick={handleStart}
            className="px-8 py-3 bg-indigo-600 text-white font-medium rounded-full hover:bg-indigo-700 transition-colors"
          >
            开始学习
          </button>
        </div>
      </div>
    );
  }

  // --- Content Step ---
  if (step === 'content' && textContents.length > 0) {
    const content = textContents[currentContentIdx];
    let data: any = {};
    try { data = JSON.parse(content.data); } catch (e) {}

    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <span className="text-sm text-gray-400">内容 {currentContentIdx + 1} / {textContents.length}</span>
            <span className="text-xs text-gray-400">{data.title || ''}</span>
          </div>
          <div className="prose max-w-none">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{data.title || ''}</h2>
            <div className="text-gray-700 leading-relaxed whitespace-pre-line">{data.body || ''}</div>
          </div>
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleNextContent}
              className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              {currentContentIdx < textContents.length - 1 ? '继续' : '下一步'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Vocabulary Step ---
  if (step === 'vocabulary' && lesson.vocabulary?.length > 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-2">📖 词汇学习</h2>
          <p className="text-gray-500 mb-6">学习本节课的重点词汇</p>
          <div className="grid grid-cols-1 gap-4">
            {lesson.vocabulary.map((v) => (
              <div key={v.id} className="border border-gray-200 rounded-xl p-5 hover:border-indigo-200 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-3">
                      <span className="text-xl font-bold text-indigo-600">{v.word}</span>
                      <span className="text-sm text-gray-400">/ {v.pronunciation} /</span>
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded">{v.part_of_speech}</span>
                    </div>
                    <p className="text-gray-700 mt-1">{v.translation}</p>
                    <p className="text-sm text-gray-400 mt-1 italic">"{v.example_sentence}"</p>
                  </div>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <button
                        key={level}
                        onClick={() => handleVocabReview(v.id, level)}
                        className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                          (vocabReview[v.id] || v.familiarity || 0) >= level
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                    <span className="text-xs text-gray-400 ml-2">熟悉度</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => {
                if (lesson.grammar_rules?.length) setStep('grammar');
                else if (lesson.speaking_exercises?.length) setStep('speaking');
                else if (lesson.listening_exercises?.length) setStep('listening');
                else if (quizContents.length > 0) setStep('quiz');
                else handleComplete();
              }}
              className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              继续
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Grammar Step ---
  if (step === 'grammar' && lesson.grammar_rules?.length > 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-2">📝 语法学习</h2>
          <p className="text-gray-500 mb-6">掌握本节课的重点语法</p>
          {lesson.grammar_rules.map((g) => (
            <div key={g.id} className="mb-8 last:mb-0">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">{g.title}</h3>
              <div className="bg-gray-50 rounded-xl p-5 mb-4">
                <div className="text-gray-700 leading-relaxed whitespace-pre-line">{g.explanation}</div>
              </div>
              {(() => {
                try {
                  const examples = JSON.parse(g.examples);
                  return (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-500">例文：</p>
                      {examples.map((ex: string, i: number) => (
                        <div key={i} className="bg-indigo-50 rounded-lg px-4 py-2 text-indigo-700 text-sm">
                          {ex}
                        </div>
                      ))}
                    </div>
                  );
                } catch (e) { return null; }
              })()}
            </div>
          ))}
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => {
                if (lesson.speaking_exercises?.length) setStep('speaking');
                else if (lesson.listening_exercises?.length) setStep('listening');
                else if (quizContents.length > 0) setStep('quiz');
                else handleComplete();
              }}
              className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              继续
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Speaking Step ---
  if (step === 'speaking' && lesson.speaking_exercises?.length > 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-2">🎤 口语跟读</h2>
          <p className="text-gray-500 mb-6">跟读以下句子，练习发音</p>
          {lesson.speaking_exercises.map((s) => (
            <div key={s.id} className="border border-gray-200 rounded-xl p-5 mb-4 last:mb-0">
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-medium text-gray-900">{s.phrase}</span>
              </div>
              <p className="text-gray-500 text-sm">{s.translation}</p>
              {s.reference_text && (
                <div className="mt-2 bg-indigo-50 rounded-lg px-4 py-2 text-sm text-indigo-700">
                  💡 {s.reference_text}
                </div>
              )}
            </div>
          ))}
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => {
                if (lesson.listening_exercises?.length) setStep('listening');
                else if (quizContents.length > 0) setStep('quiz');
                else handleComplete();
              }}
              className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              继续
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Listening Step ---
  if (step === 'listening' && lesson.listening_exercises?.length > 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-2">🎧 听力训练</h2>
          <p className="text-gray-500 mb-6">练习听力理解能力</p>
          {lesson.listening_exercises.map((l) => (
            <div key={l.id} className="border border-gray-200 rounded-xl p-5 mb-4 last:mb-0">
              <div className="bg-gray-50 rounded-lg p-4 mb-3">
                <p className="text-sm font-medium text-gray-500 mb-2">原文：</p>
                <p className="text-gray-700 whitespace-pre-line">{l.transcript}</p>
              </div>
              <div className="bg-indigo-50 rounded-lg p-4">
                <p className="text-sm font-medium text-indigo-500 mb-2">翻译：</p>
                <p className="text-indigo-700 whitespace-pre-line">{l.translation}</p>
              </div>
              {(() => {
                try {
                  const questions = JSON.parse(l.questions);
                  return (
                    <div className="mt-4 space-y-3">
                      {questions.map((q: any, i: number) => (
                        <div key={i} className="bg-white border border-gray-200 rounded-lg p-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">{q.question}</p>
                          <div className="grid grid-cols-2 gap-2">
                            {q.options.map((opt: string, oi: number) => (
                              <button
                                key={oi}
                                onClick={() => handleQuizAnswer(i, oi)}
                                className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                                  quizAnswers[i] === oi
                                    ? quizSubmitted
                                      ? oi === q.answer
                                        ? 'bg-green-100 border-green-300 text-green-700'
                                        : 'bg-red-100 border-red-300 text-red-700'
                                      : 'bg-indigo-100 border-indigo-300 text-indigo-700'
                                    : quizSubmitted && oi === q.answer
                                      ? 'bg-green-100 border-green-300 text-green-700'
                                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                                disabled={quizSubmitted}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                } catch (e) { return null; }
              })()}
            </div>
          ))}
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => {
                if (quizContents.length > 0) setStep('quiz');
                else handleComplete();
              }}
              className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              继续
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Quiz Step ---
  if (step === 'quiz' && quizContents.length > 0) {
    const correctCount = quizContents.filter((q, i) => {
      try {
        const data = JSON.parse(q.data);
        return quizAnswers[i] === data.answer;
      } catch (e) { return false; }
    }).length;

    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-2">✍️ 课堂测验</h2>
          <p className="text-gray-500 mb-6">检验你的学习成果</p>

          <div className="space-y-6">
            {quizContents.map((q, i) => {
              let data: any = {};
              try { data = JSON.parse(q.data); } catch (e) {}
              return (
                <div key={q.id} className="border border-gray-200 rounded-xl p-5">
                  <p className="font-medium text-gray-900 mb-3">{i + 1}. {data.question || '题目'}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(data.options || []).map((opt: string, oi: number) => (
                      <button
                        key={oi}
                        onClick={() => handleQuizAnswer(i, oi)}
                        className={`px-4 py-3 text-sm rounded-lg border transition-colors text-left ${
                          quizAnswers[i] === oi
                            ? quizSubmitted
                              ? oi === data.answer
                                ? 'bg-green-100 border-green-300 text-green-700'
                                : 'bg-red-100 border-red-300 text-red-700'
                              : 'bg-indigo-100 border-indigo-300 text-indigo-700'
                            : quizSubmitted && oi === data.answer
                              ? 'bg-green-100 border-green-300 text-green-700'
                              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                        disabled={quizSubmitted}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {quizSubmitted && (
            <div className={`mt-6 p-4 rounded-xl text-center ${
              correctCount === quizContents.length ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
            }`}>
              <p className="text-lg font-semibold">得分：{Math.round((correctCount / quizContents.length) * 100)} / 100</p>
              <p className="text-sm mt-1">{correctCount} / {quizContents.length} 题正确</p>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSubmitQuiz}
              disabled={completing}
              className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {quizSubmitted ? '完成学习' : '提交答案'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Complete Step ---
  if (step === 'complete') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">学习完成！</h1>
          <p className="text-gray-500 mb-6">恭喜你完成了本节课的学习</p>

          <div className="flex justify-center space-x-8 mb-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600">+{xpEarned}</div>
              <div className="text-sm text-gray-500">经验值</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{score || 100}</div>
              <div className="text-sm text-gray-500">得分</div>
            </div>
          </div>

          {newAchievements.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🏆 新成就解锁！</h3>
              <div className="flex justify-center space-x-4">
                {newAchievements.map((a: any) => (
                  <div key={a.id} className="bg-yellow-50 border border-yellow-200 rounded-xl px-6 py-4 text-center">
                    <div className="text-3xl mb-2">🏅</div>
                    <div className="font-semibold text-yellow-800">{a.title}</div>
                    <div className="text-xs text-yellow-600">{a.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-center space-x-4">
            <button
              onClick={() => navigate(`/courses/${lesson.course_id}`)}
              className="px-6 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              返回课程
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              查看学习中心
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Fallback: no content but not complete
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
        <p className="text-gray-500 mb-4">本节课内容已学完</p>
        <button
          onClick={handleComplete}
          disabled={completing}
          className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {completing ? '提交中...' : '完成学习'}
        </button>
      </div>
    </div>
  );
}