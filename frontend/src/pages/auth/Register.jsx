import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiBook } from 'react-icons/fi';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', password: '', department: '', semester: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({ ...form, semester: parseInt(form.semester) });
      navigate('/student');
    }catch (err) {
  console.error('REGISTER ERROR:', err);

  const message =
    err.response?.data?.message ||
    err.message ||
    'Registration failed.';

  setError(message);

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <FiBook style={{ fontSize: '2.5rem', color: 'var(--gold)' }} />
          <h1>Student Registration</h1>
          <p>Create your Szabist library account</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input className="form-control" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input className="form-control" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={6} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Department</label>
              <select className="form-control" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} required>
                <option value="">Select</option>
                <option>Computer Science</option>
                <option>Business Administration</option>
                <option>Media Sciences</option>
                <option>Social Sciences</option>
                <option>Engineering</option>
              </select>
            </div>
            <div className="form-group">
              <label>Semester</label>
              <select className="form-control" value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} required>
                <option value="">Select</option>
                {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
