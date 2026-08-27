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

  if (loading) return <div className="loading-spinner"><span className="spin" /> Loading dashboard…</div>;
  if (!data) return <div className="alert alert-error">Failed to load dashboard.</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Welcome back</h1>
          <p>Here's what's happening with your library account</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <FiBookOpen className="stat-icon" />
          <div className="stat-value">{data.issued_count}</div>
          <div className="stat-label">Currently issued</div>
        </div>
        <div className="stat-card teal">
          <FiClock className="stat-icon" />
          <div className="stat-value">{data.reserved_count}</div>
          <div className="stat-label">Active reservations</div>
        </div>
        <div className="stat-card danger">
          <FiDollarSign className="stat-icon" />
          <div className="stat-value">Rs. {data.pending_fines}</div>
          <div className="stat-label">Pending fines</div>
        </div>
        <div className="stat-card navy">
          <FiAlertTriangle className="stat-icon" />
          <div className="stat-value">{data.due_soon?.length || 0}</div>
          <div className="stat-label">Due within 3 days</div>
        </div>
      </div>

      {data.due_soon?.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 className="card-title">Due date alerts</h3>
          {data.due_soon.map((book) => (
            <div
              key={book.issue_id}
              style={{
                padding: '0.85rem 0',
                borderBottom: '1px solid var(--paper-200)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem',
              }}
            >
              <strong style={{ color: 'var(--navy-700)' }}>{book.title}</strong>
              <span className={`due-stamp ${book.days_overdue > 0 ? 'overdue' : ''}`}>
                <span className="due-stamp-label">{book.days_overdue > 0 ? 'Overdue' : 'Date due'}</span>
                <span className="due-stamp-date">
                  {book.days_overdue > 0
                    ? `${book.days_overdue} day${book.days_overdue === 1 ? '' : 's'} late`
                    : new Date(book.due_date).toLocaleDateString()}
                </span>
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 className="card-title" style={{ margin: 0 }}>Recent issued books</h3>
          <Link to="/student/issued" className="btn btn-outline btn-sm">View all</Link>
        </div>
        {data.recent_issued?.length === 0 ? (
          <div className="empty-state">
            <FiBookOpen />
            <p>No issued books yet. <Link to="/student/search">Search the catalogue</Link> to get started.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Title</th><th>Author</th><th>Issue date</th><th>Due date</th><th>Status</th></tr>
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
