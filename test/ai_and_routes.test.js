import test from 'node:test';
import assert from 'node:assert';
import { posts } from '../scratch/seed_data_list.js';
import { createPostSchema } from '../validations/post.validation.js';
import { signupSchema } from '../validations/auth.validation.js';
import { chatAssistantService, summarizeBlogService, getTransitGuideService } from '../services/ai.service.js';
import dotenv from 'dotenv';

dotenv.config();

test('1. Database Seed Data Integrity Check', () => {
  assert.ok(posts.length >= 24, 'Seed data must contain at least 24 destinations');
  
  const slugs = new Set();
  posts.forEach((p) => {
    assert.ok(p.title, `Post must have a title: ${JSON.stringify(p)}`);
    assert.ok(p.slug, `Post must have a slug: ${p.title}`);
    assert.ok(p.category, `Post must have a category: ${p.title}`);
    assert.ok(p.region, `Post must have a region: ${p.title}`);
    assert.ok(p.image.startsWith('http') || p.image.startsWith('/'), `Image must be a valid URL: ${p.title}`);
    assert.ok(p.content.length > 20, `Content must be meaningful: ${p.title}`);
    assert.ok(!slugs.has(p.slug), `Duplicate slug detected: ${p.slug}`);
    slugs.add(p.slug);
  });
});

test('2. Regional Balance Check (North, South, West, East, Central)', () => {
  const regions = { 'North India': 0, 'South India': 0, 'West India': 0, 'East India': 0, 'Central India': 0 };
  posts.forEach((p) => {
    if (regions[p.region] !== undefined) {
      regions[p.region]++;
    }
  });

  assert.ok(regions['North India'] >= 6, 'North India must have at least 6 destinations');
  assert.ok(regions['South India'] >= 6, 'South India must have at least 6 destinations');
  assert.ok(regions['West India'] >= 6, 'West India must have at least 6 destinations');
  assert.ok(regions['East India'] >= 6, 'East India must have at least 6 destinations');
});

test('2b. Rich Geo & Waypoint Route Integrity Check', () => {
  posts.forEach((p) => {
    assert.ok(p.coordinates, `Missing coordinates for: ${p.title}`);
    assert.ok(p.coordinates.lat >= 8 && p.coordinates.lat <= 38, `Latitude out of range for India: ${p.title}`);
    assert.ok(p.coordinates.lng >= 68 && p.coordinates.lng <= 98, `Longitude out of range for India: ${p.title}`);
    assert.ok(Array.isArray(p.waypoints) && p.waypoints.length >= 3, `Must have at least 3 waypoints: ${p.title}`);
    assert.ok(p.nearestHubs && p.nearestHubs.airport, `Missing airport hub: ${p.title}`);
    assert.ok(p.nearestHubs && p.nearestHubs.railway, `Missing railway hub: ${p.title}`);
    assert.ok(p.budgetINR && p.budgetINR.backpacker > 0, `Missing budget: ${p.title}`);
    
    p.waypoints.forEach((wp) => {
      assert.ok(wp.name, `Waypoint missing name in ${p.title}`);
      assert.ok(typeof wp.lat === 'number', `Waypoint missing lat in ${p.title}`);
      assert.ok(typeof wp.lng === 'number', `Waypoint missing lng in ${p.title}`);
      assert.ok(wp.transport, `Waypoint missing transport in ${p.title}`);
    });
  });
});

test('3. Zod Post Validation Schema Tests', () => {
  // Valid payload
  const valid = createPostSchema.safeParse({
    body: {
      title: 'Coorg: Coffee Capital',
      content: 'Misty hills and coffee plantations in Karnataka.',
      category: 'nature',
      image: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2',
    },
  });
  assert.ok(valid.success, 'Valid post payload should pass validation');

  // Invalid payload (missing content)
  const invalid = createPostSchema.safeParse({
    body: {
      title: 'Incomplete Post',
    },
  });
  assert.strictEqual(invalid.success, false, 'Payload without content should fail');
});

