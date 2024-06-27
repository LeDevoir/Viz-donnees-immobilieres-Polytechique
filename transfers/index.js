d3.csv('donn_transf_prop_reqst.csv').then((data) => {
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
        10: "Nord-du-Québec",
        11: "Gaspésie-Îles-de-la-Madeleine",
        12: "Chaudière-Appalaches",
        13: "Laval",
        14: "Lanaudière",
        15: "Laurentides",
        16: "Montérégie",
        17: "Centre-du-Québec",
    };

    data.forEach((d) => {
        d.Month = d3.timeParse("%Y-%m-%d")(d.DT_DEBUT_MOIS);
        d.Year = d3.timeFormat("%Y")(d.Month);
        d.MonthFormatted = d3.timeFormat("%Y-%m")(d.Month);
        d.NB_REQST = +d.NB_REQST;
        d.Region = regionNames[+d.ID_REGN_ADMIN];
    });

    const minDate = d3.min(data, d => d.Month);
    const maxDate = d3.max(data, d => d.Month);
    let zMax = d3.max(data, d => d.NB_REQST); 
    let colorScale = d3.scaleSequential(d3.interpolateViridis)
        .domain([0, zMax]);

    const regionSelector = d3.select("#regionSelector");
    regionSelector.selectAll("option").remove();

    const timeSelector = d3.select("#timeSelector");
    const dateSelector = d3.select("#dateSelector");

    const initialTimeUnit = timeSelector.property("value");

    const aggregateData = (data, timeUnit) => {
        return d3.rollups(
            data,
            (v) => d3.sum(v, (d) => d.NB_REQST),
            (d) => (timeUnit === "month" ? d.MonthFormatted : d.Year),
            (d) => d.Region
        );
    };

    const createPivotTable = (aggregatedData) => {
        const pivotData = {};
        aggregatedData.forEach(([time, regions]) => {
            regions.forEach(([region, sum]) => {
                if (!pivotData[region]) pivotData[region] = {};
                pivotData[region][time] = sum;
            });
        });
        return pivotData;
    };

    const populateDateSelector = (data, timeUnit) => {
        const dates = Array.from(new Set(data.map(d => timeUnit === "month" ? d.MonthFormatted : d.Year)));
        dateSelector.selectAll("option").remove();
        dateSelector.append("option").attr("value", "All").text("All");
        dates.forEach(date => {
            dateSelector.append("option").attr("value", date).text(date);
        });
    };

    let aggregatedData = aggregateData(data, initialTimeUnit);
    let pivotData = createPivotTable(aggregatedData);

    const margin = { top: 50, right: 100, bottom: 150, left: 145 };
    const width = 940 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;
    const transMarginLeft = margin.left + 100;
    const svg = d3
        .select("#heatmap")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + transMarginLeft + "," + margin.top + ")");

    const x = d3.scaleBand().range([0, width]).padding(0.01);
    const y = d3.scaleBand().range([height, 0]).padding(0.01);

    const times = Array.from(new Set(data.map((d) => d.MonthFormatted)));
    const regions = Object.keys(pivotData);

    x.domain(times);
    y.domain(regions);

    // Add X Axis
    const xAxis = svg
        .append("g")
        .attr("class", "x axis text-sm")
        .attr("transform", "translate(0," + height + ")");

    xAxis
        .call(
            d3.axisBottom(x).tickValues(
                x.domain().filter(function (d, i) {
                    return !(i % 3);
                })
            )
        )
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    // Add Y Axis
    svg.append("g").attr("class", "y axis text-sm").call(d3.axisLeft(y));

    // Add X Axis Label
    svg.append("text")
        .attr("class", "axis-label text-xl font-semibold")
        .attr("text-anchor", "middle")
        .attr("x", width / 2)
        .attr("y", height + 88)
        .text("Mois");

    // Add y-axis label
    svg.append("text")
        .attr("class", "axis-label text-xl font-semibold")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -220)
        .text("Régions");

    const tooltip = d3
        .select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    const updateHeatmap = (pivotData, timeUnit, selectedRegions, selectedDate) => {
        const xAxisLabel = timeUnit === "month" ? "Mois" : "Année";

        // Update the text of the X-axis label
        d3.select(".axis-label")
            .text(xAxisLabel);
        const times = Array.from(new Set(data.map((d) => timeUnit === "month" ? d.MonthFormatted : d.Year)));
        if (selectedDate !== "All") {
            x.domain([selectedDate]);
        } else {
            x.domain(times);
        }
        xAxis
            .call(
                d3.axisBottom(x).tickValues(
                    x.domain().filter(function (d, i) {
                        return !(i % (timeUnit === "month" ? 3 : 1));
                    })
                )
            )
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");

        svg.selectAll("rect").remove();

        if (selectedRegions.includes("Tout")) {
            selectedRegions = regions;
        }

        if (selectedDate !== "All") {
            pivotData = {
                ...pivotData,
                ...Object.fromEntries(
                    Object.entries(pivotData).map(([region, timeData]) => [
                        region,
                        { [selectedDate]: timeData[selectedDate] },
                    ])
                ),
            };
        }

        selectedRegions.forEach((region) => {
            x.domain().forEach((time) => {
                svg
                    .append("rect")
                    .attr("x", x(time))
                    .attr("y", y(region))
                    .attr("width", x.bandwidth())
                    .attr("height", y.bandwidth())
                    .attr("rx", 4) // Rounded corners
                    .attr("ry", 4) // Rounded corners
                    .style("fill", colorScale(pivotData[region][time] || 0))
                    .style("stroke-width", 2)
                    .style("stroke", "#e2e8f0")
                    .style("opacity", 0.8)
                    .on("mouseover", function (event, d) {
                        const nbRequests = pivotData[region][time] || 0;
                        tooltip.transition().duration(200).style("opacity", 0.9);
                        tooltip
                            .html(`Région: ${region}<br>Temps: ${time}<br>Requetes: ${nbRequests}`)
                            .style("left", (event.pageX + 10) + "px")
                            .style("top", (event.pageY - 28) + "px");
                    })
                    .on("mouseout", function (d) {
                        tooltip.transition().duration(500).style("opacity", 0);
                    });
            });
        });
    };

    updateHeatmap(pivotData, initialTimeUnit, regions, "All");

    const colorSelector = d3
        .select("#colorSelector")
        .append("select")
        .attr("class", "p-2 border rounded-md");

    const colorOptions = [
        { name: "Cool", scale: d3.interpolateCool },
        { name: "Viridis", scale: d3.interpolateViridis },
        { name: "Inferno", scale: d3.interpolateInferno },
        { name: "Magma", scale: d3.interpolateMagma },
        { name: "Plasma", scale: d3.interpolatePlasma },
        { name: "Cividis", scale: d3.interpolateCividis },
    ];

    colorOptions.forEach((option) => {
        colorSelector
            .append("option")
            .attr("value", option.name)
            .text(option.name);
    });

    colorSelector.on("change", function (event) {
        const selectedOption = colorOptions.find(
            (option) => option.name === this.value
        );
        colorScale = d3
            .scaleSequential(selectedOption.scale)
            .domain([0, zMax]);
        updateHeatmap(pivotData, d3.select("#timeSelector").property("value"), regions, dateSelector.property("value"));
        updateLegend(colorScale);
    });

    const legendWidth = 40,
        legendHeight = height;

    const legendSvg = d3
        .select("#legend")
        .append("svg")
        .attr("width", legendWidth + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(10, ${margin.top})`);

    const legendScale = d3
        .scaleLinear()
        .domain([0, zMax])
        .range([legendHeight, 0]);

    const legendAxis = d3
        .axisRight(legendScale)
        .ticks(20)
        .tickFormat(d3.format(".0f"));

    const legendGradient = legendSvg.append("defs")
        .append("svg:linearGradient")
        .attr("id", "gradient")
        .attr("x1", "0%")
        .attr("y1", "100%")
        .attr("x2", "0%")
        .attr("y2", "0%")
        .attr("spreadMethod", "pad");

    for (let i = 0; i <= 100; i += 1) {
        legendGradient.append("stop")
            .attr("offset", `${i}%`)
            .attr("stop-color", colorScale(zMax * i / 100));
    }

    legendSvg
        .append("rect")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#gradient)");

    legendSvg
        .append("g")
        .attr("class", "axis text-sm")
        .attr("transform", `translate(${legendWidth}, 0)`)
        .call(legendAxis);

    legendSvg
        .append("text")
        .attr("x", legendWidth / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .attr("class", "text-sm font-semibold text-gray-700")
        .text("Requetes");

    function updateLegend(colorScale) {
        const legendGradient = legendSvg.select("defs linearGradient");
        legendGradient.selectAll("stop").remove();

        for (let i = 0; i <= 100; i += 1) {
            legendGradient.append("stop")
                .attr("offset", `${i}%`)
                .attr("stop-color", colorScale(zMax * i / 100));
        }
    }

    function updateGradient(data) {
        let zMaxq = d3.max(data, d => d.NB_REQST);
        colorScale.domain([0, zMaxq]);

        const gradient = legendSvg.select("defs")
            .select("linearGradient")
            .selectAll("stop")
            .data(d3.range(0, 101).map(i => ({ offset: `${i}%`, color: colorScale(zMaxq * i / 100) })))
            .join("stop")
            .attr("offset", d => d.offset)
            .attr("stop-color", d => d.color);
    }

    regionSelector
        .append("option")
        .attr("value", "Tout")
        .text("Tout");

    regionSelector.selectAll(null)
        .data(regions)
        .enter()
        .append("option")
        .attr("value", d => d)
        .text(d => d);

    // Create a function to handle legend click
    function handleLegendClick(lowerBound, upperBound) {
        const highlightedData = data.filter(d => d.NB_REQST > lowerBound && d.NB_REQST <= upperBound);
        
        highlightedData.forEach(d => {
            d.Region = regionNames[d.ID_REGN_ADMIN];
        });

        svg.selectAll("rect")
            .data(highlightedData, d => `${d.Region}-${d.MonthFormatted}`)
            .transition()
            .duration(500)
            .attr("fill", d => colorScale(d.NB_REQST));
    }

    // Add interactivity to the legend
    const legendSteps = 40; // Number of steps in the legend
    const stepSize = zMax / legendSteps; // Size of each step

    legendSvg.selectAll("rect.legend-step")
        .data(d3.range(0, zMax, stepSize))
        .enter()
        .append("rect")
        .attr("class", "legend-step")
        .attr("x", 0)
        .attr("y", d => legendScale(d + stepSize))
        .attr("width", legendWidth)
        .attr("height", d => legendScale(d) - legendScale(d + stepSize))
        .attr("fill", d => colorScale(d + stepSize))
        .on("click", function (event, d) {
            handleLegendClick(d, d + stepSize);
        });

    // Update heatmap on region selection change
    regionSelector.on("change", function () {
        const selectedRegions = Array.from(this.selectedOptions, option => option.value);
        const selectedTimeUnit = timeSelector.property("value");
        const selectedDate = dateSelector.property("value");
        updateHeatmap(pivotData, selectedTimeUnit, selectedRegions, selectedDate);
        updateGradient(data);
    });

    // Update heatmap on time period selection change
    timeSelector.on("change", function () {
        const timeUnit = this.value;
        aggregatedData = aggregateData(data, timeUnit);
        pivotData = createPivotTable(aggregatedData);
        const selectedRegions = Array.from(regionSelector.node().selectedOptions, option => option.value);
        const selectedDate = dateSelector.property("value");
        populateDateSelector(data, timeUnit);
        updateHeatmap(pivotData, timeUnit, selectedRegions, selectedDate);
        updateGradient(data);
    });

    dateSelector.on("change", function () {
        const selectedRegions = Array.from(regionSelector.node().selectedOptions, option => option.value);
        const selectedTimeUnit = timeSelector.property("value");
        const selectedDate = this.value;
        updateHeatmap(pivotData, selectedTimeUnit, selectedRegions, selectedDate);
        updateGradient(data);
    });

    // Initial population of date selector
    populateDateSelector(data, initialTimeUnit);
});
