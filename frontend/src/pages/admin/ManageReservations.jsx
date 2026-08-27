import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { FiCheckSquare, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const statusClass = (s) => ({
  pending: 'info', approved: 'success', rejected: 'danger',
  expired: 'neutral', cancelled: 'neutral', waitlisted: 'warning',
}[s] || 'neutral');

const ManageReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const load = (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 15 });
    if (filter) params.append('status', filter);
    api.get(`/reservations?${params}`)
      .then(({ data }) => {
        setReservations(data.reservations);
        setPagination(data.pagination);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(1); }, [filter]);

  const goToPage = (page) => {
    if (page < 1 || page > pagination.pages) return;
    load(page);
  };

  const approve = async (id) => {
    try {
      const { data } = await api.put(`/reservations/${id}/approve`);
      toast.success(data.message);
      load(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed.');
    }
  };

  const reject = async (id) => {
    try {
      const { data } = await api.put(`/reservations/${id}/reject`);
      toast.success(data.message);
      load(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed.');
    }
  };

  const cancelExpired = async () => {
    try {
      const { data } = await api.post('/reservations/cancel-expired');
      toast.success(data.message);
      load(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed.');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Reservation management</h1>
          <p>Approve, reject, or cancel expired reservations and holds</p>
        </div>
        <button className="btn btn-outline" onClick={cancelExpired}>Cancel expired</button>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <select className="form-control" style={{ maxWidth: '200px' }} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All status</option>
          <option value="pending">Pending</option>
          <option value="waitlisted">Waitlisted</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="expired">Expired</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-spinner"><span className="spin" /> Loading reservations…</div>
        ) : reservations.length === 0 ? (
          <div className="empty-state"><FiCheckSquare /><p>No reservations found.</p></div>
        ) : (
          <>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr><th>Student</th><th>Email</th><th>Book</th><th>Reserved</th><th>Expires</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {reservations.map((r) => (
                    <tr key={r.reservation_id}>
                      <td>{r.student_name}</td>
                      <td>{r.student_email}</td>
                      <td><strong>{r.title}</strong></td>
                      <td>{new Date(r.reservation_date).toLocaleString()}</td>
                      <td>{r.expiry_date ? new Date(r.expiry_date).toLocaleString() : '—'}</td>
                      <td><span className={`badge badge-${statusClass(r.status)}`}>{r.status}</span></td>
                      <td>
                        {r.status === 'pending' && (
                          <>
                            <button className="btn btn-success btn-sm" onClick={() => approve(r.reservation_id)} style={{ marginRight: '0.35rem' }}>Approve</button>
                            <button className="btn btn-danger btn-sm" onClick={() => reject(r.reservation_id)}>Reject</button>
                          </>
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
                <span className="pagination-info">Page {pagination.page} of {pagination.pages} · {pagination.total} reservations</span>
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

export default ManageReservations;
