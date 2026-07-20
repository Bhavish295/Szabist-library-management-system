import { NavLink } from 'react-router-dom';
import {
  FiHome, FiSearch, FiBookOpen, FiClock, FiDollarSign,
  FiUsers, FiBook, FiCheckSquare, FiRefreshCw, FiBarChart2
} from 'react-icons/fi';
import './Sidebar.css';

const studentLinks = [
  { to: '/student', icon: FiHome, label: 'Dashboard', end: true },
  { to: '/student/search', icon: FiSearch, label: 'Search Books' },
  { to: '/student/issued', icon: FiBookOpen, label: 'Issued Books' },
  { to: '/student/reservations', icon: FiClock, label: 'Reservations' },
  { to: '/student/fines', icon: FiDollarSign, label: 'Fines' },
  { to: '/student/ebooks', icon: FiBook, label: 'E-Books' },
];

const adminLinks = [
  { to: '/admin', icon: FiBarChart2, label: 'Dashboard', end: true },
  { to: '/admin/books', icon: FiBook, label: 'Manage Books' },
  { to: '/admin/students', icon: FiUsers, label: 'Students' },
  { to: '/admin/reservations', icon: FiCheckSquare, label: 'Reservations' },
  { to: '/admin/issues', icon: FiRefreshCw, label: 'Issue & Return' },
  { to: '/admin/fines', icon: FiDollarSign, label: 'Fines' },
];

const Sidebar = ({ role }) => {
  const links = role === 'admin' ? adminLinks : studentLinks;

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {links.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Icon />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
