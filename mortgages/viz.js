
function createScales(width, height) {
  const xScale = d3.scaleTime().range([0, width]);
  const yScale = d3.scaleLinear().range([height, 0]);
  const color = d3
    .scaleOrdinal()
    .domain(Object.keys(colorMap))
    .range(Object.values(colorMap));

  return { xScale, yScale, color };
}

function setScaleDomains(xScale, yScale, data, series) {
  xScale.domain([
    d3.min(data, (d) => new Date(d.date)),
    d3.max(data, (d) => new Date(d.date)),
  ]);
  yScale.domain([0, d3.max(series, (layer) => d3.max(layer, (d) => d[1]))]);
}

function createStack(regionIdsWanteds) {
  console.log(regionIdsWanteds);
  return d3
    .stack()
    .keys(regionIdsWanteds)
    .value((d, key) => d[key] || 0)
    .order(d3.stackOrderNone)
    .offset(d3.stackOffsetNone);
}

function drawChart(svg, series, xScale, yScale, color, height, width, regionsMaps) {
  // Draw the layers
  svg
    .selectAll(".layer")
    .data(series)
    .join("path")
    .attr("class", "layer")
    .attr(
      "d",
      d3
        .area()
        .x((d) => xScale(new Date(d.data.date)))
        .y0((d) => yScale(d[0]))
        .y1((d) => yScale(d[1]))
        .curve(d3.curveLinear),
    )
    .attr("fill", (d, i) => color(i));

  // Define the axes with grid lines
  const xAxis = d3
    .axisBottom(xScale)
    .ticks(d3.timeMonth.every(1)) // Show a tick for every month
    .tickFormat(d3.timeFormat("%b-%y")) // Format as "Jan-20"
    .tickSize(-height) // Extend the tick lines to create grid lines
    .tickSizeOuter(0); // Remove the outer ticks

  const yAxis = d3
    .axisLeft(yScale)
    .ticks(10) // Adjust the number of ticks as needed
    .tickSize(-width) // Extend the tick lines to create grid lines
    .tickSizeOuter(0); // Remove the outer ticks

  // Add the axes
  svg
    .selectAll(".x-axis")
    .data([0])
    .join("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height})`)
    .call(xAxis)
    .selectAll("text") // Select all x-axis labels
    .style("text-anchor", "end") // Align text to end for better readability
    .attr("dx", "-0.8em") // Adjust horizontal position
    .attr("dy", "0.15em") // Adjust vertical position
    .attr("transform", "rotate(-45)"); // Rotate labels 45 degrees

  svg
    .selectAll(".y-axis")
    .data([0])
    .join("g")
    .attr("class", "y-axis")
    .call(yAxis);

  // Customize the appearance of grid lines
  svg
    .selectAll(".x-axis .tick line")
    .attr("stroke", "lightgrey")
    .attr("stroke-dasharray", "2,2");

  svg
    .selectAll(".y-axis .tick line")
    .attr("stroke", "lightgrey")
    .attr("stroke-dasharray", "2,2");

  // Add x-axis label
  svg
    .append("text")
    .attr("class", "x-axis-label")
    .attr("text-anchor", "middle")
    .attr("x", width / 2)
    .attr("y", height + 50) // Adjust this value as needed
    .text("Temps (Mois-Année)");

  // Add y-axis label
  svg
    .append("text")
    .attr("class", "y-axis-label")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -50) // Adjust this value as needed
    .text("Nombre total d'hyphothèques");

  series.forEach((layer, i) => {
    svg
      .selectAll(`.dot-${i}`)
      .data(layer)
      .join("circle")
      .attr("class", `dot-${i}`)
      .attr("cx", (d) => xScale(new Date(d.data.date)))
      .attr("cy", (d) => yScale(d[1]))
      .attr("r", 6) // Small radius for the dots
      .attr("fill", "black")
      .style("opacity", 0) // Dots are initially invisible
      .on("mouseover", (event, d) => {
        let count = 0;
        let regionId = null;
        let value = null;
        Object.keys(d.data).forEach((key) => {
          console.log(d.data);
          if (typeof d.data[key] === "number") {
            count += d.data[key];
            if (count === d[1]) {
              regionId = key;
              value = d.data[key];
            }
          }
        });
        // Show the tooltip
        d3.select("#tooltip")
          .html(
            `Région: ${regionsMaps[regionId]} <br>Date: ${d.data.date.toISOString().substring(0, 7)}<br>Nombre d'hypohtèques spécifique à cette région: ${value} <br >Nombre d'hypohtèques total avec les régions inférieurs: ${d[1]}`,
          )
          .style("visibility", "visible")
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY + 10}px`);

        // Make the dot visible
        d3.select(event.currentTarget)
          .style("opacity", 1) // Make dot visible
          .attr("r", 5); // Increase radius for emphasis
      })
      .on("mouseout", (event) => {
        d3.select("#tooltip").style("visibility", "hidden");

        // Hide the dot
        d3.select(event.currentTarget).style("opacity", 0).attr("r", 3); // Reset radius
      });
  });
}
