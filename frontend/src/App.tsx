import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import Home from './pages/Home';
import CreateSurvey from './pages/CreateSurvey';
import TakeSurvey from './pages/TakeSurvey';
import MyResponses from './pages/MyResponses';
import MySurveys from './pages/MySurveys';
import SurveyStats from './pages/SurveyStats';
import { initWebApp, isMaxWebApp, getUserInfoFromWebApp } from './utils/webapp';
import { useWebApp } from './hooks/useWebApp';
import './App.css';

function App() {
  useEffect(() => {
    // Инициализируем WebApp при загрузке
    if (isMaxWebApp()) {
      initWebApp();
    }
  }, []);

  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

function AppContent() {
  useWebApp(); // Настраиваем кнопку "Назад" и другие функции WebApp
  
  const userInfo = getUserInfoFromWebApp();
  const isInMax = isMaxWebApp();

  return (
    <div className="app">
      <header className="header">
        <h1>MAX Quiz</h1>
        {isInMax && userInfo && (
          <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
            {userInfo.firstName} {userInfo.lastName}
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
