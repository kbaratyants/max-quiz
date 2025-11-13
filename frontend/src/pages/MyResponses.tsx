import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api, SubmissionSummary, SubmissionDetail } from '../api';
import { useToastContext } from '../context/ToastContext';

export default function MyResponses() {
  const toast = useToastContext();
  const [submissions, setSubmissions] = useState<SubmissionSummary[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const loadingRef = useRef(false);
  const loadingDetailRef = useRef(false);
  const toastRef = useRef(toast);
  
  // Обновляем ref при изменении toast
  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  const loadSubmissions = useCallback(async () => {
    // Защита от повторных запросов
    if (loadingRef.current) {
      return;
    }
    
    loadingRef.current = true;
    try {
      setLoading(true);
      const response = await api.get('/submissions/user/me/summary');
      setSubmissions(response.data);
    } catch (error) {
      console.error('Ошибка загрузки прохождений:', error);
      toastRef.current.error('Не удалось загрузить список пройденных квизов');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  const loadSubmissionDetail = useCallback(async (submissionId: string) => {
    if (loadingDetailRef.current) {
      return;
    }
    
    loadingDetailRef.current = true;
    try {
      setLoadingDetail(true);
      const response = await api.get(`/submissions/user/me/${submissionId}`);
      setSelectedSubmission(response.data);
    } catch (error: any) {
      console.error('Ошибка загрузки деталей:', error);
      toastRef.current.error('Не удалось загрузить детали прохождения');
    } finally {
      setLoadingDetail(false);
      loadingDetailRef.current = false;
    }
  }, []);

  if (loading) {
    return <div className="container"><div className="loading">Загрузка...</div></div>;
  }

  if (selectedSubmission) {
    return (
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <h2>Результаты: {selectedSubmission.quizTitle}</h2>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button onClick={() => setSelectedSubmission(null)} className="btn btn-secondary">
              ← Назад к списку
            </button>
            <Link to="/" className="btn btn-secondary">
              На главную
            </Link>
          </div>
        </div>

        <div className="card" style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h3>Ваш результат</h3>
          <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#007bff', margin: '20px 0' }}>
            {selectedSubmission.score} из {selectedSubmission.total}
          </div>
          <div style={{ fontSize: '24px', color: '#666' }}>
            {Math.round((selectedSubmission.score / selectedSubmission.total) * 100)}% правильных ответов
          </div>
          <p style={{ marginTop: '10px', color: '#666' }}>
            Пройдено: {new Date(selectedSubmission.submittedAt).toLocaleString('ru-RU')}
          </p>
        </div>

        <div>
          <h3 style={{ marginBottom: '20px' }}>Детали ответов</h3>
          {selectedSubmission.questions.map((q, index) => {
            const isCorrect = q.selectedAnswer === q.correctAnswer;
            return (
              <div key={index} className="card" style={{ marginBottom: '15px' }}>
                <h4>Вопрос {index + 1}: {q.question}</h4>
                <div style={{ marginTop: '15px' }}>
                  {q.options.map((opt, optIndex) => {
                    const isSelected = optIndex === q.selectedAnswer;
                    const isCorrectAnswer = optIndex === q.correctAnswer;
                    let bgColor = '#f5f5f5';
                    let borderColor = 'transparent';
                    
                    if (isCorrectAnswer) {
                      bgColor = '#d4edda';
                      borderColor = '#28a745';
                    } else if (isSelected && !isCorrect) {
                      bgColor = '#f8d7da';
                      borderColor = '#dc3545';
                    }
                    
                    return (
                      <div
                        key={optIndex}
                        style={{
                          padding: '12px',
                          marginBottom: '8px',
                          background: bgColor,
                          borderRadius: '4px',
                          borderLeft: `4px solid ${borderColor}`,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                        }}
                      >
                        <span style={{ fontWeight: 'bold' }}>{opt}</span>
                        {isCorrectAnswer && <span style={{ color: '#28a745', fontWeight: 'bold' }}>✓ Правильный ответ</span>}
                        {isSelected && !isCorrect && <span style={{ color: '#dc3545', fontWeight: 'bold' }}>✗ Ваш ответ</span>}
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: '15px', padding: '10px', background: isCorrect ? '#d4edda' : '#f8d7da', borderRadius: '4px' }}>
                  <strong>{isCorrect ? '✓ Правильно' : '✗ Неправильно'}</strong>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h2>Мои пройденные квизы</h2>
        <Link to="/" className="btn btn-secondary">
          ← На главную
        </Link>
      </div>

      {submissions.length === 0 ? (
        <div className="card">
          <p>Вы еще не прошли ни одного квиза.</p>
          <Link to="/take" className="btn btn-primary" style={{ marginTop: '15px', display: 'inline-block' }}>
            Пройти квиз
          </Link>
        </div>
      ) : (
        <div>
          {submissions.map((submission) => (
            <div key={submission.submissionId} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ flex: '1 1 0', minWidth: 0 }}>
                  <h3>{submission.quizTitle}</h3>
                  <p style={{ color: '#666', marginTop: '5px' }}>
                    Результат: <strong style={{ color: '#007bff', fontSize: '18px' }}>{submission.score} из {submission.total}</strong> ({Math.round((submission.score / submission.total) * 100)}%)
                  </p>
                  <p style={{ color: '#666', marginTop: '5px' }}>
                    Пройдено: {new Date(submission.submittedAt).toLocaleString('ru-RU')}
                  </p>
                </div>
                <button
                  onClick={() => loadSubmissionDetail(submission.submissionId)}
                  className="btn btn-primary"
                  disabled={loadingDetail}
                >
                  {loadingDetail ? 'Загрузка...' : 'Детали'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

