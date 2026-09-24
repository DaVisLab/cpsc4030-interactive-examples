// Activity content stays separate from the router and future D3 renderers.
// No answer key is shown in the student-facing navigation or task prompts.
const activities = [
  { title: 'A movie’s runtime', prompt: 'The catalog is organized by decade and alphabetically by title. You know The Matrix is in the 1990s, under M. Go to that section and find its runtime.' },
  { title: 'Budget & revenue', prompt: 'Find Spirited Away in the budget-versus-revenue visualization. Report its production budget and worldwide box-office revenue.' },
  { title: 'A movie to watch', prompt: 'Within the 1980s comedy section, find a movie rated at least 7 out of 10 with a runtime under 100 minutes.' },
  { title: 'Something unexpected', prompt: 'Investigate the movie collection. Find an unexpected relationship or an unusual movie involving budget, revenue, runtime, or audience rating. Describe what you discover.' }
];

const welcome = document.querySelector('#welcome-view');
const activity = document.querySelector('#activity-view');
const main = document.querySelector('#main');

function renderRoute({ moveFocus = false } = {}) {
  const route = location.hash.slice(1) || 'welcome';
  const match = /^activity-([1-4])$/.exec(route);
  const currentPage = match ? route : 'welcome';
  welcome.hidden = Boolean(match);
  activity.hidden = !match;
  document.querySelectorAll('[data-page]').forEach(link => {
    if (link.dataset.page === currentPage) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  if (match) {
    const number = Number(match[1]);
    const task = activities[number - 1];
    document.querySelector('#activity-number').textContent = `TASK ${String(number).padStart(2, '0')} / 04`;
    document.querySelector('#activity-title').textContent = task.title;
    document.querySelector('#activity-prompt').textContent = task.prompt;
    const previous = document.querySelector('#previous-activity');
    previous.href = number === 1 ? '#welcome' : `#activity-${number - 1}`;
    previous.textContent = number === 1 ? '← Introduction' : '← Previous task';
    const next = document.querySelector('#next-activity');
    next.href = number === 4 ? '#welcome' : `#activity-${number + 1}`;
    next.textContent = number === 4 ? 'Back to introduction →' : 'Preview next task →';
    document.title = `Movie Search Lab · Task ${number}`;
  } else {
    document.title = 'Movie Search Lab · Introduction';
  }
  if (moveFocus) {
    main.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
}

window.addEventListener('hashchange', () => renderRoute({ moveFocus: true }));
renderRoute();
