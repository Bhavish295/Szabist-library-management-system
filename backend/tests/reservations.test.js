const { app, request, registerStudent, loginAdmin, uniqueEmail, uniqueIsbn } = require('./helpers');
const pool = require('../config/db');

describe('Reservations & waitlist', () => {
  let adminToken;

  beforeAll(async () => {
    adminToken = await loginAdmin();
  });

  const makeSingleCopyBook = async (title) => {
    const [cat] = await pool.execute('SELECT category_id FROM Categories LIMIT 1');
    const [result] = await pool.execute(
      'INSERT INTO Books (title, author, category_id, isbn, quantity, available_quantity, rack_no, shelf_no) VALUES (?,?,?,?,?,?,?,?)',
      [title, 'Fixture Author', cat[0].category_id, uniqueIsbn(), 1, 1, 'A1', 'S1']
    );
    return result.insertId;
  };

  test('reserving an available copy grants an immediate pending hold', async () => {
    const bookId = await makeSingleCopyBook('Immediate Hold Fixture');
    const { token } = await registerStudent();

    const res = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${token}`)
      .send({ book_id: bookId });

    expect(res.status).toBe(201);
    expect(res.body.waitlisted).toBe(false);
    expect(res.body.expiry_date).toBeTruthy();
  });

  test('duplicate reservation on the same book is rejected', async () => {
    const bookId = await makeSingleCopyBook('Duplicate Fixture');
    const { token } = await registerStudent();

    const first = await request(app).post('/api/reservations').set('Authorization', `Bearer ${token}`).send({ book_id: bookId });
    expect(first.status).toBe(201);

    const second = await request(app).post('/api/reservations').set('Authorization', `Bearer ${token}`).send({ book_id: bookId });
    expect(second.status).toBe(400);
  });

  test('full FIFO waitlist lifecycle: queue, auto-promote on return, position tracking, cancel', async () => {
    const bookId = await makeSingleCopyBook('Waitlist Lifecycle Fixture');

    const alice = await registerStudent({ email: uniqueEmail('alice') });
    const bob = await registerStudent({ email: uniqueEmail('bob') });
    const carol = await registerStudent({ email: uniqueEmail('carol') });

    // Alice takes the only copy as an active issue (not just a reservation),
    // so the book's available_quantity actually drops to zero.
    const issueRes = await request(app)
      .post('/api/issues/issue')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ student_id: alice.res.body.user.id, book_id: bookId });
    expect(issueRes.status).toBe(201);
    const issueId = issueRes.body.issue_id;

    // Bob and Carol both try to reserve the now-unavailable book.
    const bobResv = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${bob.token}`)
      .send({ book_id: bookId });
    expect(bobResv.status).toBe(201);
    expect(bobResv.body.waitlisted).toBe(true);
    expect(bobResv.body.position).toBe(1);

    const carolResv = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${carol.token}`)
      .send({ book_id: bookId });
    expect(carolResv.status).toBe(201);
    expect(carolResv.body.waitlisted).toBe(true);
    expect(carolResv.body.position).toBe(2);

    // Bob can see his queue position reflected back.
    const bobList = await request(app).get('/api/reservations/my').set('Authorization', `Bearer ${bob.token}`);
    const bobEntry = bobList.body.find((r) => r.book_id === bookId);
    expect(bobEntry.status).toBe('waitlisted');
    expect(bobEntry.queue_position).toBe(1);

    // Alice returns the book -> should auto-promote Bob (first in line), not Carol.
    const returnRes = await request(app)
      .post('/api/issues/return')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ issue_id: issueId });
    expect(returnRes.status).toBe(200);

    const bobAfter = await request(app).get('/api/reservations/my').set('Authorization', `Bearer ${bob.token}`);
    const bobPromoted = bobAfter.body.find((r) => r.book_id === bookId);
    expect(bobPromoted.status).toBe('pending');
    expect(bobPromoted.expiry_date).toBeTruthy();

    const carolAfter = await request(app).get('/api/reservations/my').set('Authorization', `Bearer ${carol.token}`);
    const carolStill = carolAfter.body.find((r) => r.book_id === bookId);
    expect(carolStill.status).toBe('waitlisted');
    expect(carolStill.queue_position).toBe(1); // moved up now that Bob is out of the waitlist

    // Carol decides to leave the queue.
    const cancelRes = await request(app)
      .put(`/api/reservations/${carolStill.reservation_id}/cancel`)
      .set('Authorization', `Bearer ${carol.token}`);
    expect(cancelRes.status).toBe(200);

    const carolFinal = await request(app).get('/api/reservations/my').set('Authorization', `Bearer ${carol.token}`);
    expect(carolFinal.body.find((r) => r.book_id === bookId).status).toBe('cancelled');
  });

  test('a student cannot cancel another student\'s reservation', async () => {
    const bookId = await makeSingleCopyBook('Cross-Student Cancel Fixture');
    const owner = await registerStudent();
    const intruder = await registerStudent();

    const resv = await request(app).post('/api/reservations').set('Authorization', `Bearer ${owner.token}`).send({ book_id: bookId });

    const res = await request(app)
      .put(`/api/reservations/${resv.body.reservation_id}/cancel`)
      .set('Authorization', `Bearer ${intruder.token}`);
    expect(res.status).toBe(403);
  });
});
