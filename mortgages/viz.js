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

  const monthNamesInFrench = ["jan", "fév", "mar", "avr", "mai", "jun", "jul", "aoû", "sep", "oct", "nov", "déc"];
  const xAxis = d3
    .axisBottom(xScale)
    .ticks(d3.timeMonth.every(1)) // Show a tick for every month
    .tickFormat(d => {
      const date = new Date(d);
      const month = date.getMonth(); // Get the month index (0-11)
      const year = date.getFullYear();
      return `${monthNamesInFrench[month]}-${year.toString().substr(-2)}`;
    })
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
    .attr("y", height + 55) // Adjust this value as needed
    .text("Temps (mois-année)");

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
          .style("top", `${event.pageY - 50}px`);

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

function drawMarkers(svg, xScale, yScale, height, data) {
  const markerAData = new Date(markerStartYear, markerStartMonth - 1);
  const markerBData = new Date(markerEndYear, markerEndMonth - 1);

 
  const minDate=new Date(data[0].date);
  const maxDate= new Date(data[data.length-1].date);
  const minYear = minDate.getUTCFullYear();
  const minMonth = minDate.getUTCMonth()+1;
  const maxYear = maxDate.getUTCFullYear();
  const maxMonth = maxDate.getUTCMonth()+1;
  console.log(maxYear)
  console.log(maxMonth+"MAXMONTH");
  console.log(markerEndMonth + "ENDmoNTH")


  console.log(data);
  // Remove existing message if any
  svg.selectAll(".invalid-marker-message").remove();

  // Validate marker dates
  let invalidMarkers = false;
  console.log(markerAData);
  console.log(markerBData);
  if ( markerStartYear < minYear  || ( markerStartYear === minYear && markerStartMonth < minMonth) || markerEndYear > maxYear || markerEndYear === maxYear && markerEndMonth > maxMonth) {
    invalidMarkers = true;
    svg.append('text')
      .attr('class', 'invalid-marker-message')
      .attr('x', width / 2)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .attr('fill', 'red')
      .attr('font-size', '14px')
      .text("Assurez-vous que les dates des marqueurs ne soient pas à l'extérieur de la période couverte.");
  }

  if (  markerEndYear < markerStartYear || markerStartYear > markerEndYear || ( markerEndYear <= markerStartYear && markerEndMonth < markerStartMonth ) ) {
    invalidMarkers = true;
    svg.append('text')
      .attr('class', 'invalid-marker-message')
      .attr('x', width / 2)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .attr('fill', 'red')
      .attr('font-size', '14px')
      .text('Assurez-vous que la date du marqueur A soit inférieur ou égale à celle du marqueur B.');
  }

  if(!invalidMarkers){
  const markerA = svg.append('line')
    .attr('class', 'marker-line')
    .attr('x1', xScale(markerAData))
    .attr('x2', xScale(markerAData))
    .attr('y1', 0)
    .attr('y2', height)
    .attr('stroke', 'black')
    .attr('stroke-width', 2)
    .attr('stroke-dasharray', '5,5');

  const markerB = svg.append('line')
    .attr('class', 'marker-line')
    .attr('x1', xScale(markerBData))
    .attr('x2', xScale(markerBData))
    .attr('y1', 0)
    .attr('y2', height)
    .attr('stroke', 'black')
    .attr('stroke-width', 2)
    .attr('stroke-dasharray', '5,5');
  } else{
    svg.selectAll('marker-line').remove();
  }

  if (!invalidMarkers) {
    const totalMortgagesA = computeTotalMortgages(data, markerStartYear, markerStartMonth);
    const totalMortgagesB = computeTotalMortgages(data, markerEndYear, markerEndMonth);
    const netVariation = ((totalMortgagesB - totalMortgagesA) / totalMortgagesA) * 100;

    let message = '';
    if (netVariation > 0) {
      message = `Augmentation de ${netVariation.toFixed(2)}% du nombre d'hypothèques.`;
    } else if (netVariation < 0) {
      message = `Diminution de ${netVariation.toFixed(2) * -1 }% du nombre d'hypothèques.`;
    } else {
      message = `Aucune variation des hypothèques.`;
    }

    if(message === `Aucune variation des hypothèques.`){
      if( xScale(markerBData) < 150){
        svg.append('text')
          .attr('class', 'net-variation-text')
          .attr('x', 0 )
          .attr('y', -10 )
          .attr('fill', 'black')
          .attr('font-size', '14px')
          .attr('font-weight', 'bold')
          .text( message );
        svg.append('line')
          .attr('class', 'slope-line')
          .attr('x1', xScale(markerAData))
          .attr('x2', xScale(markerBData))
          .attr('y1', yScale(totalMortgagesA))
          .attr('y2', yScale(totalMortgagesB))
          .attr('stroke', 'blue')
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '5,5');
      } else if(xScale(markerAData) > 800 && xScale(markerBData) > 800) {
        console.log(xScale(markerBData) + "TRY1000")
        svg.append('text')
          .attr('class', 'net-variation-text')
          .attr('x', 680)
          .attr('y', -10 )
          .attr('fill', 'black')
          .attr('font-size', '14px')
          .attr('font-weight', 'bold')
          .text( message );
        svg.append('line')
          .attr('class', 'slope-line')
          .attr('x1', xScale(markerAData))
          .attr('x2', xScale(markerBData))
          .attr('y1', yScale(totalMortgagesA))
          .attr('y2', yScale(totalMortgagesB))
          .attr('stroke', 'blue')
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '5,5');
      } else {
        console.log(xScale(markerBData) + "TRY1000")
        svg.append('text')
          .attr('class', 'net-variation-text')
          .attr('x', xScale(markerBData) - 100 )
          .attr('y', -10 )
          .attr('fill', 'black')
          .attr('font-size', '14px')
          .attr('font-weight', 'bold')
          .text( message );
        svg.append('line')
          .attr('class', 'slope-line')
          .attr('x1', xScale(markerAData))
          .attr('x2', xScale(markerBData))
          .attr('y1', yScale(totalMortgagesA))
          .attr('y2', yScale(totalMortgagesB))
          .attr('stroke', 'blue')
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '5,5');
      } 
    } else {

      if( xScale(markerAData) > 600){
        console.log(xScale(markerBData));
        svg.append('text')
          .attr('class', 'net-variation-text')
          .attr('x', 560 )
          .attr('y', -10 )
          .attr('fill', 'black')
          .attr('font-size', '14px')
          .attr('font-weight', 'bold')
          .text( message );
        svg.append('line')
          .attr('class', 'slope-line')
          .attr('x1', xScale(markerAData))
          .attr('x2', xScale(markerBData))
          .attr('y1', yScale(totalMortgagesA))
          .attr('y2', yScale(totalMortgagesB))
          .attr('stroke', 'blue')
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '5,5');
      } else if( xScale(markerBData) < 350 && xScale(markerAData) < 150){
        console.log(xScale(markerBData));
        svg.append('text')
          .attr('class', 'net-variation-text')
          .attr('x', 0 )
          .attr('y', -10 )
          .attr('fill', 'black')
          .attr('font-size', '14px')
          .attr('font-weight', 'bold')
          .text( message );
        svg.append('line')
          .attr('class', 'slope-line')
          .attr('x1', xScale(markerAData))
          .attr('x2', xScale(markerBData))
          .attr('y1', yScale(totalMortgagesA))
          .attr('y2', yScale(totalMortgagesB))
          .attr('stroke', 'blue')
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '5,5');
        } else{
            svg.append('text')
              .attr('class', 'net-variation-text')
              .attr('x', ((xScale(markerBData) - xScale(markerAData))/2) + xScale(markerAData) -170 )
              .attr('y', -10 )
              .attr('fill', 'black')
              .attr('font-size', '14px')
              .attr('font-weight', 'bold')
              .text( message );
            svg.append('line')
              .attr('class', 'slope-line')
              .attr('x1', xScale(markerAData))
              .attr('x2', xScale(markerBData))
              .attr('y1', yScale(totalMortgagesA))
              .attr('y2', yScale(totalMortgagesB))
              .attr('stroke', 'blue')
              .attr('stroke-width', 2)
              .attr('stroke-dasharray', '5,5');
        }
    }
}
}
