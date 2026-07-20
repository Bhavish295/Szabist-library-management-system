import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiBook, FiDownload } from 'react-icons/fi';
import api from '../../services/api';

const Ebooks = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/books/search')
      .then(({ data }) => setBooks(data.filter(b => b.is_ebook && b.pdf_path)))
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = async (book) => {
    try {
      const response = await api.get(`/books/${book.book_id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${book.title}.pdf`;
      link.click();
    } catch {
      alert('Download failed.');
    }
  };

  if (loading) return <div className="loading-spinner">Loading e-books...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>E-Books Library</h1>
        <p>Download and read PDF books online</p>
      </div>

      {books.length === 0 ? (
        <div className="empty-state"><FiBook /><p>No e-books available at the moment.</p></div>
      ) : (
        <div className="book-grid">
          {books.map((book) => (
            <div key={book.book_id} className="book-card">
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
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                  <button className="btn btn-primary btn-sm" onClick={() => handleDownload(book)}>
                    <FiDownload /> Download
                  </button>
                  <Link to={`/student/books/${book.book_id}`} className="btn btn-outline btn-sm">Details</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Ebooks;
