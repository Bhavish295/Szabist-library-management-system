import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiBook, FiSearch } from 'react-icons/fi';
import api from '../../services/api';

const BookSearch = () => {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ q: '', title: '', author: '', category: '', isbn: '' });

  useEffect(() => {
    api.get('/books/categories').then(({ data }) => setCategories(data));
    searchBooks({});
  }, []);

  const searchBooks = async (params) => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => { if (v) query.append(k, v); });
      const { data } = await api.get(`/books/search?${query}`);
      setBooks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    searchBooks(filters);
  };

  const statusBadge = (book) => {
    if (book.available_quantity > 0) return <span className="badge badge-success">Available ({book.available_quantity})</span>;
    return <span className="badge badge-danger">Unavailable</span>;
  };

  return (
    <div>
      <div className="page-header">
        <h1>Search Books</h1>
        <p>Find books by title, author, category, or ISBN</p>
      </div>

      <form onSubmit={handleSearch}>
        <div className="search-bar">
          <input
            className="form-control"
            placeholder="Quick search..."
            value={filters.q}
            onChange={(e) => setFilters({ ...filters, q: e.target.value })}
          />
          <button className="btn btn-primary" type="submit"><FiSearch /> Search</button>
        </div>
        <div className="search-filters">
          <input className="form-control" placeholder="Title" value={filters.title} onChange={(e) => setFilters({ ...filters, title: e.target.value })} />
          <input className="form-control" placeholder="Author" value={filters.author} onChange={(e) => setFilters({ ...filters, author: e.target.value })} />
          <select className="form-control" value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c.category_id} value={c.category_name}>{c.category_name}</option>)}
          </select>
          <input className="form-control" placeholder="ISBN" value={filters.isbn} onChange={(e) => setFilters({ ...filters, isbn: e.target.value })} />
        </div>
      </form>

      {loading ? (
        <div className="loading-spinner">Searching...</div>
      ) : books.length === 0 ? (
        <div className="empty-state"><FiBook /><p>No books found.</p></div>
      ) : (
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
                  <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>Rack {book.rack_no}, Shelf {book.shelf_no}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookSearch;
