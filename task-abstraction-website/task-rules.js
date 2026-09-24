// Pure validation rules shared by the browser and the verification script.
(function (root) {
  'use strict';
  const rules = {
    amount(value) {
      const cleaned = String(value ?? '').trim().replace(/^\$/, '').replaceAll(',', '');
      return /^\d+(\.\d+)?$/.test(cleaned) ? Number(cleaned) : NaN;
    },
    qualifies(movie) {
      return Boolean(movie && movie.decade === '1980s' && movie.genre === 'Comedy' && movie.audience_rating >= 7 && movie.runtime_min < 100);
    },
    validate(task, values, selected, movies) {
      if (task === 1) {
        const target = movies.find(d => d.title === 'The Matrix');
        if (selected?.id !== target?.id || !target) return 'Select The Matrix in the plot first.';
        if (+values.runtime !== target.runtime_min) return 'Check the runtime in the selected movie’s details and try again.';
      }
      if (task === 2) {
        const target = movies.find(d => d.title === 'Spirited Away');
        if (!target || rules.amount(values.budget) !== target.budget_usd || rules.amount(values.revenue) !== target.revenue_usd) return 'Check both values for Spirited Away. Use full US dollar amounts, not amounts in millions.';
      }
      if (task === 3 && !rules.qualifies(selected)) return 'Choose a comedy from the 1980s with a rating of at least 7 and a runtime strictly under 100 minutes.';
      if (task === 4 && String(values.finding || '').trim().length < 20) return 'Add a little more detail: describe a movie or pattern and the evidence you observed.';
      return '';
    }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = rules;
  else root.MovieTaskRules = rules;
})(typeof globalThis === 'undefined' ? this : globalThis);
