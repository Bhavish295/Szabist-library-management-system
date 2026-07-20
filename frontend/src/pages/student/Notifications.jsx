import { useEffect, useState } from 'react';
import api from '../../services/api';
import { FiBell } from 'react-icons/fi';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api.get('/notifications')
      .then(({ data }) => setNotifications(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id) => {
    await api.put(`/notifications/${id}/read`);
    load();
  };

  const markAllRead = async () => {
    await api.put('/notifications/read-all');
    load();
  };

  const typeIcon = (type) => ({
    due_date: 'badge-warning',
    reservation: 'badge-info',
    fine: 'badge-danger',
    general: 'badge-neutral',
  }[type] || 'badge-neutral');

  if (loading) return <div className="loading-spinner">Loading...</div>;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Notifications</h1>
          <p>Due date reminders, reservation updates, and fine alerts</p>
        </div>
        {notifications.some(n => !n.is_read) && (
          <button className="btn btn-outline btn-sm" onClick={markAllRead}>Mark all read</button>
        )}
      </div>

      <div className="card">
        {notifications.length === 0 ? (
          <div className="empty-state"><FiBell /><p>No notifications yet.</p></div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.notification_id}
              onClick={() => !n.is_read && markRead(n.notification_id)}
              style={{
                padding: '1rem',
                borderBottom: '1px solid var(--gray-200)',
                cursor: n.is_read ? 'default' : 'pointer',
                background: n.is_read ? 'transparent' : 'rgba(212, 168, 83, 0.08)',
                borderRadius: n.is_read ? 0 : 'var(--radius-sm)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <strong style={{ color: 'var(--navy)' }}>{n.title}</strong>
                <span className={`badge ${typeIcon(n.type)}`}>{n.type.replace('_', ' ')}</span>
              </div>
              <p style={{ color: 'var(--gray-700)', fontSize: '0.9rem' }}>{n.message}</p>
              <small style={{ color: 'var(--gray-500)' }}>{new Date(n.created_at).toLocaleString()}</small>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;
