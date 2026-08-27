import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { FiUsers } from 'react-icons/fi';

const ManageStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api.get('/students')
      .then(({ data }) => setStudents(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const toggleBlock = async (id) => {
    try {
      const { data } = await api.put(`/students/${id}/toggle-block`);
      toast.success(data.message);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed.');
    }
  };

  if (loading) return <div className="loading-spinner"><span className="spin" /> Loading students…</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Student management</h1>
          <p>View and manage registered students</p>
        </div>
      </div>

      <div className="card">
        {students.length === 0 ? (
          <div className="empty-state"><FiUsers /><p>No students registered yet.</p></div>
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
