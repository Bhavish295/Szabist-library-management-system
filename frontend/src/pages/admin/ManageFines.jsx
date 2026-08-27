import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { FiDollarSign, FiChevronLeft, FiChevronRight, FiDownload } from 'react-icons/fi';
import { downloadCsv } from '../../utils/csv';

const ManageFines = () => {
  const [fines, setFines] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [filter, setFilter] = useState('');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 15 });
    if (filter) params.append('status', filter);
    Promise.all([
      api.get(`/fines?${params}`),
      api.get('/fines/stats'),
    ]).then(([finesRes, statsRes]) => {
      setFines(finesRes.data.fines);
      setPagination(finesRes.data.pagination);
      setStats(statsRes.data);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(1); }, [filter]);

  const goToPage = (page) => {
    if (page < 1 || page > pagination.pages) return;
    load(page);
  };

  const markPaid = async (id) => {
    try {
      const { data } = await api.put(`/fines/${id}/pay`);
      toast.success(data.message);
      load(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed.');
    }
  };

  const exportCsv = () => {
    downloadCsv('fines-report.csv', fines, [
      { key: 'student_name', label: 'Student' },
      { key: 'email', label: 'Email' },
      { key: 'book_title', label: 'Book' },
      { key: 'amount', label: 'Amount (Rs.)' },
      { key: 'reason', label: 'Reason' },
      { key: 'status', label: 'Status' },
      { key: 'created_at', label: 'Date' },
    ]);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Fine management</h1>
          <p>Auto-calculated fines and payment tracking</p>
        </div>
        <button className="btn btn-outline" onClick={exportCsv} disabled={fines.length === 0}>
          <FiDownload /> Export this page (CSV)
        </button>
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

      <div style={{ marginBottom: '1rem' }}>
        <select className="form-control" style={{ maxWidth: '200px' }} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All status</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
        </select>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-spinner"><span className="spin" /> Loading fines…</div>
        ) : fines.length === 0 ? (
          <div className="empty-state"><FiDollarSign /><p>No fines recorded.</p></div>
        ) : (
          <>
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
            {pagination.pages > 1 && (
              <div className="pagination">
                <button className="btn btn-outline btn-sm" onClick={() => goToPage(pagination.page - 1)} disabled={pagination.page <= 1}>
                  <FiChevronLeft /> Prev
                </button>
                <span className="pagination-info">Page {pagination.page} of {pagination.pages} · {pagination.total} fines</span>
                <button className="btn btn-outline btn-sm" onClick={() => goToPage(pagination.page + 1)} disabled={pagination.page >= pagination.pages}>
                  Next <FiChevronRight />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ManageFines;
