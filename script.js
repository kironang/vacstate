// ————————————————— DATA ENDPOINTS —————————————————
const ENDPOINTS = {
  A: "https://data.cdc.gov/resource/ee48-w5t6.csv?$limit=1000000000",
  B: "https://data.cdc.gov/resource/vh55-3he6.csv?$limit=1000000000"
};

// ————————————————— DYNAMIC SUBTITLES —————————————————
const SUBTITLES = {
  A: "Filter & explore adolescent vaccination dataset.",
  B: "Filter & explore influenza vaccination dataset.",
  C: "About the dashboard & data sources."
};

// state holders
const originalData = {};
const currentFilters = {};
const summaryDivs    = {};
const tableDivs      = {};

document.addEventListener("DOMContentLoaded", () => {
  const tabs = d3.selectAll(".tab-button");

  // Tab click handler
  tabs.on("click", function() {
    const sel = d3.select(this).attr("data-tab");

    // 1) Active button
    tabs.classed("active", false);
    d3.select(this).classed("active", true);

    // 2) Show correct pane
    d3.selectAll(".tab-content").classed("active", false);
    d3.select(`#tab${sel}`).classed("active", true);

    // 3) Update subtitle
    d3.select("#subtitle").text(SUBTITLES[sel]);

    // 4) If data‐tab and not yet initialized, fetch & build UI
    if ((sel === "A" || sel === "B") && !originalData[sel]) {
      initTab(sel);
    }
  });

  // Initial load: Tab A
  d3.select("#subtitle").text(SUBTITLES.A);
  initTab("A");
});


/**
 * Fetches CSV, sets up filters, summary & unique‐table for a tab
 */
function initTab(sel) {
  d3.csv(ENDPOINTS[sel]).then(data => {
    originalData[sel] = data;
    const cols = Object.keys(data[0] || {});
    // initialize filter sets
    currentFilters[sel] = {};
    const uniqueMap = {};
    cols.forEach(col => {
      const values = Array.from(new Set(data.map(d => d[col]))).sort();
      uniqueMap[col] = values;
      currentFilters[sel][col] = new Set(values);
    });

    const container = d3.select(`#tab${sel}`);

    // 1) Build filter panel
    buildFilterPanel(sel, cols, uniqueMap, container);

    // 2) Create summary & table containers
    summaryDivs[sel] = container.append("div")
      .attr("class", "chart-card summary");

    tableDivs[sel] = container.append("div")
      .attr("class", "chart-card unique-table");

    // 3) Initial render
    updateView(sel);
  });
}

/**
 * Renders the filter checkboxes for each column
 */
function buildFilterPanel(sel, cols, uniqueMap, container) {
  const panel = container.append("div")
    .attr("class", "chart-card filter-panel");

  cols.forEach(col => {
    const colDiv = panel.append("div");
    colDiv.append("h3").text(col);

    const list = colDiv.append("div")
      .attr("class", "checkbox-list");

    uniqueMap[col].forEach((val, i) => {
      const checkboxId = `chk_${sel}_${col}_${i}`;

      const item = list.append("div")
        .attr("class", "checkbox-item");

      item.append("input")
        .attr("type", "checkbox")
        .attr("id", checkboxId)
        .property("checked", true)
        .on("change", function() {
          if (this.checked) {
            currentFilters[sel][col].add(val);
          } else {
            currentFilters[sel][col].delete(val);
          }
          updateView(sel);
        });

      item.append("label")
        .attr("for", checkboxId)
        .text(val);
    });
  });
}

/**
 * Applies filters, then updates the summary & the unique‐values table
 */
function updateView(sel) {
  const data     = originalData[sel];
  const filters  = currentFilters[sel];
  const cols     = Object.keys(filters);

  // 1) filter rows
  const filtered = data.filter(d =>
    cols.every(col => filters[col].has(d[col]))
  );

  // 2) update summary
  const sumDiv = summaryDivs[sel];
  sumDiv.html("");
  sumDiv.append("p").text(`Rows: ${filtered.length}`);
  sumDiv.append("p").text(`Columns: ${cols.length}`);

  // 3) update unique‐values table
  const tblDiv = tableDivs[sel];
  tblDiv.html("");
  tblDiv.append("h2").text("Unique Values by Column");

  const table = tblDiv.append("table");
  const thead = table.append("thead");
  const tbody = table.append("tbody");

  // header
  thead.append("tr")
    .selectAll("th")
    .data(["Column", "Unique Values"])
    .join("th")
      .text(d => d);

  // compute uniques on filtered data
  const uniques = cols.map(col => {
    return {
      col,
      values: Array.from(new Set(filtered.map(d => d[col]))).sort()
    };
  });

  // rows
  const rows = tbody.selectAll("tr")
    .data(uniques)
    .join("tr");

  rows.append("td").text(d => d.col);
  rows.append("td").text(d => d.values.join(", "));
}
