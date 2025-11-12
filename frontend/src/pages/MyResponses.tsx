import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api, SubmissionSummary } from '../api';
import { useToastContext } from '../context/ToastContext';

export default function MyResponses() {
  const toast = useToastContext();
  const [submissions, setSubmissions] = useState<SubmissionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const loadingRef = useRef(false);
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

  if (loading) {
    return <div className="container"><div className="loading">Загрузка...</div></div>;
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
              <h3>{submission.quizTitle}</h3>
              <p style={{ color: '#666', marginTop: '5px' }}>
                Результат: {submission.score} из {submission.total} ({Math.round((submission.score / submission.total) * 100)}%)
              </p>
              <p style={{ color: '#666', marginTop: '5px' }}>
                Пройдено: {new Date(submission.submittedAt).toLocaleString('ru-RU')}
              </p>
              <Link to={`/survey/${submission.quizId}`} className="btn btn-primary" style={{ marginTop: '15px', display: 'inline-block' }}>
                Пройти снова
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

