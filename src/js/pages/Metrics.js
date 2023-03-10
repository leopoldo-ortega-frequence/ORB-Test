const Metrics = () => {
  // DOMS
  // const allMetricsCards = document.querySelectorAll("div.card");
  // const metricsGlanceHeader = document.getElementById(
  //   "metrics-glance-subheader"
  // );
  const rampChartBtns = document.querySelectorAll(".ramp-btn");
  const ticketChartBtns = document.querySelectorAll(".metric-ad-btn");
  const designerHeaders = document.querySelectorAll(".designer-name");
  const table = document.querySelector(".table-container");
  // global variables go here
  const METRIC_CHART_CONTAINER = ".metrics #svg-metric-graph";
  const METRIC_BAR_CHART_CONTAINER = ".metrics #svg-metric-ad-graph";
  const svgChartWidth = document.querySelector(
    METRIC_CHART_CONTAINER
  ).offsetWidth;
  const svgChartHeight = document.querySelector(
    METRIC_CHART_CONTAINER
  ).offsetHeight;
  const svgBarChartWidth = document.querySelector(
    METRIC_BAR_CHART_CONTAINER
  ).offsetWidth;
  const svgBarChartHeight = document.querySelector(
    METRIC_BAR_CHART_CONTAINER
  ).offsetHeight;
  let dataValue = "standard",
    selectedGroup = "weighted",
    ticketKey;
  let data, metricsChart, barChart;

  // add listeners to DOM elements
  rampChartBtns.forEach((el) => {
    el.addEventListener("click", (event) => {
      event.preventDefault();
      // need to remove all instances of active button
      handleChartBtn(rampChartBtns, event);
      dataValue = event.target.id;
      // only rerender with data updates if chart has been initially rendered
      if (metricsChart) {
        metricsChart.update({
          dataType: dataValue,
          yProp: METRICS_NAMES[dataValue],
          yOffset: METRICS_LINE_SCALEOFFSET[dataValue],
          legendKeys: METRICS_RAMP_LEGEND[dataValue],
        });
      }
    });
  });
  ticketChartBtns.forEach((el) => {
    el.addEventListener("click", (event) => {
      event.preventDefault();
      // need to remove all instances of active button
      handleChartBtn(ticketChartBtns, event);
      selectedGroup = event.target.id;
      ticketKey = `Designer Ticket ${
        selectedGroup.charAt(0).toUpperCase() + selectedGroup.slice(1)
      }`;
      // only rerender with data updates if chart has been initially rendered
      if (barChart) {
        barChart.update({
          selected: ticketKey,
          newGroup: [ticketKey, TEAM_TICKET_RAMP_AVG],
        });
      }
    });
  });

  // this method will run whenever a different set of data is passed
  const update = (props) => {
    ticketKey = `Designer Ticket ${
      selectedGroup.charAt(0).toUpperCase() + selectedGroup.slice(1)
    }`;
    const { newData, designer } = props;
    // set the new data properties
    data = newData;
    // update the metrics card glance
    updateMetricsCards(data, ["layout", "standard", "edit"]);
    // update the ad times cards
    updateAdCards(data);
    updateTable();
    // update the chart if one exists
    // if no chart exists, then create one

    // Add Weighted and Unweighted ticket data
    data = calcDesignerValue(data);
    // Update section names to show the designer's name
    let nameDisplay = designer.split(" ")[0];
    nameDisplay += "'s";
    designerHeaders.forEach((el) => {
      el.innerText = nameDisplay;
    });
    // previous chart deletion occuring within chart component
    metricsChart = new MultipleLinesChart({
      data: data,
      designer: designer,
      dataType: dataValue,
      container: METRIC_CHART_CONTAINER,
      xProp: "Week",
      yProp: METRICS_NAMES[dataValue],
      yOffset: METRICS_LINE_SCALEOFFSET[dataValue],
      svgHeight: svgChartHeight + 50,
      svgWidth: svgChartWidth * 0.9,
      legendKeys: METRICS_RAMP_LEGEND[dataValue],
    });

    barChart = new GroupedBarChart({
      data: data,
      chartTitle: `Number of Tickets Ramp Chart - ${
        TEAM_TICKET_RAMP_AVG[0].toUpperCase() +
        TEAM_TICKET_RAMP_AVG.substring(1)
      }`,
      subgroups: [ticketKey, TEAM_TICKET_RAMP_AVG],
      container: METRIC_BAR_CHART_CONTAINER,
      xProp: "Week",
      yProp: TEAM_TICKET_RAMP_AVG,
      selectedGroup: ticketKey, // <-- this will need to change on tab press
      yLabel: "Number of Tickets",
      xLabel: "Week Range",
      legendKeys: [`${designer} Ticket`, "Avg Ramp Tickets"],
      svgHeight: svgBarChartHeight + 20,
      svgWidth: svgBarChartWidth,
      chartWidth: svgChartWidth - 500,
      chartHeight: svgChartHeight * 0.65,
      barPadding: 0,
      tickLines: false,
      tooltipKey: "Tickets",
    });
  };
  // this method will be called and update the Designer Time Cards
  const updateMetricsCards = (data, keyNames) => {
    let startTime, endTime;
    let designer_time, team_ramp;
    // start and end week for the selected designer
    const startWeek = data[0]["Week"];
    const endWeek = data[data.length - 1]["Week"];
    // add date comparison card data
    for (let key of keyNames) {
      const container = document.querySelector(
        `.metrics-card.${key} #metric-card-data`
      );
      // clear the section
      container.innerHTML = "";
      designer_time = data[data.length - 1][METRICS_NAMES[key][0]];
      team_ramp = data[data.length - 1][METRICS_NAMES[key][1]];
      // IT IS IMPORTANT THAT DESIGNER KEY NAME INDEX IS IN POS 0 IN THE CONFIG FILE
      startTime = data[0][METRICS_NAMES[key][0]];
      endTime = data[data.length - 1][METRICS_NAMES[key][0]];
      //* Fixed - Added 2023 metric data
      updateSingleMetricCard({
        key: key,
        valTwo: endTime,
        valOne: startTime,
        message: `from Week ${startWeek} vs Week ${endWeek}`,
        container,
      });

      // add benchmark comparitison data
      updateSingleMetricCard({
        key: key, // use this to target class container
        valTwo: designer_time,
        valOne: team_ramp,
        message: "than Ramp Average",
        container,
      });

      //* Handle innacurate data if RAMP data exceeds 52 weeks
      if (endWeek >= 52) {
        container.innerHTML = `
        <p class="ramp-error"> 
          <i class="fa-solid fa-triangle-exclamation"></i>
          RAMP data after 52 weeks is inapplicable
        </p>
        `;
      }
    }
  };
  const updateSingleMetricCard = (props) => {
    let deltaInfo = {};
    const { key, valOne, valTwo, message, container } = props;
    if (valTwo > valOne) {
      let diff = ((valTwo - valOne) / valTwo) * 100;
      deltaInfo = {
        diff: Math.round(diff),
        pos: "down",
      };
      // faster
    } else {
      let diff = ((valOne - valTwo) / valOne) * 100;
      deltaInfo = {
        diff: Math.round(diff),
        pos: "up",
      };
    }
    deltaSection({
      container,
      percent: deltaInfo.diff,
      message,
      deltaPos: deltaInfo.pos,
    });
    document.querySelector(`#card-${key}-val`).innerText = valTwo.toFixed(2);
  };
  const deltaSection = (props) => {
    const { container, percent, deltaPos, message } = props;
    const div = document.createElement("div");
    div.innerHTML = `
        <div class="card-content">
        <div class="layout delta ${deltaPos}"></div>  
        <div class="card-content-text">
          <span class="percent"
          >${percent}% &nbsp;</span>
          <span>${deltaPos === "up" ? " Faster" : " Slower"}</span>
          <span class="message">${message}</span>
        </div>
        </div>
       
      `;
    container.appendChild(div);
  };
  const updateAdCards = (data) => {
    const ticketData = [];
    const _data = data[data.length - 1]; // grabbing only the last week of data
    const adCards = document.querySelectorAll(".num-ad-card .ad-card-val");
    let actual = 0,
      weighted = 0,
      ramp = 0;

    // sum all the tickets within the selected date range
    data.forEach((wk) => {
      ramp += wk[TEAM_TICKET_RAMP_AVG];
      DESIGNER_TICKET_KEYNAMES.forEach((key) => {
        actual += _data[key];
        weighted += _data[key] / DESIGNER_TICKET_VALUES[key];
      });
    });

    ticketData.push(Math.round(actual));
    ticketData.push(Math.round(weighted));
    ticketData.push(Math.round(ramp));
    // order will be team Avg weight, Designer weight, Designer actual
    // push average Team Ticket data to array
    // ticketData.push(_data[TEAM_TICKET_RAMP_AVG]);

    // add designer's weighted and unweighted data to array
    // calculate actual numbers
    // let actual = 0;
    // let weighted = 0;
    // DESIGNER_TICKET_KEYNAMES.forEach((key) => {
    //   actual += _data[key];
    //   weighted += _data[key] / DESIGNER_TICKET_VALUES[key];
    // });
    // ticketData.push(Math.round(weighted)); // rounding off to avoid having decimals
    // ticketData.push(actual);
    adCards.forEach((el, idx) => {
      el.innerText = Math.round(Number(ticketData[idx]));
    });
  };

  const updateTable = () => {
    const row = METRICS_TABLE_HEADERS;
    // remove previous data
    document
      .querySelectorAll("div.grid-row.body:not(.header-sub)")
      .forEach((el) => el.remove());
    data.forEach((d) => {
      let ticketTotal = 0,
        weightedTotal = 0;
      // add up all the tickets
      DESIGNER_TICKET_KEYNAMES.forEach((key) => {
        let value = d[key];
        ticketTotal += value;
        weightedTotal += value / DESIGNER_TICKET_VALUES[key];
      });
      weightedTotal = Math.round(weightedTotal * 100) / 100;
      const div = document.createElement("div");
      div.classList.add("grid-row");
      div.classList.add("body");
      div.innerHTML = `
        <div class="week-col">
        <span>${d["Week"]}</span>
      </div>
      <div>
        <span class="${
          d[row.ad_time_designer] > d[row.ad_time_ramp] * 1.15 &&
          "negative-color"
        }">${d[row.ad_time_designer]}</span>
        <span>${d[row.ad_time_ramp]}</span>
      </div>
      <div>
        <span class="${
          d[row.standard_time_designer] > d[row.standard_time_ramp] * 1.15 &&
          "negative-color"
        }">${d[row.standard_time_designer]}</span>
        <span>${d[row.standard_time_ramp]}</span>
      </div>
      <div>
        <span class="${
          d[row.layout_time_designer] > d[row.layout_time_ramp] * 1.15 &&
          "negative-color"
        }">${d[row.layout_time_designer]}</span>
        <span>${d[row.layout_time_ramp]}</span>
      </div>
      <div>
        <span class="${
          d[row.edit_time_designer] > d[row.edit_time_ramp] * 1.15 &&
          "negative-color"
        }">${d[row.edit_time_designer]}</span>
        <span>${d[row.edit_time_ramp]}</span>
      </div>
      <div class="ads-table">
        <span>${Math.round(ticketTotal)}</span>
        <span>${Math.round(weightedTotal)}</span>
        <span>${d[row.total_tickets_ramp]}</span>
      </div>
    `;
      table.append(div);
    });
  };

  // when ckcukating, we will ALREADY define both weighted and unweightted results, the use the selectedGroup prop to then modify which data to display
  const calcDesignerValue = (data) => {
    data.forEach((d) => {
      let weighted = 0,
        unweighted = 0;
      DESIGNER_TICKET_KEYNAMES.forEach((name) => {
        weighted += d[name] / DESIGNER_TICKET_VALUES[name];
        unweighted += d[name];
      });
      d["Designer Ticket Weighted"] = Math.round(weighted * 10) / 10;
      d["Designer Ticket Unweighted"] = Math.round(unweighted * 10) / 10;
    });
    return data;
  };

  // return functions we want to use outside this scope here
  return {
    update,
  };
};
