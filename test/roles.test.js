import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { startTestApp } from './helpers.js';

let ctx;
let Post;

before(async () => {
  ctx = await startTestApp();
  ({ default: Post } = await import('../models/post.model.js'));
});

after(() => ctx.stop());

test('admin can promote a user and the change applies without re-login', async () => {
  const admin = await ctx.createUser({ isAdmin: true });
  const user = await ctx.createUser();
  const userCookie = ctx.cookieFor(user);

  const before = await request(ctx.app).get('/api/user/getusers').set('Cookie', userCookie);
  assert.equal(before.status, 403);

  const promote = await request(ctx.app)
    .put(`/api/user/${user._id}/role`)
    .set('Cookie', ctx.cookieFor(admin))
    .send({ isAdmin: true });
  assert.equal(promote.status, 200);
  assert.equal(promote.body.isAdmin, true);
  assert.equal(promote.body.password, undefined);

  // Same cookie as before promotion: role must come from the database.
  const after = await request(ctx.app).get('/api/user/getusers').set('Cookie', userCookie);
  assert.equal(after.status, 200);
});

test('removing admin takes effect immediately even with an old token', async () => {
  const admin = await ctx.createUser({ isAdmin: true });
  const formerAdmin = await ctx.createUser({ isAdmin: true });
  const oldCookie = ctx.cookieFor(formerAdmin);

  await request(ctx.app)
    .put(`/api/user/${formerAdmin._id}/role`)
    .set('Cookie', ctx.cookieFor(admin))
    .send({ isAdmin: false })
    .expect(200);

  const res = await request(ctx.app).get('/api/user/getusers').set('Cookie', oldCookie);
  assert.equal(res.status, 403);
});

test('only admins can change roles, and not their own', async () => {
  const user = await ctx.createUser();
  const target = await ctx.createUser();
  const admin = await ctx.createUser({ isAdmin: true });

  const byUser = await request(ctx.app)
    .put(`/api/user/${target._id}/role`)
    .set('Cookie', ctx.cookieFor(user))
    .send({ isAdmin: true });
  assert.equal(byUser.status, 403);

  const self = await request(ctx.app)
    .put(`/api/user/${admin._id}/role`)
    .set('Cookie', ctx.cookieFor(admin))
    .send({ isAdmin: false });
  assert.equal(self.status, 400);

  const badBody = await request(ctx.app)
    .put(`/api/user/${target._id}/role`)
    .set('Cookie', ctx.cookieFor(admin))
    .send({ isAdmin: 'yes' });
  assert.equal(badBody.status, 400);
});

test('the last remaining admin cannot be deleted', async () => {
  const { default: User } = await import('../models/user.model.js');
  await User.updateMany({}, { $set: { isAdmin: false } });
  const onlyAdmin = await ctx.createUser({ isAdmin: true });

  const res = await request(ctx.app)
    .delete(`/api/user/delete/${onlyAdmin._id}`)
    .set('Cookie', ctx.cookieFor(onlyAdmin));
  assert.equal(res.status, 400);
  assert.ok(await User.exists({ _id: onlyAdmin._id }));

  const secondAdmin = await ctx.createUser({ isAdmin: true });
  const ok = await request(ctx.app)
    .delete(`/api/user/delete/${secondAdmin._id}`)
    .set('Cookie', ctx.cookieFor(onlyAdmin));
  assert.equal(ok.status, 200);
});

test('a deleted user can no longer use their session', async () => {
  const { default: User } = await import('../models/user.model.js');
  const user = await ctx.createUser();
  const cookie = ctx.cookieFor(user);
  await User.deleteOne({ _id: user._id });
  const res = await request(ctx.app).get('/api/user/me').set('Cookie', cookie);
  assert.equal(res.status, 401);
});

test('/api/user/me returns the signed-in user without password', async () => {
  const user = await ctx.createUser({ isAdmin: true });
  const res = await request(ctx.app).get('/api/user/me').set('Cookie', ctx.cookieFor(user));
  assert.equal(res.status, 200);
  assert.equal(res.body.username, user.username);
  assert.equal(res.body.isAdmin, true);
  assert.equal(res.body.password, undefined);

  const anonymous = await request(ctx.app).get('/api/user/me');
  assert.equal(anonymous.status, 401);
});

test('public profile does not expose email', async () => {
  const user = await ctx.createUser();
  const res = await request(ctx.app).get(`/api/user/${user._id}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.username, user.username);
  assert.equal(res.body.email, undefined);
  assert.equal(res.body.password, undefined);

  const invalid = await request(ctx.app).get('/api/user/not-an-id');
  assert.equal(invalid.status, 404);
});

test('any admin can edit any post, including replacing its video', async () => {
  const author = await ctx.createUser({ isAdmin: true });
  const otherAdmin = await ctx.createUser({ isAdmin: true });
  const user = await ctx.createUser();
  const post = await Post.create({
    userId: author._id.toString(),
    title: 'Gulmarg Guide',
    slug: 'gulmarg-guide',
    content: '<p>Snow</p>',
  });

  const res = await request(ctx.app)
    .put(`/api/post/updatepost/${post._id}/${otherAdmin._id}`)
    .set('Cookie', ctx.cookieFor(otherAdmin))
    .send({ videoUrl: '/uploads/gulmarg.mp4', bestSeason: 'December to March' });
  assert.equal(res.status, 200);
  assert.equal(res.body.videoUrl, '/uploads/gulmarg.mp4');
  assert.equal(res.body.bestSeason, 'December to March');
  assert.equal(res.body.title, 'Gulmarg Guide');

  const denied = await request(ctx.app)
    .put(`/api/post/updatepost/${post._id}/${user._id}`)
    .set('Cookie', ctx.cookieFor(user))
    .send({ title: 'Hacked' });
  assert.equal(denied.status, 403);
});
