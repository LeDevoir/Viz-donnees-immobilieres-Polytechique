let g;
let heigh;
let width;
let svg;
function setDateFilters(callback, minDate, maxDate) {
  const startYearSelect = document.getElementById("start-year");
  const endYearSelect = document.getElementById("end-year");
  const startMonthSelect = document.getElementById("start-month");
  const endMonthSelect = document.getElementById("end-month");

  // Clear previous options
  startYearSelect.innerHTML = "";
  endYearSelect.innerHTML = "";
  startMonthSelect.innerHTML = "";
  endMonthSelect.innerHTML = "";

  // Populate the year dropdowns with the range from minDate to maxDate
  for (
    let year = minDate.getUTCFullYear();
    year <= maxDate.getUTCFullYear();
    year++
  ) {
    const startOption = document.createElement("option");
    startOption.value = year;
    startOption.textContent = year;
    startYearSelect.appendChild(startOption);

    const endOption = document.createElement("option");
    endOption.value = year;
    endOption.textContent = year;
    endYearSelect.appendChild(endOption);
  }

  // Populate the month dropdowns with all months
  const months = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ];
  months.forEach((month, index) => {
    const startOption = document.createElement("option");
    startOption.value = index + 1; // Months are 1-12
    startOption.textContent = month;
    startMonthSelect.appendChild(startOption);

    const endOption = document.createElement("option");
    endOption.value = index + 1; // Months are 1-12
    endOption.textContent = month;
    endMonthSelect.appendChild(endOption);
  });

  // Function to update the available end months based on the selected end year
  function updateEndMonths() {
    const selectedEndYear = parseInt(endYearSelect.value, 10);
    const selectedEndMonth = parseInt(endMonthSelect.value, 10);
    const maxEndMonth =
      selectedEndYear === maxDate.getUTCFullYear()
        ? maxDate.getUTCMonth() + 1
        : 12;
    endMonthSelect.innerHTML = ""; // Clear previous options

    for (let i = 0; i < maxEndMonth; i++) {
      const option = document.createElement("option");
      option.value = i + 1;
      option.textContent = months[i];
      endMonthSelect.appendChild(option);
    }

    // Set the end month to the previously selected month if it's still valid, otherwise to the last available month
    if (selectedEndMonth <= maxEndMonth) {
      endMonthSelect.value = selectedEndMonth;
    } else {
      endMonthSelect.value = maxEndMonth;
    }
  }

  function updateFilters() {
    const startYear = parseInt(startYearSelect.value, 10);
    const endYear = parseInt(endYearSelect.value, 10);
    const startMonth = parseInt(startMonthSelect.value, 10);
    const endMonth = parseInt(endMonthSelect.value, 10);
    callback(startYear, endYear, startMonth, endMonth);
  }

  startYearSelect.addEventListener("change", updateFilters);
  endYearSelect.addEventListener("change", () => {
    updateEndMonths();
    updateFilters();
  });
  startMonthSelect.addEventListener("change", updateFilters);
  endMonthSelect.addEventListener("change", updateFilters);

  // Set default values
  startYearSelect.value = minDate.getUTCFullYear();
  endYearSelect.value = maxDate.getUTCFullYear();
  startMonthSelect.value = minDate.getUTCMonth() + 1;
  updateEndMonths();

  // Set the default end month to the last available month
  if (endYearSelect.value === maxDate.getUTCFullYear().toString()) {
    endMonthSelect.value = maxDate.getUTCMonth() + 1;
  }

  updateFilters();
}

function filterDataByDate(data, startYear, endYear, startMonth, endMonth) {
  return data.filter((d) => {
    const date = new Date(d.DT_DEBUT_MOIS);
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1; // Months are 0-11, so add 1 to make it 1-12

    return (
      (year > startYear || (year === startYear && month >= startMonth)) &&
      (year < endYear || (year === endYear && month <= endMonth))
    );
  });
}

