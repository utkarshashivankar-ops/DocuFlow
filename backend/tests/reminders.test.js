const test = require('node:test');
const assert = require('node:assert/strict');
const { dueReminder, dedupeKey, buildMessage } = require('../src/utils/reminders');
const { renewalTemplate, recommendedAction, guideFor } = require('../src/utils/renewalGuide');
const v = require('../src/utils/validators');

const S = [90, 30, 7, 1];

test('no expiry date -> no reminder', () => {
  assert.equal(dueReminder(null, S), null);
});
test('far in the future -> nothing due yet', () => {
  assert.equal(dueReminder(200, S), null);
  assert.equal(dueReminder(91, S), null);
});
test('each threshold fires when reached', () => {
  assert.deepEqual(dueReminder(90, S), { kind: 'upcoming', threshold: 90 });
  assert.deepEqual(dueReminder(45, S), { kind: 'upcoming', threshold: 90 });
  assert.deepEqual(dueReminder(30, S), { kind: 'upcoming', threshold: 30 });
  assert.deepEqual(dueReminder(7, S), { kind: 'upcoming', threshold: 7 });
  assert.deepEqual(dueReminder(1, S), { kind: 'upcoming', threshold: 1 });
});
test('late upload produces ONE reminder (smallest reached threshold), not a burst', () => {
  assert.deepEqual(dueReminder(5, S), { kind: 'upcoming', threshold: 7 });
});
test('expiring today is still an "upcoming" 1-day reminder; past is "expired"', () => {
  assert.deepEqual(dueReminder(0, S), { kind: 'upcoming', threshold: 1 });
  assert.deepEqual(dueReminder(-3, S), { kind: 'expired', threshold: 0 });
});
test('dedupe key is stable per cycle and changes when the expiry date is renewed', () => {
  const a = dedupeKey('u1', 'd1', new Date('2026-12-01T00:00:00Z'), 30);
  assert.equal(a, dedupeKey('u1', 'd1', new Date('2026-12-01T00:00:00Z'), 30));
  assert.notEqual(a, dedupeKey('u1', 'd1', new Date('2031-12-01T00:00:00Z'), 30));
  assert.notEqual(a, dedupeKey('u1', 'd1', new Date('2026-12-01T00:00:00Z'), 7));
});
test('messages read naturally', () => {
  assert.match(buildMessage('Passport', 1, 'upcoming').heading, /expires in 1 day$/);
  assert.match(buildMessage('Passport', 12, 'upcoming').heading, /12 days/);
  assert.match(buildMessage('Passport', 0, 'upcoming').heading, /today/);
  assert.match(buildMessage('Passport', -4, 'expired').body, /4 days ago/);
});

test('renewal templates: known type, generic fallback, fresh un-ticked checklist each time', () => {
  const p = renewalTemplate('Passport');
  assert.ok(p.checklist.length >= 3 && p.steps.length >= 3);
  assert.ok(p.checklist.every((c) => c.done === false));
  assert.match(p.officialUrl, /^https:\/\//);
  assert.equal(renewalTemplate('Passport').checklist === p.checklist, false);
  assert.equal(renewalTemplate('Something Unknown').officialUrl, '');
  assert.equal(recommendedAction('Unknown thing'), guideFor('x').action);
});

test('renewal update validation', () => {
  assert.ok(v.renewalUpdateSchema.safeParse({ status: 'In Progress' }).success);
  assert.ok(!v.renewalUpdateSchema.safeParse({ status: 'Done' }).success);
  assert.ok(v.renewalUpdateSchema.safeParse({ officialUrl: '' }).success);
  assert.ok(!v.renewalUpdateSchema.safeParse({ officialUrl: 'javascript:alert(1)' }).success);
  assert.ok(!v.renewalUpdateSchema.safeParse({ officialUrl: 'ftp://example.com' }).success);
});
test('share validation: default 24h, max 7 days', () => {
  assert.equal(v.shareCreateSchema.parse({}).expiresInHours, 24);
  assert.ok(!v.shareCreateSchema.safeParse({ expiresInHours: 0 }).success);
  assert.ok(!v.shareCreateSchema.safeParse({ expiresInHours: 169 }).success);
});
