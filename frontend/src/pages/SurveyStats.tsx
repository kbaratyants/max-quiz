import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { api, SurveyStats } from '../api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function SurveyStatsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [stats, setStats] = useState<SurveyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [id]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/surveys/${id}/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
      alert('Не удалось загрузить статистику');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Загрузка статистики...</div>;
  }

  if (!stats) {
    return <div className="container">Статистика не найдена</div>;
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Статистика: {stats.survey.title}</h2>
        <Link to="/" className="btn btn-secondary">
          ← Назад к списку
        </Link>
      </div>

      <div className="card">
        <h3>Общая информация</h3>
        <div style={{ display: 'flex', gap: '30px', marginTop: '15px' }}>
          <div>
            <strong>Всего ответов:</strong> {stats.totalResponses}
          </div>
          {stats.avgScore !== undefined && (
            <div>
              <strong>Средний балл:</strong> {stats.avgScore.toFixed(2)} из {stats.questionStats.length}
            </div>
          )}
        </div>
      </div>

      {stats.totalResponses === 0 ? (
        <div className="card">
          <p>Пока нет ответов на этот опрос.</p>
        </div>
      ) : (
        <div>
          {stats.questionStats.map((questionStat, index) => {
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
                        <strong>{opt.optionText}:</strong> {opt.count} ответов ({opt.percentage}%)
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

