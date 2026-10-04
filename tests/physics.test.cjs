const { test } = require('node:test');
const assert = require('node:assert/strict');
const { calculate, C_KM_S } = require('../js/physics.js');
function close(actual, expected) { assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} != ${expected}`); }
test('at rest both clocks agree', () => {
  const r = calculate(100, 0); close(r.gamma, 1); close(r.travellerYears, 100); close(r.difference, 0);
});
for (const [beta, elapsed] of [[0.5,86.60254037844386],[0.9,43.58898943540673],[0.99,14.10673597966589],[0.999,4.471017781221601],[0.9999,1.414178206591827]]) {
  test(`${beta * 100}% c reference calculation`, () => {
    const r = calculate(100, beta); close(r.travellerYears, elapsed);
    close(r.travellerYears + r.difference, 100); close(r.gamma * r.travellerYears, 100);
    close(r.velocity, beta * C_KM_S);
  });
}
test('faster travel means less traveller time', () => {
  let previous = 100;
  for (const beta of [0.5,0.9,0.99,0.999,0.9999]) {
    const r = calculate(100,beta); assert.ok(r.travellerYears < previous); previous = r.travellerYears;
  }
});
test('time scales linearly and UI duration boundaries are finite', () => {
  close(calculate(200,0.99).travellerYears, 2 * calculate(100,0.99).travellerYears);
  for (const years of [0.01,10000]) assert.ok(Number.isFinite(calculate(years,0.9999).travellerYears));
});
test('reject invalid time or impossible speeds', () => {
  for (const years of [0,-1,10001,NaN,Infinity]) assert.throws(() => calculate(years,0.5),RangeError);
  for (const beta of [-0.1,1,2,NaN,Infinity]) assert.throws(() => calculate(100,beta),RangeError);
});
