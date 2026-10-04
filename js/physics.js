/* Pure physics, shared by the browser and dependency-free Node tests. */
(function (root) {
  'use strict';
  const C_KM_S = 299792.458;
  function calculate(earthYears, beta) {
    if (!Number.isFinite(earthYears) || earthYears <= 0 || earthYears > 10000) {
      throw new RangeError('Earth time must be greater than zero and at most 10,000 years.');
    }
    if (!Number.isFinite(beta) || beta < 0 || beta >= 1) {
      throw new RangeError('Speed must be at least zero and strictly below light speed.');
    }
    const ratio = Math.sqrt((1 - beta) * (1 + beta));
    const gamma = 1 / ratio;
    const travellerYears = earthYears * ratio;
    return { earthYears, beta, gamma, travellerYears,
      difference: earthYears - travellerYears, velocity: beta * C_KM_S, ratio };
  }
  const api = { calculate, C_KM_S };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Relativity = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
