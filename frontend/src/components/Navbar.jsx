import { Link, useNavigate } from 'react-router-dom';
import { FiBell, FiLogOut, FiBook } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import api from '../services/api';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isStudent } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (isStudent) {
      api.get('/notifications/unread-count')
        .then(({ data }) => setUnread(data.count))
        .catch(() => {});
    }
  }, [isStudent]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner container">
        <Link to={user?.role === 'admin' ? '/admin' : '/student'} className="navbar-brand">
          <FiBook className="brand-icon" />
          <div>
            <span className="brand-title">Szabist</span>
            <span className="brand-sub">Digital Library</span>
          </div>
        </Link>

        <div className="navbar-actions">
          {isStudent && (
            <Link to="/student/notifications" className="notif-btn">
              <FiBell />
              {unread > 0 && <span className="notif-badge">{unread}</span>}
            </Link>
          )}
          <Link to={user?.role === 'admin' ? '/admin/profile' : '/student/profile'} className="user-info" title="Account settings">
            <span className="user-name">{user?.name || user?.username}</span>
            <span className="user-role">{user?.role}</span>
          </Link>
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            <FiLogOut />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
