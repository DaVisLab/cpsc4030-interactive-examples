// Compute a settled force layout without mutating the source movie records.
(function (root) {
  function createDecadeLayout(d3, movies) {
    const width = 1050, left = 86, right = 22, top = 52, rowHeight = 88;
    const decades = Array.from(new Set(movies.map(d => d.decade))).sort();
    const initial = movie => /^[A-Z]$/.test(movie.title_initial) ? movie.title_initial : '#';
    const letters = (movies.some(d => initial(d) === '#') ? ['#'] : []).concat(Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ'));
    const bottom = top + rowHeight * decades.length, height = bottom + 62;
    const x = d3.scaleBand().domain(letters).range([left, width - right]);
    const y = d3.scaleBand().domain(decades).range([top, bottom]);
    const radius = 5.5, collisionRadius = 7;
    const nodes = movies.map(movie => {
      const letter = initial(movie), cx = x(letter) + x.bandwidth() / 2, cy = y(movie.decade) + y.bandwidth() / 2;
      return { movie, letter, cx, cy, x: cx, y: cy };
    });
    const simulation = d3.forceSimulation(nodes)
      .randomSource(d3.randomLcg(4030))
      .force('letter', d3.forceX(d => d.cx).strength(.22))
      .force('decade', d3.forceY(d => d.cy).strength(.06))
      .force('collision', d3.forceCollide(collisionRadius).strength(1).iterations(5))
      .stop();
    // Constrain points to their category cell: offsets never imply a new decade or letter.
    for (let tick = 0; tick < 360; tick++) {
      simulation.tick();
      for (const node of nodes) {
        const dx = x.bandwidth() / 2 - collisionRadius - 1;
        const dy = y.bandwidth() / 2 - collisionRadius - 1;
        const nx = Math.max(node.cx - dx, Math.min(node.cx + dx, node.x));
        const ny = Math.max(node.cy - dy, Math.min(node.cy + dy, node.y));
        if (nx !== node.x) node.vx = 0;
        if (ny !== node.y) node.vy = 0;
        node.x = nx; node.y = ny;
      }
    }
    return { nodes, letters, decades, x, y, width, height, left, right, top, bottom, radius };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = createDecadeLayout;
  else root.createDecadeLayout = createDecadeLayout;
})(typeof globalThis === 'undefined' ? this : globalThis);
