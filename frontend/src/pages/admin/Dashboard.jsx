import { useEffect, useState } from 'react';
import { FiBook, FiUsers, FiClock, FiDollarSign, FiBookOpen } from 'react-icons/fi';
import api from '../../services/api';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard')
      .then(({ data }) => setData(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-spinner">Loading dashboard...</div>;
  if (!data) return <div className="alert alert-error">Failed to load dashboard.</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>Szabist Library — Analytics & Overview</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <FiBook className="stat-icon" />
          <div className="stat-value">{data.total_books}</div>
          <div className="stat-label">Total Books</div>
        </div>
        <div className="stat-card success">
          <FiBookOpen className="stat-icon" />
          <div className="stat-value">{data.available_books}</div>
          <div className="stat-label">Available Copies</div>
        </div>
        <div className="stat-card teal">
          <FiBookOpen className="stat-icon" />
          <div className="stat-value">{data.issued_books}</div>
          <div className="stat-label">Currently Issued</div>
        </div>
        <div className="stat-card navy">
          <FiClock className="stat-icon" />
          <div className="stat-value">{data.reserved_books}</div>
          <div className="stat-label">Active Reservations</div>
        </div>
        <div className="stat-card">
          <FiUsers className="stat-icon" />
          <div className="stat-value">{data.total_students}</div>
          <div className="stat-label">Total Students</div>
        </div>
        <div className="stat-card danger">
          <FiDollarSign className="stat-icon" />
          <div className="stat-value">Rs. {data.fine_pending}</div>
          <div className="stat-label">Pending Fines</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="card">
          <h3 className="card-title">Fine Statistics</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--gray-200)' }}>
            <span>Pending Collection</span>
            <strong style={{ color: 'var(--danger)' }}>Rs. {data.fine_pending}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0' }}>
            <span>Total Collected</span>
            <strong style={{ color: 'var(--success)' }}>Rs. {data.fine_collected}</strong>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">Books by Category</h3>
          {data.category_stats?.map((c) => (
            <div key={c.category_name} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--gray-100)' }}>
              <span>{c.category_name}</span>
              <span className="badge badge-neutral">{c.book_count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h3 className="card-title">Recent Reservations</h3>
        {data.recent_reservations?.length === 0 ? (
          <div className="empty-state">No recent reservations.</div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Student</th><th>Book</th><th>Date</th><th>Status</th></tr>
              </thead>
              <tbody>
                {data.recent_reservations.map((r) => (
                  <tr key={r.reservation_id}>
                    <td>{r.student_name}</td>
                    <td>{r.title}</td>
                    <td>{new Date(r.reservation_date).toLocaleString()}</td>
                    <td><span className="badge badge-info">{r.status}</span></td>
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

export default AdminDashboard;
