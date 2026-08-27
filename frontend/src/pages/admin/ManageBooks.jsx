import { useEffect, useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';

const ManageBooks = () => {
  const [books, setBooks] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    title: '', author: '', category_id: '', isbn: '', quantity: 1,
    rack_no: '', shelf_no: '', description: '', is_ebook: false,
  });
  const [coverFile, setCoverFile] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [error, setError] = useState('');

  const load = (page = 1) => {
    setLoading(true);
    Promise.all([
      api.get(`/books/search?limit=20&page=${page}`),
      api.get('/books/categories'),
    ]).then(([booksRes, catRes]) => {
      setBooks(booksRes.data.books);
      setPagination(booksRes.data.pagination);
      setCategories(catRes.data);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(1); }, []);

  const goToPage = (page) => {
    if (page < 1 || page > pagination.pages) return;
    load(page);
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ title: '', author: '', category_id: '', isbn: '', quantity: 1, rack_no: '', shelf_no: '', description: '', is_ebook: false });
    setCoverFile(null);
    setPdfFile(null);
    setShowModal(true);
  };

  const openEdit = (book) => {
    setEditing(book);
    setForm({
      title: book.title, author: book.author, category_id: book.category_id,
      isbn: book.isbn || '', quantity: book.quantity, rack_no: book.rack_no,
      shelf_no: book.shelf_no, description: book.description || '', is_ebook: !!book.is_ebook,
    });
    setCoverFile(null);
    setPdfFile(null);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (coverFile) fd.append('cover_image', coverFile);
    if (pdfFile) fd.append('pdf', pdfFile);

    try {
      if (editing) {
        await api.put(`/books/${editing.book_id}`, fd);
        toast.success('Book updated successfully.');
      } else {
        await api.post('/books', fd);
        toast.success('Book added successfully.');
      }
      setShowModal(false);
      load(pagination.page);
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this book? This cannot be undone.')) return;
    try {
      await api.delete(`/books/${id}`);
      toast.success('Book deleted.');
      load(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed.');
    }
  };

  if (loading) return <div className="loading-spinner"><span className="spin" /> Loading catalogue…</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Book management</h1>
          <p>Add, edit, and delete library books</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><FiPlus /> Add book</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>Title</th><th>Author</th><th>Category</th><th>ISBN</th><th>Qty</th><th>Available</th><th>Location</th><th>E-Book</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {books.map((b) => (
                <tr key={b.book_id}>
                  <td><strong>{b.title}</strong></td>
                  <td>{b.author}</td>
                  <td>{b.category_name}</td>
                  <td>{b.isbn || '-'}</td>
                  <td>{b.quantity}</td>
                  <td>{b.available_quantity}</td>
                  <td>R{b.rack_no}/S{b.shelf_no}</td>
                  <td>{b.is_ebook ? 'Yes' : 'No'}</td>
                  <td>
                    <button className="btn btn-outline btn-sm" onClick={() => openEdit(b)} style={{ marginRight: '0.5rem' }}><FiEdit2 /></button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(b.book_id)}><FiTrash2 /></button>
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
            <span className="pagination-info">Page {pagination.page} of {pagination.pages} · {pagination.total} books</span>
            <button className="btn btn-outline btn-sm" onClick={() => goToPage(pagination.page + 1)} disabled={pagination.page >= pagination.pages}>
              Next <FiChevronRight />
            </button>
          </div>
        )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? 'Edit Book' : 'Add New Book'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Title</label>
                  <input className="form-control" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Author</label>
                  <input className="form-control" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <select className="form-control" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} required>
                    <option value="">Select</option>
                    {categories.map((c) => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>ISBN</label>
                  <input className="form-control" value={form.isbn} onChange={(e) => setForm({ ...form, isbn: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Quantity</label>
                  <input className="form-control" type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Rack No</label>
                  <input className="form-control" value={form.rack_no} onChange={(e) => setForm({ ...form, rack_no: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Shelf No</label>
                  <input className="form-control" value={form.shelf_no} onChange={(e) => setForm({ ...form, shelf_no: e.target.value })} required />
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea className="form-control" rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Cover Image</label>
                  <input className="form-control" type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files[0])} />
                </div>
                <div className="form-group">
                  <label>PDF (E-Book)</label>
                  <input className="form-control" type="file" accept=".pdf" onChange={(e) => setPdfFile(e.target.files[0])} />
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <input type="checkbox" checked={form.is_ebook} onChange={(e) => setForm({ ...form, is_ebook: e.target.checked })} />
                Mark as E-Book
              </label>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Add Book'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageBooks;
