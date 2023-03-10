// in order to propely map the lines, need to convert our [] into [[],[],[]];
//

class MultipleLinesChart {
  constructor(props) {
    this.data = props.data;
    this.container = props.container;
    this.dataType = props.dataType;
    this.xProp = props.xProp;
    this.yProp = props.yProp;
    this.yOffset = props.yOffset;
    this.svgHeight = props.svgHeight;
    this.svgWidth = props.svgWidth;
    this.designer = props.designer;
    this.legendKeys = props.legendKeys;
    this.init();
  }

  init() {
    // initializing
    this.margin = { top: 20, right: 20, bottom: 80, left: 50 };
    this.width = this.svgWidth - this.margin.left - this.margin.right;
    this.height = this.svgHeight - this.margin.top - this.margin.bottom;
    this.chartWidth = this.svgWidth - 400;
    this.chartHeight = this.svgHeight - 160;
    // set the ranges
    this.x = d3.scaleLinear().range([0, this.chartWidth]);
    this.y = d3.scaleLinear().range([this.chartHeight, 0]);

    // color scale
    this.color = ["primary", "secondary", "tertiary", "quaternary"];
    this.bisectDate = d3.bisector((d) => d["Week"]).left;

    this.update();
  }

  update(newVal) {
   
    // change data type on radio button selection
    if (newVal) {
      this.dataType = newVal.dataType;
      this.yProp = newVal.yProp;
      this.yOffset = newVal.yOffset;
      this.legendKeys = newVal.legendKeys;
    }
    // clear previous chart
    d3.select(`${this.container} svg`).remove();

    this.render();
  }

  // this function is needed to determine how to scale the chart so that all lines and values appear
  calcScales() {
    let min = Infinity;
    let max = 0;
    this.data.forEach((d) => {
      this.yProp.forEach((key, idx) => {
        if (d[key] > max) {
          max = d[key];
        }
        if (d[key] < min) {
          min = d[key];
        }
      });
    });
   // return max >= 7 ? 7 : max;
    return [min - (min * 0.25),max + (max * 0.15)];
  }

  render() {
    const ctx = this;
    const nested = this.toTreeData(this.data); // convert the single data arrau into multiple arrays
    // append the svg obgect to the body of the page
    // appends a 'group' element to 'svg'
    // moves the 'group' element to the top left margin
    const svg = d3
      .select(this.container)
      .append("svg")
      .attr("width", this.width + this.margin.left + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom)
      .append("g")
      .attr(
        "transform",
        "translate(" + this.margin.left + "," + this.margin.top + ")"
      );
    const chartG = svg
      .append("g")
      .attr("class", "chart-group")
      .attr("transform", "translate(80,60)");
    const legendG = svg
      .append("g")
      .attr("class", "legend-group")
      .attr(
        "transform",
        `translate(${this.chartWidth + 150}, ${this.svgHeight / 2.5})`
      );

    const title = svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr("x", this.width / 2)
      .attr("y", 20)
      .attr("class", "chart-title")
      .text(
        `Ad Time Ramp Chart - ${
          this.dataType.replaceAll("_"," ")
        }`
      );
    // Scale the range of the data
    // change max value of Y-scale based on data type
    this.x.domain(d3.extent(this.data, (d) => d[this.xProp]));
    // uses calculated Y-scale for maximum
    this.y.domain(this.calcScales());
    // variables needed to calculate trendline
    const xSeries = d3.range(1, this.data.length + 1);
    const ySeries = this.data.map(
      (d) => parseFloat(d[this.yProp[0]]) // by default, index 0 is the data related to the designer
    ); // proving a, [] of values sorted by index's
    const leastSquaresCoeff = this.leastSquares(xSeries, ySeries);
    const x1 = this.data[0][this.xProp];
    const y1 = leastSquaresCoeff[0] + leastSquaresCoeff[1];
    const x2 = this.data[this.data.length - 1][this.xProp];
    const y2 = leastSquaresCoeff[0] * xSeries.length + leastSquaresCoeff[1];
    const trendData = [[x1, y1, x2, y2]];

    const lineValue = d3
      .line()
      .x((d) => this.x(d["Week"]))
      .y((d) => this.y(d["value"]));

    const chartEnter = chartG
      .selectAll(".line-g")
      .append("g")
      .attr("class", "line-g")
      .data(nested)
      .enter();
    chartEnter
      .append("path")
      .attr("d", lineValue)
      .attr("class", (d, i) => `line stroke-${this.color[i]}`);
    chartEnter
      .selectAll(".dotted-circle")
      .data((d) => d)
      .enter()
      .append("circle")
      .attr("r", 4)
      .attr("cx", (d) => this.x(d["Week"]))
      .attr("cy", (d) => this.y(d["value"]))
      .attr("class", (d) => `fill-${this.color[d.idx]}`);

    // append trendline
    // apply the reults of the least squares regression
    var trendline = chartG.selectAll(".trendline").data(trendData);

    trendline
      .enter()
      .append("line")
      .attr("class", "trendline")
      .attr("x1", (d) => this.x(d[0]))
      .attr("y1", (d) => this.y(d[1]))
      .attr("x2", (d) => this.x(d[2]))
      .attr("y2", (d) => this.y(d[3]))
      .attr("stroke", (d) => (this.y(d[1]) > this.y(d[3]) ? "red" : "green"))
      .attr("stroke-dasharray", 4)
      .attr("stroke-width", 1);

    // Add the X Axis + label
    const xAxisG = chartG.append("g").attr("class", "xAxisG");

    xAxisG.attr("transform", "translate(0," + this.chartHeight + ")").call(
      d3
        .axisBottom(this.x)
        .tickFormat((d) => (d % 1 === 0 ? d : ""))
        .tickSize(0)
        .tickPadding(10)
    );
    xAxisG
      .append("text")
      .attr("class", "line-chart-label")
      .attr("x", this.chartWidth / 2)
      .attr("y", 60)
      .attr("text-anchor", "middle")
      .text("Week Range");

    // Add the Y Axis + label
    const yAxisG = chartG.append("g").attr("class", "yAxisG");

    yAxisG.call(d3.axisLeft(this.y).ticks(5));
    yAxisG
      .append("text")
      .attr("class", "line-chart-label")
      .attr("y", -50)
      .attr("x", -40)
      .attr("transform", `rotate(-90)`)
      .text(
        this.dataType.charAt(0).toUpperCase() +
          this.dataType.slice(1) +
          " Time (Hour)"
      );
    this.renderLegend(legendG, [
      `${this.designer} Trendline`,
      this.designer,
      ...this.legendKeys,
    ]);

    // Adding tooltip on mouse hover
    this.focus = chartG
      .append("g")
      .attr("class", "this.focus")
      .style("display", "none");

    this.focus
      .append("circle")
      .attr("fill", "white")
      .attr("stroke", "black")
      .attr("r", 6);

    this.focus
      .append("rect")
      .attr("class", "tooltip")
      .attr("width", 65)
      .attr("height", 20)
      .attr("x", 10)
      .attr("y", 0)
      .attr("rx", 4)
      .attr("ry", 4);

    this.focus
      .append("text")
      .attr("class", "tooltip-likes")
      .attr("x", 13)
      .attr("y", 13);

    chartG
      .append("rect")
      .attr("class", "overlay")
      .attr("width", this.chartWidth)
      .attr("height", this.height)
      .on("mouseover", () => {
        this.focus.style("display", null);
      })
      .on("mouseout", () => {
        this.focus.style("display", "none");
      })
      .on("mousemove", function () {
        ctx.mousemove(ctx, this);
      });
  }

