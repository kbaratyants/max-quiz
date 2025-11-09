import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="container">
      <h2>Выберите действие</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '30px' }}>
        <Link to="/create" className="card" style={{ textDecoration: 'none', color: 'inherit', textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '15px' }}>➕</div>
          <h3>Создать опрос</h3>
          <p style={{ color: '#666', marginTop: '10px' }}>Создать новый опрос с вопросами и вариантами ответов</p>
        </Link>

        <Link to="/my-surveys" className="card" style={{ textDecoration: 'none', color: 'inherit', textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '15px' }}>📝</div>
          <h3>Мои созданные опросы</h3>
          <p style={{ color: '#666', marginTop: '10px' }}>Посмотреть список опросов, которые вы создали</p>
        </Link>

        <Link to="/my-responses" className="card" style={{ textDecoration: 'none', color: 'inherit', textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '15px' }}>📋</div>
          <h3>Мои пройденные опросы</h3>
          <p style={{ color: '#666', marginTop: '10px' }}>Посмотреть список опросов, которые вы прошли</p>
        </Link>

        <Link to="/take" className="card" style={{ textDecoration: 'none', color: 'inherit', textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '15px' }}>✏️</div>
          <h3>Пройти опрос по ID</h3>
          <p style={{ color: '#666', marginTop: '10px' }}>Введите ID опроса для прохождения</p>
        </Link>

        <Link to="/stats" className="card" style={{ textDecoration: 'none', color: 'inherit', textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '15px' }}>📊</div>
          <h3>Статистика по созданным</h3>
          <p style={{ color: '#666', marginTop: '10px' }}>Посмотреть статистику по опросам, которые вы создали</p>
        </Link>
      </div>
    </div>
  );
}

