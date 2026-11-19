import { test } from 'node:test';
import assert from 'node:assert/strict';
import { escapeRegex, escapeHtml, plainTextToHtml, asString } from '../utils/sanitize.js';

test('escapeRegex makes user input match literally', () => {
  const pattern = new RegExp(escapeRegex('Dal Lake (Srinagar).*'));
  assert.ok(pattern.test('Dal Lake (Srinagar).*'));
  assert.ok(!pattern.test('Dal Lake Srinagar anything'));
});

test('escapeHtml neutralizes markup', () => {
  assert.equal(escapeHtml('<img src=x onerror="alert(1)">'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
});

test('plainTextToHtml wraps paragraphs and escapes HTML', () => {
  const html = plainTextToHtml('First <script>alert(1)</script>\n\nSecond');
  assert.equal(html, '<p>First &lt;script&gt;alert(1)&lt;/script&gt;</p><p>Second</p>');
});

test('asString rejects query-operator objects', () => {
  assert.equal(asString('goa'), 'goa');
  assert.equal(asString({ $ne: 'x' }), undefined);
  assert.equal(asString(['a']), undefined);
});
