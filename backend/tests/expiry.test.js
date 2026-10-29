const test = require('node:test');
const assert = require('node:assert/strict');
const { computeStatus, daysRemaining, expiryRanges, parseDateOnly } = require('../src/utils/expiry');

const NOW = new Date('2026-10-01T06:00:00Z'); // 11:30 IST on 1 Oct 2026
const opts = { tz: 'Asia/Kolkata', now: NOW };

test('no expiry date -> Active, null days', () => {
  assert.equal(computeStatus(null, 30, opts), 'Active');
  assert.equal(daysRemaining(null, opts), null);
});
test('past date -> Expired', () => {
  assert.equal(computeStatus(new Date('2026-09-30T00:00:00Z'), 30, opts), 'Expired');
});
test('expiring today is still valid (Expiring Soon, 0 days)', () => {
  assert.equal(daysRemaining(new Date('2026-10-01T00:00:00Z'), opts), 0);
  assert.equal(computeStatus(new Date('2026-10-01T00:00:00Z'), 30, opts), 'Expiring Soon');
});
test('inside / outside the warning window', () => {
  assert.equal(computeStatus(new Date('2026-10-31T00:00:00Z'), 30, opts), 'Expiring Soon');
  assert.equal(computeStatus(new Date('2026-11-01T00:00:00Z'), 30, opts), 'Active');
  assert.equal(computeStatus(new Date('2026-11-01T00:00:00Z'), 60, opts), 'Expiring Soon');
});
test('timezone: late UTC evening is already next day in IST', () => {
  const lateUtc = new Date('2026-10-01T20:00:00Z'); // 1:30 IST on 2 Oct
  assert.equal(computeStatus(new Date('2026-10-01T00:00:00Z'), 30, { tz: 'Asia/Kolkata', now: lateUtc }), 'Expired');
});
test('expiryRanges', () => {
  const r = expiryRanges(30, opts);
  assert.equal(r.today.toISOString(), '2026-10-01T00:00:00.000Z');
  assert.equal(r.soonEnd.toISOString(), '2026-10-31T00:00:00.000Z');
});
test('parseDateOnly', () => {
  assert.equal(parseDateOnly('2030-08-12').toISOString(), '2030-08-12T00:00:00.000Z');
  assert.equal(parseDateOnly(''), null);
  assert.equal(parseDateOnly('2030-02-31'), undefined);
  assert.equal(parseDateOnly('12/08/2030'), undefined);
});