  // renders the legend <-- doing it manuallly, may make more dynamic
  renderLegend(container, categories) {
    const legendRow = container
      .selectAll(".legend-data")
      .data(categories, (d) => d);

    // // this enters() the data, therefore it is the parent container for where changes need to take place
    const enterLegend = legendRow
      .enter()
      .append("g")
      .attr("class", "legend-data")
      .attr("transform", (d, i) => {
        return `translate(0, ${i * 45})`;
      })
      .merge(legendRow);

    // append legend colored squares
    enterLegend
      .append("rect")
      .attr("width", 30)
      .attr("height", 30)
      .attr("class", (d, i) =>
        i === 0
          ? "legend-data trendline"
          : `legend-data fill-${this.color[i - 1]}`
      );

    // append legend text
    enterLegend
      .append("text")
      .attr("class", "legend-data")
      .attr("x", 40)
      .attr("y", 20)
      .attr("text-anchor", "start")
      .text((d) => {
        return d;
      });
  }
  // returns slope, intercept and r-square of the line
  leastSquares = (xSeries, ySeries) => {
    const reduceSumFunc = (prev, cur) => prev + cur;

    const xBar = (xSeries.reduce(reduceSumFunc) * 1.0) / xSeries.length;
    const yBar = (ySeries.reduce(reduceSumFunc) * 1.0) / ySeries.length;

    const ssXX = xSeries
      .map((d) => Math.pow(d - xBar, 2))
      .reduce(reduceSumFunc);

    const ssYY = ySeries
      .map((d) => Math.pow(d - yBar, 2))
      .reduce(reduceSumFunc);

    const ssXY = xSeries
      .map((d, i) => (d - xBar) * (ySeries[i] - yBar))
      .reduce(reduceSumFunc);

    const slope = ssXY / ssXX;
    const intercept = yBar - xBar * slope;
    const rSquare = Math.pow(ssXY, 2) / (ssXX * ssYY);

    return [slope, intercept, rSquare];
  };

  toTreeData(data) {
    const tree = [];
    // each sub-array will need value and week
    this.yProp.forEach((key, idx) => {
      const arr = [];
      data.forEach((d) => {
        const obj = {};
        obj["Week"] = d["Week"];
        obj["value"] = d[key];
        obj["idx"] = idx;
        arr.push(obj);
      });
      tree.push(arr);
    });
    return tree;
  }

  mousemove(ctx, el) {
    var x0 = ctx.x.invert(d3.pointer(event, el)[0]);
    var i = ctx.bisectDate(ctx.data, x0, 1);
    var d0 = ctx.data[i - 1];
    var d1 = ctx.data[i];
    var d = x0 - d0["Week"] > d1["Week"] - x0 ? d1 : d0;
    var transformString =
      "translate(" + ctx.x(d["Week"]) + "," + ctx.y(d[ctx.yProp[0]]) + ")";
    ctx.focus.attr("transform", transformString);
    ctx.focus.select(".tooltip-likes").text(`${d[ctx.yProp[0]]} hrs`);
  }
}
