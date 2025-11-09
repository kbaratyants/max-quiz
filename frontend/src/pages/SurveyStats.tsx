import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { api, MySurvey, SurveyStats as SurveyStatsType } from '../api';

export default function SurveyStats() {
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState<MySurvey[]>([]);
  const [selectedSurvey, setSelectedSurvey] = useState<SurveyStatsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    loadSurveys();
  }, []);

  const loadSurveys = async () => {
    try {
      setLoading(true);
      const response = await api.get('/surveys/mine');
      setSurveys(response.data);
    } catch (error) {
      console.error('Ошибка загрузки опросов:', error);
      alert('Не удалось загрузить список опросов');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async (surveyId: string) => {
    try {
      setLoadingStats(true);
      const response = await api.get(`/surveys/${surveyId}/stats`);
      setSelectedSurvey(response.data);
    } catch (error: any) {
      console.error('Ошибка загрузки статистики:', error);
      if (error.response?.status === 403) {
        alert('У вас нет доступа к статистике этого опроса');
      } else {
        alert('Не удалось загрузить статистику');
      }
    } finally {
      setLoadingStats(false);
    }
  };

  if (loading) {
    return <div className="container"><div className="loading">Загрузка...</div></div>;
  }

  if (selectedSurvey) {
    return (
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Статистика: {selectedSurvey.survey.title}</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setSelectedSurvey(null)} className="btn btn-secondary">
              ← Назад к списку
            </button>
            <Link to="/" className="btn btn-secondary">
              На главную
            </Link>
          </div>
        </div>

        <div className="card">
          <h3>Общая информация</h3>
          <div style={{ marginTop: '15px' }}>
            <strong>Всего ответов:</strong> {selectedSurvey.totalResponses}
          </div>
        </div>

        {selectedSurvey.totalResponses === 0 ? (
          <div className="card">
            <p>Пока нет ответов на этот опрос.</p>
          </div>
        ) : (
          <div>
            {selectedSurvey.questionStats.map((questionStat, index) => {
              const chartData = questionStat.optionCounts.map(opt => ({
                name: opt.optionText,
                value: opt.count,
                percentage: opt.percentage.toFixed(1),
              }));

              return (
                <div key={index} className="card">
                  <h3>Вопрос {questionStat.questionIndex + 1}: {questionStat.questionText}</h3>
                  <div style={{ marginTop: '20px' }}>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" fill="#8884d8" name="Количество ответов" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ marginTop: '20px' }}>
                    <h4>Детали:</h4>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                      {questionStat.optionCounts.map((opt, optIndex) => (
                        <li key={optIndex} style={{ marginBottom: '10px', padding: '10px', background: '#f5f5f5', borderRadius: '4px' }}>
                          <strong>{opt.optionText}:</strong> {opt.count} ответов ({opt.percentage.toFixed(1)}%)
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Статистика по созданным опросам</h2>
        <Link to="/" className="btn btn-secondary">
          ← На главную
        </Link>
      </div>

      {surveys.length === 0 ? (
        <div className="card">
          <p>Вы еще не создали ни одного опроса.</p>
          <Link to="/create" className="btn btn-primary" style={{ marginTop: '15px', display: 'inline-block' }}>
            Создать опрос
          </Link>
        </div>
      ) : (
        <div>
          {surveys.map((survey) => (
            <div key={survey._id} className="card">
              <h3>{survey.title}</h3>
              <p style={{ color: '#666', marginTop: '5px' }}>
                Вопросов: {survey.questionsCount} • Создан: {new Date(survey.createdAt).toLocaleString('ru-RU')}
              </p>
              <button
                onClick={() => loadStats(survey._id)}
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
