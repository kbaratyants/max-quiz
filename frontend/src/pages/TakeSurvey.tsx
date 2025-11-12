import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, Quiz, Submission } from '../api';
import { openCodeReader, hapticFeedback, enableScreenCaptureProtection, disableScreenCaptureProtection, isMaxWebApp, extractQuizIdFromQR } from '../utils/webapp-helpers';
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
      const response = await api.get(`/quizzes/${id}`);
      if (response.data.status === 'ok' && response.data.data) {
        setQuiz(response.data.data);
        setAnswers(new Array(response.data.data.questions.length).fill(-1));
      } else {
        setError('Квиз не найден');
      }
    } catch (error: any) {
      console.error('Ошибка загрузки квиза:', error);
      if (error.response?.status === 404) {
        setError('Квиз не найден');
      } else {
        setError('Не удалось загрузить квиз');
      }
    } finally {
      setLoading(false);
      loadingQuizRef.current = false;
    }
  }, []);

  // Загружаем квиз при изменении paramPublicId
  useEffect(() => {
    if (paramPublicId) {
      loadQuizById(paramPublicId);
    }
  }, [paramPublicId, loadQuizById]);

  // Включаем защиту от скриншотов при прохождении квиза в MAX
  useEffect(() => {
    if (checkMaxWebApp() && quiz) {
      enableScreenCaptureProtection();
      return () => {
        disableScreenCaptureProtection();
      };
    }
  }, [quiz]);

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
    hapticFeedback('selection');
    const newAnswers = [...answers];
    newAnswers[questionIndex] = optionIndex;
    setAnswers(newAnswers);
  };
  
  const handleScanQR = async () => {
    try {
      if (!checkMaxWebApp()) {
        toast.error('QR сканер недоступен (не в MAX WebApp)');
        return;
      }

      const qrResult = await openCodeReader(true);
      
      // Извлекаем quizId используя общую функцию
      const quizId = extractQuizIdFromQR(qrResult);
      if (quizId) {
        setQuizId(quizId);
        await loadQuizById(quizId);
      } else {
        toast.error(`Не удалось распознать ID из QR-кода: ${qrResult}`);
      }
    } catch (error: any) {
      console.error('Ошибка сканирования QR:', error);
      
      // Показываем понятное сообщение пользователю
      if (error?.message?.includes('QR code reader not available')) {
        // Не показываем ошибку, если сканер недоступен (не в MAX)
        return;
      } else if (error?.message?.includes('Сканирование отменено')) {
        // Не показываем ошибку, если пользователь просто отменил
        return;
      } else {
        // Выводим детальную информацию об ошибке
        const errorMessage = error?.message || 'Не удалось отсканировать QR-код';
        toast.error(errorMessage);
      }
    }
  };

  const handleSubmit = async () => {
    if (answers.some(a => a === -1)) {
      hapticFeedback('notification', 'error');
      toast.warning('Ответьте на все вопросы');
      return;
    }

    setSubmitting(true);
    hapticFeedback('impact', 'medium');
    try {
      if (!quiz) return;
      const response = await api.patch(`/submissions/quiz/${quiz._id}/submit`, { answers });
      setSubmitted(true);
      setSubmissionResult(response.data);
      hapticFeedback('notification', 'success');
    } catch (error: any) {
      console.error('Ошибка отправки ответов:', error);
      hapticFeedback('notification', 'error');
      toast.error('Не удалось отправить ответы');
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
              >
                <input
                  type="radio"
                  name={`question-${qIndex}`}
                  checked={answers[qIndex] === oIndex}
                  onChange={() => handleAnswer(qIndex, oIndex)}
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
