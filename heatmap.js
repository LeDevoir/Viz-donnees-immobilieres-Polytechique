d3.csv('donn_transf_prop_reqst.csv').then((data) => {
    // Your D3.js heatmap code here
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

    // Function to aggregate data
    const aggregateData = (data, timeUnit) => {
        return d3.rollups(
            data,
            (v) => d3.sum(v, (d) => d.NB_REQST),
            (d) => (timeUnit === "month" ? d.MonthFormatted : d.Year),
            (d) => d.Region
        );
    };

    // Initial aggregation by month
    let aggregatedData = aggregateData(data, "month");

    // Function to create pivot table
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

    // Create initial pivot table
    let pivotData = createPivotTable(aggregatedData);

    // Define dimensions
    const margin = { top: 100, right: 50, bottom: 150, left: 200 };
    const width = 1200 - margin.left - margin.right;
    const height = 800 - margin.top - margin.bottom;

    // Append SVG and set dimensions
    const svg = d3
        .select("#heatmap")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Define scales
    const x = d3.scaleBand().range([0, width]).padding(0.01);
    const y = d3.scaleBand().range([height, 0]).padding(0.01);

    let color = d3
        .scaleSequential(d3.interpolateViridis)
        .domain([
            0,
            d3.max(Object.values(pivotData).flatMap((d) => Object.values(d))),
        ]);

    // Extract unique times and regions
    const times = Array.from(new Set(data.map((d) => d.MonthFormatted)));
    const regions = Object.keys(pivotData);

    x.domain(times);
    y.domain(regions);

    // Append axes
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

    svg.append("g").attr("class", "y axis").call(d3.axisLeft(y));

    // Tooltip
    const tooltip = d3
        .select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // Function to update heatmap
    const updateHeatmap = (pivotData, timeUnit) => {
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

        regions.forEach((region) => {
            x.domain().forEach((time) => {
                svg
                    .append("rect")
                    .attr("x", x(time))
                    .attr("y", y(region))
                    .attr("width", x.bandwidth())
                    .attr("height", y.bandwidth())
                    .style("fill", color(pivotData[region][time] || 0))
                    .on("mouseover", function (event, d) {
                        tooltip.transition().duration(200).style("opacity", 0.9);
                        tooltip
                            .html(
                                `Region: ${region}<br>${
                                    timeUnit.charAt(0).toUpperCase() +
                                    timeUnit.slice(1)
                                }: ${time}<br>Requests: ${
                                    pivotData[region][time] || 0
                                }`
                            )
                            .style("left", event.pageX + 15 + "px")
                            .style("top", event.pageY - 28 + "px");
                    })
                    .on("mouseout", function (d) {
                        tooltip.transition().duration(500).style("opacity", 0);
                    });
            });
        });
    };

    // Initial heatmap
    updateHeatmap(pivotData, "month");

    // Add slider for z-axis
    const zMax = d3.max(
        Object.values(pivotData).flatMap((d) => Object.values(d))
    );
    const slider = d3
        .sliderBottom()
        .min(0)
        .max(zMax)
        .width(300)
        .ticks(10)
        .default(zMax)
        .on("onchange", (val) => {
            color.domain([0, val]);
            svg.selectAll("rect").style("fill", function (d) {
                const region = d3.select(this).attr("y");
                const time = d3.select(this).attr("x");
                return color(pivotData[region][time] || 0);
            });
            updateLegend(color);
        });

    const gSlider = d3
        .select("#slider")
        .append("svg")
        .attr("width", 400)
        .attr("height", 100)
        .append("g")
        .attr("transform", "translate(30,30)");

    gSlider.call(slider);

    // Add color selector
    const colorSelector = d3
        .select("#colorSelector")
        .append("select")
        .attr("class", "color-selector");

    const colorOptions = [
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
        color = d3
            .scaleSequential(selectedOption.scale)
            .domain([0, slider.value()]);
        svg.selectAll("rect").style("fill", function (d) {
            const region = d3.select(this).attr("y");
            const time = d3.select(this).attr("x");
            return color(pivotData[region][time] || 0);
        });
        updateLegend(color);
    });

    // Add color legend
    const legendWidth = 300,
        legendHeight = 10;

    const legendSvg = d3
        .select("#heatmap")
        .append("svg")
        .attr("width", legendWidth + margin.left + margin.right)
        .attr("height", 50)
        .append("g")
        .attr("transform", `translate(${margin.left}, 10)`);

    const legendScale = d3
        .scaleLinear()
        .domain([0, zMax])
        .range([0, legendWidth]);

    const legendAxis = d3
        .axisBottom(legendScale)
        .ticks(5)
        .tickFormat(d3.format(".0f"));

    const legend = legendSvg
        .append("defs")
        .append("svg:linearGradient")
        .attr("id", "gradient")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
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
        .attr("transform", `translate(0, ${legendHeight})`)
        .call(legendAxis);

    // Add explanatory legend
    const explanatoryLegend = d3
        .select("#heatmap")
        .append("svg")
        .attr("width", legendWidth + margin.left + margin.right)
        .attr("height", 50)
        .append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${margin.left}, 60)`);

    explanatoryLegend
        .append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 20)
        .attr("height", 20)
        .style("fill", color(0));
    explanatoryLegend
        .append("text")
        .attr("x", 30)
        .attr("y", 15)
        .text("Low number of requests");

    explanatoryLegend
        .append("rect")
        .attr("x", 150)
        .attr("y", 0)
        .attr("width", 20)
        .attr("height", 20)
        .style("fill", color(zMax / 2));
    explanatoryLegend
        .append("text")
        .attr("x", 180)
        .attr("y", 15)
        .text("Medium number of requests");

    explanatoryLegend
        .append("rect")
        .attr("x", 320)
        .attr("y", 0)
        .attr("width", 20)
        .attr("height", 20)
        .style("fill", color(zMax));
    explanatoryLegend
        .append("text")
        .attr("x", 350)
        .attr("y", 15)
        .text("High number of requests");

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

        explanatoryLegend
            .selectAll("rect")
            .data([0, zMax / 2, zMax])
            .style("fill", (d) => color(d));
    }

    // Time unit selector
    d3.select("#timeSelector").on("change", function () {
        const timeUnit = this.value;
        aggregatedData = aggregateData(data, timeUnit);
        pivotData = createPivotTable(aggregatedData);
        updateHeatmap(pivotData, timeUnit);
    });
});
