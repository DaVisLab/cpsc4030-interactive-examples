# Movie Search Lab

Plain HTML, CSS, and JavaScript. No build step or package installation is required.

## Preview

From this directory, run `python3 -m http.server 8080` and visit http://localhost:8080.
Use the local server for activities; browsers restrict loading movies.json when HTML is opened as a file.

## Structure

- index.html: concise introduction.
- task-1.html through task-4.html: separate activity pages.
- shared.js: page layout, attempt initialization, reload detection, and guarded sequential navigation.
- exercise-state.js: randomized attempt order, completion records, immutable first answers, and scoring.
- reflection.html and reflection.js: final score visualization and explanations in the student's task order.
- theme.css: light orange-and-purple theme using Clemson Orange and Regalia from https://www.clemson.edu/brand/web/color.html.
- tasks.js: D3 catalogs and scatterplots, interaction controls, answers, classification, and feedback.
- task-rules.js: pure task-answer validation.
- tasks.css: activity layout and visualization styles.
- d3.min.js: locally bundled D3 7.9.0, from https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js. The upstream copyright notice is retained.
- styles.css: responsive layout, typography, colors, and component styles.
- app.js: unused earlier prototype, retained for reference.
- movies.json: existing teaching dataset, preserved as provided.
- README.md: existing dataset provenance and instructor notes, preserved as provided.

The four tasks are implemented. Each reveals the classification form only after a valid finding is submitted. Tasks 1–3 check against the supplied dataset and ask students only to choose a search type. Task 4 records an open-ended observation and additionally requires a written explanation of the search-type choice. Written reasoning is not automatically graded. Feedback explains the intended search objective after classification.

## Interaction and storage

Opening the introduction or reloading any page creates a fresh randomized attempt and clears previous answers, selected movies, completions, and scores. Reload is detected using the navigation timing entry. If a reloaded task is no longer the first task, the student is redirected to the new first task. Reloading reflection also returns to the new first task. Ordinary page navigation preserves the attempt. History pages restored from the browser cache are rebuilt from current attempt state.

Navigation labels, page titles, and Previous/Next links follow the stored order. Sidebar links to future tasks and the Next link remain disabled until a valid finding and a search-type choice have been submitted. The open-ended task also requires reasoning. Direct URLs to locked tasks or reflection redirect to the next unfinished task. An incorrect classification still completes the activity, records zero points, and unlocks the next task; correctness is separate from completion. Submitted responses are frozen. The written explanation stays with “Something unexpected,” wherever it appears. The task IDs below refer to file identities, not displayed positions.

- Task 1: scatterplot with decade rows and title-initial columns. decade-layout.js uses D3 position and collision forces to settle points inside their category cells. Offsets have no data meaning. The alphabet remains readable through horizontal scrolling on narrow screens; title initials ignore leading The, A, and An.
- Task 2: budget/revenue scatterplot with title highlighting, point inspection, and selection.
- Task 3: runtime (horizontal) versus audience rating (vertical) scatterplot. Decade and genre dropdowns default to All decades and All genres. Reset filters restores both defaults. Filtering removes excluded points while axis domains stay fixed.
- Task 4: selectable axes, genre coloring, decade/genre filters, and title highlighting.
- Charts have optional logarithmic dollar axes, fixed domains across filters, keyboard-focusable points, and movie detail panels.
- Responses and selected movies are stored in sessionStorage only to carry the current attempt between pages. Reloading clears them. Nothing is sent to a server. Filter and axis choices are not persisted. Session storage must be available to complete the multi-page exercise; a clear message is shown if it is blocked.
- The final page shows a D3 score ring (0–4 and percent), each first choice alongside the expected search type, target/location knowledge, and explanations. The student's discovery and reasoning are shown for the open-ended activity. Written text does not contribute to the score.

The page uses Google Fonts with local sans-serif fallbacks. D3 and the movie dataset are local, so the activities do not need a CDN connection. The introduction contains no artwork.

## Verification

Run node verify.cjs and node verify-flow.cjs. These check task-answer validation, runtime/rating boundaries, the seven valid browse answers, force-layout geometry, D3 scales, local dependencies, reload resets, direct-link guards, Next links, reflection access, immutable submissions, and scores from 0 to 4. This is a classroom activity, not a secure assessment: source code and the answer dataset are accessible to students.
