// —────────────────────────────────────────────────
//   CONFIG & STATE
// —────────────────────────────────────────────────
const ADOL_ENDPOINT = 'https://data.cdc.gov/resource/ee48-w5t6.json?$limit=100000';
const FLU_ENDPOINT  = 'https://data.cdc.gov/resource/vh55-3he6.json?$limit=100000';
const ADOL_VACCINES = [
  'HPV',
  'Tetanus',
  'Varicella',
  '≥1 Dose MenACWY',
  '≥2 Doses Hep A',
  '≥2 Doses MMR',
  '≥3 Doses HepB'
];
const SKIP_COLUMNS  = ['coverage_estimate', '_95_ci'];

let allData       = [];
let filteredData  = [];
let activeFilters = {};
let currentMode   = 'adolescent';   // 'adolescent' | 'influenza' | 'about'
let currentVaccine = ADOL_VACCINES[0];


// —────────────────────────────────────────────────
//   FETCH FUNCTIONS
// —────────────────────────────────────────────────
async function fetchAdol(vaccine) {
  const url = `${ADOL_ENDPOINT}&vaccine=${encodeURIComponent(vaccine)}`;
  const res = await fetch(url);
  return res.json();
}

async function fetchFlu() {
  const res = await fetch(FLU_ENDPOINT);
  return res.json();
}


// —────────────────────────────────────────────────
//   UTILS: UNIQUE VALUE MAP (EXCLUDING SKIPPED)
// —────────────────────────────────────────────────
function computeUniqueMap(data) {
  const map = {};
  if (!data.length) return map;
  Object.keys(data[0]).forEach(key => {
    if (key === 'vaccine' || SKIP_COLUMNS.includes(key)) return;
    const vals = Array.from(new Set(data.map(d => d[key]))).filter(Boolean).sort();
    map[key] = vals;
  });
  return map;
}


// —────────────────────────────────────────────────
//   RENDER FILTERS PANEL
// —────────────────────────────────────────────────
function renderFilters() {
  const container = document.getElementById('filters');
  container.innerHTML = '';

  // choose full or filtered
  const source = filteredData.length ? filteredData : allData;
  const uniqueMap = computeUniqueMap(source);

  // seed empty activeFilters with “all”
  Object.entries(uniqueMap).forEach(([key, vals]) => {
    if (!activeFilters[key]) activeFilters[key] = [...vals];
  });

  // build one group per column
  Object.entries(uniqueMap).forEach(([key, vals]) => {
    const group = document.createElement('div');
    group.className = 'filter-group';

    const h3 = document.createElement('h3');
    h3.textContent = key;
    group.appendChild(h3);

    vals.forEach(val => {
      const id = `chk_${key}_${val}`.replace(/\s+/g,'_');
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.id = id;
      cb.dataset.key = key;
      cb.value = val;
      cb.checked = activeFilters[key].includes(val);
      cb.addEventListener('change', onFilterChange);

      const label = document.createElement('label');
      label.htmlFor = id;
      label.textContent = val;

      group.appendChild(cb);
      group.appendChild(label);
    });

    container.appendChild(group);
  });
}

function onFilterChange(e) {
  const { key, value } = e.target.dataset;
  if (e.target.checked) {
    activeFilters[key].push(value);
  } else {
    activeFilters[key] = activeFilters[key].filter(v => v !== value);
  }
  applyFilters();
}

function applyFilters() {
  filteredData = allData.filter(row =>
    Object.entries(activeFilters).every(([k, arr]) => arr.includes(row[k]))
  );
  renderFilters();
  renderUniques();
}


// —────────────────────────────────────────────────
//   RENDER UNIQUE‐VALUES TABLE
// —────────────────────────────────────────────────
function renderUniques() {
  const container = document.getElementById('uniqueTable');
  container.innerHTML = '';

  // choose full or filtered
  const source = filteredData.length ? filteredData : allData;
  const uniqueMap = computeUniqueMap(source);

  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  ['Column', 'Unique Values'].forEach(txt => {
    const th = document.createElement('th');
    th.textContent = txt;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  Object.entries(uniqueMap).forEach(([col, vals]) => {
    const tr = document.createElement('tr');
    const tdCol = document.createElement('td');
    tdCol.textContent = col;
    const tdVals = document.createElement('td');
    tdVals.textContent = vals.join(', ');
    tr.appendChild(tdCol);
    tr.appendChild(tdVals);
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  container.appendChild(table);
}


// —────────────────────────────────────────────────
//   TAB SWITCHING & INITIALIZATION
// —────────────────────────────────────────────────
async function switchTab(mode, vaccine) {
  currentMode = mode;

  // show/hide About pane
  document.getElementById('aboutContent').hidden = (mode !== 'about');
  // show/hide filters + uniques
  document.getElementById('filters').style.display    = (mode === 'about' ? 'none' : '');
  document.getElementById('uniqueTable').style.display = (mode === 'about' ? 'none' : '');

  if (mode === 'about') {
    document.getElementById('subtitle').textContent = 'About the dashboard & data sources.';
    document.getElementById('pageTitle').textContent = '';
    return;
  }

  // update subtitles & titles
  document.getElementById('subtitle').textContent =
    mode === 'adolescent'
      ? 'Filter & explore adolescent vaccination dataset.'
      : 'Filter & explore influenza vaccination dataset.';
  document.getElementById('pageTitle').textContent =
    mode === 'adolescent'
      ? `${vaccine} Coverage`
      : 'Influenza Coverage';

  // fetch the right data
  if (mode === 'adolescent') {
    currentVaccine = vaccine;
    allData = await fetchAdol(vaccine);
  } else {
    allData = await fetchFlu();
  }

  // reset filters & table
  filteredData  = [];
  activeFilters = {};
  renderFilters();
  renderUniques();
}

function initTabs() {
  const tabs = document.querySelectorAll('#mainTabs .tab-button');
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      tabs.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const mode    = btn.dataset.mode;
      const vaccine = btn.dataset.vaccine;
      switchTab(mode, vaccine);
    });
  });

  // kick-off default
  switchTab('adolescent', currentVaccine);
}

document.addEventListener('DOMContentLoaded', initTabs);
