import { useEffect, useState } from 'react';
import api from '../../services/api';
import { FiCheckSquare } from 'react-icons/fi';

const ManageReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const load = () => {
    const url = filter ? `/reservations?status=${filter}` : '/reservations';
    api.get(url)
      .then(({ data }) => setReservations(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const approve = async (id) => {
    try {
      const { data } = await api.put(`/reservations/${id}/approve`);
      setMessage(data.message);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed.');
    }
  };

  const reject = async (id) => {
    try {
      const { data } = await api.put(`/reservations/${id}/reject`);
      setMessage(data.message);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed.');
    }
  };

  const cancelExpired = async () => {
    try {
      const { data } = await api.post('/reservations/cancel-expired');
      setMessage(data.message);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed.');
    }
  };

  if (loading) return <div className="loading-spinner">Loading...</div>;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Reservation Management</h1>
          <p>Approve, reject, or cancel expired reservations</p>
        </div>
        <button className="btn btn-outline" onClick={cancelExpired}>Cancel Expired</button>
      </div>

      {message && <div className="alert alert-success">{message}</div>}

      <div style={{ marginBottom: '1rem' }}>
        <select className="form-control" style={{ maxWidth: '200px' }} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      <div className="card">
        {reservations.length === 0 ? (
          <div className="empty-state"><FiCheckSquare /><p>No reservations found.</p></div>
        ) : (
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
                    <td>{new Date(r.expiry_date).toLocaleString()}</td>
                    <td><span className="badge badge-info">{r.status}</span></td>
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
        )}
      </div>
    </div>
  );
};

export default ManageReservations;
