import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiBook } from 'react-icons/fi';

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
      navigate(data.user.role === 'admin' ? '/admin' : '/student');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <FiBook style={{ fontSize: '2.5rem', color: 'var(--gold)' }} />
          <h1>Szabist Digital Library</h1>
          <span className="subtitle">Shaheed Zulfikar Ali Bhutto Institute</span>
          <p>Sign in to your account</p>
        </div>

        <div className="auth-tabs">
          <button className={`auth-tab ${role === 'student' ? 'active' : ''}`} onClick={() => setRole('student')}>
            Student
          </button>
          <button className={`auth-tab ${role === 'admin' ? 'active' : ''}`} onClick={() => setRole('admin')}>
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
              required
            />
          </div>
          {role === 'student' && (
            <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
              <Link to="/forgot-password" style={{ fontSize: '0.875rem', color: 'var(--navy)' }}>
                Forgot password?
              </Link>
            </div>
          )}
          <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {role === 'student' && (
          <div className="auth-footer">
            Don't have an account? <Link to="/register">Register here</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
