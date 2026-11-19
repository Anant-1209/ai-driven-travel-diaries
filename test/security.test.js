import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import mongoose from 'mongoose';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { io as ioClient } from 'socket.io-client';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.FIREBASE_PROJECT_ID = 'travel-diaries-test';
process.env.CLIENT_URL = 'http://localhost:5173';
delete process.env.GEMINI_API_KEY;
delete process.env.GROQ_API_KEY;
delete process.env.XAI_API_KEY;

let mongo;
let app;
let User;
let Post;

const authCookie = (user) =>
  `access_token=${jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET)}`;

const createUser = (overrides = {}) =>
  User.create({
    username: `user${Math.random().toString(36).slice(2, 10)}`,
    email: `${Math.random().toString(36).slice(2, 10)}@example.com`,
    password: 'hashed',
    ...overrides,
  });

const samplePost = (overrides = {}) => ({
  userId: 'author',
  title: `Sample ${Math.random()}`,
  slug: `sample-${Math.random().toString(36).slice(2)}`,
  content: '<p>Sample content</p>',
  ...overrides,
});

before(async () => {
  mongo = await MongoMemoryServer.create({ instance: { launchTimeout: 60000 } });
  await mongoose.connect(mongo.getUri());
  ({ default: User } = await import('../models/user.model.js'));
  ({ default: Post } = await import('../models/post.model.js'));
  const { createApp } = await import('../app.js');
  app = createApp();
});

after(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

test('public seed route is removed and cannot wipe posts', async () => {
  await Post.create(samplePost());
  const before = await Post.countDocuments();
  const res = await request(app).get('/api/post/seed-data');
  assert.equal(res.status, 404);
  assert.equal(await Post.countDocuments(), before);
});

test('first user to sign up does not become admin', async () => {
  await User.deleteMany({});
  const res = await request(app)
    .post('/api/auth/signup')
    .send({ username: 'firstuser', email: 'first@example.com', password: 'secret123' });
  assert.equal(res.status, 200);
  const user = await User.findOne({ email: 'first@example.com' });
  assert.equal(user.isAdmin, false);
});

test('sign-in does not reveal whether an email exists', async () => {
  await request(app)
    .post('/api/auth/signup')
    .send({ username: 'signinuser', email: 'signin@example.com', password: 'secret123' });

  const wrongPassword = await request(app)
    .post('/api/auth/signin')
    .send({ email: 'signin@example.com', password: 'wrong-password' });
  const unknownEmail = await request(app)
    .post('/api/auth/signin')
    .send({ email: 'nobody@example.com', password: 'wrong-password' });

  assert.equal(wrongPassword.status, 401);
  assert.equal(unknownEmail.status, 401);
  assert.equal(wrongPassword.body.message, unknownEmail.body.message);
});

test('sign-in sets an httpOnly cookie with an expiring JWT', async () => {
  const res = await request(app)
    .post('/api/auth/signin')
    .send({ email: 'signin@example.com', password: 'secret123' });
  assert.equal(res.status, 200);
  assert.equal(res.body.password, undefined);

  const cookie = res.headers['set-cookie'].find((c) => c.startsWith('access_token='));
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Lax/i);
  assert.match(cookie, /Max-Age=604800/);

  const token = decodeURIComponent(cookie.split(';')[0].split('=')[1]);
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  assert.ok(payload.exp - payload.iat === 7 * 24 * 60 * 60);
});

test('Google login rejects a bare email and forged tokens', async () => {
  const victim = await createUser({ email: 'victim@example.com', isAdmin: true });

  const bareEmail = await request(app)
    .post('/api/auth/google')
    .send({ email: victim.email, name: 'Attacker' });
  assert.equal(bareEmail.status, 400);
  assert.equal(bareEmail.headers['set-cookie'], undefined);

  const forged = await request(app)
    .post('/api/auth/google')
    .send({ idToken: 'forged.token.value' });
  assert.equal(forged.status, 401);
  assert.equal(forged.headers['set-cookie'], undefined);
});

