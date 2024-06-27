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

    // Define a categorical color scale
    let colorScale = d3.scaleOrdinal(d3.schemeCategory10);

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

    const updateLegend = (colorScale, zMax, stepSize) => {
        const legendGradient = legendSvg.select("defs linearGradient");
        legendGradient.selectAll("stop").remove();

        const colorDomain = d3.range(0, zMax, stepSize);

        colorDomain.forEach((d, i) => {
            legendGradient.append("stop")
                .attr("offset", `${(i / colorDomain.length) * 100}%`)
                .attr("stop-color", colorScale(d));
        });

        legendSvg.selectAll("rect.legend-step").remove();

        legendSvg.selectAll("rect.legend-step")
            .data(colorDomain)
            .enter()
            .append("rect")
            .attr("class", "legend-step")
            .attr("x", 0)
            .attr("y", d => legendScale(d + stepSize))
            .attr("width", legendWidth)
            .attr("height", d => legendScale(d) - legendScale(d + stepSize))
            .attr("fill", d => colorScale(d))
            .on("click", function (event, d) {
                handleLegendClick(d, d + stepSize);
            });
    };

    updateHeatmap(pivotData, initialTimeUnit, regions, "All");

    const colorSelector = d3
        .select("#colorSelector")
        .append("select")
        .attr("class", "p-2 border rounded-md");

    const colorOptions = [
        { name: "Category10", scale: d3.schemeCategory10 },
        { name: "Category20", scale: d3.schemeCategory20 },
        { name: "Accent", scale: d3.schemeAccent },
        { name: "Dark2", scale: d3.schemeDark2 },
        { name: "Paired", scale: d3.schemePaired },
        { name: "Set1", scale: d3.schemeSet1 },
        { name: "Set2", scale: d3.schemeSet2 },
        { name: "Set3", scale: d3.schemeSet3 },
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
        colorScale.range(selectedOption.scale);
        const timeUnit = d3.select("#timeSelector").property("value");
        updateHeatmap(pivotData, timeUnit, regions, dateSelector.property("value"));
        const stepSize = timeUnit === "month" ? 50 : 2000;
        updateLegend(colorScale, zMax, stepSize);
    });

    const legendWidth = 60,
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

    const colorDomain = d3.range(0, zMax, 2000);

    colorDomain.forEach((d, i) => {
        legendGradient.append("stop")
            .attr("offset", `${(i / colorDomain.length) * 100}%`)
            .attr("stop-color", colorScale(d));
    });

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

    updateLegend(colorScale, zMax, 2000);

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

    // Update heatmap on region selection change
    regionSelector.on("change", function () {
        const selectedRegions = Array.from(this.selectedOptions, option => option.value);
        const selectedTimeUnit = timeSelector.property("value");
        const selectedDate = dateSelector.property("value");
        updateHeatmap(pivotData, selectedTimeUnit, selectedRegions, selectedDate);
        const stepSize = selectedTimeUnit === "month" ? 50 : 2000;
        updateLegend(colorScale, zMax, stepSize);
    });

    // Update heatmap on time period selection change
    timeSelector.on("change", function () {
        const timeUnit = this.value;
        aggregatedData = aggregateData(data, timeUnit);
        pivotData = createPivotTable(aggregatedData);
        zMax = d3.max(aggregatedData.map(d => d[1]).flatMap(d => d[1]));
        colorScale.domain([0, zMax]);
        const selectedRegions = Array.from(regionSelector.node().selectedOptions, option => option.value);
        const selectedDate = dateSelector.property("value");
        populateDateSelector(data, timeUnit);
        updateHeatmap(pivotData, timeUnit, selectedRegions, selectedDate);
        const stepSize = timeUnit === "month" ? 50 : 2000;
        updateLegend(colorScale, zMax, stepSize);
    });

    dateSelector.on("change", function () {
        const selectedRegions = Array.from(regionSelector.node().selectedOptions, option => option.value);
        const selectedTimeUnit = timeSelector.property("value");
        const selectedDate = this.value;
        updateHeatmap(pivotData, selectedTimeUnit, selectedRegions, selectedDate);
        const stepSize = selectedTimeUnit === "month" ? 50 : 2000;
        updateLegend(colorScale, zMax, stepSize);
    });

    // Initial population of date selector
    populateDateSelector(data, initialTimeUnit);
});
