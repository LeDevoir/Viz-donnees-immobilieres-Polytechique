document.addEventListener("DOMContentLoaded", function () {
  const mapRef = document.getElementById("mapSvg");
  const legendRef = document.getElementById("legendSvg");
  const tooltipRef = document.getElementById("tooltip");

  let geojsonData = null;
  let csvData = [];
  let years = [];
  let selectedStartYear = null;
  let selectedEndYear = null;
  let selectedStartMonth = null;
  let selectedEndMonth = null;
  let monthsInStartYear = [];
  let monthsInEndYear = [];

  const regionNames = {
    1: "Bas-Saint-Laurent",
    2: "Saguenay-Lac-Saint-Jean",
    3: "Capitale-Nationale",
    4: "Mauricie",
    5: "Estrie",
    6: "Montréal",
    7: "Outaouais",
    8: "Abitibi-Témiscamingue",
    9: "Côte-Nord",
    10: "Nord du Québec (pas de données)",
    11: "Gaspésie-Îles-de-la-Madeleine",
    12: "Chaudière-Appalaches",
    13: "Laval",
    14: "Lanaudière",
    15: "Laurentides",
    16: "Montérégie",
    17: "Centre-du-Québec",
  };

  const categoryNames = {
    25: "Avis de vente impôt foncier",
    26: "Faillites",
    27: "Hypothèques construction",
    28: "Préavis d'exercice",
    29: "Saisies",
  };

  const monthNames = {
    1: "Janvier",
    2: "Février",
    3: "Mars",
    4: "Avril",
    5: "Mai",
    6: "Juin",
    7: "Juillet",
    8: "Août",
    9: "Septembre",
    10: "Octobre",
    11: "Novembre",
    12: "Décembre",
  };

  function loadData() {
    d3.json("quebec-with-regions.geojson")
      .then((data) => {
        geojsonData = data;
        drawMap();
      })
      .catch((error) => console.error("Error loading GeoJSON data: ", error));

    d3.csv("donn_diff_fin_reqst.csv")
      .then((data) => {
        const parsedData = data.reduce((acc, d) => {
          const year = +d.DT_DEBUT_MOIS.substring(0, 4);
          const month = +d.DT_DEBUT_MOIS.substring(5, 7);
          const region = +d.ID_REGN_ADMIN;
          const category = +d.CD_CATGR_NATR;
          const distressedPeople = +d.NB_REQST;

          const existingItem = acc.find(
            (item) =>
              item.year === year &&
              item.month === month &&
              item.region === region,
          );

          if (existingItem) {
            existingItem.distressedPeople += distressedPeople;
            const categoryItem = existingItem.categories.find(
              (c) => c.category === category,
            );
            if (categoryItem) {
              categoryItem.distressedPeople += distressedPeople;
            } else {
              existingItem.categories.push({
                category,
                distressedPeople,
              });
            }
          } else {
            acc.push({
              year,
              month,
              region,
              distressedPeople,
              categories: [{ category, distressedPeople }],
            });
          }

          return acc;
        }, []);

        csvData = parsedData;
        years = [...new Set(parsedData.map((d) => d.year))];
        selectedStartYear = years[0];
        selectedEndYear = years[years.length - 1];

        const uniqueMonths = [...new Set(parsedData.map((d) => d.month))];
        selectedStartMonth = uniqueMonths[0];
        selectedEndMonth = uniqueMonths[years.length - 1];

        updateControls();
        drawMap();
      })
      .catch((error) => console.error("Error loading CSV data: ", error));
  }

  function drawMap() {
    if (!geojsonData || csvData.length === 0) return;

    const mapContainerWidth = 550;
    const mapContainerHeight = 550;

    const projection = d3
      .geoMercator()
      .fitSize([mapContainerWidth, mapContainerHeight], geojsonData);
    const path = d3.geoPath().projection(projection);

    let totalDistressedPeople = 0;
    const categoryTotals = {};

    geojsonData.features.forEach((d) => {
      const regionId = d.properties.res_co_reg;
      const dataForRegion = csvData.filter(
        (data) =>
          data.region === regionId &&
          data.year >= selectedStartYear &&
          data.year <= selectedEndYear &&
          data.month >= selectedStartMonth &&
          data.month <= selectedEndMonth,
      );

      d.properties.totalDistressedPeople = dataForRegion.reduce(
        (sum, data) => sum + data.distressedPeople,
        0,
      );

      const aggregatedCategories = dataForRegion.reduce((acc, data) => {
        data.categories.forEach((c) => {
          if (!acc[c.category]) {
            acc[c.category] = 0;
          }
          acc[c.category] += c.distressedPeople;
        });
        return acc;
      }, {});

      d.properties.categories = Object.keys(aggregatedCategories).map(
        (key) => ({
          category: +key,
          distressedPeople: aggregatedCategories[key],
        }),
      );

      totalDistressedPeople += d.properties.totalDistressedPeople;

      d.properties.categories.forEach((c) => {
        if (!categoryTotals[c.category]) {
          categoryTotals[c.category] = 0;
        }
        categoryTotals[c.category] += c.distressedPeople;
      });
    });

    const maxDistressedPeople =
      d3.max(geojsonData.features, (d) => d.properties.totalDistressedPeople) ||
      0;
    const colorScale = d3
      .scaleSequential()
      .domain([0, maxDistressedPeople])
      .interpolator(d3.interpolateRgbBasis(["green", "yellow", "red"]));

    d3.select(mapRef).selectAll("*").remove();
    d3.select(legendRef).selectAll("*").remove();

    const svg = d3.select(mapRef);

    svg
      .attr("width", mapContainerWidth)
      .attr("height", mapContainerHeight)
      .attr("viewBox", `0 0 ${mapContainerWidth} ${mapContainerHeight}`);

    svg
      .selectAll("path")
      .data(geojsonData.features)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("fill", (d) => colorScale(d.properties.totalDistressedPeople))
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .on("mouseover", function (event, d) {
        const tooltipHtml = `<strong>${regionNames[d.properties.res_co_reg]}</strong><br>
                    Total: ${d.properties.totalDistressedPeople}<br>
                    ${d.properties.categories
                      .map(
                        (c) =>
                          `${categoryNames[c.category]}: ${c.distressedPeople}`,
                      )
                      .join("<br>")}`;

        tooltipRef.innerHTML = tooltipHtml;
        tooltipRef.style.visibility = "visible";
      })
      .on("mousemove", function (event) {
        tooltipRef.style.top = event.pageY - 75 + "px";
        tooltipRef.style.left = event.pageX - 115 + "px";
      })
      .on("mouseout", function () {
        tooltipRef.style.visibility = "hidden";
      });

    const legendContainerWidth = 800;
    const legendContainerHeight = 60;

    const legendSvg = d3
      .select(legendRef)
      .attr("width", legendContainerWidth)
      .attr("height", legendContainerHeight);

    legendSvg.selectAll("*").remove();

    const legendGradient = legendSvg
      .append("defs")
      .append("linearGradient")
      .attr("id", "legendGradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "0%");

    legendGradient
      .selectAll("stop")
      .data(
        colorScale.ticks().map((t, i, n) => ({
          offset: `${(100 * i) / n.length}%`,
          color: colorScale(t),
        })),
      )
      .enter()
      .append("stop")
      .attr("offset", (d) => d.offset)
      .attr("stop-color", (d) => d.color);

    legendSvg
      .append("rect")
      .attr("x", legendContainerWidth * 0.3)
      .attr("y", legendContainerHeight / 4)
      .attr("width", legendContainerWidth * 0.4)
      .attr("height", legendContainerHeight / 3)
      .style("fill", "url(#legendGradient)");

    const legendScale = d3
      .scaleLinear()
      .domain(colorScale.domain())
      .range([legendContainerWidth * 0.3, legendContainerWidth * 0.7]);

    const legendAxis = d3
      .axisBottom(legendScale)
      .ticks(5)
      .tickSize(-legendContainerHeight / 3);

    legendSvg
      .append("g")
      .attr("transform", `translate(0, ${legendContainerHeight / 2 + 5})`)
      .call(legendAxis)
      .select(".domain")
      .remove();

    legendSvg
      .append("text")
      .attr("x", legendContainerWidth / 2)
      .attr("y", legendContainerHeight - 1)
      .attr("text-anchor", "middle")
      .attr("class", "mb-2")
      .style("font-size", "12px")
      .text("Nombre total de détresse financière");

    legendSvg
      .append("text")
      .attr("x", legendContainerWidth / 3 - 50)
      .attr("y", legendContainerHeight / 2)
      .attr("text-anchor", "end")
      .style("font-size", "12px")
      .text("Faible");

    legendSvg
      .append("text")
      .attr("x", legendContainerWidth - (legendContainerWidth / 3 - 50))
      .attr("y", legendContainerHeight / 2)
      .attr("text-anchor", "start")
      .style("font-size", "12px")
      .text("Élevé");
  }

  function updateControls() {
    const startYearSelect = d3.select("#startYearSelect");
    startYearSelect
      .selectAll("option")
      .data(years)
      .enter()
      .append("option")
      .attr("value", (d) => d)
      .text((d) => d);

    startYearSelect.property("value", selectedStartYear);

    startYearSelect.on("change", function () {
      selectedStartYear = +this.value;
      monthsInStartYear = getMonthsForYear(selectedStartYear);
      updateMonths();
      drawMap();
    });

    const endYearSelect = d3.select("#endYearSelect");
    endYearSelect
      .selectAll("option")
      .data(years)
      .enter()
      .append("option")
      .attr("value", (d) => d)
      .text((d) => d);

    endYearSelect.property("value", selectedEndYear);

    endYearSelect.on("change", function () {
      selectedEndYear = +this.value;
      monthsInEndYear = getMonthsForYear(selectedEndYear);
      updateMonths();
      drawMap();
    });

    updateMonths();
  }

  function updateMonths() {
    // Filter months based on selected start and end years
    monthsInStartYear = getMonthsForYear(selectedStartYear);
    monthsInEndYear = getMonthsForYear(selectedEndYear);

    // Set default months if not already set
    if (
      !selectedStartMonth ||
      monthsInStartYear.indexOf(selectedStartMonth) === -1
    ) {
      selectedStartMonth = monthsInStartYear[0]; // Default to January if available
    }
    if (!selectedEndMonth || monthsInEndYear.indexOf(selectedEndMonth) === -1) {
      selectedEndMonth = monthsInEndYear[0]; // Default to January if available
    }

    // Update start month select dropdown
    const startMonthSelect = d3.select("#startMonthSelect");
    startMonthSelect
      .selectAll("option")
      .data(monthsInStartYear, (d) => d)
      .join("option")
      .attr("value", (d) => d)
      .text((d) => monthNames[d]);

    startMonthSelect.property("value", selectedStartMonth);

    startMonthSelect.on("change", function () {
      selectedStartMonth = +this.value;
      drawMap();
    });

    // Update end month select dropdown
    const endMonthSelect = d3.select("#endMonthSelect");
    endMonthSelect
      .selectAll("option")
      .data(monthsInEndYear, (d) => d)
      .join("option")
      .attr("value", (d) => d)
      .text((d) => monthNames[d]);

    endMonthSelect.property("value", selectedEndMonth);

    endMonthSelect.on("change", function () {
      selectedEndMonth = +this.value;
      drawMap();
    });

    // Trigger map redraw
    drawMap();
  }

  function getMonthsForYear(year) {
    const months = csvData.filter((d) => d.year === year).map((d) => d.month);
    return [...new Set(months)];
  }

  loadData();
});
