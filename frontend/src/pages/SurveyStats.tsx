import { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, QuizDetailedStats, QuizResult } from '../api';
import { useToastContext } from '../context/ToastContext';

export default function SurveyStats() {
  const toast = useToastContext();
  const [searchParams] = useSearchParams();
  const [selectedStats, setSelectedStats] = useState<QuizDetailedStats | null>(null);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const loadingStatsRef = useRef(false);
  const loadingResultsRef = useRef(false);
  const toastRef = useRef(toast);
  
  // Обновляем ref при изменении toast
  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  const loadStats = useCallback(async (quizId: string) => {
    // Защита от повторных запросов
    if (loadingStatsRef.current) {
      return;
    }
    
    loadingStatsRef.current = true;
    setLoading(true);
    try {
      const response = await api.get(`/quizzes/my/stats/${quizId}`);
      setSelectedStats(response.data);
    } catch (error: any) {
      console.error('Ошибка загрузки статистики:', error);
      if (error.response?.status === 403) {
        toastRef.current.error('У вас нет доступа к статистике этого квиза');
      } else {
        toastRef.current.error('Не удалось загрузить статистику');
      }
    } finally {
      setLoading(false);
      loadingStatsRef.current = false;
    }
  }, []);

  const loadQuizResults = useCallback(async (quizId: string) => {
    // Защита от повторных запросов
    if (loadingResultsRef.current) {
      return;
    }
    
    loadingResultsRef.current = true;
    try {
      setLoadingResults(true);
      const response = await api.get(`/submissions/quiz/${quizId}/results`);
      // Бэкенд возвращает массив напрямую, не обернутый в { status, data }
      const results = Array.isArray(response.data) ? response.data : [];
      console.log('Загружены результаты квиза:', results);
      setQuizResults(results);
    } catch (error: any) {
      console.error('Ошибка загрузки результатов:', error);
      toastRef.current.error('Не удалось загрузить результаты квиза');
      setQuizResults([]);
    } finally {
      setLoadingResults(false);
      loadingResultsRef.current = false;
    }
  }, []);

  useEffect(() => {
    const quizId = searchParams.get('quizId');
    if (quizId) {
      loadStats(quizId);
      loadQuizResults(quizId);
    } else {
      setLoading(false);
    }
  }, [loadStats, loadQuizResults, searchParams]);

  // Если нет quizId в URL, показываем сообщение
  const quizId = searchParams.get('quizId');
  if (!quizId) {
    return (
      <div className="container">
        <div className="card">
          <h2>Статистика</h2>
          <p>Для просмотра статистики необходимо указать ID квиза в URL.</p>
          <Link to="/my-surveys" className="btn btn-primary" style={{ marginTop: '15px', display: 'inline-block' }}>
            Перейти к опросам
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="container"><div className="loading">Загрузка...</div></div>;
  }

  if (selectedStats) {
    return (
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <h2>Статистика: {selectedStats.title}</h2>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link to="/my-surveys" className="btn btn-secondary">
              ← К опросам
            </Link>
            <Link to="/" className="btn btn-secondary">
              На главную
            </Link>
          </div>
        </div>

        <div className="card">
          <h3>Общая информация</h3>
          <div style={{ marginTop: '15px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div>
              <strong>Всего прохождений:</strong> {selectedStats.totalSubmissions}
            </div>
            <div>
              <strong>Средний балл:</strong> {selectedStats.avgScore.toFixed(2)} из {selectedStats.questions.length}
            </div>
          </div>
        </div>

        {selectedStats.totalSubmissions === 0 ? (
          <div className="card">
            <p>Пока нет прохождений этого квиза.</p>
          </div>
        ) : (
          <>
            {/* Список всех, кто проходил квиз */}
            <div className="card">
              <h3>Все прохождения ({quizResults.length})</h3>
              {loadingResults ? (
                <p>Загрузка результатов...</p>
              ) : quizResults.length === 0 ? (
                <p>Пока нет прохождений.</p>
              ) : (
                <div style={{ marginTop: '15px' }}>
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {quizResults
                      .sort((a, b) => b.score - a.score) // Сортируем по убыванию баллов
                      .map((result, index) => (
                        <div
                          key={result.userId + result.submittedAt}
                          style={{
                            padding: '15px',
                            background: index === 0 ? '#fff3cd' : '#f5f5f5',
                            borderRadius: '8px',
                            border: index === 0 ? '2px solid #ffc107' : '1px solid #ddd',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '10px',
                          }}
                        >
                          <div style={{ flex: '1 1 0', minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                              {index === 0 && <span style={{ fontSize: '20px' }}>🏆</span>}
                              <strong>{result.userName || `Пользователь ${result.userId}`}</strong>
                              <span style={{ color: '#666', fontSize: '14px' }}>
                                {new Date(result.submittedAt).toLocaleString('ru-RU')}
                              </span>
                            </div>
                          </div>
                          <div style={{ fontSize: '18px', fontWeight: 'bold', color: index === 0 ? '#ffc107' : '#007bff' }}>
                            {result.score} из {selectedStats.questions.length} ({Math.round((result.score / selectedStats.questions.length) * 100)}%)
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Детальная статистика по вопросам */}
            <div>
              <h2 style={{ marginTop: '30px', marginBottom: '20px' }}>Статистика по вопросам</h2>
              {selectedStats.questions.map((question, index) => {
                return (
                  <div key={index} className="card">
                    <h3>Вопрос {index + 1}: {question.question}</h3>
                    <div style={{ marginTop: '15px', padding: '10px', background: question.correctPercentage >= 70 ? '#d4edda' : question.correctPercentage >= 50 ? '#fff3cd' : '#f8d7da', borderRadius: '4px' }}>
                      <strong>Правильных ответов:</strong> {question.correctCount} из {question.totalAttempts} ({question.correctPercentage.toFixed(1)}%)
                    </div>
                    <div style={{ marginTop: '20px' }}>
                      <h4>Варианты ответов:</h4>
                      <ul style={{ listStyle: 'none', padding: 0, marginTop: '10px' }}>
                        {question.options.map((opt, optIndex) => (
                          <li key={optIndex} style={{ marginBottom: '10px', padding: '10px', background: optIndex === question.correctAnswer ? '#d4edda' : '#f5f5f5', borderRadius: '4px', borderLeft: optIndex === question.correctAnswer ? '4px solid #28a745' : 'none' }}>
                            <strong>{opt}</strong>
                            {optIndex === question.correctAnswer && <span style={{ color: '#28a745', marginLeft: '10px' }}>✓ Правильный ответ</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  }

  // Показываем загрузку или ошибку, если статистика не загружена
  return (
    <div className="container">
      <div className="card">
        <h2>Загрузка статистики...</h2>
        <p>Загрузка данных о квизе...</p>
      </div>
    </div>
  );
}
