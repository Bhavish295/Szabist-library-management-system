import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiBookOpen, FiClock, FiDollarSign, FiAlertTriangle } from 'react-icons/fi';
import api from '../../services/api';

const StudentDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/students/dashboard')
      .then(({ data }) => setData(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-spinner">Loading dashboard...</div>;
  if (!data) return <div className="alert alert-error">Failed to load dashboard.</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Student Dashboard</h1>
        <p>Welcome to Szabist Digital Library</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <FiBookOpen className="stat-icon" />
          <div className="stat-value">{data.issued_count}</div>
          <div className="stat-label">Currently Issued</div>
        </div>
        <div className="stat-card teal">
          <FiClock className="stat-icon" />
          <div className="stat-value">{data.reserved_count}</div>
          <div className="stat-label">Active Reservations</div>
        </div>
        <div className="stat-card danger">
          <FiDollarSign className="stat-icon" />
          <div className="stat-value">Rs. {data.pending_fines}</div>
          <div className="stat-label">Pending Fines</div>
        </div>
        <div className="stat-card navy">
          <FiAlertTriangle className="stat-icon" />
          <div className="stat-value">{data.due_soon?.length || 0}</div>
          <div className="stat-label">Due Soon (3 days)</div>
        </div>
      </div>

      {data.due_soon?.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 className="card-title">Due Date Alerts</h3>
          {data.due_soon.map((book) => (
            <div key={book.issue_id} style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--gray-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>{book.title}</strong>
                <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>
                  Due: {new Date(book.due_date).toLocaleDateString()}
                  {book.days_overdue > 0 && <span style={{ color: 'var(--danger)', marginLeft: '0.5rem' }}>({book.days_overdue} days overdue)</span>}
                </div>
              </div>
              <span className={`badge ${book.days_overdue > 0 ? 'badge-danger' : 'badge-warning'}`}>
                {book.days_overdue > 0 ? 'Overdue' : 'Due Soon'}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 className="card-title" style={{ margin: 0 }}>Recent Issued Books</h3>
          <Link to="/student/issued" className="btn btn-outline btn-sm">View All</Link>
        </div>
        {data.recent_issued?.length === 0 ? (
          <div className="empty-state">No issued books yet. <Link to="/student/search">Search books</Link></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Title</th><th>Author</th><th>Issue Date</th><th>Due Date</th><th>Status</th></tr>
              </thead>
              <tbody>
                {data.recent_issued.map((b) => (
                  <tr key={b.issue_id}>
                    <td>{b.title}</td>
                    <td>{b.author}</td>
                    <td>{new Date(b.issue_date).toLocaleDateString()}</td>
                    <td>{new Date(b.due_date).toLocaleDateString()}</td>
                    <td><span className={`badge badge-${b.status === 'returned' ? 'success' : b.status === 'overdue' ? 'danger' : 'info'}`}>{b.status}</span></td>
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

export default StudentDashboard;
