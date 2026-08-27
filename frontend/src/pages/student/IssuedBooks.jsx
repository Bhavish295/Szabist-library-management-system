import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { FiBookOpen, FiRotateCw } from 'react-icons/fi';

const MAX_RENEWALS = 2;

const IssuedBooks = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [renewingId, setRenewingId] = useState(null);

  const load = () => {
    api.get('/issues/my')
      .then(({ data }) => setBooks(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleRenew = async (issueId) => {
    setRenewingId(issueId);
    try {
      const { data } = await api.post(`/issues/${issueId}/renew`);
      toast.success(data.message);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Renewal failed.');
    } finally {
      setRenewingId(null);
    }
  };

  if (loading) return <div className="loading-spinner"><span className="spin" /> Loading…</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Issued books history</h1>
        <p>Track your borrowed books, due dates, and returns</p>
      </div>

      <div className="card">
        {books.length === 0 ? (
          <div className="empty-state"><FiBookOpen /><p>No issued books found.</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Location</th>
                  <th>Issue date</th>
                  <th>Due date</th>
                  <th>Return date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {books.map((b) => (
                  <tr key={b.issue_id}>
                    <td><strong>{b.title}</strong></td>
                    <td>{b.author}</td>
                    <td>Rack {b.rack_no}, Shelf {b.shelf_no}</td>
                    <td>{new Date(b.issue_date).toLocaleDateString()}</td>
                    <td>
                      {b.status === 'returned' ? (
                        new Date(b.due_date).toLocaleDateString()
                      ) : (
                        <span className={`due-stamp ${b.days_overdue > 0 ? 'overdue' : ''}`}>
                          <span className="due-stamp-label">{b.days_overdue > 0 ? 'Overdue' : 'Date due'}</span>
                          <span className="due-stamp-date">
                            {b.days_overdue > 0 ? `${b.days_overdue}d late` : new Date(b.due_date).toLocaleDateString()}
                          </span>
                        </span>
                      )}
                    </td>
                    <td>{b.return_date ? new Date(b.return_date).toLocaleDateString() : '-'}</td>
                    <td>
                      <span className={`badge badge-${b.status === 'returned' ? 'success' : b.status === 'overdue' ? 'danger' : 'info'}`}>
                        {b.status}
                      </span>
                    </td>
                    <td>
                      {b.status === 'issued' && (
                        b.renewal_count < MAX_RENEWALS ? (
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => handleRenew(b.issue_id)}
                            disabled={renewingId === b.issue_id}
                            title={`${MAX_RENEWALS - b.renewal_count} renewal(s) left`}
                          >
                            <FiRotateCw /> {renewingId === b.issue_id ? 'Renewing…' : 'Renew'}
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--ink-300)' }}>Limit reached</span>
                        )
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

export default IssuedBooks;
