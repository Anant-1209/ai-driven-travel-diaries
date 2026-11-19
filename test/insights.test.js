import { test, before, after, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { startTestApp } from './helpers.js';

let ctx;
let Trip;
let Post;
let Story;
const realFetch = globalThis.fetch;

before(async () => {
  ctx = await startTestApp();
  ({ default: Trip } = await import('../models/trip.model.js'));
  ({ default: Post } = await import('../models/post.model.js'));
  ({ default: Story } = await import('../models/story.model.js'));
  await Post.create({ userId: 'admin', title: 'Pahalgam: Valley of Shepherds', slug: 'pahalgam', content: '<p>Valley</p>' });
});

afterEach(() => {
  globalThis.fetch = realFetch;
  delete process.env.GROQ_API_KEY;
});

after(() => ctx.stop());

const saveTrip = async (user, overrides = {}) => {
  const res = await request(ctx.app)
    .post('/api/trip')
    .set('Cookie', ctx.cookieFor(user))
    .send({ destination: 'Pahalgam', days: 3, budget: 'Moderate', itinerary: '### Day 1', ...overrides });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  return res.body;
};

const patch = (user, trip, body) =>
  request(ctx.app).patch(`/api/trip/${trip._id}`).set('Cookie', ctx.cookieFor(user)).send(body);

const feedback = (user, trip, body) =>
  request(ctx.app).post(`/api/trip/${trip._id}/feedback`).set('Cookie', ctx.cookieFor(user)).send(body);

test('new trips start with a practical checklist the owner can edit', async () => {
  const user = await ctx.createUser();
  const trip = await saveTrip(user);
  assert.equal(trip.checklist.length, 8);
  assert.ok(trip.checklist.every((item) => item.done === false));

  const updated = trip.checklist.map(({ _id, text }, i) => ({ _id, text, done: i === 0 }));
  updated.push({ text: 'Warm jacket', done: false });
  const res = await patch(user, trip, { checklist: updated.slice(1) });
  assert.equal(res.status, 200);
  assert.equal(res.body.checklist.length, 8);
  assert.equal(res.body.checklist.at(-1).text, 'Warm jacket');

  const tooMany = Array.from({ length: 31 }, (_, i) => ({ text: `Item ${i}`, done: false }));
  assert.equal((await patch(user, trip, { checklist: tooMany })).status, 400);
  assert.equal((await patch(user, trip, { checklist: [{ text: '', done: false }] })).status, 400);
});

test('travel date can be set and cleared, and stays private on shared links', async () => {
  const owner = await ctx.createUser();
  const stranger = await ctx.createUser();
  const trip = await saveTrip(owner);

  assert.equal((await patch(owner, trip, { startDate: 'next week' })).status, 400);
  const set = await patch(owner, trip, { startDate: '2026-12-20' });
  assert.equal(set.status, 200);
  assert.equal(set.body.startDate.slice(0, 10), '2026-12-20');

  const strangerView = await request(ctx.app).get(`/api/trip/s/${trip.shareId}`).set('Cookie', ctx.cookieFor(stranger));
  assert.equal(strangerView.body.startDate, undefined);
  assert.equal(strangerView.body.checklist, undefined);
  const ownerView = await request(ctx.app).get(`/api/trip/s/${trip.shareId}`).set('Cookie', ctx.cookieFor(owner));
  assert.equal(ownerView.body.startDate.slice(0, 10), '2026-12-20');
  assert.equal(ownerView.body.checklist.length, 8);

  const cleared = await patch(owner, trip, { startDate: null });
  assert.equal(cleared.body.startDate, null);
});

test('post-trip questions can only be answered by the owner and mark the trip completed', async () => {
  const owner = await ctx.createUser();
  const stranger = await ctx.createUser();
  const trip = await saveTrip(owner);

  assert.equal((await request(ctx.app).post(`/api/trip/${trip._id}/feedback`).send({ rating: 5 })).status, 401);
  assert.equal((await feedback(stranger, trip, { rating: 5 })).status, 404);
  assert.equal((await feedback(owner, trip, { rating: 6 })).status, 400);
  assert.equal((await feedback(owner, trip, { rating: 4.5 })).status, 400);
  assert.equal((await feedback(owner, trip, {})).status, 400);

  const res = await feedback(owner, trip, { rating: 4, transportEasy: true, dailySpendINR: 3500, tip: 'Hire the local union taxi for Aru and Betaab.' });
  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'completed');
  assert.equal(res.body.feedback.rating, 4);
  assert.ok(res.body.feedback.submittedAt);
});

