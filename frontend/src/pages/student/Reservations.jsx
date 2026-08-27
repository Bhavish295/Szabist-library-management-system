import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { FiClock } from 'react-icons/fi';

const statusClass = (s) => ({
  pending: 'info', approved: 'success', rejected: 'danger',
  expired: 'neutral', cancelled: 'neutral', waitlisted: 'warning',
}[s] || 'neutral');

const Reservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  const load = () => {
    api.get('/reservations/my')
      .then(({ data }) => setReservations(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCancel = async (id) => {
    setCancellingId(id);
    try {
      const { data } = await api.put(`/reservations/${id}/cancel`);
      toast.success(data.message);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancel failed.');
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) return <div className="loading-spinner"><span className="spin" /> Loading…</div>;

  return (
    <div>
      <div className="page-header">
        <h1>My reservations</h1>
        <p>Active holds and waitlist positions</p>
      </div>

      <div className="card">
        {reservations.length === 0 ? (
          <div className="empty-state"><FiClock /><p>No reservations yet.</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Book</th>
                  <th>Author</th>
                  <th>Location</th>
                  <th>Reserved on</th>
                  <th>Expires / queue</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((r) => (
                  <tr key={r.reservation_id}>
                    <td><strong>{r.title}</strong></td>
                    <td>{r.author}</td>
                    <td>Rack {r.rack_no}, Shelf {r.shelf_no}</td>
                    <td>{new Date(r.reservation_date).toLocaleString()}</td>
                    <td>
                      {r.status === 'waitlisted'
                        ? <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>#{r.queue_position} in line</span>
                        : r.expiry_date ? new Date(r.expiry_date).toLocaleString() : '—'}
                    </td>
                    <td><span className={`badge badge-${statusClass(r.status)}`}>{r.status}</span></td>
                    <td>
                      {['pending', 'waitlisted'].includes(r.status) && (
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => handleCancel(r.reservation_id)}
                          disabled={cancellingId === r.reservation_id}
                        >
                          {cancellingId === r.reservation_id ? 'Cancelling…' : 'Cancel'}
                        </button>
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

export default Reservations;
