import { Link } from 'react-router-dom';
import { isMaxWebApp, getUserInfoFromWebApp } from '../utils/webapp';

export default function Home() {
  const isInMax = isMaxWebApp();
  const userInfo = getUserInfoFromWebApp();
  const userName = userInfo 
    ? `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim() || userInfo.username || 'Пользователь'
    : null;

  return (
    <div className="container">
      <h2>Выберите действие</h2>
      
      {/* Минимальная дебаг-информация */}
      <div style={{ 
        marginBottom: '20px', 
        padding: '12px', 
        backgroundColor: isInMax ? '#e8f5e9' : '#fff3cd', 
        borderRadius: '8px',
        fontSize: '14px',
        border: `1px solid ${isInMax ? '#4caf50' : '#ffc107'}`
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
          MAX WebApp: {isInMax ? '✅ Инициализировано' : '❌ Не инициализировано'}
        </div>
        {userName && (
          <div style={{ color: '#666' }}>
            Пользователь: {userName}
          </div>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '30px' }}>
        <Link to="/create" className="card" style={{ textDecoration: 'none', color: 'inherit', textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '15px' }}>➕</div>
          <h3>Создать квиз</h3>
          <p style={{ color: '#666', marginTop: '10px' }}>Создать новый квиз с вопросами и правильными ответами</p>
        </Link>

        <Link to="/my-surveys" className="card" style={{ textDecoration: 'none', color: 'inherit', textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '15px' }}>📝</div>
          <h3>Мои созданные квизы</h3>
          <p style={{ color: '#666', marginTop: '10px' }}>Посмотреть список квизов, которые вы создали</p>
        </Link>

        <Link to="/my-responses" className="card" style={{ textDecoration: 'none', color: 'inherit', textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '15px' }}>📋</div>
          <h3>Мои пройденные квизы</h3>
          <p style={{ color: '#666', marginTop: '10px' }}>Посмотреть список квизов, которые вы прошли</p>
        </Link>

        <Link to="/take" className="card" style={{ textDecoration: 'none', color: 'inherit', textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '15px' }}>✏️</div>
          <h3>Пройти квиз по ID</h3>
          <p style={{ color: '#666', marginTop: '10px' }}>Введите ID квиза для прохождения</p>
        </Link>

        <Link to="/stats" className="card" style={{ textDecoration: 'none', color: 'inherit', textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '15px' }}>📊</div>
          <h3>Статистика по созданным</h3>
          <p style={{ color: '#666', marginTop: '10px' }}>Посмотреть статистику по квизам, которые вы создали</p>
        </Link>
      </div>
    </div>
  );
}