test('copying a trip does not copy the travel date, checklist progress or feedback', async () => {
  const owner = await ctx.createUser();
  const fan = await ctx.createUser();
  const trip = await saveTrip(owner);
  await patch(owner, trip, { startDate: '2026-12-01' });
  await feedback(owner, trip, { rating: 5 });

  const copy = await request(ctx.app).post(`/api/trip/s/${trip.shareId}/copy`).set('Cookie', ctx.cookieFor(fan));
  assert.equal(copy.status, 201);
  assert.equal(copy.body.startDate, null);
  assert.equal(copy.body.status, 'planned');
  assert.equal(copy.body.feedback?.rating, undefined);
  assert.equal(copy.body.checklist.length, 8);
});

test('toxic tips are rejected', async () => {
  process.env.GROQ_API_KEY = 'test-key';
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({ id: 't', object: 'chat.completion', created: 0, model: 't', choices: [{ index: 0, finish_reason: 'stop', message: { role: 'assistant', content: 'TOXIC' } }] }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );
  const owner = await ctx.createUser();
  const trip = await saveTrip(owner);
  assert.equal((await feedback(owner, trip, { rating: 1, tip: 'abusive text' })).status, 400);
  assert.equal((await Trip.findById(trip._id)).status, 'planned');
});

test('destination insights aggregate real trip feedback; named tips only from public trips', async () => {
  await Trip.deleteMany({ placeSlug: 'pahalgam' });
  const answers = [
    { rating: 5, transportEasy: true, dailySpendINR: 3000, tip: 'Go early to Betaab Valley.' },
    { rating: 4, transportEasy: true, dailySpendINR: 4000 },
    { rating: 3, transportEasy: false, dailySpendINR: 6000, tip: 'Private trip tip' },
  ];
  for (const [i, answer] of answers.entries()) {
    const user = await ctx.createUser();
    const trip = await saveTrip(user);
    if (i === 2) await patch(user, trip, { isPublic: false });
    await feedback(user, trip, answer).expect(200);
  }
  await saveTrip(await ctx.createUser()); // planned trips are not counted

  const res = await request(ctx.app).get('/api/trip/insights').query({ place: 'pahalgam' });
  assert.equal(res.status, 200);
  assert.equal(res.body.count, 3);
  assert.equal(res.body.avgRating, 4);
  assert.equal(res.body.medianDailySpendINR, 4000);
  assert.equal(res.body.transportEasyPercent, 67);
  assert.deepEqual(res.body.tips.map((t) => t.tip), ['Go early to Betaab Valley.']);
  assert.equal(res.body.tips[0].email, undefined);

  const none = await request(ctx.app).get('/api/trip/insights').query({ place: 'unknown-place' });
  assert.deepEqual(none.body, { count: 0 });
  assert.equal((await request(ctx.app).get('/api/trip/insights').query({ place: 'Bad Place!' })).status, 400);
});

test('travel passport counts trips, places, stories, likes and awards badges', async () => {
  const user = await ctx.createUser();
  const empty = await request(ctx.app).get('/api/user/me/passport').set('Cookie', ctx.cookieFor(user));
  assert.equal(empty.status, 200);
  assert.ok(empty.body.badges.every((b) => b.earned === false));

  for (const destination of ['Pahalgam', 'Gulmarg', 'gulmarg ', 'Sonamarg']) {
    const trip = await saveTrip(user, { destination });
    await feedback(user, trip, { rating: 5, ...(destination === 'Sonamarg' && { tip: 'Carry cash.' }) }).expect(200);
  }
  await Story.create({ userId: user._id, caption: 'Snow!', media: [{ url: '/uploads/s.jpg', type: 'image' }], likesCount: 10 });

  const res = await request(ctx.app).get('/api/user/me/passport').set('Cookie', ctx.cookieFor(user));
  assert.equal(res.body.tripsPlanned, 4);
  assert.equal(res.body.tripsCompleted, 4);
  assert.equal(res.body.placesVisited.length, 3, 'same place in different case counts once');
  assert.equal(res.body.storiesShared, 1);
  assert.equal(res.body.likesReceived, 10);
  assert.equal(res.body.tipsShared, 1);
  const earned = res.body.badges.filter((b) => b.earned).map((b) => b.id).sort();
  assert.deepEqual(earned, ['explorer', 'favourite', 'helper', 'planner', 'storyteller']);

  assert.equal((await request(ctx.app).get('/api/user/me/passport')).status, 401);
});
