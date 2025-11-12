import { Link, useLocation } from 'react-router-dom';
import './BottomNavigation.css';

export default function BottomNavigation() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="bottom-nav">
      <Link 
        to="/" 
        className={`bottom-nav-item ${isActive('/') ? 'active' : ''}`}
      >
        <div className="bottom-nav-icon">🏠</div>
        <span className="bottom-nav-label">Главная</span>
      </Link>
      
      <Link 
        to="/my-surveys" 
        className={`bottom-nav-item ${isActive('/my-surveys') ? 'active' : ''}`}
      >
        <div className="bottom-nav-icon">📝</div>
        <span className="bottom-nav-label">Мои квизы</span>
      </Link>
      
      <Link 
        to="/my-responses" 
        className={`bottom-nav-item ${isActive('/my-responses') ? 'active' : ''}`}
      >
        <div className="bottom-nav-icon">📋</div>
        <span className="bottom-nav-label">Пройденные</span>
      </Link>
      
      <Link 
        to="/stats" 
        className={`bottom-nav-item ${isActive('/stats') ? 'active' : ''}`}
      >
        <div className="bottom-nav-icon">📊</div>
        <span className="bottom-nav-label">Статистика</span>
      </Link>
      
      <Link 
        to="/profile" 
        className={`bottom-nav-item ${isActive('/profile') ? 'active' : ''}`}
      >
        <div className="bottom-nav-icon">👤</div>
        <span className="bottom-nav-label">Профиль</span>
      </Link>
    </nav>
  );
}

