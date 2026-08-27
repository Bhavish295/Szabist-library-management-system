import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { FiBook } from 'react-icons/fi';
import AuthHero from '../../components/AuthHero';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setMessage(data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Request failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <AuthHero
        heading={<>Lost your <em>key</em>? Not a problem.</>}
        body="We'll send a reset link straight to your inbox — valid for one hour."
      />
      <div className="auth-panel">
        <div className="auth-card">
          <div className="auth-logo">
            <FiBook style={{ fontSize: '2rem', color: 'var(--gold-600)' }} />
            <h1>Forgot password</h1>
            <p>Enter your email to receive a reset link</p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {message && <div className="alert alert-success">{message}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email</label>
              <input className="form-control" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>

          <div className="auth-footer">
            <Link to="/login">Back to sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
