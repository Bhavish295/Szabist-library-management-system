import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import './Layout.css';

const Layout = ({ role }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading-spinner">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/student'} replace />;
  }

  return (
    <div className="layout">
      <Navbar />
      <div className="layout-body">
        <Sidebar role={user.role} />
        <main className="layout-main">
          <div className="container page-content">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
