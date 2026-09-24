const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { createSession, tasks } = require('./exercise-state.js');
const memory = new Map();
const storage = {
  getItem: key => memory.get(key) ?? null,
  setItem: (key, value) => memory.set(key, value),
  removeItem: key => memory.delete(key)
};
function finish(session, id, choice) {
  const state = session.getTask(id);
  Object.assign(state, { accepted: true, submitted: true, compared: true, choice, reason: id === 4 ? 'The discovery and its location were initially unknown.' : '', answer: { finding: 'An observation supported by values in the chart.' } });
  session.saveTask(id, state);
}
storage.setItem('movie-search-task-v1-1', 'old selection');
let session = createSession(storage, { reset: true, random: () => .5 });
assert.equal(storage.getItem('movie-search-task-v1-1'), null);
assert.equal(session.frontier(), 0);
assert.equal(session.score(), 0);
assert.ok(session.canVisit(session.attempt.order[0]));
assert.ok(!session.canVisit(session.attempt.order[1]));
assert.throws(() => session.saveTask(session.attempt.order[1], { accepted: true }), /current task/);
const initialOrder = session.attempt.order.join('');
for (const [index, id] of session.attempt.order.entries()) {
  const correct = tasks.find(task => task.id === id).category;
  const choice = index % 2 === 0 ? correct : tasks.find(task => task.category !== correct).category;
  // A valid finding alone must not unlock another page.
  session.saveTask(id, { ...session.getTask(id), accepted: true, choice });
  assert.equal(session.frontier(), index);
  if (id === 4) assert.throws(() => session.saveTask(id, { accepted: true, submitted: true, choice, reason: '  ' }), /both steps/);
  finish(session, id, choice);
  assert.equal(session.frontier(), index + 1);
  const first = session.getTask(id).firstChoice;
  finish(session, id, correct);
  assert.equal(session.getTask(id).firstChoice, first, 'Submitted answers must be immutable');
}
assert.ok(session.finished());
assert.equal(session.score(), 2);
const continued = createSession(storage);
assert.equal(continued.score(), 2, 'Normal page navigation must retain the score');
session = createSession(storage, { reset: true, random: () => .5 });
assert.notEqual(session.attempt.order.join(''), initialOrder);
assert.equal(session.score(), 0);
assert.equal(session.frontier(), 0);
assert.ok(Object.keys(session.attempt.answers).length === 0);
for (let expected = 0; expected <= 4; expected++) {
  const run = createSession(storage, { reset: true });
  run.attempt.order.forEach((id, index) => {
    const correct = tasks.find(task => task.id === id).category;
    finish(run, id, index < expected ? correct : tasks.find(task => task.category !== correct).category);
  });
  assert.equal(run.score(), expected);
}
function page({ task = 0, reflection = false, reload = false } = {}) {
  const elements = {};
  const makeElement = () => ({
    innerHTML: '', textContent: '', attributes: {},
    setAttribute(k, v) { this.attributes[k] = v; },
    removeAttribute(k) { delete this.attributes[k]; if (k === 'href') delete this.href; }
  });
  let redirect = '';
  const context = {
    sessionStorage: storage,
    document: { body: { dataset: { task: String(task), page: reflection ? 'reflection' : '' } },
      querySelector(selector) { return elements[selector] ||= makeElement(); } },
    window: { addEventListener() {} },
    performance: { getEntriesByType: () => [{ type: reload ? 'reload' : 'navigate' }] },
    location: { replace(url) { redirect = url; } }
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync('exercise-state.js', 'utf8'), context);
  vm.runInContext(fs.readFileSync('shared.js', 'utf8'), context);
  return { context, elements, redirect };
}
let home = page();
const order = home.context.window.MovieExercise.attempt.order;
assert.equal(home.elements['#start-exercise'].href, 'task-' + order[0] + '.html');
let blocked = page({ task: order[3] });
assert.equal(blocked.context.window.MovieExercise.allowed, false);
assert.equal(blocked.redirect, 'task-' + order[0] + '.html');
blocked = page({ reflection: true });
assert.equal(blocked.context.window.MovieExercise.allowed, false);
let current = page({ task: order[0] });
assert.equal(current.elements['#next-task'].attributes['aria-disabled'], 'true');
assert.equal(current.elements['#next-task'].href, undefined);
let flow = current.context.window.MovieExercise;
finish(flow, order[0], tasks.find(t => t.id === order[0]).category);
flow.refreshNavigation();
assert.equal(current.elements['#next-task'].href, 'task-' + order[1] + '.html');
current = page({ task: order[0], reload: true });
flow = current.context.window.MovieExercise;
if (flow.allowed) assert.equal(flow.frontier(), 0);
const fresh = createSession(storage);
assert.equal(fresh.score(), 0);
assert.deepEqual(fresh.attempt.answers, {});
for (const id of fresh.attempt.order) finish(fresh, id, tasks.find(t => t.id === id).category);
const last = page({ task: fresh.attempt.order[3] });
assert.equal(last.elements['#next-task'].href, 'reflection.html');
const reflection = page({ reflection: true });
assert.ok(reflection.context.window.MovieExercise.allowed);
assert.ok(reflection.elements['#app'].innerHTML.includes('score-summary'));
assert.equal(reflection.context.window.MovieExercise.score(), 4);
const resetReflection = page({ reflection: true, reload: true });
assert.equal(resetReflection.context.window.MovieExercise.allowed, false);
assert.equal(createSession(storage).score(), 0);
console.log('Passed: reload reset on task/reflection pages, shuffled attempt state, direct-link gates, disabled/enabled Next, reflection access, preserved navigation, immutable submissions, and scores 0–4.');
