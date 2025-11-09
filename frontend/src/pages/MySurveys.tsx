import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../api';

interface MySurvey {
  _id: string;
  title: string;
  createdAt: string;
  publicId: string;
  shareUrl: string;
  isClosed: boolean;
  expiresAt?: string;
  isExpired?: boolean;
}

export default function MySurveys() {
  const [surveys, setSurveys] = useState<MySurvey[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSurvey, setExpandedSurvey] = useState<string | null>(null);
  const [closingId, setClosingId] = useState<string | null>(null);

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

  const handleCloseSurvey = async (surveyId: string) => {
    if (!confirm('Вы уверены, что хотите закрыть этот опрос?')) {
      return;
    }

    try {
      setClosingId(surveyId);
      await api.patch(`/surveys/${surveyId}/close`);
      await loadSurveys();
      alert('Опрос закрыт');
    } catch (error: any) {
      console.error('Ошибка закрытия опроса:', error);
      if (error.response?.status === 403) {
        alert('У вас нет прав для закрытия этого опроса');
      } else {
        alert('Не удалось закрыть опрос');
      }
    } finally {
      setClosingId(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Ссылка скопирована в буфер обмена!');
  };

  const getStatus = (survey: MySurvey) => {
    if (survey.isClosed) return { text: 'Закрыт', color: '#dc3545' };
    if (survey.isExpired) return { text: 'Истёк', color: '#ffc107' };
    return { text: 'Активен', color: '#28a745' };
  };

  if (loading) {
    return <div className="container"><div className="loading">Загрузка...</div></div>;
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Мои созданные опросы</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/create" className="btn btn-primary">
            + Создать опрос
          </Link>
          <Link to="/" className="btn btn-secondary">
            ← На главную
          </Link>
        </div>
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
          {surveys.map((survey) => {
            const status = getStatus(survey);
            const isExpanded = expandedSurvey === survey._id;

            return (
              <div key={survey._id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <h3>{survey.title}</h3>
                    <p style={{ color: '#666', marginTop: '5px' }}>
                      Создан: {new Date(survey.createdAt).toLocaleString('ru-RU')}
                      {survey.expiresAt && (
                        <> • Истекает: {new Date(survey.expiresAt).toLocaleString('ru-RU')}</>
                      )}
                    </p>
                    <div style={{ marginTop: '10px' }}>
                      <span style={{ 
                        padding: '5px 10px', 
                        borderRadius: '4px', 
                        backgroundColor: status.color + '20',
                        color: status.color,
                        fontWeight: 'bold',
                        fontSize: '14px'
                      }}>
                        {status.text}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
                    <button
                      onClick={() => setExpandedSurvey(isExpanded ? null : survey._id)}
                      className="btn btn-secondary"
                    >
                      {isExpanded ? 'Скрыть' : 'Показать ссылку'}
                    </button>
                    {!survey.isClosed && !survey.isExpired && (
                      <button
                        onClick={() => handleCloseSurvey(survey._id)}
                        className="btn btn-secondary"
                        disabled={closingId === survey._id}
                        style={{ backgroundColor: '#dc3545' }}
                      >
                        {closingId === survey._id ? 'Закрытие...' : 'Закрыть опрос'}
                      </button>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ marginTop: '20px', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '20px', alignItems: 'center' }}>
                      <div>
                        <h4>Ссылка для прохождения:</h4>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                          <input
                            type="text"
                            value={survey.shareUrl}
                            readOnly
                            style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                          />
                          <button
                            onClick={() => copyToClipboard(survey.shareUrl)}
                            className="btn btn-primary"
                          >
                            Копировать
                          </button>
                        </div>
                        <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                          Public ID: <code>{survey.publicId}</code>
                        </p>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <h4>QR-код:</h4>
                        <div style={{ padding: '15px', background: 'white', borderRadius: '8px', display: 'inline-block', marginTop: '10px' }}>
                          <QRCodeSVG value={survey.shareUrl} size={150} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

