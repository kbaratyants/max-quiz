import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../api';
import { copyToClipboard, shareContent, shareMaxContent, hapticFeedback, isMaxWebApp } from '../utils/webapp-helpers';
import { useToastContext } from '../context/ToastContext';

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
}

interface CreatedQuiz {
  quizId: string;
  publicUrl: string;
  shortId?: string;
}

export default function CreateSurvey() {
  const navigate = useNavigate();
  const toast = useToastContext();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<Question[]>([
    { question: '', options: ['', ''], correctAnswer: 0 },
  ]);
  const [loading, setLoading] = useState(false);
  const [createdQuiz, setCreatedQuiz] = useState<CreatedQuiz | null>(null);

  const addQuestion = () => {
    setQuestions([...questions, { question: '', options: ['', ''], correctAnswer: 0 }]);
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


  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = value;
    setQuestions(updated);
  };

  const handleCopy = async (text: string) => {
    await copyToClipboard(text);
    toast.success('Ссылка скопирована в буфер обмена!');
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
      toast.warning('Введите название квиза');
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        toast.warning(`Вопрос ${i + 1}: введите текст вопроса`);
        return;
      }
      if (q.options.length < 2) {
        toast.warning(`Вопрос ${i + 1}: должно быть минимум 2 варианта ответа`);
        return;
      }
      if (q.options.some(opt => !opt.trim())) {
        toast.warning(`Вопрос ${i + 1}: все варианты ответов должны быть заполнены`);
        return;
      }
      if (q.correctAnswer < 0 || q.correctAnswer >= q.options.length) {
        toast.warning(`Вопрос ${i + 1}: выберите правильный ответ`);
        return;
      }
    }

    setLoading(true);
    try {
      // Подготавливаем данные для отправки
      const quizData: any = {
        title: title.trim(),
        description: description.trim() || '', // description обязателен
        questions: questions.map(q => ({
          question: q.question.trim(),
          options: q.options.map(opt => opt.trim()).filter(opt => opt.length > 0),
          correctAnswer: q.correctAnswer,
        })).filter(q => q.question.length > 0 && q.options.length >= 2),
      };

      console.log('Отправка данных квиза:', JSON.stringify(quizData, null, 2));

      const response = await api.post('/quizzes', quizData);
      
      if (response.data.status === 'ok') {
        setCreatedQuiz(response.data.data);
      } else {
        throw new Error('Не удалось создать квиз');
      }
    } catch (error: any) {
      console.error('Ошибка создания квиза:', error);
      
      // Выводим детальную информацию об ошибке
      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.message) {
          // Если есть массив ошибок валидации
          if (Array.isArray(errorData.message)) {
            const messages = errorData.message.map((m: any) => 
              typeof m === 'string' ? m : Object.values(m.constraints || {}).join(', ')
            ).join('\n');
            toast.error(`Ошибка валидации:\n${messages}`);
          } else {
            toast.error(errorData.message);
          }
        } else {
          toast.error(`Ошибка: ${JSON.stringify(errorData)}`);
        }
      } else {
        toast.error('Не удалось создать квиз');
      }
    } finally {
      setLoading(false);
    }
    hapticFeedback('notification', 'success');
  };

  if (createdQuiz) {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: 'center' }}>
          <h2>Квиз успешно создан! 🎉</h2>
          
          <div style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <div>
              <h3>Ссылка для прохождения:</h3>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', alignItems: 'center', marginTop: '10px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  value={createdQuiz.publicUrl}
                  readOnly
                  style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px', minWidth: '300px', maxWidth: '100%' }}
                />
                <button
                  onClick={() => handleCopy(createdQuiz.publicUrl)}
                  className="btn btn-primary"
                >
                  Копировать
                </button>
                {isMaxWebApp() && (
                  <>
                    <button
                      onClick={() => handleShare(`Квиз: ${title}`, createdQuiz.publicUrl)}
                      className="btn btn-secondary"
                    >
                      Поделиться в MAX
                    </button>
                    <button
                      onClick={() => shareContent(`Квиз: ${title}`, createdQuiz.publicUrl)}
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
                {/* В QR-коде должен быть _id, а не shortId */}
                <QRCodeSVG value={`${window.location.origin}/survey/${createdQuiz.quizId}`} size={200} />
              </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/my-surveys')} className="btn btn-primary">
                Мои квизы
              </button>
              <button onClick={() => {
                setCreatedQuiz(null);
                setTitle('');
                setDescription('');
                setQuestions([{ question: '', options: ['', ''], correctAnswer: 0 }]);
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
      <h2>Создать квиз</h2>
      <form onSubmit={handleSubmit}>
        <div className="card">
          <div className="form-group">
            <label>Название квиза</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: Тест по JavaScript"
              required
            />
          </div>

          <div className="form-group">
            <label>Описание (опционально)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Краткое описание квиза"
              rows={3}
            />
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
                value={question.question}
                onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                placeholder="Введите вопрос"
                required
              />
            </div>

            <div className="form-group">
              <label>Варианты ответов</label>
              {question.options.map((option, oIndex) => (
                <div key={oIndex} style={{ display: 'flex', gap: '8px', marginBottom: '10px', alignItems: 'center' }}>
                  <input
                    type="radio"
                    name={`correct-${qIndex}`}
                    checked={question.correctAnswer === oIndex}
                    onChange={() => updateQuestion(qIndex, 'correctAnswer', oIndex)}
                    style={{ 
                      width: '18px',
                      height: '18px',
                      minWidth: '18px',
                      flexShrink: 0,
                      cursor: 'pointer'
                    }}
                  />
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                    placeholder={`Вариант ${oIndex + 1}`}
                    required
                    style={{ 
                      flex: '1 1 0',
                      minWidth: '150px',
                      padding: '10px', 
                      fontSize: '16px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      boxSizing: 'border-box'
                    }}
                  />
                  {question.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...questions];
                        updated[qIndex].options = updated[qIndex].options.filter((_, i) => i !== oIndex);
                        if (updated[qIndex].correctAnswer >= updated[qIndex].options.length) {
                          updated[qIndex].correctAnswer = updated[qIndex].options.length - 1;
                        }
                        setQuestions(updated);
                      }}
                      className="btn btn-secondary"
                      style={{ padding: '5px 10px' }}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => addOption(qIndex)}
                  className="btn btn-secondary"
                >
                  + Добавить вариант
                </button>
                <span style={{ color: '#666', fontSize: '14px', alignSelf: 'center' }}>
                  Выберите правильный ответ (радиокнопка)
                </span>
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
            {loading ? 'Создание...' : 'Создать квиз'}
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
