import { useEffect, useState } from 'react';
import api from '../../services/api';
import { FiDollarSign } from 'react-icons/fi';

const Fines = () => {
  const [fines, setFines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/fines/my')
      .then(({ data }) => setFines(data))
      .finally(() => setLoading(false));
  }, []);

  const totalPending = fines.filter(f => f.status === 'pending').reduce((s, f) => s + parseFloat(f.amount), 0);

  if (loading) return <div className="loading-spinner">Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Fines & Penalties</h1>
        <p>Auto-calculated fines for late returns (Rs. 50/day)</p>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="stat-card danger">
          <FiDollarSign className="stat-icon" />
          <div className="stat-value">Rs. {totalPending}</div>
          <div className="stat-label">Total Pending</div>
        </div>
      </div>

      <div className="card">
        {fines.length === 0 ? (
          <div className="empty-state"><FiDollarSign /><p>No fines recorded. Keep returning books on time!</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Book</th><th>Amount</th><th>Reason</th><th>Due Date</th><th>Return Date</th><th>Status</th><th>Date</th></tr>
              </thead>
              <tbody>
                {fines.map((f) => (
                  <tr key={f.fine_id}>
                    <td>{f.book_title}</td>
                    <td><strong>Rs. {f.amount}</strong></td>
                    <td>{f.reason}</td>
                    <td>{new Date(f.due_date).toLocaleDateString()}</td>
                    <td>{f.return_date ? new Date(f.return_date).toLocaleDateString() : '-'}</td>
                    <td><span className={`badge badge-${f.status === 'paid' ? 'success' : 'danger'}`}>{f.status}</span></td>
                    <td>{new Date(f.created_at).toLocaleDateString()}</td>
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

export default Fines;
