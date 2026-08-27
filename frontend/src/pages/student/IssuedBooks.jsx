import { useEffect, useState } from 'react';
import api from '../../services/api';
import { FiBookOpen } from 'react-icons/fi';

const IssuedBooks = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/issues/my')
      .then(({ data }) => setBooks(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-spinner">Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Issued Books History</h1>
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
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th>Return Date</th>
                  <th>Status</th>
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
