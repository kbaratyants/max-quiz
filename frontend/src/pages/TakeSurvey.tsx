import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, Survey } from '../api';

export default function TakeSurvey() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    loadSurvey();
  }, [id]);

  const loadSurvey = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/surveys/${id}`);
      setSurvey(response.data);
      setAnswers(new Array(response.data.questions.length).fill(-1));
    } catch (error) {
      console.error('Ошибка загрузки опроса:', error);
      alert('Не удалось загрузить опрос');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionIndex: number, optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = optionIndex;
    setAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    if (answers.some(a => a === -1)) {
      alert('Ответьте на все вопросы');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post(`/surveys/${id}/responses`, { answers });
      setSubmitted(true);
      if (response.data.score !== undefined) {
        setScore(response.data.score);
      }
    } catch (error) {
      console.error('Ошибка отправки ответов:', error);
      alert('Не удалось отправить ответы');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading">Загрузка опроса...</div>;
  }

  if (!survey) {
    return <div className="container">Опрос не найден</div>;
  }

  if (submitted) {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: 'center' }}>
          <h2>Спасибо за прохождение опроса!</h2>
          {survey.type === 'quiz' && score !== null && (
            <p style={{ fontSize: '24px', marginTop: '20px' }}>
              Ваш результат: <strong>{score} из {survey.questions.length}</strong>
            </p>
          )}
          <button onClick={() => navigate('/')} className="btn btn-primary" style={{ marginTop: '20px' }}>
            Вернуться к списку опросов
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <h2>{survey.title}</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Тип: {survey.type === 'quiz' ? 'Квиз' : 'Обратная связь'}
      </p>

      {survey.questions.map((question, qIndex) => (
        <div key={qIndex} className="card">
          <h3>
            Вопрос {qIndex + 1}: {question.text}
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

      <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        <button
          onClick={handleSubmit}
          className="btn btn-success"
          disabled={submitting || answers.some(a => a === -1)}
        >
          {submitting ? 'Отправка...' : 'Отправить ответы'}
        </button>
        <button onClick={() => navigate('/')} className="btn btn-secondary">
          Отмена
        </button>
      </div>
    </div>
  );
}

