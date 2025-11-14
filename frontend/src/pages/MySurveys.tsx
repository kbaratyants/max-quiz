import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { api, Quiz } from '../api';
import { copyToClipboard, shareContent, shareMaxContent, isMaxWebApp } from '../utils/webapp-helpers';
import { useToastContext } from '../context/ToastContext';


export default function MySurveys() {
  const toast = useToastContext();

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedQuiz, setExpandedQuiz] = useState<string | null>(null);
  const loadingRef = useRef(false);
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

  useEffect(() => {
    loadQuizzes();
  }, [loadQuizzes]);

  const handleCopy = async (text: string) => {
    await copyToClipboard(text);
    toast.success('Ссылка скопирована в буфер обмена!');
  };
  
  const handleShare = (quiz: Quiz) => {
    // Используем getPublicUrl для формирования ссылки в правильном формате
    const publicUrl = getPublicUrl(quiz);
    const text = `Квиз: ${quiz.title}`;

      if (shareMaxContent({ text, link: publicUrl })) {
          return true;
      }
      if (shareContent({ text, link: publicUrl })) {
          return true;
      }
    handleCopy(publicUrl);
    return false;
  };

  const getPublicUrl = (quiz: Quiz) => {
    // В ссылке используем shortId для читаемости
    const id = quiz.shortId || quiz._id;
    if (!id) {
      return '';
    }
    
    // Формат для MAX: https://max.ru/botName?startapp=shortId
    // Используем тот же формат, что и на бэкенде
    const botName = import.meta.env.VITE_BOT_NAME || 't39_hakaton_bot';
    const startParam = encodeURIComponent(id.toString());
    return `https://max.ru/${botName}?startapp=${startParam}`;
  };

  const getQrCodeUrl = (quiz: Quiz) => {
    // В QR-коде должен быть _id, а не shortId
    return `${window.location.origin}/survey/${quiz._id}`;
  };

  const handleCloseQuiz = async (quizId: string) => {
    toast.warning('Закрытие квиза... После закрытия новые ответы приниматься не будут.');
    
    try {
      console.log('Закрытие квиза с ID:', quizId);
      const response = await api.patch(`/quizzes/my/${quizId}/close`, {});
      console.log('Ответ на закрытие квиза:', response.data);
      toast.success('Квиз успешно закрыт');
      // Перезагружаем список квизов
      loadQuizzes();
    } catch (error: any) {
      console.error('Ошибка закрытия квиза:', error);
      console.error('Детали ошибки:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.response?.status === 404) {
        toast.error('Квиз не найден');
      } else if (error.response?.status === 403) {
        toast.error('У вас нет прав для закрытия этого квиза');
      } else {
        toast.error(`Не удалось закрыть квиз: ${error.message || 'Неизвестная ошибка'}`);
      }
    }
  };

  if (loading) {
    return <div className="container"><div className="loading">Загрузка...</div></div>;
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h2>Опросы</h2>
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
                  <div style={{ flex: '1 1 0', minWidth: 0 }}>
                    <h3>{quiz.title}</h3>
                    {quiz.description && (
                      <p style={{ color: '#666', marginTop: '5px' }}>{quiz.description}</p>
                    )}
                    <p style={{ color: '#666', marginTop: '5px' }}>
                      Создан: {quiz.createdAt ? new Date(quiz.createdAt).toLocaleString('ru-RU') : 'Неизвестно'}
                      {quiz.questions && (
                        <> • Вопросов: {quiz.questions.length}</>
                      )}
                      {quiz.isActive === false && (
                        <> • <span style={{ color: '#dc3545', fontWeight: 'bold' }}>Закрыт</span></>
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
                    {quiz.isActive !== false && (
                      <button
                        onClick={() => handleCloseQuiz(quiz._id)}
                        className="btn btn-secondary"
                        style={{ background: '#dc3545', color: 'white', border: 'none' }}
                      >
                        Закрыть квиз
                      </button>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ marginTop: '20px', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      gap: '20px'
                    }}>
                      {/* Ссылка и кнопки */}
                      <div style={{ minWidth: 0, width: '100%' }}>
                        <h4>Ссылка для прохождения:</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                          <input
                            type="text"
                            value={publicUrl}
                            readOnly
                            style={{ 
                              width: '100%',
                              padding: '8px', 
                              border: '1px solid #ddd', 
                              borderRadius: '4px', 
                              boxSizing: 'border-box',
                              fontSize: '14px',
                              wordBreak: 'break-all'
                            }}
                          />
                          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => handleCopy(publicUrl)}
                              className="btn btn-primary"
                              style={{ flex: '0 0 auto' }}
                            >
                              Копировать
                            </button>
                            {isMaxWebApp() && (
                              <>
                                <button
                                  onClick={() => {
                                    // Используем handleShare, который правильно обрабатывает shareMaxContent
                                    handleShare(quiz);
                                  }}
                                  className="btn btn-secondary"
                                  style={{ flex: '0 0 auto' }}
                                >
                                  Поделиться в MAX
                                </button>
                                <button
                                  onClick={() => {
                                    const text = `Квиз: ${quiz.title}`;
                                    const result = shareContent({ text, link: publicUrl });
                                    if (!result) {
                                      handleCopy(publicUrl);
                                    }
                                  }}
                                  className="btn btn-secondary"
                                  style={{ flex: '0 0 auto' }}
                                >
                                  Поделиться
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        {quiz.shortId && (
                          <p style={{ marginTop: '10px', fontSize: '14px', color: '#666', wordBreak: 'break-word' }}>
                            ID: <code style={{ fontSize: '14px', background: '#e9ecef', padding: '2px 6px', borderRadius: '4px' }}>{quiz.shortId}</code>
                          </p>
                        )}
                      </div>
                      {/* QR-код */}
                      <div style={{ textAlign: 'center', alignSelf: 'center' }}>
                        <h4>QR-код:</h4>
                        <div style={{ padding: '15px', background: 'white', borderRadius: '8px', display: 'inline-block', marginTop: '10px' }}>
                          {/* В QR-коде должен быть _id, а не shortId */}
                          <QRCodeSVG value={getQrCodeUrl(quiz)} size={150} />
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

