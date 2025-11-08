import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { api, Survey } from '../api';

export default function SurveyList() {
  const { user } = useContext(AuthContext);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSurveys();
  }, []);

  const loadSurveys = async () => {
    try {
      setLoading(true);
      const isTeacher = user?.role === 'teacher';
      const response = await api.get('/surveys', {
        params: isTeacher ? { mine: 'true' } : {},
      });
      setSurveys(response.data);
    } catch (error) {
      console.error('Ошибка загрузки опросов:', error);
      alert('Не удалось загрузить опросы');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Загрузка опросов...</div>;
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>{user?.role === 'teacher' ? 'Мои опросы' : 'Доступные опросы'}</h2>
        {user?.role === 'teacher' && (
          <Link to="/create" className="btn btn-primary">
            + Создать опрос
          </Link>
        )}
      </div>

      {surveys.length === 0 ? (
        <div className="card">
          <p>Опросов пока нет.</p>
          {user?.role === 'teacher' && (
            <Link to="/create" className="btn btn-primary" style={{ marginTop: '15px', display: 'inline-block' }}>
              Создать первый опрос
            </Link>
          )}
        </div>
      ) : (
        <div>
          {surveys.map((survey) => (
            <div key={survey._id} className="card">
              <h3>{survey.title}</h3>
              <p style={{ color: '#666', marginTop: '5px' }}>
                Тип: {survey.type === 'quiz' ? 'Квиз' : 'Обратная связь'} • Вопросов: {survey.questions.length}
              </p>
              <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                {user?.role === 'teacher' ? (
                  <>
                    <Link to={`/survey/${survey._id}/stats`} className="btn btn-secondary">
                      Статистика
                    </Link>
                    <Link to={`/survey/${survey._id}`} className="btn btn-primary">
                      Просмотреть
                    </Link>
                  </>
                ) : (
                  <Link to={`/survey/${survey._id}`} className="btn btn-primary">
                    Пройти опрос
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

