import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import SurveyList from './pages/SurveyList';
import CreateSurvey from './pages/CreateSurvey';
import TakeSurvey from './pages/TakeSurvey';
import SurveyStats from './pages/SurveyStats';
import { AuthContext } from './context/AuthContext';
import { api } from './api';
import './App.css';

function App() {
  const [user, setUser] = useState<{ _id: string; maxId: string; role: 'teacher' | 'student' } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Проверяем сохраненного пользователя
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (maxId: string, role: 'teacher' | 'student') => {
    try {
      const response = await api.post('/auth/mock', { maxId, role });
      const userData = response.data.user;
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return userData;
    } catch (error) {
      console.error('Ошибка входа:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  if (!user) {
    return <LoginPage onLogin={login} />;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <BrowserRouter>
        <div className="app">
          <header className="header">
            <h1>MAX Quiz</h1>
            <div className="user-info">
              <span>{user.role === 'teacher' ? '👨‍🏫 Преподаватель' : '👨‍🎓 Студент'}: {user.maxId}</span>
              <button onClick={logout} className="btn btn-secondary" style={{ marginLeft: '10px' }}>
                Выйти
              </button>
            </div>
          </header>
          <main className="main">
            <Routes>
              <Route path="/" element={<SurveyList />} />
              <Route path="/create" element={<CreateSurvey />} />
              <Route path="/survey/:id" element={<TakeSurvey />} />
              <Route path="/survey/:id/stats" element={<SurveyStats />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

function LoginPage({ onLogin }: { onLogin: (maxId: string, role: 'teacher' | 'student') => Promise<any> }) {
  const [maxId, setMaxId] = useState('teacher1');
  const [role, setRole] = useState<'teacher' | 'student'>('teacher');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onLogin(maxId, role);
    } catch (error) {
      alert('Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2>Вход в MAX Quiz</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>ID пользователя (maxId)</label>
            <input
              type="text"
              value={maxId}
              onChange={(e) => setMaxId(e.target.value)}
              required
              placeholder="teacher1 или student1"
            />
          </div>
          <div className="form-group">
            <label>Роль</label>
            <select value={role} onChange={(e) => setRole(e.target.value as 'teacher' | 'student')}>
              <option value="teacher">Преподаватель</option>
              <option value="student">Студент</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
        <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
          <p><strong>Примеры:</strong></p>
          <p>Преподаватель: maxId = "teacher1"</p>
          <p>Студент: maxId = "student1"</p>
        </div>
      </div>
    </div>
  );
}

export default App;

