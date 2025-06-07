// ──────────────────────────────────────────────
//  Fetch + render one vaccine at a time from Socrata
// ──────────────────────────────────────────────
const ENDPOINT = 'https://data.cdc.gov/resource/ee48-w5t6.json?$limit=100000';
const VACCINES = [
  'HPV',
  'Tetanus',
  'Varicella',
  '≥1 Dose MenACWY',
  '≥2 Doses Hep A',
  '≥2 Doses MMR',
  '≥3 Doses HepB'
];

let currentVaccine = VACCINES[0];
let allData        = [];
let filteredData   = [];
let activeFilters  = {};

// 1) Fetch raw JSON for a vaccine
async function fetchData(vaccine) {
  const url = `${ENDPOINT}&vaccine=${encodeURIComponent(vaccine)}`;
  const res = await fetch(url);
  return await res.json();
}

// 2) Build a map of unique values for each field
function computeUniqueMap(data) {
  if (!data.length) return {};
  return Object.keys(data[0])
    .filter(k => k !== 'vaccine')
    .reduce((map, k) => {
      map[k] = Array.from(new Set(data.map(d => d[k]))).filter(Boolean).sort();
      return map;
    }, {});
}

// 3) Update the page title
function renderPageTitle() {
  document.getElementById('pageTitle').textContent =
    `${currentVaccine} Coverage`;
}

// 4) Render all checkbox filters (and wire up dynamic show/hide)
function renderFilters() {
  const container = document.getElementById('filters');
  container.innerHTML = '';

  // decide which dataset drives available values
  const source = filteredData.length ? filteredData : allData;
  const uniques = computeUniqueMap(source);

  Object.entries(uniques).forEach(([key, vals]) => {
    const group = document.createElement('div');
    group.className = 'filter-group';

    const title = document.createElement('h3');
    title.textContent = key;
    group.appendChild(title);

    vals.forEach(v => {
      const id = `chk_${key}_${v}`.replace(/\s+/g, '_');
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.id = id;
      cb.dataset.key = key;
      cb.value = v;
      cb.checked = activeFilters[key]?.includes(v) ?? true;
      cb.addEventListener('change', onFilterChange);

      const label = document.createElement('label');
      label.htmlFor = id;
      label.textContent = v;

      group.appendChild(cb);
      group.appendChild(label);
    });

    container.appendChild(group);
  });
}

// 5) Handle one checkbox toggle
function onFilterChange(e) {
  const { key, value } = e.target.dataset;

  // ensure an array exists
  if (!activeFilters[key]) {
    activeFilters[key] = computeUniqueMap(allData)[key].slice();
  }

  if (e.target.checked) {
    activeFilters[key].push(value);
  } else {
    activeFilters[key] = activeFilters[key].filter(x => x !== value);
  }

  // apply all activeFilters
  filteredData = allData.filter(row =>
    Object.entries(activeFilters).every(([k, allowed]) =>
      !allowed.length || allowed.includes(row[k])
    )
  );

  // re-render UI off the filtered set
  renderFilters();
  renderUniques();
}

// 6) Render the unique-values table
function renderUniques() {
  const container = document.getElementById('uniqueTable');
  container.innerHTML = '';

  const source = filteredData.length ? filteredData : allData;
  const uniques = computeUniqueMap(source);

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
  Object.entries(uniques).forEach(([col, vals]) => {
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

// 7) Load data + initialize filters & table
async function loadAndRender() {
  allData = await fetchData(currentVaccine);
  const uniques = computeUniqueMap(allData);

  // start with "all values" checked
  activeFilters = Object.fromEntries(
    Object.entries(uniques).map(([k, arr]) => [k, arr.slice()])
  );
  filteredData = [];

  renderPageTitle();
  renderFilters();
  renderUniques();
}

// 8) Wire up the main tabs & kick it off
document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('#mainTabs .tab-button');
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      tabs.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentVaccine = btn.dataset.vaccine;
      loadAndRender();
    });
  });

  // initial load
  currentVaccine =
    document.querySelector('#mainTabs .tab-button.active').dataset.vaccine;
  loadAndRender();
});
