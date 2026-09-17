const test = require('node:test');
const assert = require('node:assert/strict');

const { getProjectListKey, invalidateProjectListCache, cache } = require('../src/utils/cache');

test('project cache keys include the user and query payload', () => {
  const key = getProjectListKey('user-123', { search: 'demo', status: 'pending' });
  assert.match(key, /^projects_user-123_/);
  assert.match(key, /search|status/);
});

test('project cache invalidation clears all entries for a user', () => {
  cache.set('projects_user-123_{"search":"alpha"}', { ok: true }, 60);
  cache.set('projects_user-999_{"search":"beta"}', { ok: false }, 60);
  invalidateProjectListCache('user-123');

  assert.equal(cache.get('projects_user-123_{"search":"alpha"}'), undefined);
  assert.deepEqual(cache.get('projects_user-999_{"search":"beta"}'), { ok: false });
});
