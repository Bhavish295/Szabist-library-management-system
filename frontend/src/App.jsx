import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import StudentDashboard from './pages/student/Dashboard';
import BookSearch from './pages/student/BookSearch';
import BookDetails from './pages/student/BookDetails';
import IssuedBooks from './pages/student/IssuedBooks';
import Reservations from './pages/student/Reservations';
import Fines from './pages/student/Fines';
import Ebooks from './pages/student/Ebooks';
import Notifications from './pages/student/Notifications';
import AdminDashboard from './pages/admin/Dashboard';
import ManageBooks from './pages/admin/ManageBooks';
import ManageStudents from './pages/admin/ManageStudents';
import ManageReservations from './pages/admin/ManageReservations';
import IssueReturn from './pages/admin/IssueReturn';
import ManageFines from './pages/admin/ManageFines';
import Profile from './pages/Profile';

const HomeRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-spinner">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'admin' ? '/admin' : '/student'} replace />;
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route path="/student" element={<Layout role="student" />}>
        <Route index element={<StudentDashboard />} />
        <Route path="search" element={<BookSearch />} />
        <Route path="books/:id" element={<BookDetails />} />
        <Route path="issued" element={<IssuedBooks />} />
        <Route path="reservations" element={<Reservations />} />
        <Route path="fines" element={<Fines />} />
        <Route path="ebooks" element={<Ebooks />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      <Route path="/admin" element={<Layout role="admin" />}>
        <Route index element={<AdminDashboard />} />
        <Route path="books" element={<ManageBooks />} />
        <Route path="students" element={<ManageStudents />} />
        <Route path="reservations" element={<ManageReservations />} />
        <Route path="issues" element={<IssueReturn />} />
        <Route path="fines" element={<ManageFines />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
