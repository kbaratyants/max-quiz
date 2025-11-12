import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { api, Quiz } from '../api';
import { copyToClipboard, shareContent, shareMaxContent, isMaxWebApp } from '../utils/webapp-helpers';

export default function MySurveys() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedQuiz, setExpandedQuiz] = useState<string | null>(null);

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/quizzes/my');
      setQuizzes(response.data);
    } catch (error) {
      console.error('Ошибка загрузки квизов:', error);
      alert('Не удалось загрузить список квизов');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string) => {
    await copyToClipboard(text);
    alert('Ссылка скопирована в буфер обмена!');
  };
  
  const handleShare = (quiz: Quiz) => {
    const publicUrl = `${window.location.origin}/survey/${quiz._id}`;
    const text = `Квиз: ${quiz.title}`;
    if (shareMaxContent(text, publicUrl)) {
      return;
    }
    if (shareContent(text, publicUrl)) {
      return;
    }
    handleCopy(publicUrl);
  };

  const getPublicUrl = (quiz: Quiz) => {
    return `${window.location.origin}/survey/${quiz._id}`;
  };

  if (loading) {
    return <div className="container"><div className="loading">Загрузка...</div></div>;
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h2>Мои созданные квизы</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link to="/create" className="btn btn-primary">
            + Создать квиз
          </Link>
          <Link to="/" className="btn btn-secondary">
            ← На главную
          </Link>
        </div>
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
          {quizzes.map((quiz) => {
            const isExpanded = expandedQuiz === quiz._id;
            const publicUrl = getPublicUrl(quiz);

            return (
              <div key={quiz._id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <h3>{quiz.title}</h3>
                    {quiz.description && (
                      <p style={{ color: '#666', marginTop: '5px' }}>{quiz.description}</p>
                    )}
                    <p style={{ color: '#666', marginTop: '5px' }}>
                      Создан: {quiz.createdAt ? new Date(quiz.createdAt).toLocaleString('ru-RU') : 'Неизвестно'}
                      {quiz.questions && (
                        <> • Вопросов: {quiz.questions.length}</>
                      )}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
                    <button
                      onClick={() => setExpandedQuiz(isExpanded ? null : quiz._id)}
                      className="btn btn-secondary"
                    >
                      {isExpanded ? 'Скрыть' : 'Показать ссылку'}
                    </button>
                    <Link
                      to={`/stats?quizId=${quiz._id}`}
                      className="btn btn-secondary"
                      style={{ textDecoration: 'none', textAlign: 'center' }}
                    >
                      Статистика
                    </Link>
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ marginTop: '20px', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '20px', alignItems: 'center' }}>
                      <div>
                        <h4>Ссылка для прохождения:</h4>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
                          <input
                            type="text"
                            value={publicUrl}
                            readOnly
                            style={{ flex: 1, minWidth: '200px', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                          />
                          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => handleCopy(publicUrl)}
                              className="btn btn-primary"
                            >
                              Копировать
                            </button>
                            {isMaxWebApp() && (
                              <>
                                <button
                                  onClick={() => handleShare(quiz)}
                                  className="btn btn-secondary"
                                >
                                  Поделиться в MAX
                                </button>
                                <button
                                  onClick={() => shareContent(`Квиз: ${quiz.title}`, publicUrl)}
                                  className="btn btn-secondary"
                                >
                                  Поделиться
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                          ID: <code>{quiz._id}</code>
                        </p>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <h4>QR-код:</h4>
                        <div style={{ padding: '15px', background: 'white', borderRadius: '8px', display: 'inline-block', marginTop: '10px' }}>
                          <QRCodeSVG value={publicUrl} size={150} />
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

