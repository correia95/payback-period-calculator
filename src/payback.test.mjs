import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  simplePayback,
  discountCashFlows,
  discountedPayback,
  encodeState,
  decodeState,
} from './payback.ts';

test('simplePayback matches a classic textbook example ($1000 investment, $400/yr)', () => {
  // Well-known capital-budgeting textbook example: $1000 up front, $400/year
  // for 4 years -> payback occurs 2.5 years in (2 full years = $800, then
  // half of year 3's $400 covers the remaining $200).
  const result = simplePayback(1000, [400, 400, 400, 400]);
  assert.equal(result.paybackYears, 2.5);
  assert.deepEqual(result.cumulative, [400, 800, 1200, 1600]);
});

test('simplePayback returns null when the investment is never recovered', () => {
  const result = simplePayback(1000, [100, 100]);
  assert.equal(result.paybackYears, null);
});

test('simplePayback handles an exact-boundary recovery with no fractional year', () => {
  const result = simplePayback(800, [400, 400, 400]);
  assert.equal(result.paybackYears, 2);
});

test('discountCashFlows discounts each flow by (1+r)^year', () => {
  const discounted = discountCashFlows([400, 400], 10);
  assert.ok(Math.abs(discounted[0] - 363.636) < 0.01);
  assert.ok(Math.abs(discounted[1] - 330.579) < 0.01);
});

test('discountedPayback matches a classic textbook example at a 10% discount rate', () => {
  const result = discountedPayback(1000, [400, 400, 400, 400], 10);
  assert.ok(result.paybackYears !== null);
  assert.ok(Math.abs(result.paybackYears - 3.019) < 0.01);
});

test('discountedPayback is always later than or equal to simple payback for a positive discount rate', () => {
  const simple = simplePayback(1000, [400, 400, 400, 400]).paybackYears;
  const discounted = discountedPayback(1000, [400, 400, 400, 400], 10).paybackYears;
  assert.ok(discounted !== null && simple !== null && discounted > simple);
});

test('discountedPayback with a 0% discount rate matches simple payback', () => {
  const simple = simplePayback(1000, [400, 400, 400, 400]).paybackYears;
  const discounted = discountedPayback(1000, [400, 400, 400, 400], 0).paybackYears;
  assert.ok(Math.abs((discounted ?? NaN) - (simple ?? NaN)) < 1e-9);
});

test('encodeState/decodeState round-trips the cash flow array and currency', () => {
  const state = { initialInvestment: 1000, cashFlows: [400, 400, 400, 400], discountRatePercent: 10, currency: 'USD' };
  const params = encodeState(state);
  const fallback = { initialInvestment: 0, cashFlows: [], discountRatePercent: 0, currency: 'AUD' };
  assert.deepEqual(decodeState(params, fallback), state);
});

test('decodeState falls back to the default for corrupted data', () => {
  const params = new URLSearchParams();
  params.set('d', 'garbage!!!');
  const fallback = { initialInvestment: 1000, cashFlows: [400, 400], discountRatePercent: 10, currency: 'USD' };
  assert.deepEqual(decodeState(params, fallback), fallback);
});
