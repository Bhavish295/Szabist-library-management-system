const { app, request, registerStudent, loginAdmin, uniqueEmail } = require('./helpers');

describe('Auth', () => {
  test('registers a new student and returns a token', async () => {
    const { res } = await registerStudent();
    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.role).toBe('student');
  });

  test('rejects registration with an invalid email', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Bad Email',
      email: 'not-an-email',
      password: 'password123',
      department: 'Computer Science',
      semester: 2,
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/email/i);
  });

  test('rejects duplicate email registration', async () => {
    const email = uniqueEmail('dup');
    const first = await registerStudent({ email });
    expect(first.res.status).toBe(201);

    const second = await request(app).post('/api/auth/register').send({
      name: 'Second', email, password: 'password123', department: 'Computer Science', semester: 2,
    });
    expect(second.status).toBe(400);
    expect(second.body.message).toMatch(/already registered/i);
  });

  test('logs a student in with correct credentials, rejects wrong password', async () => {
    const { email } = await registerStudent({ password: 'correct-horse' });

    const good = await request(app).post('/api/auth/login').send({ email, password: 'correct-horse' });
    expect(good.status).toBe(200);
    expect(good.body.token).toBeTruthy();

    const bad = await request(app).post('/api/auth/login').send({ email, password: 'wrong' });
    expect(bad.status).toBe(401);
  });

  test('admin can log in with role=admin', async () => {
    const token = await loginAdmin();
    expect(token).toBeTruthy();
  });

  test('profile endpoint requires a token', async () => {
    const res = await request(app).get('/api/auth/profile');
    expect(res.status).toBe(401);
  });

  test('student can update profile and change password', async () => {
    const { token, email } = await registerStudent();

    const update = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Name', department: 'Engineering', semester: 5 });
    expect(update.status).toBe(200);
    expect(update.body.user.name).toBe('Updated Name');

    const changePw = await request(app)
      .put('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'password123', newPassword: 'newpassword456' });
    expect(changePw.status).toBe(200);

    const reLogin = await request(app).post('/api/auth/login').send({ email, password: 'newpassword456' });
    expect(reLogin.status).toBe(200);

    const wrongOldPw = await request(app)
      .put('/api/auth/change-password')
      .set('Authorization', `Bearer ${reLogin.body.token}`)
      .send({ currentPassword: 'wrong-current', newPassword: 'irrelevant123' });
    expect(wrongOldPw.status).toBe(400);
  });
});
