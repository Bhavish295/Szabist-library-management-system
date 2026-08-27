import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { FiRefreshCw } from 'react-icons/fi';

const IssueReturn = () => {
  const [issues, setIssues] = useState([]);
  const [students, setStudents] = useState([]);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showIssue, setShowIssue] = useState(false);
  const [issueForm, setIssueForm] = useState({ student_id: '', book_id: '' });
  const [filter, setFilter] = useState('issued');

  const load = () => {
    Promise.all([
      api.get(`/issues${filter ? `?status=${filter}` : ''}`),
      api.get('/students'),
      api.get('/books/search?limit=48'),
    ]).then(([issuesRes, studentsRes, booksRes]) => {
      setIssues(issuesRes.data);
      setStudents(studentsRes.data.filter(s => !s.is_blocked));
      setBooks(booksRes.data.books.filter(b => b.available_quantity > 0));
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const handleIssue = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/issues/issue', issueForm);
      toast.success(data.message);
      setShowIssue(false);
      setIssueForm({ student_id: '', book_id: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Issue failed.');
    }
  };

  const handleReturn = async (issueId) => {
    if (!confirm('Confirm book return?')) return;
    try {
      const { data } = await api.post('/issues/return', { issue_id: issueId });
      toast.success(`${data.message}${data.fine > 0 ? ` Fine: Rs. ${data.fine}` : ''}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Return failed.');
    }
  };

  if (loading) return <div className="loading-spinner">Loading...</div>;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Issue & Return</h1>
          <p>Issue books to students and process returns</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowIssue(true)}>Issue Book</button>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <select className="form-control" style={{ maxWidth: '200px' }} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="issued">Currently Issued</option>
          <option value="overdue">Overdue</option>
          <option value="returned">Returned</option>
          <option value="">All</option>
        </select>
      </div>

      <div className="card">
        {issues.length === 0 ? (
          <div className="empty-state"><FiRefreshCw /><p>No records found.</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Student</th><th>Book</th><th>Issue Date</th><th>Due Date</th><th>Return Date</th><th>Status</th><th>Action</th></tr>
              </thead>
              <tbody>
                {issues.map((i) => (
                  <tr key={i.issue_id}>
                    <td>{i.student_name}</td>
                    <td><strong>{i.title}</strong></td>
                    <td>{new Date(i.issue_date).toLocaleDateString()}</td>
                    <td>{new Date(i.due_date).toLocaleDateString()}</td>
                    <td>{i.return_date ? new Date(i.return_date).toLocaleDateString() : '-'}</td>
                    <td><span className={`badge badge-${i.status === 'returned' ? 'success' : i.status === 'overdue' ? 'danger' : 'info'}`}>{i.status}</span></td>
                    <td>
                      {i.status !== 'returned' && (
                        <button className="btn btn-success btn-sm" onClick={() => handleReturn(i.issue_id)}>Return</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showIssue && (
        <div className="modal-overlay" onClick={() => setShowIssue(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Issue Book to Student</h2>
            <form onSubmit={handleIssue}>
              <div className="form-group">
                <label>Student</label>
                <select className="form-control" value={issueForm.student_id} onChange={(e) => setIssueForm({ ...issueForm, student_id: e.target.value })} required>
                  <option value="">Select student</option>
                  {students.map((s) => <option key={s.student_id} value={s.student_id}>{s.name} ({s.email})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Book</label>
                <select className="form-control" value={issueForm.book_id} onChange={(e) => setIssueForm({ ...issueForm, book_id: e.target.value })} required>
                  <option value="">Select book</option>
                  {books.map((b) => <option key={b.book_id} value={b.book_id}>{b.title} ({b.available_quantity} available)</option>)}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowIssue(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Issue Book</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default IssueReturn;
