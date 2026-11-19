import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import request from 'supertest';
import { startTestApp } from './helpers.js';
import { renderWithMeta } from '../utils/socialMeta.js';

let ctx;
let Trip;
let Post;

const plan = (overrides = {}) => ({
  destination: 'Srinagar',
  days: 3,
  budget: 'Moderate',
  itinerary: '### Day 1: Dal Lake\nShikara ride at sunset.',
  ...overrides,
});

before(async () => {
  ctx = await startTestApp();
  ({ default: Trip } = await import('../models/trip.model.js'));
  ({ default: Post } = await import('../models/post.model.js'));
  await Post.create({ userId: 'admin', title: 'Srinagar: Paradise on Earth', slug: 'srinagar', content: '<p>Dal Lake</p>' });
});

after(() => ctx.stop());

const saveTrip = async (user, overrides) => {
  const res = await request(ctx.app).post('/api/trip').set('Cookie', ctx.cookieFor(user)).send(plan(overrides));
  assert.equal(res.status, 201, JSON.stringify(res.body));
  return res.body;
};

test('saving a trip requires login and valid input', async () => {
  const anonymous = await request(ctx.app).post('/api/trip').send(plan());
  assert.equal(anonymous.status, 401);

  const user = await ctx.createUser();
  const tooLong = await request(ctx.app).post('/api/trip').set('Cookie', ctx.cookieFor(user)).send(plan({ days: 30 }));
  assert.equal(tooLong.status, 400);
  const badBudget = await request(ctx.app).post('/api/trip').set('Cookie', ctx.cookieFor(user)).send(plan({ budget: 'Free' }));
  assert.equal(badBudget.status, 400);
});

test('saved trip gets a share link, default title and is linked to the destination guide', async () => {
  const user = await ctx.createUser();
  const trip = await saveTrip(user);
  assert.match(trip.shareId, /^[A-Za-z0-9_-]{6,20}$/);
  assert.equal(trip.title, '3 days in Srinagar');
  assert.equal(trip.placeSlug, 'srinagar');
  assert.equal(trip.isPublic, true);
});

test('My Trips lists only my trips, without the full itinerary', async () => {
  const me = await ctx.createUser();
  const other = await ctx.createUser();
  await saveTrip(me, { destination: 'Gulmarg' });
  await saveTrip(other, { destination: 'Pahalgam' });

  const res = await request(ctx.app).get('/api/trip/mine').set('Cookie', ctx.cookieFor(me));
  assert.equal(res.status, 200);
  assert.equal(res.body.length, 1);
  assert.equal(res.body[0].destination, 'Gulmarg');
  assert.equal(res.body[0].itinerary, undefined);
});

test('public trips are visible to anyone; private trips only to the owner', async () => {
  const owner = await ctx.createUser();
  const stranger = await ctx.createUser();
  const trip = await saveTrip(owner);

  const publicView = await request(ctx.app).get(`/api/trip/s/${trip.shareId}`);
  assert.equal(publicView.status, 200);
  assert.equal(publicView.body.isOwner, false);
  assert.equal(publicView.body.owner.username, owner.username);
  assert.equal(publicView.body.owner.email, undefined);

  await request(ctx.app)
    .patch(`/api/trip/${trip._id}`)
    .set('Cookie', ctx.cookieFor(owner))
    .send({ isPublic: false })
    .expect(200);

  assert.equal((await request(ctx.app).get(`/api/trip/s/${trip.shareId}`)).status, 404);
  assert.equal(
    (await request(ctx.app).get(`/api/trip/s/${trip.shareId}`).set('Cookie', ctx.cookieFor(stranger))).status,
    404
  );
  const ownerView = await request(ctx.app).get(`/api/trip/s/${trip.shareId}`).set('Cookie', ctx.cookieFor(owner));
  assert.equal(ownerView.status, 200);
  assert.equal(ownerView.body.isOwner, true);
});

