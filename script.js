// Helper: switch active tab
function switchTab(tabId) {
  // Deactivate all tabs and contents
  d3.selectAll('.tab').classed('active', false);
  d3.selectAll('.tab-content').classed('active', false);

  // Activate selected tab and content
  d3.select(`.tab[data-tab="${tabId}"]`).classed('active', true);
  d3.select(`#tab${tabId}`).classed('active', true);

  // Load data for A or B when clicked
  if (tabId === 'A') {
    loadTabA();
  } else if (tabId === 'B') {
    loadTabB();
  }
  // Tab C is static
}

// Tab A: load ee48-w5t6.json with $limit=30000, count rows & columns, then list column titles
function loadTabA() {
  const container = d3.select('#tabA');
  container.html(''); // clear previous content
  container.append('p').text('Fetching Tab A data…');

  const urlA = 'https://data.cdc.gov/resource/ee48-w5t6.json?$limit=30000';

  d3.json(urlA)
    .then(data => {
      container.html(''); // clear loading message

      const rowCount = data.length;
      let colKeys = [];
      if (rowCount > 0) {
        colKeys = Object.keys(data[0]);
      }
      const colCount = colKeys.length;

      container.append('p').text('Tab A (ee48-w5t6):');
      container.append('p').text(`Number of rows (up to 30,000): ${rowCount}`);
      container.append('p').text(`Number of columns: ${colCount}`);

      if (colCount > 0) {
        container.append('p').text('Column titles:');
        // Show comma-separated list in one <p>
        container.append('p').text(colKeys.join(', '));
      }
    })
    .catch(error => {
      container.html('');
      container.append('p')
        .style('color', 'red')
        .text('Error loading Tab A data.');
      console.error(error);
    });
}

// Tab B: load vh55-3he6.json with $limit=300000, count rows & columns, then list column titles
function loadTabB() {
  const container = d3.select('#tabB');
  container.html(''); // clear previous content
  container.append('p').text('Fetching Tab B data…');

  const urlB = 'https://data.cdc.gov/resource/vh55-3he6.json?$limit=300000';

  d3.json(urlB)
    .then(data => {
      container.html(''); // clear loading message

      const rowCount = data.length;
      let colKeys = [];
      if (rowCount > 0) {
        colKeys = Object.keys(data[0]);
      }
      const colCount = colKeys.length;

      container.append('p').text('Tab B (vh55-3he6):');
      container.append('p').text(`Number of rows (up to 300,000): ${rowCount}`);
      container.append('p').text(`Number of columns: ${colCount}`);

      if (colCount > 0) {
        container.append('p').text('Column titles:');
        container.append('p').text(colKeys.join(', '));
      }
    })
    .catch(error => {
      container.html('');
      container.append('p')
        .style('color', 'red')
        .text('Error loading Tab B data.');
      console.error(error);
    });
}

// Attach click listeners to tabs
d3.selectAll('.tab').on('click', function () {
  const tabId = d3.select(this).attr('data-tab');
  switchTab(tabId);
});

// Load Tab A by default on page load
document.addEventListener('DOMContentLoaded', () => {
  loadTabA();
});
