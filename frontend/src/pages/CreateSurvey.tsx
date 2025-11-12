import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../api';
import { copyToClipboard, shareContent, shareMaxContent, hapticFeedback, isMaxWebApp } from '../utils/webapp-helpers';

interface Question {
  text: string;
  options: string[];
}

interface CreatedSurvey {
  surveyId: string;
  publicId: string;
  shareUrl: string;
  qrData: string;
  isClosed: boolean;
}

export default function CreateSurvey() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<Question[]>([
    { text: '', options: ['', ''] },
  ]);
  const [expiresInHours, setExpiresInHours] = useState<number | ''>('');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [createdSurvey, setCreatedSurvey] = useState<CreatedSurvey | null>(null);

  const addQuestion = () => {
    setQuestions([...questions, { text: '', options: ['', ''] }]);
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

  const handleCopy = async (text: string) => {
    await copyToClipboard(text);
    alert('Ссылка скопирована в буфер обмена!');
  };
  
  const handleShare = (text: string, link: string) => {
    if (shareMaxContent(text, link)) {
      return;
    }
    if (shareContent(text, link)) {
      return;
    }
    // Fallback на копирование
    handleCopy(link);
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
    }

    setLoading(true);
    try {
      const expiresAt = expiresInHours 
        ? new Date(Date.now() + Number(expiresInHours) * 60 * 60 * 1000).toISOString()
        : undefined;
      
      const timeLimitSec = timeLimitMinutes 
        ? Number(timeLimitMinutes) * 60
        : undefined;

      const response = await api.post('/surveys', {
        title,
        questions: questions.map(q => ({
          text: q.text,
          options: q.options,
        })),
        expiresAt,
        timeLimitSec,
      });
      
      setCreatedSurvey(response.data);
    } catch (error) {
      console.error('Ошибка создания опроса:', error);
      alert('Не удалось создать опрос');
    } finally {
      setLoading(false);
    }
    hapticFeedback('notification', 'success');
  };

  if (createdSurvey) {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: 'center' }}>
          <h2>Опрос успешно создан! 🎉</h2>
          
          <div style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <div>
              <h3>Ссылка для прохождения:</h3>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', alignItems: 'center', marginTop: '10px' }}>
                <input
                  type="text"
                  value={createdSurvey.shareUrl}
                  readOnly
                  style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px', minWidth: '300px' }}
                />
                <button
                  onClick={() => handleCopy(createdSurvey.shareUrl)}
                  className="btn btn-primary"
                >
                  Копировать
                </button>
                {isMaxWebApp() && (
                  <>
                    <button
                      onClick={() => handleShare(`Опрос: ${createdSurvey.shareUrl}`, createdSurvey.shareUrl)}
                      className="btn btn-secondary"
                    >
                      Поделиться в MAX
                    </button>
                    <button
                      onClick={() => shareContent(`Опрос: ${createdSurvey.shareUrl}`, createdSurvey.shareUrl)}
                      className="btn btn-secondary"
                    >
                      Поделиться
                    </button>
                  </>
                )}
              </div>
            </div>

            <div>
              <h3>QR-код:</h3>
              <div style={{ padding: '20px', background: 'white', borderRadius: '8px', display: 'inline-block' }}>
                <QRCodeSVG value={createdSurvey.qrData} size={200} />
              </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button onClick={() => navigate('/my-surveys')} className="btn btn-primary">
                Мои опросы
              </button>
              <button onClick={() => {
                setCreatedSurvey(null);
                setTitle('');
                setQuestions([{ text: '', options: ['', ''] }]);
                setExpiresInHours('');
                setTimeLimitMinutes('');
              }} className="btn btn-secondary">
                Создать ещё
              </button>
              <button onClick={() => navigate('/')} className="btn btn-secondary">
                На главную
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
              placeholder="Например: Опрос по программированию"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
            <div className="form-group">
              <label>Время жизни опроса (в часах, опционально)</label>
              <input
                type="number"
                value={expiresInHours}
                onChange={(e) => setExpiresInHours(e.target.value ? Number(e.target.value) : '')}
                placeholder="Например: 24"
                min="1"
              />
            </div>

            <div className="form-group">
              <label>Таймер на прохождение (в минутах, опционально)</label>
              <input
                type="number"
                value={timeLimitMinutes}
                onChange={(e) => setTimeLimitMinutes(e.target.value ? Number(e.target.value) : '')}
                placeholder="Например: 5"
                min="1"
              />
            </div>
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
                    style={{ flex: 1 }}
                  />
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
              <button
                type="button"
                onClick={() => addOption(qIndex)}
                className="btn btn-secondary"
                style={{ marginTop: '10px' }}
              >
                + Добавить вариант
              </button>
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