test('only the owner (or an admin) can edit or delete a trip', async () => {
  const owner = await ctx.createUser();
  const stranger = await ctx.createUser();
  const admin = await ctx.createUser({ isAdmin: true });
  const trip = await saveTrip(owner);

  const edit = await request(ctx.app)
    .patch(`/api/trip/${trip._id}`)
    .set('Cookie', ctx.cookieFor(stranger))
    .send({ title: 'Hijacked' });
  assert.equal(edit.status, 403);

  const del = await request(ctx.app).delete(`/api/trip/${trip._id}`).set('Cookie', ctx.cookieFor(stranger));
  assert.equal(del.status, 403);

  const adminEdit = await request(ctx.app)
    .patch(`/api/trip/${trip._id}`)
    .set('Cookie', ctx.cookieFor(admin))
    .send({ title: 'Kashmir family trip' });
  assert.equal(adminEdit.status, 200);

  const ownerDelete = await request(ctx.app).delete(`/api/trip/${trip._id}`).set('Cookie', ctx.cookieFor(owner));
  assert.equal(ownerDelete.status, 200);
  assert.equal(await Trip.countDocuments({ _id: trip._id }), 0);
});

test('anyone signed in can copy a public trip; private trips cannot be copied', async () => {
  const owner = await ctx.createUser();
  const fan = await ctx.createUser();
  const trip = await saveTrip(owner);

  assert.equal((await request(ctx.app).post(`/api/trip/s/${trip.shareId}/copy`)).status, 401);

  const copy = await request(ctx.app).post(`/api/trip/s/${trip.shareId}/copy`).set('Cookie', ctx.cookieFor(fan));
  assert.equal(copy.status, 201);
  assert.notEqual(copy.body.shareId, trip.shareId);
  assert.equal(copy.body.copiedFrom, trip.shareId);
  assert.equal(String(copy.body.userId), String(fan._id));
  assert.equal((await Trip.findById(trip._id)).copies, 1);

  await Trip.updateOne({ _id: trip._id }, { isPublic: false });
  const privateCopy = await request(ctx.app).post(`/api/trip/s/${trip.shareId}/copy`).set('Cookie', ctx.cookieFor(fan));
  assert.equal(privateCopy.status, 404);
});

test('malformed ids are rejected before reaching the database', async () => {
  const user = await ctx.createUser();
  assert.equal((await request(ctx.app).get('/api/trip/s/$bad!')).status, 400);
  assert.equal((await request(ctx.app).delete('/api/trip/not-an-id').set('Cookie', ctx.cookieFor(user))).status, 400);
});

test("deleting an account removes that user's trips", async () => {
  const user = await ctx.createUser();
  await saveTrip(user);
  await request(ctx.app).delete(`/api/user/delete/${user._id}`).set('Cookie', ctx.cookieFor(user)).expect(200);
  assert.equal(await Trip.countDocuments({ userId: user._id }), 0);
});

test('link preview tags are escaped', () => {
  const html = renderWithMeta('<html><head><title>Old</title></head><body></body></html>', {
    title: '"><script>alert(1)</script>',
    description: 'Trip',
    image: 'https://example.com/a.jpg',
    url: 'https://example.com/trip/abc',
  });
  assert.ok(!html.includes('<script>alert(1)</script>'));
  assert.match(html, /<meta property="og:title" content="&quot;&gt;&lt;script&gt;/);
  assert.match(html, /<title>&quot;&gt;&lt;script&gt;/);
});

const hasClientBuild = fs.existsSync(path.resolve('client', 'dist', 'index.html'));

test('shared trip links serve preview tags for WhatsApp', { skip: !hasClientBuild && 'client not built' }, async () => {
  const owner = await ctx.createUser();
  const trip = await saveTrip(owner, { title: 'Kashmir with parents' });

  const res = await request(ctx.app).get(`/trip/${trip.shareId}`);
  assert.equal(res.status, 200);
  assert.match(res.text, /<meta property="og:title" content="Kashmir with parents \| Travel Diaries">/);
  assert.match(res.text, /og:description" content="3-day moderate trip plan for Srinagar/);

  await Trip.updateOne({ _id: trip._id }, { isPublic: false });
  const privateTrip = await request(ctx.app).get(`/trip/${trip.shareId}`);
  assert.equal(privateTrip.status, 200);
  assert.ok(!privateTrip.text.includes('Kashmir with parents'), 'private trips must not leak in previews');
});
