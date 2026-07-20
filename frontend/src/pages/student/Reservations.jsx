import { useEffect, useState } from 'react';
import api from '../../services/api';
import { FiClock } from 'react-icons/fi';

const Reservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reservations/my')
      .then(({ data }) => setReservations(data))
      .finally(() => setLoading(false));
  }, []);

  const statusClass = (s) => ({
    pending: 'warning', approved: 'success', rejected: 'danger', expired: 'neutral', cancelled: 'neutral',
  }[s] || 'neutral');

  if (loading) return <div className="loading-spinner">Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>My Reservations</h1>
        <p>Books reserved online with 24-hour hold period</p>
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
                  <th>Reserved On</th>
                  <th>Expires</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((r) => (
                  <tr key={r.reservation_id}>
                    <td><strong>{r.title}</strong></td>
                    <td>{r.author}</td>
                    <td>Rack {r.rack_no}, Shelf {r.shelf_no}</td>
                    <td>{new Date(r.reservation_date).toLocaleString()}</td>
                    <td>{new Date(r.expiry_date).toLocaleString()}</td>
                    <td><span className={`badge badge-${statusClass(r.status)}`}>{r.status}</span></td>
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
