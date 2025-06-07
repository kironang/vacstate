// ————————————————— DATA ENDPOINTS —————————————————
const ENDPOINTS = {
  A: "https://data.cdc.gov/resource/ee48-w5t6.csv?$limit=50000",
  B: "https://data.cdc.gov/resource/vh55-3he6.csv?$limit=50000"
};

// ————————————————— DYNAMIC SUBTITLES —————————————————
const SUBTITLES = {
  A: "Unique values for adolescent vaccination dataset.",
  B: "Unique values for influenza vaccination dataset.",
  C: "About the dashboard & data sources."
};

document.addEventListener("DOMContentLoaded", () => {
  const tabs = d3.selectAll(".tab-button");

  tabs.on("click", function() {
    const sel = d3.select(this).attr("data-tab");

    // 1) activate button
    tabs.classed("active", false);
    d3.select(this).classed("active", true);

    // 2) show correct pane
    d3.selectAll(".tab-content").classed("active", false);
    d3.select(`#tab${sel}`).classed("active", true);

    // 3) update subtitle
    d3.select("#subtitle").text(SUBTITLES[sel]);

    // 4) if A or B, load the unique-values table once
    if ((sel === "A" || sel === "B") &&
        !d3.select(`#tab${sel} .unique-table`).node()) {
      d3.csv(ENDPOINTS[sel]).then(data => {
        drawUniqueTable(data, d3.select(`#tab${sel}`));
      });
    }
  });

  // INITIAL LOAD (Tab A)
  d3.select("#subtitle").text(SUBTITLES.A);
  d3.csv(ENDPOINTS.A).then(data => {
    drawUniqueTable(data, d3.select("#tabA"));
  });
});


/**
 * Appends a “Unique Values by Column” card + table to containerSel
 */
function drawUniqueTable(data, containerSel) {
  if (!data.length) {
    containerSel.append("p").text("No data available.");
    return;
  }

  // compute uniques
  const cols = Object.keys(data[0]);
  const uniques = cols.map(col => {
    return {
      col,
      values: Array.from(new Set(data.map(d => d[col]))).sort()
    };
  });

  const card = containerSel
    .append("div")
      .attr("class", "chart-card unique-table");

  card.append("h2").text("Unique Values by Column");

  const table = card.append("table");
  const thead = table.append("thead");
  const tbody = table.append("tbody");

  // header
  thead.append("tr")
    .selectAll("th")
    .data(["Column", "Unique Values"])
    .join("th")
      .text(d => d);

  // rows
  const rows = tbody.selectAll("tr")
    .data(uniques)
    .join("tr");

  rows.append("td").text(d => d.col);
  rows.append("td").text(d => d.values.join(", "));
}
