/* D3 interfaces and the two-stage exercise. No server or build tools required. */
(() => {
  'use strict';
  if (!window.MovieExercise?.allowed) return;
  const exercise = window.MovieExercise;
  const task = Number(document.body.dataset.task);
  const $ = selector => document.querySelector(selector);
  const prompts = [
    'For some reason you are interested in identifying the runtime of The Matrix. You know The Matrix came out in 1999',
    'Find Spirited Away in the visualization and report its production budget and worldwide box-office revenue.',
    'Within the 1980s comedies, find a movie rated at least 7/10 with a runtime under 100 minutes. Use the decade and genre filters to focus on that part of the collection.',
    'Investigate the collection. Find an unexpected relationship or an unusual movie involving budget, revenue, runtime, or audience rating. Describe your finding with evidence.'
  ];
  const categories = ['lookup', 'locate', 'browse', 'explore'];
  const explanations = [
    'The target was known (The Matrix), and its location was known (1990s, under M). Retrieving its runtime is lookup.',
    'The target was known (Spirited Away), but its position in the visualization was unknown. Finding that position is locate, even when a title search helps you get there.',
    'The section was known (1980s comedy), but the particular movie was not. Searching within that section for a movie meeting the rating and runtime criteria is browse.',
    'Neither a specific movie or relationship nor its location was specified. Investigating the collection to discover a pattern or unusual point is explore.'
  ];
  const fields = { budget_usd: 'Budget (USD)', revenue_usd: 'Worldwide revenue (USD)', runtime_min: 'Runtime (minutes)', audience_rating: 'Audience rating (0–10)' };
  const dollars = value => '$' + Number(value).toLocaleString('en-US');
  let movies = [], selected = null, refreshSelection = () => {};
  let state = exercise.getTask(task);
  function save() {
    try {
      exercise.saveTask(task, state);
      exercise.refreshNavigation();
    } catch (_) {
      $('.page-footer span:last-child').textContent = 'Progress could not be saved. Keep this page open and allow session storage.';
    }
  }
  function invalidateAnswer() {
    if (state.submitted) return;
    state.accepted = false;
    state.compared = false;
    $('#classification').hidden = true;
    $('#classification-feedback').hidden = true;
    $('#perform-stage').classList.add('current');
    $('#classify-stage').classList.remove('current');
    $('#answer-message').textContent = '';
    save();
  }
  function selectMovie(movie) {
    if (state.submitted) { showDetails(movie); return; }
    if (selected?.id !== movie.id && (task === 1 || task === 3)) invalidateAnswer();
    selected = movie;
    state.selectedId = movie.id;
    save();
    showDetails(movie);
    refreshSelection();
    if ($('#selected-answer')) $('#selected-answer').textContent = 'Selected: ' + movie.title;
  }
  function showDetails(movie) {
    const panel = d3.select('#movie-details');
    panel.selectAll('*').remove();
    if (!movie) {
      panel.append('h3').text('Movie details');
      panel.append('p').text(task !== 1 ? 'Hover or focus a point to inspect it. Click or press Enter to keep its details selected.' : 'Select a movie to see its attributes.');
      return;
    }
    panel.append('h3').text(movie.title);
    const dl = panel.append('dl');
    const pairs = [['Release year', movie.release_year], ['Genre', movie.genre], ['Runtime', movie.runtime_min + ' min'], ['Audience rating', movie.audience_rating + ' / 10'], ['Budget', dollars(movie.budget_usd)], ['Worldwide revenue', dollars(movie.revenue_usd)]];
    pairs.forEach(([name, value]) => { dl.append('dt').text(name); dl.append('dd').text(value); });
    if (movie.synthetic_fields.length) panel.append('p').attr('class', 'synthetic-note').text('Simulated: ' + movie.synthetic_fields.map(field => fields[field] || field).join(', ') + '.');
  }
  function addSelect(parent, label, id, options, initial) {
    const field = parent.append('label').attr('class', 'field').text(label);
    const select = field.append('select').attr('id', id);
    select.selectAll('option').data(options).join('option').attr('value', d => Array.isArray(d) ? d[0] : d).text(d => Array.isArray(d) ? d[1] : d);
    select.property('value', initial);
    return select;
  }
  function addNumber(parent, label, id, initial, min, max, step = 1) {
    return parent.append('label').attr('class', 'field').text(label).append('input').attr('id', id).attr('type', 'number').attr('min', min).attr('max', max).attr('step', step).property('value', initial);
  }
  function movieButtons(parent, data, withAttributes) {
    const buttons = parent.append('div').attr('class', 'movie-list').selectAll('button').data(data, d => d.id).join('button')
      .attr('type', 'button').attr('class', 'movie-button').attr('data-movie-id', d => d.id)
      .attr('aria-pressed', d => String(selected?.id === d.id)).on('click', (_, d) => selectMovie(d));
    buttons.append('span').text(d => d.title);
    if (withAttributes) buttons.append('small').text(d => d.audience_rating + '/10 · ' + d.runtime_min + ' min');
  }
  function decadeScatterplot() {
    const root = d3.select('#visualization');
    const layout = createDecadeLayout(d3, movies);
    const { nodes, letters, decades, x, y, width, height, left, right, top, bottom, radius } = layout;
    root.append('p').attr('class', 'hint').text('Find the decade row and title letter. Hover or focus a dot for its title; click or press Enter to select. Leading “The”, “A”, and “An” are ignored, so The Matrix is under M. # groups titles starting with a number or symbol.');
    const scroll = root.append('div').attr('class', 'scatter-scroll').attr('tabindex', 0).attr('role', 'region').attr('aria-label', 'Movie plot. Scroll horizontally on smaller screens to see all title letters.');
    const svg = scroll.append('svg').attr('class', 'scatter-svg decade-svg').attr('viewBox', '0 0 ' + width + ' ' + height)
      .attr('aria-label', 'Movies grouped by decade vertically and title initial horizontally');
    svg.append('title').text('Movies by decade and title initial');
    svg.append('desc').text('Each dot is one movie. Dots spread within their decade and letter cell to avoid overlap. Small offsets have no additional data meaning.');
    svg.append('g').selectAll('rect').data(decades).join('rect')
      .attr('x', left).attr('y', d => y(d)).attr('width', width - left - right).attr('height', y.bandwidth())
      .attr('fill', (_, i) => i % 2 ? '#fff0e2' : '#fffcf8');
    const cell = svg.append('rect').attr('class', 'lookup-cell').attr('width', x.bandwidth()).attr('height', y.bandwidth()).attr('visibility', 'hidden');
    svg.append('g').attr('class', 'lookup-grid').selectAll('line').data(letters).join('line')
      .attr('x1', d => x(d)).attr('x2', d => x(d)).attr('y1', top).attr('y2', bottom);
    svg.append('g').attr('class', 'lookup-grid').selectAll('line').data(decades).join('line')
      .attr('x1', left).attr('x2', width - right).attr('y1', d => y(d)).attr('y2', d => y(d));
    svg.append('g').attr('transform', 'translate(0,' + top + ')').call(d3.axisTop(x).tickSize(0).tickPadding(12));
    svg.append('g').attr('transform', 'translate(0,' + bottom + ')').call(d3.axisBottom(x).tickSize(0).tickPadding(12));
    svg.append('g').attr('transform', 'translate(' + (left - 10) + ',0)').call(d3.axisLeft(y).tickSize(0).tickPadding(0)).select('.domain').remove();
    svg.append('text').attr('x', left).attr('y', 17).attr('class', 'lookup-axis-title').text('TITLE INITIAL →');
    svg.append('text').attr('x', (left + width - right) / 2).attr('y', height - 10).attr('text-anchor', 'middle').text('First letter of the title (ignoring The, A, An)');
    const tooltip = root.append('div').attr('class', 'lookup-tooltip').attr('role', 'tooltip').attr('id', 'lookup-tooltip').attr('hidden', '');
    function highlightCell(movie) {
      const node = nodes.find(d => d.movie.id === movie?.id);
      cell.attr('visibility', node ? 'visible' : 'hidden');
      if (node) cell.attr('x', x(node.letter)).attr('y', y(movie.decade));
    }
    function inspect(event, node) {
      tooltip.text(node.movie.title + ' · ' + node.movie.decade + ' · ' + node.letter).attr('hidden', null);
      const rect = event.currentTarget.getBoundingClientRect();
      const px = event.clientX || rect.left + rect.width / 2, py = event.clientY || rect.top;
      tooltip.style('left', Math.max(8, Math.min(px + 12, window.innerWidth - tooltip.node().offsetWidth - 8)) + 'px')
        .style('top', Math.max(8, Math.min(py + 16, window.innerHeight - tooltip.node().offsetHeight - 8)) + 'px');
      highlightCell(node.movie);
    }
    function stopInspect() { tooltip.attr('hidden', ''); highlightCell(selected); }
    const points = svg.append('g').selectAll('circle').data(nodes, d => d.movie.id).join('circle')
      .attr('class', 'point').attr('cx', d => d.x).attr('cy', d => d.y).attr('r', radius).attr('fill', '#522d80')
      .attr('tabindex', 0).attr('role', 'button').attr('data-movie-id', d => d.movie.id)
      .attr('aria-label', d => d.movie.title + ', ' + d.movie.decade + ', title initial ' + d.letter)
      .on('pointerenter pointermove focus', inspect).on('pointerleave blur', stopInspect)
      .on('click', (_, d) => { selectMovie(d.movie); stopInspect(); })
      .on('keydown', (event, d) => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectMovie(d.movie); stopInspect(); }
        if (event.key === 'Escape') stopInspect();
      });
    points.append('title').text(d => d.movie.title);
    scroll.on('scroll', stopInspect);
    root.append('p').attr('class', 'plot-caption').text(movies.length + ' movies · One dot per movie · Small offsets separate overlapping movies; they do not encode another attribute.');
    root.append('aside').attr('id', 'movie-details').attr('class', 'movie-details scatter-details').attr('aria-live', 'polite');
    refreshSelection = () => {
      points.classed('selected', d => d.movie.id === selected?.id).attr('aria-pressed', d => String(d.movie.id === selected?.id));
      highlightCell(selected);
    };
    refreshSelection(); showDetails(selected);
  }
  function catalog() {
    const root = d3.select('#visualization');
    let decade, genre, rating, runtime;
    if (task === 3) {
      const toolbar = root.append('div').attr('class', 'toolbar');
      decade = addSelect(toolbar, 'Decade', 'decade-filter', [['all', 'All decades'], ...Array.from(new Set(movies.map(d => d.decade))).sort()], '1980s');
      genre = addSelect(toolbar, 'Genre', 'genre-filter', [['all', 'All genres'], ...Array.from(new Set(movies.map(d => d.genre))).sort()], 'Comedy');
      rating = addNumber(toolbar, 'Minimum rating', 'rating-filter', '', 0, 10, .1);
      runtime = addNumber(toolbar, 'Runtime under (min)', 'runtime-filter', '', 1, 500);
      toolbar.append('button').attr('type', 'button').attr('class', 'reset-link').text('Reset filters').on('click', () => {
        decade.property('value', '1980s'); genre.property('value', 'Comedy'); rating.property('value', ''); runtime.property('value', ''); draw();
      });
    } else {
      root.append('p').attr('class', 'hint').text('Open a decade, then a letter. Titles are sorted without leading “The”, “A”, or “An”.');
    }
    root.append('p').attr('id', 'catalog-count').attr('class', 'count').attr('role', 'status');
    const layout = root.append('div').attr('class', 'catalog-layout');
    const list = layout.append('div').attr('class', 'catalog').attr('aria-label', 'Movie catalog');
    layout.append('aside').attr('id', 'movie-details').attr('class', 'movie-details').attr('aria-live', 'polite');
    refreshSelection = () => list.selectAll('.movie-button').attr('aria-pressed', d => String(selected?.id === d.id));
    function draw() {
      list.selectAll('*').remove();
      let data = movies;
      if (task === 3) {
        data = movies.filter(d => (decade.property('value') === 'all' || d.decade === decade.property('value')) &&
          (genre.property('value') === 'all' || d.genre === genre.property('value')) &&
          (rating.property('value') === '' || d.audience_rating >= +rating.property('value')) &&
          (runtime.property('value') === '' || d.runtime_min < +runtime.property('value')));
      }
      $('#catalog-count').textContent = data.length + ' movies shown';
      if (!data.length) list.append('p').attr('class', 'empty-state').text('No movies match these filters. Try changing a filter.');
      const groups = d3.groups(data, d => d.decade).sort((a, b) => d3.ascending(a[0], b[0]));
      groups.forEach(([label, items]) => {
        if (task === 1) {
          const decadeGroup = list.append('details');
          decadeGroup.append('summary').text(label + ' · ' + items.length + ' movies');
          d3.groups(items, d => d.title_initial).sort((a, b) => d3.ascending(a[0], b[0])).forEach(([letter, titles]) => {
            const letterGroup = decadeGroup.append('details').attr('class', 'letter-group');
            letterGroup.append('summary').text(letter);
            movieButtons(letterGroup, titles, false);
            if (titles.some(d => d.id === selected?.id)) { decadeGroup.attr('open', ''); letterGroup.attr('open', ''); }
          });
        } else {
          d3.groups(items, d => d.genre).sort((a, b) => d3.ascending(a[0], b[0])).forEach(([category, titles]) => {
            list.append('h3').attr('class', 'catalog-section-title').text(label + ' · ' + category);
            movieButtons(list, titles, true);
          });
        }
      });
    }
    if (task === 3) [decade, genre, rating, runtime].forEach(control => control.on('input', draw));
    draw(); showDetails(selected);
  }
  function scatterplot() {
    const root = d3.select('#visualization');
    const genres = Array.from(new Set(movies.map(d => d.genre))).sort();
    const colors = d3.scaleOrdinal(genres, d3.schemeTableau10.concat(['#855c75', '#7b8741', '#505e91', '#8c613c']));
    const toolbar = root.append('div').attr('class', 'toolbar');
    let xSelect, ySelect, genreSelect, decadeSelect;
    if (task === 3) {
      decadeSelect = addSelect(toolbar, 'Decade', 'decade-filter', [['all', 'All decades'], ...Array.from(new Set(movies.map(d => d.decade))).sort()], 'all');
      genreSelect = addSelect(toolbar, 'Genre', 'genre-filter', [['all', 'All genres'], ...genres], 'all');
      toolbar.append('button').attr('type', 'button').attr('class', 'reset-link').text('Reset filters').on('click', () => {
        decadeSelect.property('value', 'all'); genreSelect.property('value', 'all'); draw();
      });
    }
    if (task === 4) {
      xSelect = addSelect(toolbar, 'Horizontal axis', 'x-axis', Object.entries(fields), 'budget_usd');
      ySelect = addSelect(toolbar, 'Vertical axis', 'y-axis', Object.entries(fields), 'revenue_usd');
      genreSelect = addSelect(toolbar, 'Genre', 'genre-filter', [['all', 'All genres'], ...genres], 'all');
      decadeSelect = addSelect(toolbar, 'Decade', 'decade-filter', [['all', 'All decades'], ...Array.from(new Set(movies.map(d => d.decade))).sort()], 'all');
    }
    const search = task === 3 ? null : toolbar.append('label').attr('class', 'field').text('Highlight a movie by title').append('input')
      .attr('type', 'search').attr('id', 'title-search').attr('placeholder', 'Type a title…').attr('autocomplete', 'off');
    const log = task === 3 ? null : root.append('label').attr('class', 'check-field').append('input').attr('type', 'checkbox').attr('id', 'log-scale');
    if (log) log.node().parentNode.append(' Use logarithmic scales for dollar amounts');
    root.append('p').attr('class', 'hint').text(task === 3
      ? 'Each point is a movie. Choose a decade and genre to narrow the view, or select All to show every category. Hover or focus for details; click or press Enter to choose a movie.'
      : 'Each point is a movie. Hover or focus for details; click or press Enter to select. Use the title search to highlight matching points.');
    const svg = root.append('div').attr('class', 'scatter-scroll').append('svg').attr('class', 'scatter-svg')
      .attr('viewBox', '0 0 820 450').attr('aria-label', 'Interactive movie scatterplot');
    svg.append('title').text('Movie attributes: each point represents one movie');
    const plot = svg.append('g');
    const caption = root.append('p').attr('class', 'plot-caption').attr('role', 'status');
    const legend = root.append('div').attr('class', 'legend').attr('aria-label', 'Genre colors');
    root.append('aside').attr('id', 'movie-details').attr('class', 'movie-details scatter-details');
    let circles, visible = [], hovered = null;
    const normalize = value => value.toLowerCase().trim();
    function highlight() {
      const query = search ? normalize(search.property('value')) : '';
      circles.classed('dimmed', d => Boolean(query) && !normalize(d.title).includes(query))
        .classed('selected', d => d.id === selected?.id)
        .attr('r', d => d.id === selected?.id || (query && normalize(d.title).includes(query)) ? 8 : 5)
        .attr('tabindex', d => query && !normalize(d.title).includes(query) ? -1 : 0);
      circles.filter(d => d.id === selected?.id || (query && normalize(d.title).includes(query))).raise();
      const matches = visible.filter(d => normalize(d.title).includes(query));
      caption.text(visible.length + ' of ' + movies.length + ' movies shown' + (query ? ' · ' + matches.length + ' title matches' : '') + (log?.property('checked') ? ' · Dollar axes: logarithmic' : ' · Axes: linear'));
      if (query && matches.length === 1) showDetails(matches[0]);
      else showDetails(selected && visible.some(d => d.id === selected.id) ? selected : null);
    }
    refreshSelection = highlight;
    function draw() {
      const xField = task === 3 ? 'runtime_min' : task === 4 ? xSelect.property('value') : 'budget_usd';
      const yField = task === 3 ? 'audience_rating' : task === 4 ? ySelect.property('value') : 'revenue_usd';
      visible = movies.filter(d => (task !== 3 && task !== 4) || ((genreSelect.property('value') === 'all' || d.genre === genreSelect.property('value')) && (decadeSelect.property('value') === 'all' || d.decade === decadeSelect.property('value'))));
      if (task === 3 && !state.submitted && selected && !visible.some(d => d.id === selected.id)) {
        selected = null; state.selectedId = null; invalidateAnswer();
        if ($('#selected-answer')) $('#selected-answer').textContent = 'Select a qualifying movie in the plot.';
      }
      plot.selectAll('*').remove();
      const left = 78, right = 788, top = 25, bottom = 388;
      function scale(field, range) {
        const values = movies.map(d => d[field]); // Fixed domains keep filtered views comparable.
        if (log?.property('checked') && field.endsWith('_usd')) return d3.scaleLog().domain([d3.min(values), d3.max(values)]).nice().range(range);
        return d3.scaleLinear().domain([0, field === 'audience_rating' ? 10 : d3.max(values)]).nice().range(range);
      }
      const x = scale(xField, [left, right]), y = scale(yField, [bottom, top]);
      const format = field => field.endsWith('_usd') ? d3.format('~s') : d3.format('~g');
      plot.append('g').attr('transform', 'translate(0,' + bottom + ')').call(d3.axisBottom(x).ticks(6, '~s').tickFormat(format(xField)));
      plot.append('g').attr('transform', 'translate(' + left + ',0)').call(d3.axisLeft(y).ticks(6, '~s').tickFormat(format(yField)).tickSize(-(right - left)));
      plot.append('text').attr('x', (left + right) / 2).attr('y', 434).attr('text-anchor', 'middle').text(fields[xField]);
      plot.append('text').attr('transform', 'translate(18,207) rotate(-90)').attr('text-anchor', 'middle').text(fields[yField]);
      circles = plot.append('g').selectAll('circle').data(visible, d => d.id).join('circle').attr('class', 'point')
        .attr('cx', d => x(d[xField])).attr('cy', d => y(d[yField])).attr('fill', d => task === 4 ? colors(d.genre) : '#522d80')
        .attr('role', 'button').attr('aria-label', d => d.title + ', ' + fields[xField] + ': ' + d[xField] + ', ' + fields[yField] + ': ' + d[yField])
        .on('pointerenter focus', (_, d) => { hovered = d; showDetails(d); })
        .on('pointerleave blur', () => { hovered = null; showDetails(selected); })
        .on('click', (_, d) => selectMovie(d)).on('keydown', (event, d) => {
          if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectMovie(d); }
        });
      circles.append('title').text(d => d.title);
      if (!visible.length) plot.append('text').attr('x', 420).attr('y', 200).attr('text-anchor', 'middle').text('No movies match these filters.');
      legend.selectAll('*').remove();
      if (task === 4) {
        const items = legend.selectAll('span').data(genres.filter(g => visible.some(d => d.genre === g))).join('span').attr('class', 'legend-item');
        items.append('i').attr('class', 'legend-dot').style('background', d => colors(d));
        items.append('span').text(d => d);
      }
      highlight();
    }
    if (search) search.on('input', highlight);
    if (log) log.on('change', draw);
    if (task === 3) [genreSelect, decadeSelect].forEach(control => control.on('change', draw));
    if (task === 4) [xSelect, ySelect, genreSelect, decadeSelect].forEach(control => control.on('change', draw));
    draw();
  }
  function revealClassification(focus = false) {
    $('#classification').hidden = false;
    $('#perform-stage').classList.remove('current');
    $('#classify-stage').classList.add('current');
    if (focus) $('#classification-heading').focus();
  }
  function feedback() {
    const box = $('#classification-feedback');
    box.replaceChildren();
    const heading = document.createElement('strong');
    heading.textContent = state.choice === categories[task - 1] ? 'Your classification matches: ' + categories[task - 1] + '.' : 'This task is best classified as ' + categories[task - 1] + '.';
    const explanation = document.createElement('p'); explanation.textContent = explanations[task - 1];
    box.append(heading, explanation);
    if (task === 4) {
      const note = document.createElement('p'); note.textContent = 'Compare this explanation with your reasoning. Your written explanation is for reflection and is not automatically graded.';
      box.append(note);
    }
    box.hidden = false;
  }
  function answerForm() {
    const form = $('#answer-form');
    let html = '';
    if (task === 1) html = '<p id="selected-answer" class="selection-status">Select a movie in the plot.</p><label class="field">Runtime (minutes)<input name="runtime" type="number" min="1" max="500" step="1" required></label>';
    if (task === 2) html = '<p class="hint">Enter the full dollar amounts shown in the movie details. Commas and a dollar sign are optional.</p><div class="answer-fields"><label class="field">Production budget (USD)<input name="budget" inputmode="decimal" required placeholder="e.g. 25,000,000"></label><label class="field">Worldwide revenue (USD)<input name="revenue" inputmode="decimal" required placeholder="e.g. 125,000,000"></label></div>';
    if (task === 3) html = '<p id="selected-answer" class="selection-status">Select a qualifying movie in the plot.</p>';
    if (task === 4) html = '<label class="field">Describe your finding and the evidence<textarea name="finding" rows="4" maxlength="3000" required placeholder="Name a movie or pattern, identify the attributes, and cite values or comparisons that support your observation."></textarea></label><p class="hint">There is no single correct discovery. Consider whether simulated values may affect the pattern.</p>';
    form.innerHTML = html + '<button class="button primary" type="submit">' + (state.accepted ? 'Update finding' : 'Submit finding') + ' →</button>';
    Object.entries(state.answer).forEach(([key, value]) => { if (form.elements.namedItem(key)) form.elements.namedItem(key).value = value; });
    if (selected && $('#selected-answer')) $('#selected-answer').textContent = 'Selected: ' + selected.title;
    form.addEventListener('input', () => { if (state.submitted) return; state.answer = Object.fromEntries(new FormData(form)); invalidateAnswer(); });
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (state.submitted) return;
      if (!form.reportValidity()) return;
      const values = Object.fromEntries(new FormData(form));
      const error = MovieTaskRules.validate(task, values, selected, movies);
      const message = $('#answer-message');
      message.classList.toggle('error-message', Boolean(error));
      if (error) { message.textContent = error; return; }
      state.answer = values; state.accepted = true; save();
      message.textContent = task === 4 ? 'Finding recorded. Now classify the task you were given.' : 'Your finding matches the dataset. Now classify the task.';
      revealClassification(true);
    });
    const classify = $('#classification-form');
    if (categories.includes(state.choice)) classify.elements.namedItem('search-type').value = state.choice;
    const reason = classify.elements.namedItem('reason');
    if (reason) reason.value = state.reason;
    classify.addEventListener('input', () => {
      if (state.submitted) return;
      const values = new FormData(classify);
      state.choice = values.get('search-type') || ''; state.reason = values.get('reason') || '';
      state.compared = false; $('#classification-feedback').hidden = true; save();
    });
    classify.addEventListener('submit', event => {
      event.preventDefault();
      if (state.submitted) return;
      if (!state.accepted || !classify.reportValidity()) return;
      const values = new FormData(classify);
      state.choice = values.get('search-type') || '';
      state.reason = values.get('reason') || '';
      if (task === 4 && !state.reason.trim()) { reason.focus(); return; }
      state.compared = true; state.submitted = true; state.firstChoice = state.choice;
      save(); feedback(); lockSubmittedForms();
    });
    function lockSubmittedForms() {
      if (!state.submitted) return;
      [form, classify].forEach(section => section.querySelectorAll('input, textarea, select, button').forEach(control => { control.disabled = true; }));
      $('#answer-message').textContent = 'Task completed. Your first search-type answer has been recorded.';
      exercise.refreshNavigation();
    }
    if (state.accepted) {
      revealClassification();
      $('#answer-message').textContent = 'Your finding was saved in this browser tab.';
      if (state.compared) feedback();
    }
    lockSubmittedForms();
  }
  async function start() {
    $('#task-prompt').textContent = prompts[task - 1];
    try {
      if (typeof d3 === 'undefined') throw new Error('D3 did not load.');
      movies = await d3.json('movies.json');
      if (!Array.isArray(movies) || !movies.length) throw new Error('The movie dataset is empty.');
      movies.sort((a, b) => d3.ascending(a.sort_title, b.sort_title));
      selected = movies.find(d => d.id === state.selectedId) || null;
      if (task === 1) decadeScatterplot();
      else scatterplot();
      answerForm();
      $('#load-status').hidden = true; $('#task-workspace').hidden = false;
    } catch (error) {
      $('#load-status').textContent = 'Unable to load this activity. Open the site through the local web server and check that movies.json and d3.min.js are available, then reload.';
      $('#load-status').classList.add('error-message');
      console.error(error);
    }
  }
  start();
})();
