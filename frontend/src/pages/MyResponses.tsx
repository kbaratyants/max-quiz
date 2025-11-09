import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, MyResponse } from '../api';

export default function MyResponses() {
  const [responses, setResponses] = useState<MyResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResponses();
  }, []);

  const loadResponses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/responses/mine');
      setResponses(response.data);
    } catch (error) {
      console.error('Ошибка загрузки ответов:', error);
      alert('Не удалось загрузить список пройденных опросов');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="container"><div className="loading">Загрузка...</div></div>;
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Мои пройденные опросы</h2>
        <Link to="/" className="btn btn-secondary">
          ← На главную
        </Link>
      </div>

      {responses.length === 0 ? (
        <div className="card">
          <p>Вы еще не прошли ни одного опроса.</p>
          <Link to="/take" className="btn btn-primary" style={{ marginTop: '15px', display: 'inline-block' }}>
            Пройти опрос
          </Link>
        </div>
      ) : (
        <div>
          {responses.map((response) => (
            <div key={response._id} className="card">
              <h3>{response.surveyTitle}</h3>
              <p style={{ color: '#666', marginTop: '5px' }}>
                Пройдено: {new Date(response.createdAt).toLocaleString('ru-RU')}
              </p>
              <Link to={`/take`} className="btn btn-primary" style={{ marginTop: '15px', display: 'inline-block' }}>
                Пройти снова
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

