// CDC Socrata endpoints
const ENDPOINTS = {
  A: "https://data.cdc.gov/resource/ee48-w5t6.csv?$limit=50000",
  B: "https://data.cdc.gov/resource/vh55-3he6.csv?$limit=50000"
};

document.addEventListener("DOMContentLoaded", () => {
  // Tab click behavior
  const tabs = d3.selectAll(".tab-button");
  tabs.on("click", function(event) {
    const sel = d3.select(this).attr("data-tab");

    // update button active state
    tabs.classed("active", d => false);
    d3.select(this).classed("active", true);

    // show/hide content
    d3.selectAll(".tab-content").classed("active", false);
    d3.select(`#tab${sel}`).classed("active", true);

    // lazy‐load charts
    if (sel === "A" && !d3.select("#tabA svg").node()) drawChartA();
    if (sel === "B" && !d3.select("#tabB svg").node()) drawChartB();
  });

  // draw default tab
  drawChartA();
});


function drawChartA() {
  const container = d3.select("#tabA")
    .append("div")
      .attr("class","chart-card");

  const svg = container.append("svg")
      .attr("width","100%")
      .attr("height",400);

  const margin = { top:20, right:30, bottom:40, left:60 };
  const width  = container.node().clientWidth - margin.left - margin.right;
  const height = +svg.attr("height") - margin.top - margin.bottom;

  const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

  d3.csv(ENDPOINTS.A).then(data => {
    // parse & aggregate
    const parseVal = d => +d.coverage_percent_estimate;
    const byState = Array.from(
      d3.group(data, d => d.locationabbr),
      ([st, recs]) => ({
        state: st,
        value: d3.max(recs, parseVal)
      })
    ).sort((a,b) => b.value - a.value);

    // scales
    const x = d3.scaleLinear()
      .domain([0, d3.max(byState, d=>d.value)]).nice()
      .range([0, width]);

    const y = d3.scaleBand()
      .domain(byState.map(d=>d.state))
      .range([0, height])
      .padding(0.1);

    // bars
    g.selectAll("rect")
      .data(byState)
      .join("rect")
        .attr("x", 0)
        .attr("y", d => y(d.state))
        .attr("width", d => x(d.value))
        .attr("height", y.bandwidth())
        .attr("fill", "#070353");

    // axes
    g.append("g").call(d3.axisLeft(y));
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d => d + "%"));

    // labels
    g.append("text")
      .attr("x", width/2)
      .attr("y", height + margin.bottom - 5)
      .attr("text-anchor","middle")
      .text("Coverage (%)");

    g.append("text")
      .attr("x", -margin.left)
      .attr("y", -10)
      .attr("font-size","1.2rem")
      .attr("font-weight","600")
      .text("Adolescent Vaccination Coverage by State");
  });
}


function drawChartB() {
  const container = d3.select("#tabB")
    .append("div")
      .attr("class","chart-card");

  const svg = container.append("svg")
      .attr("width","100%")
      .attr("height",400);

  const margin = { top:20, right:30, bottom:40, left:60 };
  const width  = container.node().clientWidth - margin.left - margin.right;
  const height = +svg.attr("height") - margin.top - margin.bottom;

  const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

  d3.csv(ENDPOINTS.B).then(data => {
    // parse & roll up by season
    const parseVal = d => +d.coverage;
    const bySeason = Array.from(
      d3.rollup(data, v => d3.mean(v, parseVal), d => d.season),
      ([season, val]) => ({ season, value: val })
    ).sort((a,b) => a.season.localeCompare(b.season));

    // scales
    const x = d3.scalePoint()
      .domain(bySeason.map(d=>d.season))
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(bySeason, d=>d.value)]).nice()
      .range([height, 0]);

    // line
    g.append("path")
      .datum(bySeason)
      .attr("fill","none")
      .attr("stroke","#070353")
      .attr("stroke-width",2)
      .attr("d", d3.line()
        .x(d => x(d.season))
        .y(d => y(d.value))
      );

    // axes
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
        .attr("font-size","0.9rem")
        .attr("transform","rotate(-40)")
        .attr("text-anchor","end");

    g.append("g")
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => d + "%"));

    // labels
    g.append("text")
      .attr("x", width/2)
      .attr("y", height + margin.bottom - 5)
      .attr("text-anchor","middle")
      .text("Season");

    g.append("text")
      .attr("x", -margin.left)
      .attr("y", -10)
      .attr("font-size","1.2rem")
      .attr("font-weight","600")
      .text("Influenza Vaccination Coverage Trend");
  });
}
