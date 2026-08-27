import { useState } from 'react';
import toast from 'react-hot-toast';
import { FiUser, FiLock } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Profile = () => {
  const { user, isStudent, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    department: user?.department || '',
    semester: user?.semester || '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [changingPw, setChangingPw] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { data } = await api.put('/auth/profile', { ...form, semester: parseInt(form.semester) });
      updateUser(data.user);
      toast.success('Profile updated.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) {
      toast.error('New passwords do not match.');
      return;
    }
    setChangingPw(true);
    try {
      const { data } = await api.put('/auth/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      toast.success(data.message);
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed.');
    } finally {
      setChangingPw(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Your account</h1>
          <p>Manage your profile and password</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isStudent ? '1fr 1fr' : '1fr', gap: '1.5rem' }} className="dashboard-charts">
        {isStudent && (
          <div className="card">
            <h3 className="card-title"><FiUser style={{ marginRight: '0.4rem', verticalAlign: '-2px' }} />Profile details</h3>
            <form onSubmit={handleProfileSubmit}>
              <div className="form-group">
                <label>Full name</label>
                <input className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input className="form-control" value={user?.email || ''} disabled style={{ opacity: 0.6 }} />
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
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <button className="btn btn-primary" disabled={savingProfile}>
                {savingProfile ? 'Saving…' : 'Save changes'}
              </button>
            </form>
          </div>
        )}

        <div className="card">
          <h3 className="card-title"><FiLock style={{ marginRight: '0.4rem', verticalAlign: '-2px' }} />Change password</h3>
          <form onSubmit={handlePasswordSubmit}>
            <div className="form-group">
              <label>Current password</label>
              <input className="form-control" type="password" value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>New password</label>
              <input className="form-control" type="password" value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} minLength={6} required />
            </div>
            <div className="form-group">
              <label>Confirm new password</label>
              <input className="form-control" type="password" value={pwForm.confirm} onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })} required />
            </div>
            <button className="btn btn-secondary" disabled={changingPw}>
              {changingPw ? 'Updating…' : 'Update password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
