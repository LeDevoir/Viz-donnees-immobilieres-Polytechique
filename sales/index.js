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

    let aggregatedData = aggregateData(data, "month");
    let pivotData = createPivotTable(aggregatedData);

    const margin = { top: 50, right: 150, bottom: 150, left: 200 };
    const width = 1000 - margin.left - margin.right;
    const height = 800 - margin.top - margin.bottom;

    const svg = d3
        .select("#heatmap")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    const x = d3.scaleBand().range([0, width]).padding(0.01);
    const y = d3.scaleBand().range([height, 0]).padding(0.01);

    let color = d3.scaleSequential(d3.interpolateViridis)
        .domain([0, d3.max(Object.values(pivotData).flatMap((d) => Object.values(d)))]);

    const times = Array.from(new Set(data.map((d) => d.MonthFormatted)));
    const regions = Object.keys(pivotData);

    x.domain(times);
    y.domain(regions);

    // Add X Axis
    const xAxis = svg
        .append("g")
        .attr("class", "x axis")
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
    svg.append("g").attr("class", "y axis").call(d3.axisLeft(y));

    // Add X Axis Label
    svg.append("text")
        .attr("class", "axis-label")
        .attr("transform", `translate(${width / 2}, ${height + margin.bottom - 20})`)
        .style("text-anchor", "middle")
        .text("Months");

    // Add Y Axis Label
    svg.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left + 20)
        .attr("x", 0 - height / 2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Regions");

    const tooltip = d3
        .select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background-color", "white")
        .style("border", "1px solid black")
        .style("padding", "5px")
        .style("border-radius", "5px")
        .style("pointer-events", "none");

    const updateHeatmap = (pivotData, timeUnit, selectedRegions) => {
        x.domain(
            Array.from(
                new Set(
                    data.map((d) =>
                        timeUnit === "month" ? d.MonthFormatted : d.Year
                    )
                )
            )
        );
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

        svg.selectAll("rect").remove();

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
                    .style("fill", color(pivotData[region][time] || 0))
                    .style("stroke-width", 4)
                    .style("stroke", "none")
                    .style("opacity", 0.8)
                    .on("mouseover", function (event, d) {
                        tooltip.transition().duration(200).style("opacity", 0.9);
                        tooltip
                            .html(`Region: ${region}<br>${timeUnit.charAt(0).toUpperCase() + timeUnit.slice(1)}: ${time}<br>Requests: ${pivotData[region][time] || 0}`)
                            .style("left", (event.pageX + 10) + "px")
                            .style("top", (event.pageY - 28) + "px");
                    })
                    .on("mouseout", function (d) {
                        tooltip.transition().duration(500).style("opacity", 0);
                    });
            });
        });
    };

    updateHeatmap(pivotData, "month", regions);

    const zMax = d3.max(
        Object.values(pivotData).flatMap((d) => Object.values(d))
    );

    const colorSelector = d3
        .select("#colorSelector")
        .append("select")
        .attr("class", "color-selector");

    const colorOptions = [

        { name: "Plasma", scale: d3.interpolatePlasma },

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
        color = d3
            .scaleSequential(selectedOption.scale)
            .domain([0, zMax]);
        svg.selectAll("rect").style("fill", function (d) {
            const region = d3.select(this).attr("y");
            const time = d3.select(this).attr("x");
            return color(pivotData[region][time] || 0);
        });
        updateLegend(color);
    });

    const legendWidth = 30,
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
        .ticks(10)
        .tickFormat(d3.format(".0f"));

    const legend = legendSvg
        .append("defs")
        .append("svg:linearGradient")
        .attr("id", "gradient")
        .attr("x1", "0%")
        .attr("y1", "100%")
        .attr("x2", "0%")
        .attr("y2", "0%")
        .attr("spreadMethod", "pad");

    legend
        .append("stop")
        .attr("offset", "0%")
        .attr("stop-color", color(0))
        .attr("stop-opacity", 1);

    legend
        .append("stop")
        .attr("offset", "100%")
        .attr("stop-color", color(zMax))
        .attr("stop-opacity", 1);

    legendSvg
        .append("rect")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#gradient)");

    legendSvg
        .append("g")
        .attr("class", "axis")
        .attr("transform", `translate(${legendWidth}, 0)`)
        .call(legendAxis);

    legendSvg
        .append("text")
        .attr("x", legendWidth / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .attr("class", "text-sm text-gray-700")
        .text("Number of Requests");

    function updateLegend(color) {
        const legendGradient = legendSvg.select("defs linearGradient");
        legendGradient
            .selectAll("stop")
            .data([
                { offset: "0%", color: color(0) },
                { offset: "100%", color: color(zMax) },
            ])
            .join("stop")
            .attr("offset", (d) => d.offset)
            .attr("stop-color", (d) => d.color);
    }

    // Populate region selector with regions
    const regionSelector = d3.select("#regionSelector");
    regionSelector
        .selectAll("option")
        .data(regions)
        .enter()
        .append("option")
        .attr("value", (d) => d)
        .text((d) => d);

    // Update heatmap on region selection change
    regionSelector.on("change", function() {
        const selectedRegions = Array.from(this.selectedOptions, option => option.value);
        updateHeatmap(pivotData, d3.select("#timeSelector").property("value"), selectedRegions);
    });

    // Update heatmap on time period selection change
    d3.select("#timeSelector").on("change", function () {
        const timeUnit = this.value;
        aggregatedData = aggregateData(data, timeUnit);
        pivotData = createPivotTable(aggregatedData);
        updateHeatmap(pivotData, timeUnit, Array.from(regionSelector.node().selectedOptions, option => option.value));
    });
});
