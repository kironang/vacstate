// script.js
// —───────────────────────────────────────────────
//   CONFIGURATION
// —───────────────────────────────────────────────
const VAX_CODES = ['HPV','TETANUS','VARICELLA','MENACWY','HEPA','MMR','HEPB'];
const VAX_LABEL = {
  HPV:       'HPV',
  TETANUS:   'Tetanus',
  VARICELLA: 'Varicella',
  MENACWY:   '≥1 Dose MenACWY',
  HEPA:      '≥2 Doses Hep A',
  MMR:       '≥2 Doses MMR',
  HEPB:      '≥3 Doses HepB'
};
const ENDPOINTS = {};
VAX_CODES.forEach(code => {
  ENDPOINTS[code] =
    `https://data.cdc.gov/resource/ee48-w5t6.csv?$limit=1000000000&$where=vaccine='${encodeURIComponent(VAX_LABEL[code])}'`;
});
ENDPOINTS.INFLUENZA =
  'https://data.cdc.gov/resource/vh55-3he6.csv?$limit=1000000000';

const SUBTITLES = {};
VAX_CODES.forEach(code => {
  SUBTITLES[code] = 'Filter & explore adolescent vaccination dataset.';
});
SUBTITLES.INFLUENZA = 'Filter & explore influenza vaccination dataset.';
SUBTITLES.ABOUT     = 'About the dashboard & data sources.';

// state holders
const originalData   = {};
const currentFilters = {};
const summaryDivs    = {};
const tableDivs      = {};

// helper: columns to omit
const SKIP_COLS = ['coverage_estimate','_95_ci'];


// —───────────────────────────────────────────────
//   TAB SWITCHING & INITIAL LOAD
// —───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const tabs = d3.selectAll('.tab-button');

  tabs.on('click', function() {
    const sel = d3.select(this).attr('data-tab');

    // 1) Highlight active button
    tabs.classed('active', false);
    d3.select(this).classed('active', true);

    // 2) Show correct pane
    d3.selectAll('.tab-content').classed('active', false);
    d3.select(`#tab${sel}`).classed('active', true);

    // 3) Update subtitle
    d3.select('#subtitle').text(SUBTITLES[sel]);

    // 4) If data‐tab (not ABOUT) and not yet fetched, init it
    if (sel !== 'ABOUT' && !originalData[sel]) {
      initTab(sel);
    }
  });

  // kick off the first vaccine tab
  const defaultTab = VAX_CODES[0];
  d3.select('#subtitle').text(SUBTITLES[defaultTab]);
  initTab(defaultTab);
});


// —───────────────────────────────────────────────
//   INITIALIZE A DATA TAB (vaccines or influenza)
// —───────────────────────────────────────────────
function initTab(sel) {
  const endpoint = ENDPOINTS[sel];
  d3.csv(endpoint).then(data => {
    originalData[sel] = data;

    // 1) Determine which columns to show
    const cols = data.length
      ? Object.keys(data[0]).filter(c => !SKIP_COLS.includes(c))
      : [];

    // 2) Initialize filters = “all values”
    currentFilters[sel] = {};
    cols.forEach(col => {
      currentFilters[sel][col] = new Set(
        data.map(d => d[col]).filter(v => v)
      );
    });

    const container = d3.select(`#tab${sel}`);

    // 3) Create summary & table‐holder cards
    summaryDivs[sel] = container.append('div')
      .attr('class','chart-card summary');
    tableDivs[sel]   = container.append('div')
      .attr('class','chart-card unique-table');

    // 4) Build the filter checkboxes
    buildFilterPanel(sel, cols);

    // 5) Render counts & unique‐values
    updateView(sel);
  });
}


// —───────────────────────────────────────────────
//   BUILD FILTER PANEL WITH DYNAMIC CHECKBOXES
// —───────────────────────────────────────────────
function buildFilterPanel(sel, cols) {
  const container = d3.select(`#tab${sel}`);

  // remove old panel if re-building
  container.select('.filters').remove();

  const panel = container.append('div')
    .attr('class','chart-card filters');

  cols.forEach(col => {
    const group = panel.append('div')
      .attr('class','filter-group');

    group.append('h3').text(col);

    const list = group.append('div')
      .attr('class','checkbox-list');

    // get sorted unique values
    const values = Array.from(
      new Set(originalData[sel].map(d => d[col]).filter(v => v))
    ).sort();

    values.forEach((val,i) => {
      const id = `chk_${sel}_${col.replace(/\s+/g,'_')}_${i}`;
      const item = list.append('div')
        .attr('class','checkbox-item');

      item.append('input')
        .attr('type','checkbox')
        .attr('id', id)
        .property('checked', true)
        .on('change', function() {
          if (this.checked) currentFilters[sel][col].add(val);
          else               currentFilters[sel][col].delete(val);
          updateView(sel);
        });

      item.append('label')
        .attr('for', id)
        .text(val);
    });
  });
}


// —───────────────────────────────────────────────
//   UPDATE SUMMARY & UNIQUE‐VALUES TABLE
// —───────────────────────────────────────────────
function updateView(sel) {
  const data = originalData[sel];
  const cols = Object.keys(currentFilters[sel]);

  // apply all active filters
  const filtered = data.filter(row =>
    cols.every(col => currentFilters[sel][col].has(row[col]))
  );

  // --- summary card ---
  const sumDiv = summaryDivs[sel];
  sumDiv.html('');
  sumDiv.append('p').text(`Rows: ${filtered.length}`);
  sumDiv.append('p').text(`Columns: ${cols.length}`);

  // --- unique‐values table ---
  const tblDiv = tableDivs[sel];
  tblDiv.html('');
  tblDiv.append('h2').text('Unique Values by Column');

  const table = tblDiv.append('table');
  const thead = table.append('thead');
  const tbody = table.append('tbody');

  thead.append('tr')
    .selectAll('th')
    .data(['Column','Unique Values'])
    .join('th')
    .text(d => d);

  const uniques = cols.map(col => ({
    col,
    values: Array.from(
      new Set(filtered.map(d => d[col]).filter(v => v))
    ).sort()
  }));

  const rows = tbody.selectAll('tr')
    .data(uniques)
    .join('tr');

  rows.append('td').text(d => d.col);
  rows.append('td').text(d => d.values.join(', '));
}
