import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { openCodeReader, hapticFeedback, enableScreenCaptureProtection, disableScreenCaptureProtection, isMaxWebApp } from '../utils/webapp-helpers';
import { isMaxWebApp as checkMaxWebApp } from '../utils/webapp';

interface Survey {
  _id: string;
  title: string;
  questions: {
    text: string;
    options: string[];
  }[];
  timeLimitSec?: number;
}

export default function TakeSurvey() {
  const navigate = useNavigate();
  const { publicId: paramPublicId } = useParams<{ publicId?: string }>();
  const [publicId, setPublicId] = useState(paramPublicId || '');
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (paramPublicId) {
      loadSurveyByPublicId(paramPublicId);
    }
    
    // Включаем защиту от скриншотов при прохождении опроса в MAX
    if (checkMaxWebApp() && survey) {
      enableScreenCaptureProtection();
      return () => {
        disableScreenCaptureProtection();
      };
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [paramPublicId, survey]);

  useEffect(() => {
    if (timeLeft !== null && timeLeft > 0 && !isTimeUp) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev === null || prev <= 1) {
            setIsTimeUp(true);
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timeLeft === 0 && !isTimeUp) {
      setIsTimeUp(true);
      handleAutoSubmit();
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timeLeft, isTimeUp]);

  const loadSurveyByPublicId = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/surveys/by-public/${id}`);
      setSurvey(response.data);
      setAnswers(new Array(response.data.questions.length).fill(-1));
      
      if (response.data.timeLimitSec) {
        setTimeLeft(response.data.timeLimitSec);
        setIsTimeUp(false);
      }
    } catch (error: any) {
      console.error('Ошибка загрузки опроса:', error);
      if (error.response?.status === 404) {
        setError('Опрос не найден');
      } else if (error.response?.status === 410) {
        setError(error.response?.data?.message || 'Опрос закрыт или срок его действия истёк');
      } else {
        setError('Не удалось загрузить опрос');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadSurvey = async () => {
    if (!publicId.trim()) {
      alert('Введите ID опроса');
      return;
    }
    await loadSurveyByPublicId(publicId);
  };

  const handleAnswer = (questionIndex: number, optionIndex: number) => {
    if (isTimeUp) return;
    hapticFeedback('selection');
    const newAnswers = [...answers];
    newAnswers[questionIndex] = optionIndex;
    setAnswers(newAnswers);
  };
  
  const handleScanQR = async () => {
    try {
      hapticFeedback('impact', 'light');
      const qrResult = await openCodeReader(true);
      // Извлекаем publicId из URL если это ссылка
      const match = qrResult.match(/survey\/([a-zA-Z0-9_-]+)/);
      if (match) {
        setPublicId(match[1]);
        await loadSurveyByPublicId(match[1]);
      } else {
        // Пробуем использовать как publicId напрямую
        setPublicId(qrResult);
        await loadSurveyByPublicId(qrResult);
      }
    } catch (error: any) {
      console.error('Ошибка сканирования QR:', error);
      if (error.message !== 'QR code reader not available') {
        alert('Не удалось отсканировать QR-код');
      }
    }
  };

  const handleAutoSubmit = async () => {
    if (isTimeUp || submitting || !survey) return;
    
    // Отправляем то, что уже заполнено
    const filledAnswers = answers.map((a) => a === -1 ? 0 : a);
    
    setSubmitting(true);
    try {
      const response = await api.post(`/surveys/${survey._id}/responses`, { answers: filledAnswers });
      setSubmitted(true);
      if (response.data.clientId) {
        localStorage.setItem('max-quiz-client-id', response.data.clientId);
      }
    } catch (error: any) {
      console.error('Ошибка отправки ответов:', error);
      if (error.response?.status === 410) {
        setError('Опрос закрыт или срок его действия истёк');
      } else {
        alert('Не удалось отправить ответы');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (isTimeUp) {
      handleAutoSubmit();
      return;
    }

    if (answers.some(a => a === -1)) {
      hapticFeedback('notification', 'error');
      alert('Ответьте на все вопросы');
      return;
    }

    setSubmitting(true);
    hapticFeedback('impact', 'medium');
    try {
      if (!survey) return;
      const response = await api.post(`/surveys/${survey._id}/responses`, { answers });
      setSubmitted(true);
      hapticFeedback('notification', 'success');
      if (response.data.clientId) {
        localStorage.setItem('max-quiz-client-id', response.data.clientId);
      }
    } catch (error: any) {
      console.error('Ошибка отправки ответов:', error);
      hapticFeedback('notification', 'error');
      if (error.response?.status === 410) {
        setError('Опрос закрыт или срок его действия истёк');
      } else {
        alert('Не удалось отправить ответы');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (submitted) {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: 'center' }}>
          <h2>Спасибо за прохождение опроса!</h2>
          <p style={{ marginTop: '20px' }}>Ваши ответы успешно сохранены.</p>
          <div style={{ marginTop: '30px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button onClick={() => {
              setSurvey(null);
              setPublicId('');
              setAnswers([]);
              setSubmitted(false);
              setError(null);
              setTimeLeft(null);
              setIsTimeUp(false);
            }} className="btn btn-primary">
              Пройти другой опрос
            </button>
            <button onClick={() => navigate('/')} className="btn btn-secondary">
              На главную
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: 'center' }}>
          <h2 style={{ color: '#dc3545' }}>Ошибка</h2>
          <p style={{ marginTop: '20px' }}>{error}</p>
          <div style={{ marginTop: '30px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button onClick={() => {
              setError(null);
              setPublicId('');
              setSurvey(null);
            }} className="btn btn-primary">
              Попробовать снова
            </button>
            <button onClick={() => navigate('/')} className="btn btn-secondary">
              На главную
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="container">
        <h2>Пройти опрос по ID</h2>
        <div className="card">
          <div className="form-group">
            <label>ID опроса (publicId)</label>
            <input
              type="text"
              value={publicId}
              onChange={(e) => setPublicId(e.target.value)}
              placeholder="Введите ID опроса"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  loadSurvey();
                }
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '15px', flexWrap: 'wrap' }}>
            <button onClick={loadSurvey} className="btn btn-primary" disabled={loading}>
              {loading ? 'Загрузка...' : 'Загрузить опрос'}
            </button>
            {isMaxWebApp() && (
              <button onClick={handleScanQR} className="btn btn-secondary">
                📷 Сканировать QR
              </button>
            )}
            <button onClick={() => navigate('/')} className="btn btn-secondary">
              Назад
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>{survey.title}</h2>
        {timeLeft !== null && (
          <div style={{
            padding: '10px 20px',
            borderRadius: '8px',
            backgroundColor: isTimeUp ? '#dc3545' : timeLeft < 60 ? '#ffc107' : '#28a745',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '18px',
            minWidth: '80px',
            textAlign: 'center'
          }}>
            {isTimeUp ? 'Время вышло!' : formatTime(timeLeft)}
          </div>
        )}
      </div>

      {isTimeUp && (
        <div className="card" style={{ backgroundColor: '#fff3cd', borderColor: '#ffc107', marginBottom: '20px' }}>
          <p style={{ margin: 0, fontWeight: 'bold' }}>
            Время истекло! Форма заблокирована. Отправляются уже заполненные ответы...
          </p>
        </div>
      )}

      {survey.questions.map((question, qIndex) => (
        <div key={qIndex} className="card" style={{ opacity: isTimeUp ? 0.6 : 1 }}>
          <h3>
            Вопрос {qIndex + 1}: {question.text}
          </h3>
          <div className="radio-group">
            {question.options.map((option, oIndex) => (
              <label
                key={oIndex}
                className={`radio-option ${answers[qIndex] === oIndex ? 'selected' : ''}`}
                style={{ pointerEvents: isTimeUp ? 'none' : 'auto' }}
              >
                <input
                  type="radio"
                  name={`question-${qIndex}`}
                  checked={answers[qIndex] === oIndex}
                  onChange={() => handleAnswer(qIndex, oIndex)}
                  disabled={isTimeUp}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        </div>
      ))}

      <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        <button
          onClick={handleSubmit}
          className="btn btn-success"
          disabled={submitting || isTimeUp || answers.some(a => a === -1)}
        >
          {submitting ? 'Отправка...' : isTimeUp ? 'Отправка автоматически...' : 'Отправить ответы'}
        </button>
        <button 
          onClick={() => {
            setSurvey(null);
            setPublicId('');
            setAnswers([]);
            setTimeLeft(null);
            setIsTimeUp(false);
          }} 
          className="btn btn-secondary"
          disabled={isTimeUp}
        >
          Отмена
        </button>
      </div>
    </div>
  );
}
