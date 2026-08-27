import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { FiUsers, FiChevronLeft, FiChevronRight, FiSearch } from 'react-icons/fi';

const ManageStudents = () => {
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  const load = (page = 1, query = q) => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 15 });
    if (query) params.append('q', query);
    api.get(`/students?${params}`)
      .then(({ data }) => {
        setStudents(data.students);
        setPagination(data.pagination);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(1); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    load(1, q);
  };

  const goToPage = (page) => {
    if (page < 1 || page > pagination.pages) return;
    load(page, q);
  };

  const toggleBlock = async (id) => {
    try {
      const { data } = await api.put(`/students/${id}/toggle-block`);
      toast.success(data.message);
      load(pagination.page, q);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed.');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Student management</h1>
          <p>View and manage registered students</p>
        </div>
      </div>

      <form onSubmit={handleSearch} className="search-bar">
        <input className="form-control" placeholder="Search by name or email…" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn btn-primary" type="submit"><FiSearch /> Search</button>
      </form>

      <div className="card">
        {loading ? (
          <div className="loading-spinner"><span className="spin" /> Loading students…</div>
        ) : students.length === 0 ? (
          <div className="empty-state"><FiUsers /><p>No students found.</p></div>
        ) : (
          <>
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
            {pagination.pages > 1 && (
              <div className="pagination">
                <button className="btn btn-outline btn-sm" onClick={() => goToPage(pagination.page - 1)} disabled={pagination.page <= 1}>
                  <FiChevronLeft /> Prev
                </button>
                <span className="pagination-info">Page {pagination.page} of {pagination.pages} · {pagination.total} students</span>
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

export default ManageStudents;
