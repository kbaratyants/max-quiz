import { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, Quiz, QuizDetailedStats } from '../api';
import { useToastContext } from '../context/ToastContext';

export default function SurveyStats() {
  const toast = useToastContext();
  const [searchParams] = useSearchParams();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedStats, setSelectedStats] = useState<QuizDetailedStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);
  const loadingRef = useRef(false);
  const loadingStatsRef = useRef(false);
  const toastRef = useRef(toast);
  
  // Обновляем ref при изменении toast
  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  const loadQuizzes = useCallback(async () => {
    // Защита от повторных запросов
    if (loadingRef.current) {
      return;
    }
    
    loadingRef.current = true;
    try {
      setLoading(true);
      const response = await api.get('/quizzes/my');
      setQuizzes(response.data);
    } catch (error) {
      console.error('Ошибка загрузки квизов:', error);
      toastRef.current.error('Не удалось загрузить список квизов');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  const loadStats = useCallback(async (quizId: string) => {
    // Защита от повторных запросов
    if (loadingStatsRef.current) {
      return;
    }
    
    loadingStatsRef.current = true;
    try {
      setLoadingStats(true);
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
      setLoadingStats(false);
      loadingStatsRef.current = false;
    }
  }, []);

  useEffect(() => {
    loadQuizzes();
    const quizId = searchParams.get('quizId');
    if (quizId) {
      loadStats(quizId);
    }
  }, [loadQuizzes, loadStats, searchParams]);

  if (loading) {
    return <div className="container"><div className="loading">Загрузка...</div></div>;
  }

  if (selectedStats) {
    return (
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <h2>Статистика: {selectedStats.title}</h2>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button onClick={() => setSelectedStats(null)} className="btn btn-secondary">
              ← Назад к списку
            </button>
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
          <div>
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
        )}
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h2>Статистика по созданным квизам</h2>
        <Link to="/" className="btn btn-secondary">
          ← На главную
        </Link>
      </div>

      {quizzes.length === 0 ? (
        <div className="card">
          <p>Вы еще не создали ни одного квиза.</p>
          <Link to="/create" className="btn btn-primary" style={{ marginTop: '15px', display: 'inline-block' }}>
            Создать квиз
          </Link>
        </div>
      ) : (
        <div>
          {quizzes.map((quiz) => (
            <div key={quiz._id} className="card">
              <h3>{quiz.title}</h3>
              {quiz.description && (
                <p style={{ color: '#666', marginTop: '5px' }}>{quiz.description}</p>
              )}
              <p style={{ color: '#666', marginTop: '5px' }}>
                Вопросов: {quiz.questions?.length || 0} • Создан: {quiz.createdAt ? new Date(quiz.createdAt).toLocaleString('ru-RU') : 'Неизвестно'}
              </p>
              <button
                onClick={() => loadStats(quiz._id)}
                className="btn btn-primary"
                disabled={loadingStats}
                style={{ marginTop: '15px' }}
              >
                {loadingStats ? 'Загрузка...' : 'Посмотреть статистику'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
