const { app, request, loginAdmin, uniqueIsbn } = require('./helpers');
const pool = require('../config/db');

describe('Books', () => {
  beforeAll(async () => {
    const [cat] = await pool.execute('SELECT category_id FROM Categories LIMIT 1');
    for (let i = 0; i < 3; i++) {
      await pool.execute(
        'INSERT INTO Books (title, author, category_id, isbn, quantity, available_quantity, rack_no, shelf_no) VALUES (?,?,?,?,?,?,?,?)',
        [`Search Fixture Book ${i}`, 'Fixture Author', cat[0].category_id, uniqueIsbn(), 2, 2, 'A1', 'S1']
      );
    }
  });

  test('search returns a paginated shape', async () => {
    const res = await request(app).get('/api/books/search?limit=2&page=1');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.books)).toBe(true);
    expect(res.body.books.length).toBeLessThanOrEqual(2);
    expect(res.body.pagination).toEqual(
      expect.objectContaining({ page: 1, limit: 2, total: expect.any(Number), pages: expect.any(Number) })
    );
  });

  test('search filters by query text', async () => {
    const res = await request(app).get('/api/books/search?q=Search Fixture Book 1');
    expect(res.status).toBe(200);
    expect(res.body.books.some((b) => b.title === 'Search Fixture Book 1')).toBe(true);
  });

  test('categories endpoint lists seeded categories', async () => {
    const res = await request(app).get('/api/books/categories');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('non-admin cannot add a book', async () => {
    const res = await request(app).post('/api/books').send({ title: 'Sneaky' });
    expect(res.status).toBe(401);
  });

  test('admin adding a book without required fields is rejected', async () => {
    const token = await loginAdmin();
    const res = await request(app)
      .post('/api/books')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: '', author: 'Someone' });
    expect(res.status).toBe(400);
  });
});
