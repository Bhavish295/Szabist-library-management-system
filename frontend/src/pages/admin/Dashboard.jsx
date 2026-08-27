import { useEffect, useState } from 'react';
import { FiBook, FiUsers, FiClock, FiDollarSign, FiBookOpen } from 'react-icons/fi';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import api from '../../services/api';

const CHART_COLORS = ['#1a365d', '#d4a853', '#319795', '#b6472e', '#2c5282', '#8f6d28'];

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard')
      .then(({ data }) => setData(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-spinner"><span className="spin" /> Loading dashboard…</div>;
  if (!data) return <div className="alert alert-error">Failed to load dashboard.</div>;

  const fineChartData = [
    { name: 'Collected', value: Number(data.fine_collected) || 0 },
    { name: 'Pending', value: Number(data.fine_pending) || 0 },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Library overview</h1>
          <p>Analytics across the Szabist Digital Library</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <FiBook className="stat-icon" />
          <div className="stat-value">{data.total_books}</div>
          <div className="stat-label">Total books</div>
        </div>
        <div className="stat-card success">
          <FiBookOpen className="stat-icon" />
          <div className="stat-value">{data.available_books}</div>
          <div className="stat-label">Available copies</div>
        </div>
        <div className="stat-card teal">
          <FiBookOpen className="stat-icon" />
          <div className="stat-value">{data.issued_books}</div>
          <div className="stat-label">Currently issued</div>
        </div>
        <div className="stat-card navy">
          <FiClock className="stat-icon" />
          <div className="stat-value">{data.reserved_books}</div>
          <div className="stat-label">Active reservations</div>
        </div>
        <div className="stat-card">
          <FiUsers className="stat-icon" />
          <div className="stat-value">{data.total_students}</div>
          <div className="stat-label">Total students</div>
        </div>
        <div className="stat-card danger">
          <FiDollarSign className="stat-icon" />
          <div className="stat-value">Rs. {data.fine_pending}</div>
          <div className="stat-label">Pending fines</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }} className="dashboard-charts">
        <div className="card">
          <h3 className="card-title">Fine collection</h3>
          {fineChartData.every((d) => d.value === 0) ? (
            <div className="empty-state" style={{ padding: '2rem' }}>No fines recorded yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={fineChartData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80} paddingAngle={3}>
                  {fineChartData.map((entry, i) => (
                    <Cell key={entry.name} fill={i === 0 ? 'var(--success, #2f7d5a)' : '#b6472e'} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `Rs. ${v}`} contentStyle={{ fontFamily: 'Inter, sans-serif', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '0.5rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--success, #2f7d5a)' }}>Rs. {data.fine_collected}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-500)' }}>Collected</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--brick-600)' }}>Rs. {data.fine_pending}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-500)' }}>Pending</div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">Books by category</h3>
          {!data.category_stats?.length ? (
            <div className="empty-state" style={{ padding: '2rem' }}>No categories yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.category_stats} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--paper-200)" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--ink-500)' }} />
                <YAxis type="category" dataKey="category_name" width={110} tick={{ fontSize: 11, fill: 'var(--ink-700)' }} />
                <Tooltip contentStyle={{ fontFamily: 'Inter, sans-serif', borderRadius: 8 }} />
                <Bar dataKey="book_count" radius={[0, 4, 4, 0]}>
                  {data.category_stats.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h3 className="card-title">Recent reservations</h3>
        {data.recent_reservations?.length === 0 ? (
          <div className="empty-state">No recent reservations.</div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Student</th><th>Book</th><th>Date</th><th>Status</th></tr>
              </thead>
              <tbody>
                {data.recent_reservations.map((r) => (
                  <tr key={r.reservation_id}>
                    <td>{r.student_name}</td>
                    <td>{r.title}</td>
                    <td>{new Date(r.reservation_date).toLocaleString()}</td>
                    <td><span className="badge badge-info">{r.status}</span></td>
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

export default AdminDashboard;
