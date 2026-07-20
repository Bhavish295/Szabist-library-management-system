import { useEffect, useState } from 'react';
import api from '../../services/api';
import { FiUsers } from 'react-icons/fi';

const ManageStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const load = () => {
    api.get('/students')
      .then(({ data }) => setStudents(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const toggleBlock = async (id) => {
    try {
      const { data } = await api.put(`/students/${id}/toggle-block`);
      setMessage(data.message);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed.');
    }
  };

  if (loading) return <div className="loading-spinner">Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Student Management</h1>
        <p>View and manage registered students</p>
      </div>

      {message && <div className="alert alert-success">{message}</div>}

      <div className="card">
        {students.length === 0 ? (
          <div className="empty-state"><FiUsers /><p>No students registered.</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Name</th><th>Email</th><th>Department</th><th>Semester</th><th>Registered</th><th>Status</th><th>Action</th></tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.student_id}>
                    <td><strong>{s.name}</strong></td>
                    <td>{s.email}</td>
                    <td>{s.department}</td>
                    <td>{s.semester}</td>
                    <td>{new Date(s.created_at).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge badge-${s.is_blocked ? 'danger' : 'success'}`}>
                        {s.is_blocked ? 'Blocked' : 'Active'}
                      </span>
                    </td>
                    <td>
                      <button
                        className={`btn btn-sm ${s.is_blocked ? 'btn-success' : 'btn-danger'}`}
                        onClick={() => toggleBlock(s.student_id)}
                      >
                        {s.is_blocked ? 'Unblock' : 'Block'}
                      </button>
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

export default ManageStudents;
