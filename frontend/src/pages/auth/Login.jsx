import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { FiBook } from 'react-icons/fi';
import AuthHero from '../../components/AuthHero';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('student');
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login({ ...form, role });
      toast.success(`Welcome back, ${data.user.name || data.user.username}.`);
      navigate(data.user.role === 'admin' ? '/admin' : '/student');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <AuthHero
        heading={<>Every book has a <em>place</em>, and a due date.</>}
        body="Search the catalogue, hold a copy, and track what you owe — all in one place."
      />
      <div className="auth-panel">
        <div className="auth-card">
          <div className="auth-logo">
            <FiBook style={{ fontSize: '2rem', color: 'var(--gold-600)' }} />
            <h1>Welcome back</h1>
            <span className="subtitle">Szabist Digital Library</span>
            <p>Sign in to continue</p>
          </div>

          <div className="auth-tabs">
            <button type="button" className={`auth-tab ${role === 'student' ? 'active' : ''}`} onClick={() => setRole('student')}>
              Student
            </button>
            <button type="button" className={`auth-tab ${role === 'admin' ? 'active' : ''}`} onClick={() => setRole('admin')}>
              Librarian
            </button>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>{role === 'admin' ? 'Username' : 'Email'}</label>
              <input
                className="form-control"
                type={role === 'admin' ? 'text' : 'email'}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder={role === 'admin' ? 'admin' : 'you@szabist.edu.pk'}
                autoComplete="username"
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                className="form-control"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Enter password"
                autoComplete="current-password"
                required
              />
            </div>
            {role === 'student' && (
              <div className="auth-link-row">
                <Link to="/forgot-password">Forgot password?</Link>
              </div>
            )}
            <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {role === 'student' && (
            <div className="auth-footer">
              New here? <Link to="/register">Create an account</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
