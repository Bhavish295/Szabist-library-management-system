import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { FiDollarSign } from 'react-icons/fi';

const ManageFines = () => {
  const [fines, setFines] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    Promise.all([
      api.get('/fines'),
      api.get('/fines/stats'),
    ]).then(([finesRes, statsRes]) => {
      setFines(finesRes.data);
      setStats(statsRes.data);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const markPaid = async (id) => {
    try {
      const { data } = await api.put(`/fines/${id}/pay`);
      toast.success(data.message);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed.');
    }
  };

  if (loading) return <div className="loading-spinner"><span className="spin" /> Loading fines…</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Fine management</h1>
          <p>Auto-calculated fines and payment tracking</p>
        </div>
      </div>

      {stats && (
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <div className="stat-card">
            <div className="stat-value">{stats.total_fines}</div>
            <div className="stat-label">Total fine records</div>
          </div>
          <div className="stat-card danger">
            <div className="stat-value">Rs. {stats.pending_amount}</div>
            <div className="stat-label">Pending ({stats.pending_count})</div>
          </div>
          <div className="stat-card success">
            <div className="stat-value">Rs. {stats.collected_amount}</div>
            <div className="stat-label">Collected</div>
          </div>
        </div>
      )}

      <div className="card">
        {fines.length === 0 ? (
          <div className="empty-state"><FiDollarSign /><p>No fines recorded.</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Student</th><th>Email</th><th>Book</th><th>Amount</th><th>Reason</th><th>Status</th><th>Date</th><th>Action</th></tr>
              </thead>
              <tbody>
                {fines.map((f) => (
                  <tr key={f.fine_id}>
                    <td>{f.student_name}</td>
                    <td>{f.email}</td>
                    <td>{f.book_title}</td>
                    <td><strong>Rs. {f.amount}</strong></td>
                    <td>{f.reason}</td>
                    <td><span className={`badge badge-${f.status === 'paid' ? 'success' : 'danger'}`}>{f.status}</span></td>
                    <td>{new Date(f.created_at).toLocaleDateString()}</td>
                    <td>
                      {f.status === 'pending' && (
                        <button className="btn btn-success btn-sm" onClick={() => markPaid(f.fine_id)}>Mark paid</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageFines;
