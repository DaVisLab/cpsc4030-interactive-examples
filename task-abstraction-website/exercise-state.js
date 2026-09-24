// Attempt state and task metadata. No student data is sent to a server.
(function (root) {
  'use strict';
  const key = 'movie-search-attempt-v2';
  const tasks = [
    { id: 1, title: 'A movie’s runtime', category: 'lookup', target: 'Known: The Matrix', location: 'Known: 1990s row, M column',
      explanation: 'You knew both the movie and its location in the display before starting. Going to that cell and retrieving the runtime is lookup.' },
    { id: 2, title: 'Budget & revenue', category: 'locate', target: 'Known: Spirited Away', location: 'Unknown: its position in the scatterplot',
      explanation: 'You knew which movie you wanted but did not know where it appeared in the visualization. Finding its point is locate, even when a title search helps.' },
    { id: 3, title: 'A movie to watch', category: 'browse', target: 'Unknown: a qualifying movie', location: 'Known subset: 1980s comedies',
      explanation: 'You knew which subset to inspect, but not which movie would meet the criteria. Searching within 1980s comedies for a rating of at least 7 and a runtime under 100 minutes is browse.' },
    { id: 4, title: 'Something unexpected', category: 'explore', target: 'Unknown: an interesting pattern or outlier', location: 'Unknown: anywhere in the collection',
      explanation: 'Neither a specific discovery nor a place to find it was specified. Investigating the collection to discover an unexpected relationship or unusual movie is explore.' }
  ];
  function validOrder(order) {
    return Array.isArray(order) && order.length === 4 && order.every(Number.isInteger) && order.slice().sort().join('') === '1234';
  }
  function shuffled(previous, random) {
    function permutations(items) {
      if (!items.length) return [[]];
      return items.flatMap((item, i) => permutations(items.filter((_, j) => i !== j)).map(rest => [item, ...rest]));
    }
    const choices = permutations([1, 2, 3, 4]).filter(order => !validOrder(previous) || order.join('') !== previous.join(''));
    return choices[Math.floor(random() * choices.length)];
  }
  function blank() { return { answer: {}, accepted: false, choice: '', firstChoice: '', reason: '', compared: false, submitted: false, selectedId: null }; }
  function createSession(storage, options = {}) {
    let attempt;
    try { attempt = JSON.parse(storage.getItem(key)); } catch (_) { /* Invalid or absent data is a fresh attempt. */ }
    const valid = attempt && attempt.version === 2 && validOrder(attempt.order) && attempt.answers && typeof attempt.answers === 'object';
    if (options.reset || !valid) {
      attempt = { version: 2, id: String(Date.now()) + '-' + Math.random().toString(36).slice(2), order: shuffled(valid ? attempt.order : null, options.random || Math.random), answers: {} };
    }
    // Remove selections left by earlier versions of the site as well.
    storage.removeItem('movie-search-order-v1');
    for (let id = 1; id <= 4; id++) storage.removeItem('movie-search-task-v1-' + id);
    function persist() { storage.setItem(key, JSON.stringify(attempt)); }
    persist(); // Fail visibly if storage cannot support navigation across documents.
    function complete(id) {
      const state = attempt.answers[id];
      return Boolean(state?.accepted && state.submitted && tasks.some(t => t.category === state.firstChoice) && (id !== 4 || String(state.reason || '').trim()));
    }
    function frontier() { const index = attempt.order.findIndex(id => !complete(id)); return index < 0 ? 4 : index; }
    return {
      attempt, complete, frontier,
      canVisit(id) { return attempt.order.includes(id) && attempt.order.indexOf(id) <= frontier(); },
      finished() { return frontier() === 4; },
      getTask(id) { return JSON.parse(JSON.stringify({ ...blank(), ...attempt.answers[id] })); },
      saveTask(id, state) {
        if (complete(id)) return;
        if (!this.canVisit(id)) throw new Error('Complete the current task first.');
        const copy = JSON.parse(JSON.stringify(state));
        if (copy.submitted) {
          if (!copy.accepted || !tasks.some(t => t.category === copy.choice) || (id === 4 && !String(copy.reason || '').trim())) throw new Error('Finish both steps before submitting.');
          copy.firstChoice = copy.choice;
        }
        attempt.answers[id] = copy;
        persist();
      },
      score() { return tasks.filter(t => complete(t.id) && attempt.answers[t.id].firstChoice === t.category).length; }
    };
  }
  const api = { tasks, createSession, validOrder };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MovieExerciseState = api;
})(typeof globalThis === 'undefined' ? this : globalThis);
