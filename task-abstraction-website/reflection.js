(() => {
  'use strict';
  const exercise = window.MovieExercise;
  if (!exercise?.allowed || !exercise.finished()) return;
  const score = exercise.score(), percent = Math.round(score / 4 * 100);
  const summary = d3.select('#score-summary');
  const svg = summary.append('svg').attr('viewBox', '0 0 210 210').attr('class', 'score-ring')
    .attr('role', 'img').attr('aria-label', score + ' of 4 correct search-type answers, ' + percent + ' percent');
  const center = svg.append('g').attr('transform', 'translate(105,105)');
  const arc = d3.arc().innerRadius(77).outerRadius(92).startAngle(0);
  center.append('path').attr('d', arc({ endAngle: 2 * Math.PI })).attr('fill', '#ffdfc4');
  if (score) center.append('path').attr('d', arc({ endAngle: 2 * Math.PI * score / 4 })).attr('fill', '#522d80');
  center.append('text').attr('text-anchor', 'middle').attr('y', 6).attr('class', 'score-number').text(score + ' / 4');
  center.append('text').attr('text-anchor', 'middle').attr('y', 32).attr('class', 'score-percent').text(percent + '% correct');
  const copy = summary.append('div');
  copy.append('h2').text('Your search-type score');
  copy.append('p').text(score === 4 ? 'You distinguished all four search types.' : 'Use the explanations below to compare what was known about each target and its location.');
  copy.append('p').attr('class', 'muted').text('All four activities completed. The score reflects your first classification for each one.');
  const review = d3.select('#task-review');
  exercise.attempt.order.forEach((id, index) => {
    const task = MovieExerciseState.tasks.find(t => t.id === id);
    const state = exercise.getTask(id);
    const correct = state.firstChoice === task.category;
    const card = review.append('article').attr('class', 'review-card');
    const head = card.append('div').attr('class', 'review-heading');
    head.append('h2').text('Task ' + (index + 1) + ' · ' + task.title);
    head.append('span').attr('class', 'result-badge ' + (correct ? 'correct' : 'review')).text(correct ? 'Correct · 1 / 1' : 'Review · 0 / 1');
    card.append('p').attr('class', 'review-answer').text('Your choice: ' + state.firstChoice + ' · Expected: ' + task.category);
    const facts = card.append('dl').attr('class', 'review-facts');
    facts.append('dt').text('Target'); facts.append('dd').text(task.target);
    facts.append('dt').text('Location'); facts.append('dd').text(task.location);
    card.append('p').text(task.explanation);
    if (id === 4) {
      card.append('h3').text('Your discovery');
      card.append('p').attr('class', 'student-response').text(state.answer.finding);
      card.append('h3').text('Your reasoning');
      card.append('p').attr('class', 'student-response').text(state.reason);
    }
  });
})();
