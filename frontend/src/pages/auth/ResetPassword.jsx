import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { FiBook } from 'react-icons/fi';
import AuthHero from '../../components/AuthHero';

const ResetPassword = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/reset-password', { token, password });
      setMessage(data.message);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="auth-page">
        <AuthHero heading={<>That link has <em>expired</em>.</>} body="Request a fresh reset link from the sign-in page." />
        <div className="auth-panel">
          <div className="auth-card">
            <div className="alert alert-error">Invalid or missing reset link.</div>
            <Link to="/login" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Go to sign in</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <AuthHero heading={<>Choose a new <em>password</em>.</>} body="Pick something you'll remember — at least 6 characters." />
      <div className="auth-panel">
        <div className="auth-card">
          <div className="auth-logo">
            <FiBook style={{ fontSize: '2rem', color: 'var(--gold-600)' }} />
            <h1>Reset password</h1>
            <p>Enter your new password</p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {message && <div className="alert alert-success">{message}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>New password</label>
              <input className="form-control" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
            </div>
            <div className="form-group">
              <label>Confirm password</label>
              <input className="form-control" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Resetting…' : 'Reset password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