test('4. Zod Auth Validation Schema Tests', () => {
  const validUser = signupSchema.safeParse({
    body: {
      username: 'traveler101',
      email: 'traveler@example.com',
      password: 'StrongPassword123!',
    },
  });
  assert.ok(validUser.success, 'Valid user should pass');

  const invalidEmail = signupSchema.safeParse({
    body: {
      username: 'traveler101',
      email: 'not-an-email',
      password: 'StrongPassword123!',
    },
  });
  assert.strictEqual(invalidEmail.success, false, 'Invalid email should fail');
});

// Live provider checks only run when an API key is configured.
const hasAiKey = Boolean(process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY || process.env.XAI_API_KEY);

test('5. Multi-Provider AI Fallback Test (WanderBot)', { skip: !hasAiKey && 'no AI API key configured' }, async () => {
  const reply = await chatAssistantService('Hello, recommend one quick spot in South India.');
  assert.ok(typeof reply === 'string', 'Reply must be a string');
  assert.ok(reply.length > 10, 'Reply must not be empty');
});

test('6. Origin-to-Destination Route Transit Guidance Test', { skip: !hasAiKey && 'no AI API key configured' }, async () => {
  const transit = await getTransitGuideService({
    origin: 'Pune',
    destination: 'Jhansi',
    destinationState: 'Uttar Pradesh',
  });
  assert.ok(transit, 'Transit object must exist');
  assert.ok(transit.summary, 'Must contain a journey summary');
  assert.ok(Array.isArray(transit.trains), 'Must contain trains array');
  assert.equal(transit.aiGenerated, true, 'AI transit must be labeled as AI-generated');
  assert.ok(transit.flights, 'Must contain flight options');
  assert.ok(transit.road, 'Must contain road & distance information');
});

test('7. Dignified Tone Sanitization & Ban on Socio-Economic Terms', async () => {
  const { sanitizeDignifiedLanguage } = await import('../services/ai.service.js');
  const dirtyObject = {
    summary: 'For a middle-class family, this train is economical for poverty alleviation.',
    smartTravelerAdvice: 'Middle-class travelers should book sleeper.',
    nested: {
      note: 'Middle class families love this place.',
    },
  };
  const cleaned = sanitizeDignifiedLanguage(dirtyObject);
  const jsonStr = JSON.stringify(cleaned).toLowerCase();
  assert.ok(!jsonStr.includes('middle class'), 'Must not contain "middle class"');
  assert.ok(!jsonStr.includes('middle-class'), 'Must not contain "middle-class"');
  assert.ok(!jsonStr.includes('poverty'), 'Must not contain "poverty"');
});

test('8. High Concurrency In-Flight Request Deduplication Test', async (t) => {
  const saved = { fetch: globalThis.fetch, GEMINI_API_KEY: process.env.GEMINI_API_KEY, GROQ_API_KEY: process.env.GROQ_API_KEY };
  t.after(() => {
    globalThis.fetch = saved.fetch;
    for (const key of ['GEMINI_API_KEY', 'GROQ_API_KEY']) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  });
  delete process.env.GEMINI_API_KEY;
  process.env.GROQ_API_KEY = 'test-key';

  let upstreamCalls = 0;
  globalThis.fetch = async () => {
    upstreamCalls += 1;
    await new Promise((r) => setTimeout(r, 50));
    const content = JSON.stringify({ summary: 'Take the overnight train.', trains: [], flights: {}, road: {} });
    return new Response(
      JSON.stringify({ id: 't', object: 'chat.completion', created: 0, model: 't', choices: [{ index: 0, finish_reason: 'stop', message: { role: 'assistant', content } }] }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );
  };

  const promises = [1, 2, 3, 4, 5].map(() =>
    getTransitGuideService({ origin: 'Pune', destination: 'Baruasagar' })
  );
  const results = await Promise.all(promises);
  assert.strictEqual(results.length, 5, 'All 5 concurrent requests must resolve');
  assert.strictEqual(results[0].summary, results[4].summary, 'Coalesced results must match');
  assert.strictEqual(upstreamCalls, 1, 'Concurrent identical requests must hit the AI provider once');
});
