const Quality = () => {
  const BEAM_CHART_CONTAINER = ".quality #svg-beam-graph";
  let beamData = {};
  let dataValue = "overall";
  let beamChart;
  let selectedDesigner;
  const width = document.querySelector(BEAM_CHART_CONTAINER).offsetWidth;
  const height = document.querySelector(BEAM_CHART_CONTAINER).offsetHeight;
  const qualityChartContainer = document.querySelector(BEAM_CHART_CONTAINER);
  const designerHeaders = document.querySelectorAll(".designer-name");
  const beamChartBtns = document.querySelectorAll(".beam-btn");
  const designerDesignGrade = document.querySelector("#beamd-design-grade");
  const designerDesignDelta = document.querySelector("#beamd-design-delta");
  const designerNumTickets = document.querySelector("#beamd-num-tickets");
  const beamdTable = document.querySelector("#table-content");
  const noDataMsg = document.getElementById("no-grade-data");
  const adsImprovementContent = document.querySelector(
    "#ad-improvement-content"
  );
  const improvementContent = document.querySelector("#improvement-content");
  const exceptionalContent = document.querySelector("#exceptional-ads");

  const dataSelect = {
    overall: ["designerTotal", "teamTotal"],
    time_range: ["designerRange", "teamRange"],
  };

  // initialize Quality DOME
  beamChartBtns.forEach((el) => {
    el.addEventListener("click", (event) => {
      event.preventDefault();
      // need to remove all instances of active button
      handleChartBtn(beamChartBtns, event);
      dataValue = event.target.id;
      // only rerender with data updates if chart has been initially rendered
      if (beamChart) {
        beamChart.update({
          selected: dataValue,
          newGroup: dataSelect[dataValue],
          legendKeys: legendKeyNames(dataSelect[dataValue]),
        });
      }
    });
  });

  //data = quality_dummy; // test data

  const updateDesignCards = (data) => {
    let pos, diff;
    const grade = data[D_VAL].designerRange;
    const teamGrade = data[D_VAL].teamRange;
    const numTickets = data.numTickets;
    designerDesignGrade.innerText = `${grade} / 5`;
    designerNumTickets.innerText = numTickets;

    pos = grade > teamGrade ? "up" : "down";
    if (pos === "up") {
      diff = Math.round((teamGrade / grade) * 100) / 100;
      diff = +(1 - diff).toFixed(2) * 100;
    } else {
      diff = Math.round((grade / teamGrade) * 100) / 100;
      diff = +(1 - diff).toFixed(2) * 100;
    }
    designerDesignDelta.innerHTML = `
      <div class="delta ${pos}"></div>
      <div class="card-desc">
        <span>${Math.round(diff)}% ${pos === "up" ? "faster" : "slower"}</span>
        <span class="text-small">vs Team Average</span>
      </div>
    `;
  };

  const updateGradeCards = (data) => {
    let hasData = false;
    // hide exceptional card by default
    // if (!exceptionalCard.classList.contains("hidden")) {
    //   exceptionalCard.classList.add("hidden");
    // }
    // remove no data message by default
    //noDataMsg.classList.remove("noData");

    adsImprovementContent.innerHTML = "";
    exceptionalContent.innerHTML = "";
    improvementContent.innerHTML = "";

    if (data["improvements"].length > 0) {
      hasData = true;
      data["improvements"].forEach((item, idx) => {
        const div = document.createElement("div");
        div.classList.add("table-row");
        div.classList.add("category_ad");
        div.innerHTML = `
        <span>
        ${idx + 1}.
          <a href="${item.gallery}" target="_blank"> Link</a>
        </span>
        <span class="name">${item.type.join(", ")}</span>
        `;
        improvementContent.classList.add('rendered');
        improvementContent.append(div);
      });
      for (let key in data["improvementsCounter"]) {
        const div = document.createElement("div");
        div.classList.add("table-row");
        div.classList.add("category_qty");
        div.innerHTML = `
          <span class="name">${key}</span>
          <span>${data["improvementsCounter"][key]}</span>
        `;
        adsImprovementContent.classList.add('rendered');
        adsImprovementContent.append(div);
      }
    } else {
      adsImprovementContent.innerHTML = noDataMessage();
      improvementContent.innerHTML = noDataMessage();
    }
    if (data["isExceptional"]) {
      hasData = true;
      //exceptionalCard.classList.remove("hidden");
      data["exceptional"].forEach((item, idx) => {
        const div = document.createElement("div");
        div.classList.add("table-row");
        div.classList.add("category_exceptional");
        div.innerHTML = `
         <span class="name">${item.type}</span>
        <span>
        ${idx + 1}.
          <a href="${item.gallery}" target="_blank"> Link</a>
        </span>
      `;
      exceptionalContent.classList.add('rendered');
        exceptionalContent.append(div);
      });
    } else {
      exceptionalContent.innerHTML = noDataMessage();
    }
    // if (
    //   adsImprovementContent.innerHTML === "" &&
    //   exceptionalContent.innerHTML === "" &&
    //   improvementContent.innerHTML === ""
    // ) {
    //   noDataMsg.classList.add("noData");
    // }
    // if (!hasData) {
    //   noDataMsg.classList.add("noData");
    // }
  };

  const updateBeamdTable = (data, designer) => {
    const keys = {
      designerRange: `${designer.split(" ")[0]}'s Avg within Date Range`,
      designerTotal: `${designer.split(" ")[0]}'s Overall Grade`,
      teamTotal: "Teams' overall Average",
    };
    beamdTable.innerHTML = "";
    for (let key in keys) {
      const div = document.createElement("div");
      div.classList.add("grid-row");
      div.innerHTML = `
      <div>${keys[key]}</div>
        <div>${
          beamData.scores[0][key] === 0 ? "NA" : beamData.scores[0][key]
        }</div>
        <div>${
          beamData.scores[1][key] === 0 ? "NA" : beamData.scores[1][key]
        }</div>
        <div>${
          beamData.scores[2][key] === 0 ? "NA" : beamData.scores[2][key]
        }</div>
        <div>${
          beamData.scores[3][key] === 0 ? "NA" : beamData.scores[3][key]
        }</div>
        <div>${beamData[D_VAL][key]}</div>
      `;
      beamdTable.append(div);
    }
  };

  const handleData = (data, designer) => {
    //let dateRangeScores =
    // initalize beamData object
    let designerData = {};
    designerData["scores"] = [
      { name: "B" },
      { name: "E" },
      { name: "A" },
      { name: "M" },
    ];

    let rangeData;
    // add TOTAL designer scores into beamData
    // add TOTAL TEAM scores into beamData
    // filter data by designer name
    rangeData = crunchDateRangeData(data[BEAMD_ALL_DATA].designer_data);
    // calcDataRangeScores() for designer AND Team Total
    designerData["scores"].forEach((item) => {
      item["designerTotal"] = data[designer].scores[item.name];
      item["teamTotal"] = data["Team"].scores[item.name];
      item["designerRange"] = rangeData[designer].scores[item.name];
      item["teamRange"] = rangeData["Team"].scores[item.name];
    });

    designerData[D_VAL] = {
      designerTotal: data[designer].scores[D_VAL],
      teamTotal: data["Team"].scores[D_VAL],
      designerRange: rangeData[designer].scores[D_VAL],
      teamRange: rangeData["Team"].scores[D_VAL],
    };

    designerData["numTickets"] = rangeData[designer].numTickets;
    designerData["improvements"] = rangeData[designer].improvements;
    designerData["isExceptional"] = rangeData[designer].isExceptional;
    designerData["beamTickets"] = rangeData[designer].beamTickets;
    designerData["improvementsCounter"] =
      rangeData[designer].improvementsCounter;
    designerData["exceptionalCounter"] = rangeData[designer].exceptionalCounter;
    designerData["exceptional"] = rangeData[designer].exceptional;

    return designerData;
  };

  const crunchDateRangeData = (data) => {
    var filtered_BEAMD = {};
    var total_scores = {
      B: 0,
      E: 0,
      A: 0,
      M: 0,
      D: 0,
    };
    // create array with individual Designer names
    var set = [...new Set(data.map((item) => item["designer"]))];
    // remove unwanted ERROR values
    set.splice(set.indexOf("#N/A"), 1);
    // filter out empty name fields
    set = set.filter((item) => item.length > 2);

    // loop over each individual name
    set.forEach((name) => {
      // counter to be used to calculate average
      let counter = 0;
      let designCounter = 0;
      let isExceptional = false;
      let exceptional = [];
      let improvements = [];
      let improvementsCounter = {};
      let exceptionalCounter = {};
      let scores = {
        B: 0,
        E: 0,
        A: 0,
        M: 0,
        D: 0,
      };
      data.forEach((item) => {
        if (item["designer"] === name) {
          // check if it's a Design only row
          if (item["isDesignOnly"]) {
            // We have a Design only entry
            scores.D += +item[D_VAL];

            designCounter++;
            // else if look for data row that contains BEAM data as well
          } else {
            const B = item[B_VAL],
              E = item[E_VAL],
              A = item[A_VAL],
              M = item[M_VAL],
              D = item[D_VAL];

            scores.B += B !== "" ? +B : 0;
            scores.E += E !== "" ? +E : 0;
            scores.A += A !== "" ? +A : 0;
            scores.M += M !== "" ? +M : 0;
            scores.D += D !== "" ? +D : 0;

            counter++;
            designCounter++;
          }

          if (item["isExceptional"]) {
            isExceptional = true;
            exceptional.push({
              type: item["exceptional"],
              gallery: item["gallery"],
            });

            const categories = item["exceptional"]
              .replace(/\s/g, "")
              .split(",");
            // add counters to exceptional coutner
            categories.forEach((i) => {
              if (!exceptionalCounter[i]) {
                exceptionalCounter[i] = 1;
              } else {
                exceptionalCounter[i]++;
              }
            });
          }

          if (item["improvements"].length > 0) {
            item["improvements"].forEach((item) => {
              if (!improvementsCounter[item]) {
                improvementsCounter[item] = 1;
              } else {
                improvementsCounter[item]++;
              }
            });
            improvements.push({
              type: item["improvements"],
              gallery: item["gallery"],
            });
          }
        }
      });
      // calculate average
      for (let key in scores) {
        if (key === D_VAL) {
          var value =
            Math.round((scores[key] / designCounter + Number.EPSILON) * 100) /
            100;
          scores[key] = !isNaN(value) ? value : 0;
        } else {
          var value =
            Math.round((scores[key] / counter + Number.EPSILON) * 100) / 100;
          scores[key] = !isNaN(value) ? value : 0;
        }
      }

      filtered_BEAMD[name] = {
        scores: scores,
        numTickets: designCounter,
        beamTickets: counter,
        isExceptional: isExceptional,
        exceptional: exceptional,
        exceptionalCounter: exceptionalCounter,
        improvements: improvements,
        improvementsCounter: improvementsCounter,
      };
    });

    var beamScoreCounter = {
      B: 0,
      E: 0,
      A: 0,
      M: 0,
      D: 0,
    };

    // Now that we have the averages for All Designers, we can find the Team total
    for (let key in filtered_BEAMD) {
      var current = filtered_BEAMD[key].scores;
      for (let letter in current) {
        if (current[letter] > 0) {
          total_scores[letter] += current[letter];
          beamScoreCounter[letter]++;
        }
      }
    }

    for (let key in total_scores) {
      let value =
        Math.round(
          (total_scores[key] / beamScoreCounter[key] + Number.EPSILON) * 100
        ) / 100;
      total_scores[key] = !isNaN(value) ? value : 0;
    }

    filtered_BEAMD["Team"] = {
      scores: total_scores,
    };

    return filtered_BEAMD;
  };

  const update = (props) => {
    const { designer, data } = props;
    // clear/reset the HTML content
    qualityChartContainer.innerHTML = "";
    // error handler if no BEAM data is present OR if designer data is not present
    if (!data[BEAMD_ALL_DATA].designer_data || !data.hasOwnProperty(designer)) {
      displayError(document.getElementById("snackbar"), "No Beam Data In Date Range");

      qualityChartContainer.innerHTML = noDataMessage();
      adsImprovementContent.innerHTML = noDataMessage();
      improvementContent.innerHTML = noDataMessage();
      exceptionalContent.innerHTML = noDataMessage();

    } else {
    // updates global designer variable
    selectedDesigner = designer;
    beamData = handleData(data, designer);
    let nameDisplay = designer.split(" ")[0];
    nameDisplay += "'s";
    designerHeaders.forEach((el) => {
      el.innerText = nameDisplay;
    });
    // update Design cards
    updateDesignCards(beamData);
    // update beamdTable
    updateBeamdTable(beamData, designer);
    // update botoms improvement cards
    updateGradeCards(beamData);

    // create chart
    beamChart = new GroupedBarChart({
      data: beamData.scores,
      chartTitle: `${designer} Overall Grade`,
      container: BEAM_CHART_CONTAINER,
      xProp: "name",
      yProp: "ramp", // <-- may be a bit redunant here since we will use subgroups
      selectedGroup: dataValue, // <-- this will need to change on tab press
      subgroups: dataSelect[dataValue],
      svgHeight: height,
      svgWidth: width,
      legendKeys: legendKeyNames(dataSelect[dataValue]),
      chartWidth: width - 500,
      chartHeight: height * 0.65,
      barPadding: 0,
      tickLines: false,
      hideLegend: false,
      showBackgroundColor: true,
      yAxisLimit: 3,
      tooltipKey: "Grade",
    });
   };
  };

  const legendKeyNames = (data) => {
    const type = data[0].replace("designer", "");
    return [`${selectedDesigner} ${type}`, `Team ${type}`];
  };

  const noDataMessage = () => {
    return `
    <div class="no-data-msg">
    <i class="fa-solid fa-triangle-exclamation"></i> &nbsp; No Data Available
    </div>
    `
  };

  return { update };
};
