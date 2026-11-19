import { test, before, after, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { startTestApp } from './helpers.js';

let ctx;
let Story;
let Post;
const realFetch = globalThis.fetch;

before(async () => {
  ctx = await startTestApp();
  ({ default: Story } = await import('../models/story.model.js'));
  ({ default: Post } = await import('../models/post.model.js'));
  await Post.create({ userId: 'admin', title: 'Gulmarg: Snow Meadows', slug: 'gulmarg', content: '<p>Snow</p>', videoUrl: '/uploads/gulmarg.mp4' });
  await Post.create({ userId: 'admin', title: 'Pahalgam: Valley', slug: 'pahalgam', content: '<p>Valley</p>' });
});

afterEach(() => {
  globalThis.fetch = realFetch;
  delete process.env.GROQ_API_KEY;
});

after(() => ctx.stop());

const postStory = (user, body) =>
  request(ctx.app).post('/api/story').set('Cookie', ctx.cookieFor(user)).send(body);

test('posting a story requires login', async () => {
  const res = await request(ctx.app).post('/api/story').send({ caption: 'Hi', media: ['/uploads/a.jpg'] });
  assert.equal(res.status, 401);
});

test('stories only accept files uploaded to our server', async () => {
  const user = await ctx.createUser();
  for (const media of [['javascript:alert(1)'], ['https://evil.example/x.jpg'], ['/uploads/../.env'], []]) {
    const res = await postStory(user, { caption: 'Look', media });
    assert.equal(res.status, 400, `should reject ${JSON.stringify(media)}`);
  }
  const tooMany = await postStory(user, { caption: 'Look', media: Array.from({ length: 6 }, (_, i) => `/uploads/${i}.jpg`) });
  assert.equal(tooMany.status, 400);
  const unknownPlace = await postStory(user, { caption: 'Look', media: ['/uploads/a.jpg'], placeSlug: 'atlantis' });
  assert.equal(unknownPlace.status, 400);
});

test('a story is saved with media types, place and public author info', async () => {
  const user = await ctx.createUser();
  const res = await postStory(user, {
    caption: 'Gondola queue was 40 minutes at 10am',
    media: ['/uploads/gondola.mp4', '/uploads/meadow.JPG'],
    placeSlug: 'gulmarg',
  });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  assert.deepEqual(res.body.media.map((m) => m.type), ['video', 'image']);
  assert.equal(res.body.placeSlug, 'gulmarg');
  assert.equal(res.body.userId.username, user.username);
  assert.equal(res.body.userId.email, undefined);
  assert.equal(res.body.likes, undefined);
});

test('stories can be filtered by place and paged', async () => {
  const user = await ctx.createUser();
  for (let i = 0; i < 3; i += 1) {
    await postStory(user, { caption: `Pahalgam ${i}`, media: ['/uploads/p.jpg'], placeSlug: 'pahalgam' });
  }
  const page1 = await request(ctx.app).get('/api/story').query({ place: 'pahalgam', limit: 2 });
  assert.equal(page1.status, 200);
  assert.equal(page1.body.length, 2);
  assert.ok(page1.body.every((s) => s.placeSlug === 'pahalgam'));

  const page2 = await request(ctx.app)
    .get('/api/story')
    .query({ place: 'pahalgam', limit: 2, before: page1.body[1].createdAt });
  assert.equal(page2.body.length, 1);

  const badQuery = await request(ctx.app).get('/api/story').query({ place: 'Bad Slug!' });
  assert.equal(badQuery.status, 400);
});

test('likes toggle per user and report likedByMe', async () => {
  const author = await ctx.createUser();
  const fan1 = await ctx.createUser();
  const fan2 = await ctx.createUser();
  const { body: story } = await postStory(author, { caption: 'Sunset at Dal', media: ['/uploads/dal.jpg'] });

  const like1 = await request(ctx.app).put(`/api/story/${story._id}/like`).set('Cookie', ctx.cookieFor(fan1));
  assert.deepEqual(like1.body, { likesCount: 1, likedByMe: true });
  await request(ctx.app).put(`/api/story/${story._id}/like`).set('Cookie', ctx.cookieFor(fan2));

  const view = await request(ctx.app).get('/api/story').set('Cookie', ctx.cookieFor(fan1));
  const seen = view.body.find((s) => s._id === story._id);
  assert.equal(seen.likesCount, 2);
  assert.equal(seen.likedByMe, true);

  const unlike = await request(ctx.app).put(`/api/story/${story._id}/like`).set('Cookie', ctx.cookieFor(fan1));
  assert.deepEqual(unlike.body, { likesCount: 1, likedByMe: false });

  const anonymous = await request(ctx.app).put(`/api/story/${story._id}/like`);
  assert.equal(anonymous.status, 401);
});

test('only admins can feature stories for the Home page', async () => {
  const user = await ctx.createUser();
  const admin = await ctx.createUser({ isAdmin: true });
  const { body: story } = await postStory(user, { caption: 'Featured candidate', media: ['/uploads/f.mp4'] });

  const byUser = await request(ctx.app)
    .put(`/api/story/${story._id}/feature`)
    .set('Cookie', ctx.cookieFor(user))
    .send({ featured: true });
  assert.equal(byUser.status, 403);

  const byAdmin = await request(ctx.app)
    .put(`/api/story/${story._id}/feature`)
    .set('Cookie', ctx.cookieFor(admin))
    .send({ featured: true });
  assert.equal(byAdmin.status, 200);

  const featured = await request(ctx.app).get('/api/story').query({ featured: 'true' });
  assert.deepEqual(featured.body.map((s) => s._id), [story._id]);
});

test('stories can be deleted by their author or an admin only', async () => {
  const author = await ctx.createUser();
  const stranger = await ctx.createUser();
  const admin = await ctx.createUser({ isAdmin: true });
  const { body: first } = await postStory(author, { caption: 'One', media: ['/uploads/1.jpg'] });
  const { body: second } = await postStory(author, { caption: 'Two', media: ['/uploads/2.jpg'] });

  assert.equal((await request(ctx.app).delete(`/api/story/${first._id}`).set('Cookie', ctx.cookieFor(stranger))).status, 403);
  assert.equal((await request(ctx.app).delete(`/api/story/${first._id}`).set('Cookie', ctx.cookieFor(author))).status, 200);
  assert.equal((await request(ctx.app).delete(`/api/story/${second._id}`).set('Cookie', ctx.cookieFor(admin))).status, 200);
  assert.equal(await Story.countDocuments({ _id: { $in: [first._id, second._id] } }), 0);
});

test('captions flagged as toxic by the AI are rejected', async () => {
  process.env.GROQ_API_KEY = 'test-key';
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({ id: 't', object: 'chat.completion', created: 0, model: 't', choices: [{ index: 0, finish_reason: 'stop', message: { role: 'assistant', content: 'TOXIC' } }] }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );
  const user = await ctx.createUser();
  const res = await postStory(user, { caption: 'something abusive', media: ['/uploads/x.jpg'] });
  assert.equal(res.status, 400);
});

test('destinations can be filtered to those with a video guide', async () => {
  const res = await request(ctx.app).get('/api/post/getposts').query({ hasVideo: 'true' });
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.posts.map((p) => p.slug), ['gulmarg']);
});

test("deleting an account removes that user's stories", async () => {
  const user = await ctx.createUser();
  await postStory(user, { caption: 'Bye', media: ['/uploads/bye.jpg'] });
  await request(ctx.app).delete(`/api/user/delete/${user._id}`).set('Cookie', ctx.cookieFor(user)).expect(200);
  assert.equal(await Story.countDocuments({ userId: user._id }), 0);
});