function renderChart(data) {
  // Same chart rendering code as before
  if (data.length != 0) {
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

    const priceRanges = {
      1: "Moins de 250 000$",
      2: "Entre 250 000$ et 500 000$",
      3: "Plus de 500 000$",
    };

    const groupedData = d3.group(data, (d) => d.ID_REGN_ADMIN);

    const stackedData = Array.from(groupedData, ([key, values]) => ({
      region: regionNames[key],
      ...values.reduce((acc, cur) => {
        acc[cur.CD_PLAGE_PRIX] = (acc[cur.CD_PLAGE_PRIX] || 0) + cur.NB_REQST;
        return acc;
      }, {}),
    }));

    const possibleKeys = Array.from(
      new Set(data.map((d) => d.CD_PLAGE_PRIX.toString())),
    );

    let keys = Array.from(new Set(data.map((d) => d.CD_PLAGE_PRIX.toString())));

    const margin = { top: 20, right: 120, bottom: 100, left: 150 };
    width = 1200 - margin.left - margin.right;
    height = 550 - margin.top - margin.bottom;
    svg = d3
      .select("#content-ventes")
      .html("") // Clear previous SVG content
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Add x-axis label
    svg
      .append("text")
      .attr("class", "x-axis-label")
      .attr("text-anchor", "middle")
      .attr("x", width / 2)
      .attr("y", height + 80) // Adjust this value as needed
      .text("Nombre d'achats par gamme de prix");

    // Add y-axis label
    svg
      .append("text")
      .attr("class", "y-axis-label")
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -30) // Adjust this value as needed
      .text("Régions administratives du Québec");

    const y = d3
      .scaleBand()
      .domain(stackedData.map((d) => d.region))
      .range([0, height])
      .padding(0.1);

    let x = d3
      .scaleLinear()
      .domain([
        0,
        d3.max(stackedData, (d) => d3.sum(keys, (key) => d[+key])) || 0,
      ])
      .nice()
      .range([0, width]);

    const color = d3.scaleOrdinal().domain(keys).range(d3.schemeCategory10);

    const stack = d3
      .stack()
      .keys(keys)
      .order(d3.stackOrderNone)
      .offset(d3.stackOffsetNone);

    let layers = stack(stackedData);

    const bars = g
      .selectAll(".serie")
      .data(layers)
      .enter()
      .append("g")
      .attr("fill", (d) => color(d.key))
      .attr("class", (d) => `price-range price-range-${d.key}`)
      .selectAll("rect")
      .data((d) => d)
      .enter()
      .append("rect")
      .attr("y", (d) => y(d.data.region))
      .attr("x", (d) => x(d[0]))
      .attr("height", y.bandwidth() * 1.1)
      .attr("width", (d) => x(d[1]) - x(d[0]))
      .attr("class", "bar");

    g.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(10, "s"));

    g.append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(y).tickFormat((d) => d));

    // Add tooltip element
    const tooltip = d3
      .select("body")
      .append("div")
      .attr(
        "class",
        "absolute pointer-events-none p-2 rounded-lg bg-white border text-xs",
      )
      .style("visibility", "hidden");

    // Hover effect with tooltip
    bars
      .on("mouseover", function (event, d) {
        const hoveredRegion = d.data.region;
        d3.selectAll(".bar").filter((bar) => bar.data.region === hoveredRegion);

        const tooltipData = keys.map((key) => ({
          range: priceRanges[key],
          value: d.data[key] || 0,
        }));

        tooltip.style("visibility", "visible");
        tooltip
          .html(
            `
            <strong>${hoveredRegion}</strong><br>
            ${tooltipData.map((item) => `${item.range}: ${item.value}`).join("<br>")}
          `,
          )
          .style("left", event.pageX + 15 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mousemove", function (event) {
        tooltip
          .style("left", event.pageX + 15 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", function () {
        tooltip.style("visibility", "hidden");
      });

    // Legend
    const legend = d3
      .select("#content-ventes")
      .append("div")
      .attr("class", "legend-container-ventes")
      .style("position", "absolute");

    legend
      .append("div")
      .attr("class", "legend-item")
      .append("text")
      .text("Cliquez pour modifier la visibilité")
      .style("font-weight", "bold");

    possibleKeys.forEach((key, i) => {
      const legendItem = legend
        .append("div")
        .attr("class", `legend-item legend-item-${key}`)
        .style("cursor", "pointer")
        .on("mouseover", function () {
          d3.select(this).style("outline", "1px solid black");
        })
        .on("mouseout", function () {
          d3.select(this).style("outline", null);
        })
        .on("click", function () {
          const isHidden =
            d3.select(`.price-range-${key}`).style("display") === "none";
          d3.selectAll(`.price-range-${key}`).style(
            "display",
            isHidden ? null : "none",
          );

          if (isHidden) {
            keys.push(key);
            d3.select(this).style("text-decoration", null);
          } else {
            keys = keys.filter((k) => k !== key);
            d3.select(this).style("text-decoration", "line-through");
          }

          updateBars();
        });

      legendItem
        .append("div")
        .attr("style", "display: inline-block; width: 15px; height: 15px;")
        .style("background-color", color(key));

      legendItem
        .append("text")
        .style("margin-left", "10px")
        .text(`${priceRanges[key]}`);
    });

    function updateBars() {
      // Update the stack and layers based on the current keys
      const newStack = d3
        .stack()
        .keys(possibleKeys)
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetNone);

      layers = newStack(stackedData);

      // Update the x scale domain
      x.domain([
        0,
        d3.max(stackedData, (d) => d3.sum(keys, (key) => d[+key])) || 0,
      ]).nice();

      // Update the y scale domain
      y.domain(stackedData.map((d) => d.region));

      // Redraw bars
      const updatedBars = g.selectAll(".price-range").data(layers);

      updatedBars.exit().remove();

      const newBars = updatedBars
        .enter()
        .append("g")
        .attr("fill", (d) => color(d.key))
        .attr("class", (d) => `price-range price-range-${d.key}`)
        .selectAll("rect")
        .data((d) => d)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("y", (d) => y(d.data.region))
        .attr("height", y.bandwidth() * 1.1);

      updatedBars
        .merge(newBars)
        .selectAll("rect")
        .data((d) => d)
        .transition()
        .attr("x", (d) => {
          let start = d[0];
          if (!keys.includes("1")) start -= d.data["1"];
          if (!keys.includes("2") && start !== 0) start -= d.data["2"];
          return x(start);
        })
        .attr("width", (d) => x(d[1]) - x(d[0]));

      // Update the x-axis
      g.select(".x-axis").transition().call(d3.axisBottom(x).ticks(10, "s"));
    }
  } else {
    g.selectAll("*").remove(); // Clear the SVG before drawing
    svg.selectAll("*").remove();

    if (data.length === 0) {
      // Display a placeholder when there is no data
      console.log("0 DATA !!!!");
      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .attr("font-size", "16px")
        .attr("fill", "gray")
        .text("Désolé, aucune donnée disponible pour la période sélectionnée.");
      return;
    }
  }
}

