import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiBook, FiSearch, FiChevronLeft, FiChevronRight, FiMapPin } from 'react-icons/fi';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import api from '../../services/api';

const BookSearch = () => {
  const [books, setBooks] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ q: '', title: '', author: '', category: '', isbn: '' });

  useEffect(() => {
    api.get('/books/categories').then(({ data }) => setCategories(data)).catch(() => {});
    searchBooks({}, 1);
  }, []);

  const searchBooks = async (params, page = 1) => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => { if (v) query.append(k, v); });
      query.append('page', page);
      const { data } = await api.get(`/books/search?${query}`);
      setBooks(data.books);
      setPagination(data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    searchBooks(filters, 1);
  };

  const goToPage = (page) => {
    if (page < 1 || page > pagination.pages) return;
    searchBooks(filters, page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const statusBadge = (book) => {
    if (book.available_quantity > 0) return <span className="badge badge-success">{book.available_quantity} available</span>;
    return <span className="badge badge-danger">Unavailable</span>;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Search the catalogue</h1>
          <p>Find books by title, author, category, or ISBN</p>
        </div>
      </div>

      <form onSubmit={handleSearch}>
        <div className="search-bar">
          <input
            className="form-control"
            placeholder="Quick search — try a title or author…"
            value={filters.q}
            onChange={(e) => setFilters({ ...filters, q: e.target.value })}
          />
          <button className="btn btn-primary" type="submit"><FiSearch /> Search</button>
        </div>
        <div className="search-filters">
          <input className="form-control" placeholder="Title" value={filters.title} onChange={(e) => setFilters({ ...filters, title: e.target.value })} />
          <input className="form-control" placeholder="Author" value={filters.author} onChange={(e) => setFilters({ ...filters, author: e.target.value })} />
          <select className="form-control" value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
            <option value="">All categories</option>
            {categories.map((c) => <option key={c.category_id} value={c.category_name}>{c.category_name}</option>)}
          </select>
          <input className="form-control" placeholder="ISBN" value={filters.isbn} onChange={(e) => setFilters({ ...filters, isbn: e.target.value })} />
        </div>
      </form>

      {loading ? (
        <div className="book-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div className="book-card" key={i}>
              <Skeleton height={170} />
              <div style={{ padding: '1.2rem' }}>
                <Skeleton height={18} width="80%" />
                <Skeleton height={14} width="50%" style={{ marginTop: 6 }} />
              </div>
            </div>
          ))}
        </div>
      ) : books.length === 0 ? (
        <div className="empty-state">
          <FiBook />
          <p>No books match that search. Try a different title, author, or category.</p>
        </div>
      ) : (
        <>
          <div className="book-grid">
            {books.map((book) => (
              <Link to={`/student/books/${book.book_id}`} key={book.book_id} className="book-card">
                <div className="book-card-cover">
                  {book.cover_image ? (
                    <img src={`/uploads/covers/${book.cover_image}`} alt={book.title} />
                  ) : (
                    <FiBook className="placeholder-icon" />
                  )}
                </div>
                <div className="book-card-body">
                  <h3>{book.title}</h3>
                  <p className="author">{book.author}</p>
                  <span className="badge badge-neutral">{book.category_name}</span>
                  <div className="book-card-meta">
                    {statusBadge(book)}
                    <span className="book-card-location"><FiMapPin size={11} /> R{book.rack_no}/S{book.shelf_no}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {pagination.pages > 1 && (
            <div className="pagination">
              <button className="btn btn-outline btn-sm" onClick={() => goToPage(pagination.page - 1)} disabled={pagination.page <= 1}>
                <FiChevronLeft /> Prev
              </button>
              <span className="pagination-info">
                Page {pagination.page} of {pagination.pages} · {pagination.total} books
              </span>
              <button className="btn btn-outline btn-sm" onClick={() => goToPage(pagination.page + 1)} disabled={pagination.page >= pagination.pages}>
                Next <FiChevronRight />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BookSearch;
