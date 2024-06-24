const allRegions = [
  "001",
  "002",
  "003",
  "004",
  "005",
  "006",
  "007",
  "008",
  "009",
  "010",
  "011",
  "012",
  "013",
  "014",
  "015",
  "016",
  "017",
];

const regionsMap = {
  "001": "01 - Bas-Saint-Laurent",
  "002": "02 - Saguenay-Lac-Saint-Jean",
  "003": "03 - Capitale-Nationale",
  "004": "04 - Mauricie",
  "005": "05 - Estrie",
  "006": "06 - Montréal",
  "007": "07 - Outaouais",
  "008": "08 - Abitibi-Témiscamingue",
  "009": "09 - Côte-Nord",
  "010": "10 - Nord-du-Québec",
  "011": "11 - Gaspésie-Îles-de-la-Madeleine",
  "012": "12 - Chaudière-Appalaches",
  "013": "13 - Laval",
  "014": "14 - Lanaudière",
  "015": "15 - Laurentides",
  "016": "16 - Montérégie",
  "017": "17 - Centre-du-Québec",
};

const colorMap = {
  "001": "#F5525B",
  "002": "#FAB578",
  "003": "#8EC1CF",
  "004": "#59A4D0",
  "005": "#EFCB09",
  "006": "#D0E009",
  "007": "#C5D84A",
  "008": "#01B850",
  "009": "#01A689",
  "010": "#02A3A3",
  "011": "#8888CF",
  "012": "#7AD2F7",
  "013": "#096EBE",
  "014": "#B266EB",
  "015": "#CB96C4",
  "016": "#C40093",
  "017": "#E10064",
};

const regionIdsWanted = ["001", "002", "003"];

const regionIdsWanteds = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
  "13",
  "14",
  "15",
  "16",
  "17",
];

let startYear;
let endYear;
let startMonth;
let endMonth;
d3.csv("donn_hypoth_reqst.csv").then((rawData) => {
  const { minDate, maxDate } = getDateRange(rawData);
  startYear = minDate.getUTCFullYear();
  endYear = maxDate.getUTCFullYear();
  startMonth = minDate.getUTCMonth() + 1;
  endMonth = maxDate.getUTCMonth() + 1;

  const stackedData = prepareStackedData(
    rawData,
    regionIdsWanted,
    startYear,
    endYear,
    startMonth,
    endMonth,
  );
  build(stackedData);

  populateDropdown(regionIdsWanted, (regionId) => {
    addRegion(regionId, regionIdsWanted, removeRegionCallback);
    const updatedData = prepareStackedData(
      rawData,
      regionIdsWanted,
      startYear,
      endYear,
      startMonth,
      endMonth,
    );
    build(updatedData);
  });

  function removeRegionCallback(regionId) {
    removeRegion(regionId, regionIdsWanted, removeRegionCallback);
    const updatedData = prepareStackedData(
      rawData,
      regionIdsWanted,
      startYear,
      endYear,
      startMonth,
      endMonth,
    );
    build(updatedData);
  }
  updateSelectedRegions(regionIdsWanted, removeRegionCallback);

  setDateFilters(
    (newStartYear, newEndYear, newStartMonth, newEndMonth) => {
      startYear = newStartYear;
      endYear = newEndYear;
      startMonth = newStartMonth;
      endMonth = newEndMonth;
      const updatedData = prepareStackedData(
        rawData,
        regionIdsWanted,
        startYear,
        endYear,
        startMonth,
        endMonth,
      );
      build(updatedData);
    },
    minDate,
    maxDate,
  );

  window.addEventListener("resize", () => {
    const updatedData = prepareStackedData(
      rawData,
      regionIdsWanted,
      startYear,
      endYear,
      startMonth,
      endMonth,
    );
    build(updatedData);
  });
});

function setSizing() {
  const margin = { top: 20, right: 30, bottom: 80, left: 150 };
  const width = 1200 - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;
  const content = d3.select("#content");

  content.select("svg").remove();

  const svg = content
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  svg
    .selectAll("g")
    .append("svg")
    .data([0])
    .join("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  return { width, height, svg };
}

function build(data) {
  const { width, height, svg } = setSizing();
  const { xScale, yScale, color } = createScales(width, height);
  const stack = createStack(regionIdsWanteds);
  const series = stack(data);

  svg.selectAll("*").remove(); // Clear the SVG before drawing

  if (data.length === 0) {
    // Display a placeholder when there is no data
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height / 2)
      .attr("text-anchor", "middle")
      .attr("font-size", "16px")
      .attr("fill", "gray")
      .text("Sorry, no data available for the selected timeframe or regions");
    return;
  }

  if (data.length === 1) {
    // Display a placeholder when there is no data
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height / 2)
      .attr("text-anchor", "middle")
      .attr("font-size", "16px")
      .attr("fill", "gray")
      .text("Please select a time interval of at least one month.");
    return;
  }

  setScaleDomains(xScale, yScale, data, series);
  drawChart(
    svg,
    series,
    xScale,
    yScale,
    color,
    height,
    width,
    regionIdsWanteds,
  );
}