d3.csv(
  "https://www.donneesquebec.ca/recherche/dataset/statistiques-du-registre-foncier-du-quebec-sur-le-marche-immobilier/resource/d1ce4f2f-f5bc-492e-81a5-2347ed9c8c1a/download/donn_hypoth_reqst.csv",
  (d) => ({
    DT_DEBUT_MOIS: d.DT_DEBUT_MOIS,
    ID_REGN_ADMIN: +d.ID_REGN_ADMIN,
    CD_PLAGE_PRIX: +d.CD_PLAGE_PRIX,
    CD_NATR_ACTE_JURDQ: +d.CD_NATR_ACTE_JURDQ,
    NB_REQST: +d.NB_REQST,
  }),
).then((data) => {
  const { minDate, maxDate } = getDateRange(data);

  setDateFilters(
    (startYear, endYear, startMonth, endMonth) => {
      const filteredData = filterDataByDate(
        data,
        startYear,
        endYear,
        startMonth,
        endMonth,
      );
      renderChart(filteredData);
    },
    minDate,
    maxDate,
  );

  renderChart(data); // Initial render
});

function getDateRange(data) {
  const dates = data.map((d) => new Date(d.DT_DEBUT_MOIS));
  const minDate = new Date(Math.min(...dates));
  const maxDate = new Date(Math.max(...dates));
  return { minDate, maxDate };
}
