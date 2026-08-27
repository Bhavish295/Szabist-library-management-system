const { app, request, registerStudent, loginAdmin, uniqueIsbn } = require('./helpers');
const pool = require('../config/db');

describe('Issue, return, and renewal', () => {
  let adminToken;

  beforeAll(async () => {
    adminToken = await loginAdmin();
  });

  const makeBook = async (title, quantity = 2) => {
    const [cat] = await pool.execute('SELECT category_id FROM Categories LIMIT 1');
    const [result] = await pool.execute(
      'INSERT INTO Books (title, author, category_id, isbn, quantity, available_quantity, rack_no, shelf_no) VALUES (?,?,?,?,?,?,?,?)',
      [title, 'Fixture Author', cat[0].category_id, uniqueIsbn(), quantity, quantity, 'A1', 'S1']
    );
    return result.insertId;
  };

  test('admin issues a book; a late return produces the correct fine', async () => {
    const bookId = await makeBook('Fine Calculation Fixture');
    const { token, res } = await registerStudent();
    const studentId = res.body.user.id;

    const issue = await request(app)
      .post('/api/issues/issue')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ student_id: studentId, book_id: bookId });
    expect(issue.status).toBe(201);

    // Backdate the due date 4 days into the past to force a late fine.
    await pool.execute('UPDATE IssuedBooks SET due_date = DATE_SUB(CURDATE(), INTERVAL 4 DAY) WHERE issue_id = ?', [issue.body.issue_id]);

    const ret = await request(app)
      .post('/api/issues/return')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ issue_id: issue.body.issue_id });
    expect(ret.status).toBe(200);
    expect(ret.body.fine).toBe(200); // 4 days * Rs.50/day from .env.test

    const myFines = await request(app).get('/api/fines/my').set('Authorization', `Bearer ${token}`);
    expect(myFines.body.some((f) => f.amount == 200)).toBe(true);
  });

  test('a student can renew up to the limit, then is blocked', async () => {
    const bookId = await makeBook('Renewal Limit Fixture');
    const { token, res } = await registerStudent();
    const studentId = res.body.user.id;

    const issue = await request(app)
      .post('/api/issues/issue')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ student_id: studentId, book_id: bookId });
    const issueId = issue.body.issue_id;
    const originalDue = new Date(issue.body.due_date);

    const renew1 = await request(app).post(`/api/issues/${issueId}/renew`).set('Authorization', `Bearer ${token}`);
    expect(renew1.status).toBe(200);
    expect(renew1.body.renewals_left).toBe(1);
    expect(new Date(renew1.body.due_date).getTime()).toBeGreaterThan(originalDue.getTime());

    const renew2 = await request(app).post(`/api/issues/${issueId}/renew`).set('Authorization', `Bearer ${token}`);
    expect(renew2.status).toBe(200);
    expect(renew2.body.renewals_left).toBe(0);

    const renew3 = await request(app).post(`/api/issues/${issueId}/renew`).set('Authorization', `Bearer ${token}`);
    expect(renew3.status).toBe(400);
    expect(renew3.body.message).toMatch(/renewal limit/i);
  });

  test('an overdue book cannot be renewed', async () => {
    const bookId = await makeBook('Overdue Renewal Fixture');
    const { token, res } = await registerStudent();
    const studentId = res.body.user.id;

    const issue = await request(app)
      .post('/api/issues/issue')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ student_id: studentId, book_id: bookId });

    await pool.execute("UPDATE IssuedBooks SET status = 'overdue' WHERE issue_id = ?", [issue.body.issue_id]);

    const renew = await request(app).post(`/api/issues/${issue.body.issue_id}/renew`).set('Authorization', `Bearer ${token}`);
    expect(renew.status).toBe(400);
    expect(renew.body.message).toMatch(/overdue/i);
  });

  test('renewal is blocked when another student is waiting (waitlisted counts)', async () => {
    const bookId = await makeBook('Fairness Renewal Fixture', 1); // single copy
    const holder = await registerStudent();
    const waiter = await registerStudent();

    const issue = await request(app)
      .post('/api/issues/issue')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ student_id: holder.res.body.user.id, book_id: bookId });

    // Book now has 0 copies available -> waiter's reservation lands on the waitlist.
    const resv = await request(app).post('/api/reservations').set('Authorization', `Bearer ${waiter.token}`).send({ book_id: bookId });
    expect(resv.body.waitlisted).toBe(true);

    const renew = await request(app).post(`/api/issues/${issue.body.issue_id}/renew`).set('Authorization', `Bearer ${holder.token}`);
    expect(renew.status).toBe(400);
    expect(renew.body.message).toMatch(/waiting/i);
  });

  test('a student cannot renew someone else\'s issue', async () => {
    const bookId = await makeBook('Cross-Student Renewal Fixture');
    const owner = await registerStudent();
    const intruder = await registerStudent();

    const issue = await request(app)
      .post('/api/issues/issue')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ student_id: owner.res.body.user.id, book_id: bookId });

    const renew = await request(app).post(`/api/issues/${issue.body.issue_id}/renew`).set('Authorization', `Bearer ${intruder.token}`);
    expect(renew.status).toBe(403);
  });
});
