import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

interface Question {
  text: string;
  options: string[];
  correctOptionIndex?: number;
}

export default function CreateSurvey() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'quiz' | 'feedback'>('quiz');
  const [questions, setQuestions] = useState<Question[]>([
    { text: '', options: ['', ''], correctOptionIndex: undefined },
  ]);
  const [loading, setLoading] = useState(false);

  const addQuestion = () => {
    setQuestions([...questions, { text: '', options: ['', ''], correctOptionIndex: undefined }]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const addOption = (qIndex: number) => {
    const updated = [...questions];
    updated[qIndex].options.push('');
    setQuestions(updated);
  };

  const removeOption = (qIndex: number, oIndex: number) => {
    const updated = [...questions];
    updated[qIndex].options = updated[qIndex].options.filter((_, i) => i !== oIndex);
    setQuestions(updated);
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = value;
    setQuestions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Валидация
    if (!title.trim()) {
      alert('Введите название опроса');
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        alert(`Вопрос ${i + 1}: введите текст вопроса`);
        return;
      }
      if (q.options.length < 2) {
        alert(`Вопрос ${i + 1}: должно быть минимум 2 варианта ответа`);
        return;
      }
      if (q.options.some(opt => !opt.trim())) {
        alert(`Вопрос ${i + 1}: все варианты ответов должны быть заполнены`);
        return;
      }
      if (type === 'quiz' && q.correctOptionIndex === undefined) {
        alert(`Вопрос ${i + 1}: выберите правильный ответ`);
        return;
      }
    }

    setLoading(true);
    try {
      await api.post('/surveys', {
        title,
        type,
        questions: questions.map(q => ({
          text: q.text,
          options: q.options,
          correctOptionIndex: type === 'quiz' ? q.correctOptionIndex : undefined,
        })),
      });
      navigate('/');
    } catch (error) {
      console.error('Ошибка создания опроса:', error);
      alert('Не удалось создать опрос');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h2>Создать опрос</h2>
      <form onSubmit={handleSubmit}>
        <div className="card">
          <div className="form-group">
            <label>Название опроса</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: Квиз по JavaScript"
              required
            />
          </div>
          <div className="form-group">
            <label>Тип опроса</label>
            <select value={type} onChange={(e) => setType(e.target.value as 'quiz' | 'feedback')}>
              <option value="quiz">Квиз (с правильными ответами)</option>
              <option value="feedback">Обратная связь (без правильных ответов)</option>
            </select>
          </div>
        </div>

        {questions.map((question, qIndex) => (
          <div key={qIndex} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3>Вопрос {qIndex + 1}</h3>
              {questions.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeQuestion(qIndex)}
                  className="btn btn-secondary"
                  style={{ backgroundColor: '#dc3545' }}
                >
                  Удалить вопрос
                </button>
              )}
            </div>

            <div className="form-group">
              <label>Текст вопроса</label>
              <textarea
                value={question.text}
                onChange={(e) => updateQuestion(qIndex, 'text', e.target.value)}
                placeholder="Введите вопрос"
                required
              />
            </div>

            <div className="form-group">
              <label>Варианты ответов</label>
              {question.options.map((option, oIndex) => (
                <div key={oIndex} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                    placeholder={`Вариант ${oIndex + 1}`}
                    required
                  />
                  {type === 'quiz' && (
                    <input
                      type="radio"
                      name={`correct-${qIndex}`}
                      checked={question.correctOptionIndex === oIndex}
                      onChange={() => updateQuestion(qIndex, 'correctOptionIndex', oIndex)}
                    />
                  )}
                  {question.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(qIndex, oIndex)}
                      className="btn btn-secondary"
                      style={{ padding: '5px 10px' }}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => addOption(qIndex)}
                  className="btn btn-secondary"
                >
                  + Добавить вариант
                </button>
                {type === 'quiz' && (
                  <span style={{ lineHeight: '40px', color: '#666' }}>
                    Радиокнопка = правильный ответ
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button
            type="button"
            onClick={addQuestion}
            className="btn btn-secondary"
          >
            + Добавить вопрос
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Создание...' : 'Создать опрос'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn btn-secondary"
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
}

