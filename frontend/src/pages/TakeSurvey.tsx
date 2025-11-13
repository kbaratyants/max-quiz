import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, Quiz, Submission } from '../api';
import { hapticFeedback, enableScreenCaptureProtection, disableScreenCaptureProtection } from '../utils/webapp-helpers';
import { isMaxWebApp as checkMaxWebApp } from '../utils/webapp';
import { useToastContext } from '../context/ToastContext';

export default function TakeSurvey() {
  const navigate = useNavigate();
  const { publicId: paramPublicId } = useParams<{ publicId?: string }>();
  const toast = useToastContext();
  const [quizId, setQuizId] = useState(paramPublicId || '');
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<Submission | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const loadingQuizRef = useRef(false);
  const currentQuizIdRef = useRef<string | null>(null);
  const lastAnswerRef = useRef<{ qIndex: number; oIndex: number; timestamp: number } | null>(null);

  const loadQuizById = useCallback(async (id: string) => {
    if (!id || id.trim() === '') {
      return;
    }

    // Защита от повторных запросов для того же ID
    if (loadingQuizRef.current && currentQuizIdRef.current === id) {
      return;
    }
    
    loadingQuizRef.current = true;
    currentQuizIdRef.current = id;
    setLoading(true);
    setError(null);
    try {
      // Пробуем сначала как shortId (если короткий, < 24 символов)
      // Метод /quizzes/short/:shortId возвращает полный квиз с _id
      // Если не получилось, пробуем как обычный ID
      let response;
      try {
        // Пробуем shortId если длина меньше 24 символов (MongoDB ObjectId всегда 24)
        if (id.length < 24 && /^[A-Z0-9_-]+$/i.test(id)) {
          response = await api.get(`/quizzes/short/${id}`);
        } else {
          // Иначе пробуем обычный ID
          response = await api.get(`/quizzes/${id}`);
        }
      } catch (firstError: any) {
        // Если первый запрос не сработал (404), пробуем альтернативный вариант
        if (firstError.response?.status === 404) {
          if (id.length < 24) {
            // Если пробовали shortId, пробуем обычный ID
            response = await api.get(`/quizzes/${id}`);
          } else {
            // Если пробовали обычный ID, пробуем shortId
            response = await api.get(`/quizzes/short/${id}`);
          }
        } else {
          throw firstError;
        }
      }

      if (response.data.status === 'ok' && response.data.data) {
        const quizData = response.data.data;
        
        // Нормализуем данные: если пришел quizId (из /quizzes/short/:shortId), преобразуем в _id
        if (quizData.quizId && !quizData._id) {
          quizData._id = quizData.quizId;
        }
        
        // Проверяем isActive
        if (quizData.isActive === false) {
          setError('Квиз закрыт для прохождения');
          setQuiz(null);
          return;
        }
        
        setQuiz(quizData);
        setAnswers(new Array(quizData.questions.length).fill(-1));
      } else {
        setError('Квиз не найден');
      }
    } catch (error: any) {
      console.error('Ошибка загрузки квиза:', error);
      
      // Обрабатываем специфичные ошибки от бэкенда
      if (error.response?.data?.message) {
        const message = error.response.data.message;
        if (message.includes('уже проходили')) {
          setError('Вы уже проходили этот квиз');
        } else if (message.includes('закрыт')) {
          setError('Квиз закрыт для прохождения');
        } else {
          setError(message);
        }
      } else if (error.response?.status === 404) {
        setError('Квиз не найден');
      } else {
        setError('Не удалось загрузить квиз');
      }
    } finally {
      setLoading(false);
      loadingQuizRef.current = false;
    }
  }, []);

  // Загружаем квиз при изменении paramPublicId из URL
  useEffect(() => {
    if (paramPublicId) {
      loadQuizById(paramPublicId);
    }

  }, [paramPublicId]); // Убираем loadQuizById из зависимостей, чтобы избежать бесконечных ретраев

  // Включаем защиту от скриншотов только при прохождении квиза (когда quiz загружен и не отправлен)
  useEffect(() => {
    if (checkMaxWebApp() && quiz && !submitted) {
      enableScreenCaptureProtection();
      return () => {
        disableScreenCaptureProtection();
      };
    }
  }, [quiz, submitted]);

  // Очистка таймера при размонтировании
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const loadQuiz = async () => {
    if (!quizId.trim()) {
      toast.warning('Введите ID квиза');
      return;
    }
    await loadQuizById(quizId);
  };

  const handleAnswer = (questionIndex: number, optionIndex: number) => {
    // Защита от двойного вызова (onTouchEnd + onClick на мобильных)
    const now = Date.now();
    const lastAnswer = lastAnswerRef.current;
    if (
      lastAnswer &&
      lastAnswer.qIndex === questionIndex &&
      lastAnswer.oIndex === optionIndex &&
      now - lastAnswer.timestamp < 300 // 300ms - защита от двойного вызова
    ) {
      return;
    }
    
    lastAnswerRef.current = { qIndex: questionIndex, oIndex: optionIndex, timestamp: now };
    hapticFeedback('selection');
    const newAnswers = [...answers];
    newAnswers[questionIndex] = optionIndex;
    setAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    if (answers.some(a => a === -1)) {
      hapticFeedback('notification', 'error');
      toast.warning('Ответьте на все вопросы');
      return;
    }

    if (!quiz) return;

    // Проверяем isActive перед отправкой
    if (quiz.isActive === false) {
      hapticFeedback('notification', 'error');
      toast.error('Квиз закрыт для прохождения');
      return;
    }

    setSubmitting(true);
    hapticFeedback('impact', 'medium');
    try {
      const response = await api.patch(`/submissions/quiz/${quiz._id}/submit`, { answers });
      setSubmitted(true);
      setSubmissionResult(response.data);
      hapticFeedback('notification', 'success');
    } catch (error: any) {
      console.error('Ошибка отправки ответов:', error);
      hapticFeedback('notification', 'error');
      
      // Обрабатываем специфичные ошибки
      if (error.response?.data?.message) {
        const message = error.response.data.message;
        if (message.includes('уже проходили')) {
          toast.error('Вы уже проходили этот квиз');
        } else if (message.includes('закрыт')) {
          toast.error('Квиз закрыт для новых ответов');
        } else {
          toast.error(message);
        }
      } else {
        toast.error('Не удалось отправить ответы');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted && submissionResult) {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: 'center' }}>
          <h2>Спасибо за прохождение квиза! 🎉</h2>
          <div style={{ marginTop: '20px', fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
            Ваш результат: {submissionResult.score} из {submissionResult.total}
          </div>
          <div style={{ marginTop: '10px', fontSize: '18px', color: '#666' }}>
            {Math.round((submissionResult.score / submissionResult.total) * 100)}% правильных ответов
          </div>
          <div style={{ marginTop: '30px', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => {
              setQuiz(null);
              setQuizId('');
              setAnswers([]);
              setSubmitted(false);
              setSubmissionResult(null);
              setError(null);
            }} className="btn btn-primary">
              Пройти другой квиз
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
              setQuizId('');
              setQuiz(null);
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

  if (!quiz) {
    return (
      <div className="container">
        <h2>Пройти квиз по ID</h2>
        <div className="card">
          <div className="form-group">
            <label>ID квиза</label>
            <input
              type="text"
              value={quizId}
              onChange={(e) => setQuizId(e.target.value)}
              placeholder="Введите ID квиза"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  loadQuiz();
                }
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '15px', flexWrap: 'wrap' }}>
            <button onClick={loadQuiz} className="btn btn-primary" disabled={loading}>
              {loading ? 'Загрузка...' : 'Загрузить квиз'}
            </button>
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
      <div style={{ marginBottom: '20px' }}>
        <h2>{quiz.title}</h2>
        {quiz.description && (
          <p style={{ color: '#666', marginTop: '10px' }}>{quiz.description}</p>
        )}
      </div>

      {quiz.questions.map((question, qIndex) => (
        <div key={qIndex} className="card">
          <h3>
            Вопрос {qIndex + 1}: {question.question}
          </h3>
          <div className="radio-group">
            {question.options.map((option, oIndex) => (
              <label
                key={oIndex}
                className={`radio-option ${answers[qIndex] === oIndex ? 'selected' : ''}`}
                htmlFor={`q${qIndex}-o${oIndex}`}
                onClick={() => {
                  // Обработка клика для десктопа
                  handleAnswer(qIndex, oIndex);
                }}
                onTouchEnd={(e) => {
                  // Для мобильных устройств обрабатываем touch события
                  e.preventDefault();
                  handleAnswer(qIndex, oIndex);
                }}
              >
                <input
                  type="radio"
                  id={`q${qIndex}-o${oIndex}`}
                  name={`question-${qIndex}`}
                  checked={answers[qIndex] === oIndex}
                  onChange={() => handleAnswer(qIndex, oIndex)}
                  style={{ pointerEvents: 'auto' }}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        </div>
      ))}

      <div style={{ marginTop: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={handleSubmit}
          className="btn btn-success"
          disabled={submitting || answers.some(a => a === -1)}
        >
          {submitting ? 'Отправка...' : 'Отправить ответы'}
        </button>
        <button 
          onClick={() => {
            setQuiz(null);
            setQuizId('');
            setAnswers([]);
          }} 
          className="btn btn-secondary"
        >
          Отмена
        </button>
      </div>
    </div>
  );
}
