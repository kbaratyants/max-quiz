import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, SubmissionSummary } from '../api';

export default function MyResponses() {
  const [submissions, setSubmissions] = useState<SubmissionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/submissions/user/me/summary');
      setSubmissions(response.data);
    } catch (error) {
      console.error('Ошибка загрузки прохождений:', error);
      alert('Не удалось загрузить список пройденных квизов');
    } finally {
      setLoading(false);
    }
  };

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

