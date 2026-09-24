// Shared layout, fresh-attempt lifecycle, and sequential navigation.
(() => {
  'use strict';
  const activeTask = Number(document.body.dataset.task || 0);
  const reflection = document.body.dataset.page === 'reflection';
  const home = !activeTask && !reflection;
  const taskTitles = MovieExerciseState.tasks.map(task => task.title);
  let session;
  try {
    const reloaded = performance.getEntriesByType('navigation')[0]?.type === 'reload';
    session = MovieExerciseState.createSession(sessionStorage, { reset: home || reloaded });
  } catch (error) {
    window.MovieExercise = { allowed: false };
    const host = document.querySelector('#app') || document.querySelector('main');
    host.innerHTML = '<main class="storage-error"><h1>Browser storage is unavailable</h1><p>Allow session storage for this site, then reload to start the exercise.</p></main>';
    return;
  }
  const order = session.attempt.order;
  const position = order.indexOf(activeTask);
  const taskLink = id => 'task-' + id + '.html';
  const frontierLink = () => session.finished() ? 'reflection.html' : taskLink(order[session.frontier()]);
  const allowed = home || (reflection ? session.finished() : session.canVisit(activeTask));
  window.MovieExercise = { ...session, allowed, refreshNavigation };
  if (!allowed) {
    document.querySelector('#app').innerHTML = '<p class="storage-error">Returning to the next unfinished task…</p>';
    location.replace(frontierLink());
    return;
  }
  function navMarkup() {
    const items = order.map((id, i) => {
      const contents = '<span class="step-symbol">' + String(i + 1).padStart(2, '0') + '</span><span>Task ' + (i + 1) + '<small>' + taskTitles[id - 1] + (session.complete(id) ? ' · Complete' : '') + '</small></span>';
      return session.canVisit(id)
        ? '<a class="nav-link" href="' + taskLink(id) + '"' + (activeTask === id ? ' aria-current="page"' : '') + '>' + contents + '</a>'
        : '<span class="nav-link locked" aria-disabled="true" title="Complete the preceding tasks first">' + contents + '</span>';
    }).join('');
    const last = session.finished() ? '<a class="nav-link" href="reflection.html"' + (reflection ? ' aria-current="page"' : '') + '>Reflection & score</a>' : '<span class="nav-link locked" aria-disabled="true">Reflection & score</span>';
    return '<p class="eyebrow">YOUR EXERCISE</p><nav aria-label="Exercise navigation"><a class="nav-link" href="index.html"' + (home ? ' aria-current="page"' : '') + '>Introduction / restart</a><div class="nav-divider"></div>' + items + '<div class="nav-divider"></div>' + last + '</nav>';
  }
  function refreshNavigation() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) sidebar.innerHTML = navMarkup();
    const next = document.querySelector('#next-task');
    if (next) {
      const done = session.complete(activeTask);
      const destination = position === 3 ? 'reflection.html' : taskLink(order[position + 1]);
      next.textContent = position === 3 ? 'View reflection & score →' : 'Next task →';
      if (done) {
        next.href = destination;
        next.removeAttribute('aria-disabled');
        next.removeAttribute('tabindex');
      } else {
        next.removeAttribute('href');
        next.setAttribute('aria-disabled', 'true');
        next.setAttribute('tabindex', '-1');
      }
      document.querySelector('#next-help').textContent = done ? 'Task completed. Continue when you’re ready.' : 'Submit your finding and search type to unlock the next page.';
    }
  }
  const header = '<a class="skip-link" href="#main">Skip to content</a><header class="site-header"><a class="brand" href="index.html">Movie Search Lab</a><span class="course-label">VISUALIZATION / TASK ABSTRACTION</span></header>';
  const footer = '<footer class="page-footer"><span>Movie Search Lab</span><span>Reloading starts a fresh attempt.</span></footer>';
  if (activeTask) {
    document.title = 'Task ' + (position + 1) + ' · Movie Search Lab';
    const reasons = activeTask === 4 ? '<label class="field">Explain your choice<textarea name="reason" rows="3" required maxlength="2000" placeholder="What did you know about the target and where to look?"></textarea></label>' : '';
    const radios = ['Lookup', 'Locate', 'Browse', 'Explore'].map(type => '<label class="search-choice"><input type="radio" name="search-type" value="' + type.toLowerCase() + '" required> ' + type + '</label>').join('');
    document.querySelector('#app').innerHTML = header + '<div class="layout"><aside class="sidebar"></aside><main id="main" tabindex="-1">' +
      '<p class="eyebrow accent">TASK ' + (position + 1) + ' OF 4</p><h1 class="task-title">' + taskTitles[activeTask - 1] + '</h1><p id="task-prompt" class="task-prompt"></p>' +
      '<div class="activity-stages"><span id="perform-stage" class="current">1. Perform the task</span><span id="classify-stage">2. Identify the search type</span></div>' +
      '<p id="load-status" role="status">Loading movies…</p><div id="task-workspace" hidden><section id="visualization" aria-label="Movie visualization"></section>' +
      '<p class="data-note">Real movies; some runtimes and one rating are simulated. Values reflect this teaching dataset.</p>' +
      '<section class="response-panel" aria-labelledby="answer-heading"><h2 id="answer-heading">Your finding</h2><form id="answer-form" autocomplete="off"></form><p id="answer-message" role="status"></p></section>' +
      '<section id="classification" class="response-panel" hidden aria-labelledby="classification-heading"><h2 id="classification-heading" tabindex="-1">What type of search was this?</h2>' +
      '<p>Think about what you knew about the target and its location <strong>before</strong> you started. Your first submitted choice counts toward your score.</p>' +
      '<form id="classification-form" autocomplete="off"><fieldset><legend>Choose one search type</legend><div class="choice-grid">' + radios + '</div></fieldset>' + reasons + '<button class="button primary" type="submit">Submit search type</button></form><div id="classification-feedback" class="feedback" role="status" hidden></div></section></div>' +
      '<div class="activity-navigation"><a class="button secondary" href="' + (position === 0 ? 'index.html' : taskLink(order[position - 1])) + '">← ' + (position === 0 ? 'Introduction / restart' : 'Previous task') + '</a><a id="next-task" class="button primary" role="link" aria-disabled="true" tabindex="-1"></a></div><p id="next-help" class="hint" role="status"></p>' + footer + '</main></div>';
  } else if (reflection) {
    document.querySelector('#app').innerHTML = header + '<div class="layout"><aside class="sidebar"></aside><main id="main" tabindex="-1"><p class="eyebrow accent">EXERCISE COMPLETE</p><h1 class="task-title">Reflection & score</h1><p class="task-prompt">Review your choices and the information you had before each search.</p><section id="score-summary" class="score-summary" aria-label="Overall score"></section><p class="hint">One point per correct first search-type answer.</p><section id="task-review" aria-label="Task explanations"></section><section class="reflection-prompts"><h2>Think it through</h2><ul><li>Which task was hardest to classify, and why?</li><li>How would its search type change if you knew more about the target or its location?</li><li>How could the same visualization support a different search goal?</li></ul></section><a class="button primary" href="index.html">Start a new attempt →</a>' + footer + '</main></div>';
  } else {
    document.querySelector('#start-exercise').href = taskLink(order[0]);
  }
  refreshNavigation();
  // Rebuild restored history documents from the live attempt instead of stale form state.
  window.addEventListener('pageshow', event => { if (event.persisted) location.replace(location.href); });
})();
