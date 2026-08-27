import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiBook, FiMapPin, FiDownload, FiArrowLeft } from 'react-icons/fi';
import api from '../../services/api';

const BookDetails = () => {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/books/${id}`)
      .then(({ data }) => setBook(data))
      .catch(() => setError('Book not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleReserve = async () => {
    setReserving(true);
    try {
      const { data } = await api.post('/reservations', { book_id: parseInt(id) });
      toast.success(data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reservation failed.');
    } finally {
      setReserving(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await api.get(`/books/${id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${book.title}.pdf`;
      link.click();
    } catch {
      toast.error('E-book download not available.');
    }
  };

  if (loading) return <div className="loading-spinner"><span className="spin" /> Loading…</div>;
  if (!book) return <div className="alert alert-error">{error || 'Book not found.'}</div>;

  return (
    <div>
      <Link to="/student/search" className="btn btn-outline btn-sm" style={{ marginBottom: '1.5rem' }}>
        <FiArrowLeft /> Back to search
      </Link>

      <div className="card book-details-grid" style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '2rem' }}>
        <div className="book-card-cover" style={{ borderRadius: 'var(--radius)', height: '360px' }}>
          {book.cover_image ? (
            <img src={`/uploads/covers/${book.cover_image}`} alt={book.title} style={{ borderRadius: 'var(--radius)' }} />
          ) : (
            <FiBook className="placeholder-icon" style={{ fontSize: '5rem' }} />
          )}
        </div>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--navy-700)', fontSize: '1.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>{book.title}</h1>
          <p style={{ color: 'var(--ink-500)', fontSize: '1.1rem', marginBottom: '1rem' }}>by {book.author}</p>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            <span className="badge badge-neutral">{book.category_name}</span>
            <span className={`badge ${book.available_quantity > 0 ? 'badge-success' : 'badge-danger'}`}>
              {book.availability_status} ({book.available_quantity}/{book.quantity})
            </span>
            {book.is_ebook ? <span className="badge badge-info">E-Book</span> : null}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div><strong>ISBN:</strong> <span style={{ fontFamily: 'var(--font-mono)' }}>{book.isbn || 'N/A'}</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <FiMapPin style={{ color: 'var(--gold-600)' }} />
              <strong>Location:</strong> Rack {book.rack_no}, Shelf {book.shelf_no}
            </div>
          </div>

          {book.description && (
            <p style={{ color: 'var(--ink-700)', marginBottom: '1.5rem', lineHeight: 1.7 }}>{book.description}</p>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              onClick={handleReserve}
              disabled={reserving || book.available_quantity <= 0}
            >
              {reserving ? 'Reserving…' : 'Reserve book (24hr hold)'}
            </button>
            {book.is_ebook && book.pdf_path && (
              <button className="btn btn-secondary" onClick={handleDownload}>
                <FiDownload /> Download PDF
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetails;
