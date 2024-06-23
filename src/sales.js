d3.csv("donn_prix_vente_reqst.csv", (d) => ({
  DT_DEBUT_MOIS: d.DT_DEBUT_MOIS,
  ID_REGN_ADMIN: +d.ID_REGN_ADMIN,
  CD_PLAGE_PRIX: +d.CD_PLAGE_PRIX,
  CD_NATR_ACTE_JURDQ: +d.CD_NATR_ACTE_JURDQ,
  NB_REQST: +d.NB_REQST,
}))
  .then((data) => {
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
      1: "moins de 250 000$",
      2: "250 000$ - 500 000$",
      3: "plus de 500 000$",
    };

    const groupedData = d3.group(data, (d) => d.ID_REGN_ADMIN);

    const stackedData = Array.from(groupedData, ([key, values]) => ({
      region: regionNames[key],
      ...values.reduce((acc, cur) => {
        acc[cur.CD_PLAGE_PRIX] = (acc[cur.CD_PLAGE_PRIX] || 0) + cur.NB_REQST;
        return acc;
      }, {}),
    }));

    const keys = Array.from(
      new Set(data.map((d) => d.CD_PLAGE_PRIX.toString())),
    );

    const width = 1200;
    const height = 500;
    const svg = d3
      .select("#sales")
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g");

    svg.attr("width", width).attr("height", height);

    const g = svg.append("g");

    const y = d3
      .scaleBand()
      .domain(stackedData.map((d) => d.region))
      .range([0, height])
      .padding(0.1);

    const x = d3
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

    const layers = stack(stackedData);

    const bars = g
      .selectAll(".serie")
      .data(layers)
      .enter()
      .append("g")
      .attr("fill", (d) => color(d.key))
      .attr("class", "price-range")
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

    // Hover effect
    bars
      .on("mouseover", function (_, d) {
        const hoveredRegion = d.data.region;
        d3.selectAll(".bar").attr("fill-opacity", 0.3);
        d3.selectAll(".bar")
          .filter((bar) => bar.data.region === hoveredRegion)
          .attr("fill-opacity", 1);
      })
      .on("mouseout", function () {
        d3.selectAll(".bar").attr("fill-opacity", 1);
      });

    // Legend
    const legend = svg
      .append("g")
      .attr("transform", `translate(${width - 120},${margin.top})`);

    keys.forEach((key, i) => {
      legend
        .append("rect")
        .attr("x", 0)
        .attr("y", i * 20)
        .attr("width", 12)
        .attr("height", 12)
        .attr("fill", color(key));

      legend
        .append("text")
        .attr("x", 20)
        .attr("y", i * 20 + 5)
        .attr("dy", "0.35em")
        // @ts-ignore
        .text(`${priceRanges[key]}`);
    });
  })
  .catch((e) => {
    console.error("Error loading CSV data: ", e);
  });
