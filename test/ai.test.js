import { test, before, after, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { MongoMemoryServer } from 'mongodb-memory-server';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.FIREBASE_PROJECT_ID = 'travel-diaries-test';
delete process.env.GEMINI_API_KEY;
delete process.env.GROQ_API_KEY;
delete process.env.XAI_API_KEY;

const realFetch = globalThis.fetch;
let mongo;
let app;
let User;
let Post;

// Simulates the Groq API returning `content` as the model's answer.
const fakeGroq = (content) => {
  process.env.GROQ_API_KEY = 'test-key';
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        id: 'test',
        object: 'chat.completion',
        created: 0,
        model: 'test',
        choices: [{ index: 0, finish_reason: 'stop', message: { role: 'assistant', content } }],
      }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );
};

const loginCookie = async () => {
  const user = await User.create({
    username: `u${Math.random().toString(36).slice(2, 10)}`,
    email: `${Math.random().toString(36).slice(2, 10)}@example.com`,
    password: 'hashed',
  });
  return `access_token=${jwt.sign({ id: user._id, isAdmin: false }, process.env.JWT_SECRET)}`;
};

before(async () => {
  mongo = await MongoMemoryServer.create({ instance: { launchTimeout: 60000 } });
  await mongoose.connect(mongo.getUri());
  ({ default: User } = await import('../models/user.model.js'));
  ({ default: Post } = await import('../models/post.model.js'));
  const { createApp } = await import('../app.js');
  app = createApp();
});

afterEach(() => {
  globalThis.fetch = realFetch;
  delete process.env.GROQ_API_KEY;
});

after(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

test('planner works without login but returns 503 instead of canned advice when AI is down', async () => {
  const res = await request(app)
    .post('/api/ai/plan')
    .send({ destination: 'Kashmir', days: '5', budget: 'Moderate' });
  assert.equal(res.status, 503);
  assert.match(res.body.message, /try again/i);
  assert.equal(res.body.itinerary, undefined);
});

test('planner rejects out-of-range or oversized input', async () => {
  const tooManyDays = await request(app).post('/api/ai/plan').send({ destination: 'Goa', days: 100, budget: 'Moderate' });
  const badBudget = await request(app).post('/api/ai/plan').send({ destination: 'Goa', days: 3, budget: 'Cheap' });
  const hugeDestination = await request(app).post('/api/ai/plan').send({ destination: 'x'.repeat(500), days: 3, budget: 'Moderate' });
  assert.equal(tooManyDays.status, 400);
  assert.equal(badBudget.status, 400);
  assert.equal(hugeDestination.status, 400);
});

test('planner returns AI itinerary when a provider answers', async () => {
  fakeGroq('### Day 1: Srinagar\nShikara ride on Dal Lake.');
  const res = await request(app).post('/api/ai/plan').send({ destination: 'Kashmir', days: 3, budget: 'Moderate' });
  assert.equal(res.status, 200);
  assert.match(res.body.itinerary, /Dal Lake/);
});

test('chat validates input and fails honestly when AI is down', async () => {
  const empty = await request(app).post('/api/ai/chat').send({ message: '' });
  assert.equal(empty.status, 400);
  const down = await request(app).post('/api/ai/chat').send({ message: 'Best time for Gulmarg?' });
  assert.equal(down.status, 503);
});

test('transit never returns invented fallback trains', async () => {
  const res = await request(app).post('/api/ai/transit').send({ origin: 'Pune', destination: 'Srinagar' });
  assert.equal(res.status, 503);
  assert.equal(res.body.transit, undefined);
});

test('transit from AI is labeled as AI-generated', async () => {
  fakeGroq(JSON.stringify({ summary: 'Fly to Srinagar.', trains: [], flights: {}, road: {}, smartTravelerAdvice: 'Book early.' }));
  const res = await request(app).post('/api/ai/transit').send({ origin: 'Mumbai', destination: 'Srinagar' });
  assert.equal(res.status, 200);
  assert.equal(res.body.transit.aiGenerated, true);
});

test('discover does not save a fake guide when AI is down', async () => {
  const before = await Post.countDocuments();
  const res = await request(app)
    .post('/api/ai/discover')
    .set('Cookie', await loginCookie())
    .send({ placeName: 'Bangus Valley' });
  assert.equal(res.status, 503);
  assert.equal(await Post.countDocuments(), before);
});

test('discover escapes AI HTML, drops bad waypoints and ignores injected fields', async () => {
  fakeGroq(
    JSON.stringify({
      title: 'Gurez Valley: Hidden Gem',
      content: 'Beautiful valley <script>alert(1)</script>\n\n<img src=x onerror=alert(2)>',
      category: 'nature',
      region: 'North India',
      state: 'Jammu & Kashmir',
      coordinates: { lat: 34.63, lng: 74.83 },
      highlights: ['Habba Khatoon peak'],
      waypoints: [
        { name: 'Dawar', lat: 34.63, lng: 74.83, day: 1 },
        { name: 'Broken', lat: 'abc', lng: 74.8, day: 1 },
      ],
      image: 'javascript:alert(1)',
      userId: 'attacker',
      videoUrl: 'https://evil.example/v.mp4',
    })
  );

  const res = await request(app)
    .post('/api/ai/discover')
    .set('Cookie', await loginCookie())
    .send({ placeName: 'Gurez' });
  assert.equal(res.status, 200);

  const saved = await Post.findById(res.body.post._id).lean();
  assert.ok(!saved.content.includes('<script>'));
  assert.ok(!saved.content.includes('<img'));
  assert.match(saved.content, /^<p>Beautiful valley &lt;script&gt;/);
  assert.equal(saved.waypoints.length, 1);
  assert.equal(saved.source, 'ai');
  assert.notEqual(saved.userId, 'attacker');
  assert.ok(saved.image.startsWith('https://'));
  assert.equal(saved.videoUrl, null);
});

test('discover treats regex characters in the place name literally', async () => {
  const res = await request(app)
    .post('/api/ai/discover')
    .set('Cookie', await loginCookie())
    .send({ placeName: 'Gur.*' });
  // Unescaped, `\bGur.*\b` would match the saved "Gurez Valley" post and return it.
  assert.equal(res.status, 503);
});
