import { getDateRange, prepareStackedData } from './preprocess';
import * as viz from './viz';
import { regionsMaps, regionIdsWanted, regionIdsWanteds } from './constants';
import { setMarkerFilters, populateDropdown, updateSelectedRegions, setDateFilters, removeRegion, addRegion } from './interaction';

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
  const { xScale, yScale, color } = viz.createScales(width, height);
  const stack = viz.createStack(regionIdsWanteds);
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

  viz.setScaleDomains(xScale, yScale, data, series);
  viz.drawChart(svg, series, xScale, yScale, color, height, width, regionsMaps);
  viz.drawMarkers(svg, xScale, yScale, height, width, data, markerStartYear, markerEndYear, markerStartMonth, markerEndMonth);
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
