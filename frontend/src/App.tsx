import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import Home from './pages/Home';
import CreateSurvey from './pages/CreateSurvey';
import TakeSurvey from './pages/TakeSurvey';
import MyResponses from './pages/MyResponses';
import MySurveys from './pages/MySurveys';
import SurveyStats from './pages/SurveyStats';
import Profile from './pages/Profile';
import BottomNavigation from './components/BottomNavigation';
import { ToastProvider } from './context/ToastContext';
import { isMaxWebApp, getUserInfoFromWebApp, getStartParam } from './utils/webapp';
import { useWebApp } from './hooks/useWebApp';
import './App.css';

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ToastProvider>
  );
}

function AppContent() {
  useWebApp(); // Настраиваем кнопку "Назад" и другие функции WebApp
  const navigate = useNavigate();
  const startParamProcessedRef = useRef(false); // Флаг для отслеживания обработки start_param
  
  const userInfo = getUserInfoFromWebApp();
  const isInMax = isMaxWebApp();

  // Обработка start_param при запуске приложения через startapp=...
  // Выполняется только один раз при первой загрузке
  useEffect(() => {
    // Если уже обработали start_param, больше не обрабатываем
    if (startParamProcessedRef.current) {
      return;
    }

    const startParam = getStartParam();
    if (startParam) {
      console.log('[MAX WebApp] Обнаружен start_param:', startParam);
      startParamProcessedRef.current = true; // Помечаем как обработанный
      // start_param содержит shortId квиза, переходим на страницу прохождения
      navigate(`/survey/${startParam}`, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Выполняем только один раз при монтировании компонента

  return (
    <div className="app">
      <header className="header">
        <h1>MAX Quiz</h1>
        {isInMax && userInfo && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px', 
            fontSize: '14px', 
            color: '#666', 
            marginTop: '5px' 
          }}>
            {userInfo.photoUrl && (
              <img 
                src={userInfo.photoUrl} 
                alt="Avatar" 
                style={{ 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '50%',
                  objectFit: 'cover'
                }} 
              />
            )}
            <span>
              {userInfo.firstName} {userInfo.lastName}
            </span>
          </div>
        )}
      </header>
      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<CreateSurvey />} />
          <Route path="/take" element={<TakeSurvey />} />
          <Route path="/survey/:publicId" element={<TakeSurvey />} />
          <Route path="/my-responses" element={<MyResponses />} />
          <Route path="/my-surveys" element={<MySurveys />} />
          <Route path="/stats" element={<SurveyStats />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <BottomNavigation />
    </div>
  );
}

export default App;
