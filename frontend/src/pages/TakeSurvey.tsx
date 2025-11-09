import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, Survey } from '../api';

export default function TakeSurvey() {
  const navigate = useNavigate();
  const [surveyId, setSurveyId] = useState('');
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const loadSurvey = async () => {
    if (!surveyId.trim()) {
      alert('Введите ID опроса');
      return;
    }

    setLoading(true);
    try {
      const response = await api.get(`/surveys/${surveyId}`);
      setSurvey(response.data);
      setAnswers(new Array(response.data.questions.length).fill(-1));
    } catch (error: any) {
      console.error('Ошибка загрузки опроса:', error);
      if (error.response?.status === 404) {
        alert('Опрос не найден');
      } else {
        alert('Не удалось загрузить опрос');
      }
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
      const response = await api.post(`/surveys/${surveyId}/responses`, { answers });
      setSubmitted(true);
      // Сохраняем clientId если он был сгенерирован
      if (response.data.clientId) {
        localStorage.setItem('max-quiz-client-id', response.data.clientId);
      }
    } catch (error) {
      console.error('Ошибка отправки ответов:', error);
      alert('Не удалось отправить ответы');
    } finally {
      setSubmitting(false);
    }
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
              setSurveyId('');
              setAnswers([]);
              setSubmitted(false);
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

  if (!survey) {
    return (
      <div className="container">
        <h2>Пройти опрос по ID</h2>
        <div className="card">
          <div className="form-group">
            <label>ID опроса</label>
            <input
              type="text"
              value={surveyId}
              onChange={(e) => setSurveyId(e.target.value)}
              placeholder="Введите ID опроса"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  loadSurvey();
                }
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
            <button onClick={loadSurvey} className="btn btn-primary" disabled={loading}>
              {loading ? 'Загрузка...' : 'Загрузить опрос'}
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
      <h2>{survey.title}</h2>

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
        <button onClick={() => {
          setSurvey(null);
          setSurveyId('');
          setAnswers([]);
        }} className="btn btn-secondary">
          Отмена
        </button>
      </div>
    </div>
  );
}
