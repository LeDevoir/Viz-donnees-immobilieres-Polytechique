d3.csv("donn_prix_vente_reqst.csv", (d) => ({
  DT_DEBUT_MOIS: d.DT_DEBUT_MOIS,
  ID_REGN_ADMIN: +d.ID_REGN_ADMIN,
  CD_PLAGE_PRIX: +d.CD_PLAGE_PRIX,
  CD_NATR_ACTE_JURDQ: +d.CD_NATR_ACTE_JURDQ,
  NB_REQST: +d.NB_REQST,
})).then((data) => {
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

  const margin = { top: 20, right: 110, bottom: 100, left: 150 };
  const width = 1200 - margin.left - margin.right;
  const height = 550 - margin.top - margin.bottom;
  const svg = d3
    .select("#content")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  const g = svg
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
  const legend = svg
    .append("g")
    .attr("transform", `translate(${width - 120},${margin.top})`);

  legend
    .append("g")
    .attr("class", "legend-item")
    .append("text")
    .text("Cliquez pour modifier la visibilité");

  possibleKeys.forEach((key, i) => {
    const legendItem = legend
      .append("g")
      .attr("class", `legend-item legend-item-${key}`)
      .attr("transform", `translate(0, ${i * 20 + 5})`)
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
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", color(key));

    legendItem
      .append("text")
      .attr("x", 20)
      .attr("y", 5)
      .attr("dy", "0.50em")
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
});
