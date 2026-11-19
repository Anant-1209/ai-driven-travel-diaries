import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { startTestApp } from './helpers.js';

let ctx;
let Partner;
let admin;
let user;

const partner = (overrides = {}) => ({
  name: 'Lakeview Houseboat',
  type: 'houseboat',
  placeSlugs: ['srinagar'],
  whatsapp: '98765 43210',
  priceRange: '₹3,000–5,000 / night',
  ...overrides,
});

const create = (body) =>
  request(ctx.app).post('/api/partner').set('Cookie', ctx.cookieFor(admin)).send(body);

before(async () => {
  ctx = await startTestApp();
  ({ default: Partner } = await import('../models/partner.model.js'));
  admin = await ctx.createUser({ isAdmin: true });
  user = await ctx.createUser();
});

after(() => ctx.stop());

test('only admins can manage partners', async () => {
  assert.equal((await request(ctx.app).post('/api/partner').send(partner())).status, 401);
  assert.equal(
    (await request(ctx.app).post('/api/partner').set('Cookie', ctx.cookieFor(user)).send(partner())).status,
    403
  );
  assert.equal((await request(ctx.app).get('/api/partner/admin').set('Cookie', ctx.cookieFor(user))).status, 403);
});

test('admin adds a partner; phone numbers are normalised to digits with country code', async () => {
  const res = await create(partner({ phone: '+91-99999 11111' }));
  assert.equal(res.status, 201, JSON.stringify(res.body));
  assert.equal(res.body.whatsapp, '919876543210');
  assert.equal(res.body.phone, '919999911111');
  assert.equal(res.body.verified, false);
  assert.equal(res.body.active, true);
});

test('partner input is validated', async () => {
  assert.equal((await create(partner({ whatsapp: '', phone: '' }))).status, 400, 'needs a contact number');
  assert.equal((await create(partner({ type: 'spaceship' }))).status, 400);
  assert.equal((await create(partner({ image: 'javascript:alert(1)' }))).status, 400);
  assert.equal((await create(partner({ image: 'http://insecure.example/a.jpg' }))).status, 400);
  assert.equal((await create(partner({ placeSlugs: ['Bad Slug'] }))).status, 400);
  assert.equal((await create(partner({ image: '/uploads/boat.jpg' }))).status, 201);
});

test('destination pages list only active partners, verified first, without admin stats', async () => {
  await Partner.deleteMany({});
  await create(partner({ name: 'Zubair Cabs', type: 'cab', placeSlugs: ['gulmarg'], verified: false }));
  await create(partner({ name: 'Alpine Homestay', type: 'homestay', placeSlugs: ['gulmarg'], verified: true }));
  await create(partner({ name: 'Hidden Guide', type: 'guide', placeSlugs: ['gulmarg'], active: false }));
  await create(partner({ name: 'Elsewhere Stay', placeSlugs: ['pahalgam'] }));

  const res = await request(ctx.app).get('/api/partner').query({ place: 'gulmarg' });
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.map((p) => p.name), ['Alpine Homestay', 'Zubair Cabs']);
  assert.equal(res.body[0].enquiries, undefined);

  assert.equal((await request(ctx.app).get('/api/partner')).status, 400, 'place is required');
});

test('admin can edit and hide a partner', async () => {
  const { body: created } = await create(partner({ name: 'Old Name', placeSlugs: ['sonamarg'] }));
  const edit = await request(ctx.app)
    .put(`/api/partner/${created._id}`)
    .set('Cookie', ctx.cookieFor(admin))
    .send({ name: 'New Name', verified: true });
  assert.equal(edit.status, 200);
  assert.equal(edit.body.name, 'New Name');
  assert.equal(edit.body.verified, true);

  await request(ctx.app)
    .put(`/api/partner/${created._id}`)
    .set('Cookie', ctx.cookieFor(admin))
    .send({ active: false })
    .expect(200);
  const list = await request(ctx.app).get('/api/partner').query({ place: 'sonamarg' });
  assert.equal(list.body.length, 0);

  const del = await request(ctx.app).delete(`/api/partner/${created._id}`).set('Cookie', ctx.cookieFor(admin));
  assert.equal(del.status, 200);
});

test('WhatsApp and call taps are counted as enquiries', async () => {
  const { body: created } = await create(partner({ name: 'Counted Stay', placeSlugs: ['pahalgam'], phone: '' }));

  await request(ctx.app).post(`/api/partner/${created._id}/contact`).send({ channel: 'whatsapp' }).expect(200);
  await request(ctx.app).post(`/api/partner/${created._id}/contact`).send({ channel: 'whatsapp' }).expect(200);
  assert.equal((await Partner.findById(created._id)).enquiries, 2);

  const noPhone = await request(ctx.app).post(`/api/partner/${created._id}/contact`).send({ channel: 'call' });
  assert.equal(noPhone.status, 404);
  const badChannel = await request(ctx.app).post(`/api/partner/${created._id}/contact`).send({ channel: 'email' });
  assert.equal(badChannel.status, 400);

  await Partner.updateOne({ _id: created._id }, { active: false });
  const hidden = await request(ctx.app).post(`/api/partner/${created._id}/contact`).send({ channel: 'whatsapp' });
  assert.equal(hidden.status, 404);
});

test('enquiry counting is rate limited per visitor', async () => {
  const { body: created } = await create(partner({ name: 'Popular Stay', placeSlugs: ['pahalgam'] }));
  let status = 200;
  for (let i = 0; i < 25 && status !== 429; i += 1) {
    status = (await request(ctx.app).post(`/api/partner/${created._id}/contact`).send({ channel: 'whatsapp' })).status;
  }
  assert.equal(status, 429);
});
