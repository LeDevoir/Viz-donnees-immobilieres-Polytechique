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

const regionsMaps = {
  1: "01 - Bas-Saint-Laurent",
  2: "02 - Saguenay-Lac-Saint-Jean",
  3: "03 - Capitale-Nationale",
  4: "04 - Mauricie",
  5: "05 - Estrie",
  6: "06 - Montréal",
  7: "07 - Outaouais",
  8: "08 - Abitibi-Témiscamingue",
  9: "09 - Côte-Nord",
  10: "10 - Nord-du-Québec",
  11: "11 - Gaspésie-Îles-de-la-Madeleine",
  12: "12 - Chaudière-Appalaches",
  13: "13 - Laval",
  14: "14 - Lanaudière",
  15: "15 - Laurentides",
  16: "16 - Montérégie",
  17: "17 - Centre-du-Québec",
};

const colorMap = {
  "001": "#F5525B",
  "002": "#FAB578",
  "003": "#8EC1CF",
  "004": "#59A4D0",
  "005": "#EFCB09",
  "006": "#D0E009",
  "007": "#ADBE17",
  "008": "#01B850",
  "009": "#01A689",
  "010": "#02A3A3",
  "011": "#8888CF",
  "012": "#7AD2F7",
  "013": "#096EBE",
  "014": "#B266EB",
  "015": "#CB96C4",
  "016": "#810856",
  "017": "#E10064",
};

const regionIdsWanted = [
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
let markerStartYear, markerEndYear, markerStartMonth, markerEndMonth;

let rawData; // Declare rawData here to make it accessible

const graph = d3.select(".graph");
const svgContainer = graph.select(".stackedArea-svg");
const margin = { top: 40, right: 10, bottom: 100, left: 80 }; // Increase bottom margin to accommodate the markers
let width, height;

function setSizing() {
  width = 1000 - margin.left - margin.right;
  height = 600 - margin.top - margin.bottom;

  svgContainer.attr("width", 1000).attr("height", 600);

  const svg = svgContainer
    .selectAll("g")
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
      .text(
        "Désolé, aucune donnée disponible pour la période ou les régions sélectionnées.",
      );
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
      .text("Veuillez choisir un interval d'au moins un mois");
    return;
  }

  setScaleDomains(xScale, yScale, data, series);
  drawChart(svg, series, xScale, yScale, color, height, width, regionsMaps);

  drawMarkers(svg, xScale, yScale, height, data);
}

d3.csv(
  "https://www.donneesquebec.ca/recherche/dataset/statistiques-du-registre-foncier-du-quebec-sur-le-marche-immobilier/resource/739ac2bb-e549-4bcd-893d-768e37a03af6/download/donn_hypoth_reqst.csv",
  d3.autoType,
).then(function (data) {
  rawData = data; // Assign rawData

  const { minDate, maxDate } = getDateRange(rawData);
  startYear = minDate.getUTCFullYear();
  endYear = maxDate.getUTCFullYear();
  startMonth = minDate.getUTCMonth() + 1;
  endMonth = maxDate.getUTCMonth() + 1;

  markerStartYear = startYear;
  markerEndYear = endYear;
  markerStartMonth = startMonth;
  markerEndMonth = endMonth;

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

  setMarkerFilters(
    (
      newMarkerStartYear,
      newMarkerEndYear,
      newMarkerStartMonth,
      newMarkerEndMonth,
    ) => {
      markerStartYear = newMarkerStartYear;
      markerEndYear = newMarkerEndYear;
      markerStartMonth = newMarkerStartMonth;
      markerEndMonth = newMarkerEndMonth;
      const updatedData = prepareStackedData(
        rawData,
        regionIdsWanted,
        startYear,
        endYear,
        startMonth,
        endMonth,
      );
      build(updatedData); // Rebuild the graph with updated markers
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