test('updating another user returns 403 instead of crashing', async () => {
  const me = await createUser();
  const other = await createUser();
  const res = await request(app)
    .put(`/api/user/update/${other._id}`)
    .set('Cookie', authCookie(me))
    .send({ email: 'hijack@example.com' });
  assert.equal(res.status, 403);
});

test('AI place discovery requires login', async () => {
  const res = await request(app).post('/api/ai/discover').send({ placeName: 'Gurez' });
  assert.equal(res.status, 401);
});

test('search treats regex characters literally', async () => {
  await Post.create(samplePost({ title: 'Dal Lake (Srinagar)' }));

  const invalidRegex = await request(app).get('/api/post/getposts').query({ searchTerm: '(' });
  assert.equal(invalidRegex.status, 200);

  const wildcard = await request(app).get('/api/post/getposts').query({ searchTerm: '.*' });
  assert.equal(wildcard.status, 200);
  assert.equal(wildcard.body.posts.length, 0);

  const literal = await request(app).get('/api/post/getposts').query({ searchTerm: '(Srinagar)' });
  assert.equal(literal.body.posts.length, 1);
});

test('query operators in filters are ignored', async () => {
  await Post.create(samplePost({ slug: 'only-this-one' }));
  const res = await request(app).get('/api/post/getposts?slug[$ne]=only-this-one&limit=50');
  assert.equal(res.status, 200);
  assert.ok(res.body.posts.some((p) => p.slug === 'only-this-one'), '$ne must not be applied as an operator');
});

test('CORS only allows configured origins', async () => {
  const evil = await request(app).get('/api/user/test').set('Origin', 'https://evil.example');
  assert.equal(evil.headers['access-control-allow-origin'], undefined);

  const allowed = await request(app).get('/api/user/test').set('Origin', 'http://localhost:5173');
  assert.equal(allowed.headers['access-control-allow-origin'], 'http://localhost:5173');
  assert.equal(allowed.headers['access-control-allow-credentials'], 'true');
});

test('unknown API routes return JSON 404', async () => {
  const res = await request(app).get('/api/does-not-exist');
  assert.equal(res.status, 404);
  assert.equal(res.body.success, false);
});

test('socket notifications only reach the authenticated user', async () => {
  const { initSocket, notifyUser } = await import('../socket/socketHandler.js');
  const server = http.createServer(app);
  initSocket(server);
  await new Promise((resolve) => server.listen(0, resolve));
  const url = `http://localhost:${server.address().port}`;

  const owner = await createUser();
  const connect = (cookie) =>
    new Promise((resolve, reject) => {
      const socket = ioClient(url, {
        transports: ['websocket'],
        extraHeaders: cookie ? { cookie } : {},
        forceNew: true,
      });
      socket.on('connect', () => resolve(socket));
      socket.on('connect_error', reject);
    });

  const ownerSocket = await connect(authCookie(owner));
  const attacker = await connect(null);
  const forgedCookie = await connect(`access_token=${jwt.sign({ id: owner._id }, 'wrong-secret')}`);

  const received = { owner: [], attacker: [], forged: [] };
  ownerSocket.on('notification', (d) => received.owner.push(d));
  attacker.on('notification', (d) => received.attacker.push(d));
  forgedCookie.on('notification', (d) => received.forged.push(d));

  // Attempts to join the owner's private rooms must be ignored.
  attacker.emit('joinPost', `user:${owner._id}`);
  attacker.emit('joinPost', ownerSocket.id);
  attacker.emit('registerUser', owner._id.toString());
  await new Promise((r) => setTimeout(r, 200));

  notifyUser(owner._id.toString(), 'notification', { message: 'private' });
  await new Promise((r) => setTimeout(r, 300));

  assert.equal(received.owner.length, 1);
  assert.equal(received.attacker.length, 0);
  assert.equal(received.forged.length, 0);

  [ownerSocket, attacker, forgedCookie].forEach((s) => s.close());
  await new Promise((resolve) => server.close(resolve));
});
