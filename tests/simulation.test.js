import test from 'node:test';
import assert from 'node:assert/strict';
import { act, advanceDay, createInitialState, distanceKm, forecast, validatePlan, validateSave } from '../src/game/systems/simulation.js';
import { MISSIONS } from '../src/game/data/airports.js';

test('a route can be planned, operated and completed without altering its input snapshot', () => {
  const original = createInitialState();
  let result = act(original, 'plan', { destination: 'CPH', aircraftId: 'VA101', frequency: 1, service: 'standard' });
  assert.equal(result.ok, true);
  assert.equal(original.routes.length, 1);
  assert.equal(result.state.cash, original.cash - 65000);
  for (let day = 0; day < 3; day += 1) result = advanceDay(result.state);
  assert.ok(result.state.completed.includes('cph'));
  assert.ok(result.state.passengers > 450);
  assert.equal(result.state.day, 4);
  assert.equal(result.report.rewards, 220000);
  assert.equal(result.report.profit, result.report.revenue - result.report.costs);
  assert.ok(result.state.fleet[0].health < 94);
});

test('range, aircraft exclusivity and invalid plans are enforced', () => {
  const state = createInitialState();
  state.completed = ['cph', 'fco', 'lhr', 'kef'];
  assert.match(validatePlan(state, { destination: 'JFK', aircraftId: 'VA101', frequency: 1, service: 'standard' }), /航程不足/);
  assert.match(validatePlan(state, { destination: 'CPH', aircraftId: 'VA102', frequency: 1, service: 'standard' }), /VIE/);
  assert.match(validatePlan(state, { destination: 'CPH', aircraftId: 'VA101', frequency: 99, service: 'standard' }), /無效/);
  assert.equal(distanceKm('WAW'), 0);
  assert.ok(distanceKm('CPH') > 650 && distanceKm('CPH') < 700);
});

test('maintenance grounds the aircraft for its entire scheduled day, then restores availability', () => {
  let state = act(createInitialState(), 'plan', { destination: 'CPH', aircraftId: 'VA101', frequency: 1, service: 'standard' }).state;
  state = act(state, 'maintain', { id: 'VA101', kind: 'line' }).state;
  assert.match(validatePlan(state, { destination: 'CPH', aircraftId: 'VA101', frequency: 1, service: 'standard' }), /保養/);
  let result = advanceDay(state);
  assert.equal(result.report.routes.find((route) => route.destination === 'CPH').cancelled, true);
  assert.equal(result.state.fleet[0].maintenance, 0);
  result = advanceDay(result.state);
  assert.equal(result.report.routes.find((route) => route.destination === 'CPH').cancelled, undefined);
  assert.ok(result.report.routes.find((route) => route.destination === 'CPH').pax > 0);
});

test('lease deposits, daily charges and insufficient-funds failures are consistent', () => {
  const state = createInitialState();
  const acquired = act(state, 'acquire', { type: 'e190', mode: 'lease' });
  assert.equal(acquired.state.cash, state.cash - 280000);
  assert.equal(acquired.state.fleet.at(-1).lease, 5100);
  const baseline = advanceDay(state);
  const leased = advanceDay(acquired.state);
  assert.equal(leased.report.costs - baseline.report.costs, 5950);
  const poor = { ...state, cash: 100 };
  const denied = act(poor, 'acquire', { type: 'e190', mode: 'purchase' });
  assert.equal(denied.ok, false);
  assert.equal(denied.state, poor);
});

test('forecast and execution use the same revenue and route cost model', () => {
  const planned = act(createInitialState(), 'plan', { destination: 'CPH', aircraftId: 'VA101', frequency: 1, service: 'business' }).state;
  const estimate = forecast(planned, 'CPH', 'VA101', 1, 'business');
  const actual = advanceDay(planned).report.routes.find((route) => route.destination === 'CPH');
  assert.equal(actual.pax, estimate.pax);
  assert.equal(actual.profit, estimate.profit);
});

test('the full six-contract campaign is reachable with upgrades and upkeep', () => {
  let state = createInitialState();
  for (const mission of MISSIONS) {
    for (const route of state.routes) route.active = false;
    state = act(state, 'accept', { id: mission.id }).state;
    let plane = state.fleet.find((item) => item.type === (mission.destination === 'JFK' ? 'b789' : 'a320'));
    if (!plane) {
      const result = act(state, 'acquire', { type: 'b789', mode: 'lease' });
      assert.equal(result.ok, true);
      state = result.state; plane = state.fleet.at(-1);
    }
    if (plane.health < 65) {
      state = act(state, 'maintain', { id: plane.id, kind: 'deep' }).state;
      state = advanceDay(advanceDay(state).state).state;
    }
    const result = act(state, 'plan', { destination: mission.destination, aircraftId: plane.id, frequency: 1, service: 'standard' });
    assert.equal(result.ok, true, result.message);
    state = result.state;
    // The first thin market needs a small jet for the required load factor.
    if (mission.destination === 'CPH') state = act(state, 'plan', { destination: 'CPH', aircraftId: 'VA101', frequency: 1, service: 'standard' }).state;
    for (let turn = 0; turn < 12 && !state.completed.includes(mission.id); turn += 1) state = advanceDay(state).state;
    assert.ok(state.completed.includes(mission.id), `Unreachable contract: ${mission.id}`);
  }
  assert.equal(state.completed.length, 6);
  assert.ok(state.cash > 0);
});

test('corrupt or incomplete saves are rejected', () => {
  assert.equal(validateSave(createInitialState()), true);
  assert.equal(validateSave({ version: 1 }), false);
  assert.equal(validateSave({ ...createInitialState(), cash: Infinity }), false);
  assert.equal(validateSave({ ...createInitialState(), messages: null }), false);
});
