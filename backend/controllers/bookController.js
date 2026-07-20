const pool = require('../config/db');

exports.getCategories = async (req, res) => {
  try {
    const [categories] = await pool.execute('SELECT * FROM Categories ORDER BY category_name');
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.searchBooks = async (req, res) => {
  try {
    const { title, author, category, isbn, q } = req.query;
    let sql = `
      SELECT b.*, c.category_name,
        CASE WHEN b.available_quantity > 0 THEN 'Available' ELSE 'Unavailable' END as availability_status
      FROM Books b
      JOIN Categories c ON b.category_id = c.category_id
      WHERE 1=1
    `;
    const params = [];

    if (q) {
      sql += ' AND (b.title LIKE ? OR b.author LIKE ? OR b.isbn LIKE ? OR c.category_name LIKE ?)';
      const term = `%${q}%`;
      params.push(term, term, term, term);
    }
    if (title) {
      sql += ' AND b.title LIKE ?';
      params.push(`%${title}%`);
    }
    if (author) {
      sql += ' AND b.author LIKE ?';
      params.push(`%${author}%`);
    }
    if (category) {
      sql += ' AND c.category_name LIKE ?';
      params.push(`%${category}%`);
    }
    if (isbn) {
      sql += ' AND b.isbn LIKE ?';
      params.push(`%${isbn}%`);
    }

    sql += ' ORDER BY b.title ASC';
    const [books] = await pool.execute(sql, params);
    res.json(books);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.getBookById = async (req, res) => {
  try {
    const [books] = await pool.execute(
      `SELECT b.*, c.category_name,
        CASE WHEN b.available_quantity > 0 THEN 'Available' ELSE 'Unavailable' END as availability_status
       FROM Books b JOIN Categories c ON b.category_id = c.category_id
       WHERE b.book_id = ?`,
      [req.params.id]
    );
    if (books.length === 0) return res.status(404).json({ message: 'Book not found.' });
    res.json(books[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.addBook = async (req, res) => {
  try {
    const { title, author, category_id, isbn, quantity, rack_no, shelf_no, description, is_ebook } =
      req.body;
    const cover_image = req.files?.cover_image?.[0]?.filename || null;
    const pdf_path = req.files?.pdf?.[0]?.filename || null;

    const qty = parseInt(quantity) || 1;
    const [result] = await pool.execute(
      `INSERT INTO Books (title, author, category_id, isbn, quantity, available_quantity, rack_no, shelf_no, description, cover_image, pdf_path, is_ebook)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        author,
        category_id,
        isbn || null,
        qty,
        qty,
        rack_no,
        shelf_no,
        description || null,
        cover_image,
        pdf_path,
        is_ebook === 'true' || is_ebook === true ? 1 : 0,
      ]
    );
    res.status(201).json({ message: 'Book added successfully.', book_id: result.insertId });
  } catch (err) {
    console.error(err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'ISBN already exists.' });
    }
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, author, category_id, isbn, quantity, rack_no, shelf_no, description, is_ebook } =
      req.body;

    const [existing] = await pool.execute('SELECT * FROM Books WHERE book_id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ message: 'Book not found.' });

    const book = existing[0];
    const newQty = quantity !== undefined ? parseInt(quantity) : book.quantity;
    const issued = book.quantity - book.available_quantity;
    const newAvailable = Math.max(0, newQty - issued);

    let cover_image = book.cover_image;
    let pdf_path = book.pdf_path;
    if (req.files?.cover_image?.[0]) cover_image = req.files.cover_image[0].filename;
    if (req.files?.pdf?.[0]) pdf_path = req.files.pdf[0].filename;

    await pool.execute(
      `UPDATE Books SET title=?, author=?, category_id=?, isbn=?, quantity=?, available_quantity=?,
       rack_no=?, shelf_no=?, description=?, cover_image=?, pdf_path=?, is_ebook=? WHERE book_id=?`,
      [
        title || book.title,
        author || book.author,
        category_id || book.category_id,
        isbn !== undefined ? isbn : book.isbn,
        newQty,
        newAvailable,
        rack_no || book.rack_no,
        shelf_no || book.shelf_no,
        description !== undefined ? description : book.description,
        cover_image,
        pdf_path,
        is_ebook !== undefined ? (is_ebook === 'true' || is_ebook === true ? 1 : 0) : book.is_ebook,
        id,
      ]
    );
    res.json({ message: 'Book updated successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.deleteBook = async (req, res) => {
  try {
    const { id } = req.params;
    const [issued] = await pool.execute(
      "SELECT issue_id FROM IssuedBooks WHERE book_id = ? AND status IN ('issued', 'overdue')",
      [id]
    );
    if (issued.length > 0) {
      return res.status(400).json({ message: 'Cannot delete book with active issues.' });
    }
    await pool.execute('DELETE FROM Books WHERE book_id = ?', [id]);
    res.json({ message: 'Book deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.downloadEbook = async (req, res) => {
  try {
    const [books] = await pool.execute('SELECT pdf_path, title, is_ebook FROM Books WHERE book_id = ?', [
      req.params.id,
    ]);
    if (books.length === 0) return res.status(404).json({ message: 'Book not found.' });
    const book = books[0];
    if (!book.pdf_path || !book.is_ebook) {
      return res.status(404).json({ message: 'E-book not available for this title.' });
    }
    const path = require('path');
    const filePath = path.join(__dirname, '../uploads/pdfs', book.pdf_path);
    res.download(filePath, `${book.title}.pdf`);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};
