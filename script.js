// -------------------------------
// Helper: Switch active tab
// -------------------------------
function switchTab(tabId) {
  // Remove “active” class from all tabs & contents
  d3.selectAll('.tab').classed('active', false);
  d3.selectAll('.tab-content').classed('active', false);

  // Add “active” class to the clicked tab and corresponding content
  d3.select(`.tab[data-tab="${tabId}"]`).classed('active', true);
  d3.select(`#tab${tabId}`).classed('active', true);

  // If tab A or B is clicked, (re)load its data
  if (tabId === 'A') {
    loadTabA();
  } else if (tabId === 'B') {
    loadTabB();
  }
  // Tab C is static, no data fetch necessary
}

// -------------------------------
// Tab A: “ee48-w5t6”
// - Limit to 30,000 rows
// - Compute all unique values per column
// -------------------------------
function loadTabA() {
  const container = d3.select('#tabA');
  container.html(''); // Clear previous content

  // Show a loading message
  container.append('p').text('Fetching Tab A data…');

  // Socrata API endpoint with $limit=30000
  const urlA = 'https://data.cdc.gov/resource/ee48-w5t6.json?$limit=30000';

  d3.json(urlA)
    .then(data => {
      container.html(''); // Clear loading message

      const rowCount = data.length;
      // If at least one row, grab all column keys
      const colKeys = rowCount > 0
        ? Object.keys(data[0])
        : [];
      const colCount = colKeys.length;

      // Display basic info
      container.append('p').text('Tab A (ee48-w5t6):');
      container.append('p').text(`Number of rows (up to 30,000): ${rowCount}`);
      container.append('p').text(`Number of columns: ${colCount}`);

      // If there are columns, compute & display unique values per column
      if (colCount > 0) {
        container.append('p').text('Unique values per column:');
        colKeys.forEach(key => {
          // Build a Set of unique values (skip undefined/null)
          const uniquesSet = new Set();
          data.forEach(row => {
            if (row[key] !== undefined && row[key] !== null) {
              uniquesSet.add(row[key]);
            }
          });
          const uniquesArr = Array.from(uniquesSet).sort();

          // Place each column + its unique values in a <p>
          container
            .append('p')
            .text(`${key}: ${uniquesArr.join(', ')}`);
        });
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

// -------------------------------
// Tab B: “vh55-3he6”
// - Simply request all fields (including population_sample_size) with $limit=300000
// - Compute all unique values per column
// -------------------------------
function loadTabB() {
  const container = d3.select('#tabB');
  container.html(''); // Clear previous content

  container.append('p').text('Fetching Tab B data…');

  // By default, “population_sample_size” is included in each record.
  // Just use $limit=300000 to retrieve up to 300k rows.
  const urlB = 'https://data.cdc.gov/resource/vh55-3he6.json?$limit=300000';

  d3.json(urlB)
    .then(data => {
      container.html(''); // Clear loading message

      const rowCount = data.length;
      const colKeys = rowCount > 0
        ? Object.keys(data[0])
        : [];
      const colCount = colKeys.length;

      // Display basic info
      container.append('p').text('Tab B (vh55-3he6):');
      container.append('p').text(`Number of rows (up to 300,000): ${rowCount}`);
      container.append('p').text(`Number of columns: ${colCount}`);

      // If there are columns, compute & display unique values per column
      if (colCount > 0) {
        container.append('p').text('Unique values per column:');
        colKeys.forEach(key => {
          const uniquesSet = new Set();
          data.forEach(row => {
            if (row[key] !== undefined && row[key] !== null) {
              uniquesSet.add(row[key]);
            }
          });
          const uniquesArr = Array.from(uniquesSet).sort();

          // Place each column + its unique values in a <p>
          container
            .append('p')
            .text(`${key}: ${uniquesArr.join(', ')}`);
        });
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

// -------------------------------
// Attach click listeners to tabs
// -------------------------------
d3.selectAll('.tab').on('click', function() {
  const tabId = d3.select(this).attr('data-tab');
  switchTab(tabId);
});

// -------------------------------
// On initial load, show Tab A
// -------------------------------
document.addEventListener('DOMContentLoaded', () => {
  loadTabA();
});
