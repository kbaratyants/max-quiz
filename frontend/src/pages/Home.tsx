import { useNavigate } from 'react-router-dom';
import { openCodeReader, isMaxWebApp as checkMaxWebApp } from '../utils/webapp-helpers';
import { useState } from 'react';

export default function Home() {
  const navigate = useNavigate();
  const [qrDebug, setQrDebug] = useState<string>('');

  const handleScanQR = async () => {
    setQrDebug('Инициализация сканирования...');
    try {
      if (!checkMaxWebApp()) {
        setQrDebug('❌ QR сканер недоступен (не в MAX WebApp)');
        return;
      }

      setQrDebug('Открываем камеру...');
      const qrResult = await openCodeReader(true);
      
      if (!qrResult || !qrResult.trim()) {
        setQrDebug('❌ QR код не распознан или пуст');
        return;
      }

      setQrDebug(`✅ Распознано: ${qrResult}`);
      
      // Извлекаем quizId из URL если это ссылка
      const match = qrResult.match(/(?:survey|quiz|quizzes)\/([a-zA-Z0-9_-]+)/i);
      if (match) {
        const quizId = match[1];
        setQrDebug(`✅ Извлечен ID: ${quizId}`);
        navigate(`/survey/${quizId}`);
      } else if (/^[a-zA-Z0-9_-]+$/.test(qrResult.trim())) {
        // Прямой ID
        setQrDebug(`✅ Используем как ID: ${qrResult.trim()}`);
        navigate(`/survey/${qrResult.trim()}`);
      } else {
        setQrDebug(`⚠️ Не удалось распознать ID из: ${qrResult}`);
      }
    } catch (error: any) {
      console.error('Ошибка сканирования QR:', error);
      
      // Выводим полную информацию об ошибке для отладки
      const errorDetails = error?.message || JSON.stringify(error, null, 2) || 'Неизвестная ошибка';
      setQrDebug(`❌ Ошибка:\n${errorDetails}\n\nТип: ${typeof error}\nКлючи: ${error ? Object.keys(error).join(', ') : 'нет'}`);
      
      if (error?.message?.includes('QR code reader not available')) {
        setQrDebug('❌ QR сканер недоступен (не в MAX WebApp)');
      } else if (error?.message?.includes('Сканирование отменено')) {
        setQrDebug('⚠️ Сканирование отменено пользователем');
      }
    }
  };

  return (
    <div className="container">
      <h2>MAX Quiz</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '30px' }}>
        {/* Кнопка: Пройти квиз */}
        <button
          onClick={() => navigate('/take')}
          className="btn btn-primary"
          style={{ 
            padding: '30px', 
            fontSize: '18px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <div style={{ fontSize: '48px' }}>✏️</div>
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Пройти квиз</div>
            <div style={{ fontSize: '14px', opacity: 0.8 }}>По ID или QR-коду</div>
          </div>
        </button>

        {/* Кнопка: Сканировать QR (только в MAX) */}
        {checkMaxWebApp() && (
          <button
            onClick={handleScanQR}
            className="btn btn-secondary"
            style={{ 
              padding: '20px', 
              fontSize: '16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <div style={{ fontSize: '36px' }}>📷</div>
            <div>Сканировать QR-код</div>
          </button>
        )}

        {/* Дебаг QR */}
        {qrDebug && (
          <div className="card" style={{ 
            padding: '15px', 
            backgroundColor: '#f5f5f5',
            fontSize: '12px',
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>QR Debug:</div>
            <div>{qrDebug}</div>
          </div>
        )}

        {/* Кнопка: Создать квиз */}
        <button
          onClick={() => navigate('/create')}
          className="btn btn-success"
          style={{ 
            padding: '30px', 
            fontSize: '18px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <div style={{ fontSize: '48px' }}>➕</div>
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Создать квиз</div>
            <div style={{ fontSize: '14px', opacity: 0.8 }}>Создать новый квиз с вопросами</div>
          </div>
        </button>
      </div>
    </div>
  );
}

