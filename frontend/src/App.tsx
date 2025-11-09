import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import CreateSurvey from './pages/CreateSurvey';
import TakeSurvey from './pages/TakeSurvey';
import MyResponses from './pages/MyResponses';
import MySurveys from './pages/MySurveys';
import SurveyStats from './pages/SurveyStats';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <header className="header">
          <h1>MAX Quiz</h1>
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
    </BrowserRouter>
  );
}

export default App;
