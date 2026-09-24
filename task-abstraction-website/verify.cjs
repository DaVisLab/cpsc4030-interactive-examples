const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const rules = require('./task-rules.js');
const movies = require('./movies.json');
const matrix = movies.find(d => d.title === 'The Matrix');
const spirited = movies.find(d => d.title === 'Spirited Away');
assert.equal(movies.length, 200);
assert.equal(matrix.decade, '1990s');
assert.equal(matrix.title_initial, 'M');
assert.equal(rules.validate(1, { runtime: matrix.runtime_min }, matrix, movies), '');
assert.notEqual(rules.validate(1, { runtime: matrix.runtime_min }, null, movies), '');
assert.notEqual(rules.validate(1, { runtime: 1 }, matrix, movies), '');
assert.equal(rules.validate(2, { budget: '$' + spirited.budget_usd.toLocaleString('en-US'), revenue: spirited.revenue_usd }, null, movies), '');
assert.notEqual(rules.validate(2, { budget: 19, revenue: 275 }, null, movies), '');
assert.ok(Number.isNaN(rules.amount('nineteen million')));
const matches = movies.filter(rules.qualifies);
assert.equal(matches.length, 7);
for (const movie of matches) assert.equal(rules.validate(3, {}, movie, movies), '');
assert.notEqual(rules.validate(3, {}, null, movies), '');
assert.equal(rules.qualifies({ ...matches[0], runtime_min: 100 }), false);
assert.equal(rules.qualifies({ ...matches[0], audience_rating: 7 }), true);
assert.equal(rules.qualifies({ ...matches[0], audience_rating: 6.9 }), false);
assert.notEqual(rules.validate(4, { finding: '   ' }, null, movies), '');
assert.equal(rules.validate(4, { finding: 'I compared budget with revenue and found an unusual movie.' }, null, movies), '');
const sandbox = { setTimeout, clearTimeout, setInterval, clearInterval, performance };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'd3.min.js'), 'utf8'), sandbox);
const d3 = sandbox.d3;
const createDecadeLayout = require('./decade-layout.js');
const before = JSON.stringify(movies);
const layout = createDecadeLayout(d3, movies);
assert.equal(JSON.stringify(movies), before, 'Force layout must not mutate the dataset');
assert.equal(layout.nodes.length, 200);
for (const node of layout.nodes) {
  assert.ok(Number.isFinite(node.x) && Number.isFinite(node.y));
  assert.ok(Math.abs(node.x - node.cx) + layout.radius < layout.x.bandwidth() / 2, 'Point must stay in its letter column');
  assert.ok(Math.abs(node.y - node.cy) + layout.radius < layout.y.bandwidth() / 2, 'Point must stay in its decade row');
}
for (let i = 0; i < layout.nodes.length; i++) {
  for (let j = i + 1; j < layout.nodes.length; j++) {
    const a = layout.nodes[i], b = layout.nodes[j];
    assert.ok(Math.hypot(a.x - b.x, a.y - b.y) >= 2 * layout.radius, 'Movie dots must not overlap');
  }
}
assert.equal(layout.nodes.find(d => d.movie.title === 'The Matrix').letter, 'M');
for (const field of ['budget_usd', 'revenue_usd', 'runtime_min', 'audience_rating']) {
  const values = movies.map(d => d[field]);
  const linear = d3.scaleLinear().domain([0, d3.max(values)]).nice().range([78, 788]);
  assert.ok(values.every(v => Number.isFinite(linear(v))));
  if (field.endsWith('_usd')) {
    assert.ok(values.every(v => v > 0));
    const log = d3.scaleLog().domain(d3.extent(values)).nice().range([78, 788]);
    assert.ok(values.every(v => Number.isFinite(log(v))));
  }
}
for (const name of ['index.html', 'task-1.html', 'task-2.html', 'task-3.html', 'task-4.html', 'reflection.html']) {
  const html = fs.readFileSync(path.join(__dirname, name), 'utf8');
  for (const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
    if (!/^https?:/.test(match[1])) assert.ok(fs.existsSync(path.join(__dirname, match[1])), name + ': missing ' + match[1]);
  }
}
console.log('Passed: force-layout containment and non-overlap for 200 movies, source immutability, task validation, seven browse matches, D3 scales, and page dependencies.');
