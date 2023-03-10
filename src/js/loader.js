// This file handles the loading and mutation of the server data
const Loader = (snackbar, displayError) => {
  const designersColNames = [
    DESIGNER_STANDARD,
    DESIGNER_LAYOUT,
    DESIGNER_EDIT,
    DESIGNER_NEW_AD_TIME,
    DESIGNER_STANDARD_TICKETS,
    DESIGNER_LAYOUT_TICKETS,
    DESIGNER_SIMPLE_TICKETS,
  ];
  const fetchBeamData = () => {
    return new Promise((resolve) =>
      google.script.run
        .withSuccessHandler((data) => {
          resolve(handleBEAMData(data));
        })
        .getBeamData()
    );
  };

  const fetchMetricsData = () => {
    return new Promise((resolve) =>
      google.script.run
        .withSuccessHandler((data) => {
          resolve(data);
        })
        .getMetricData()
    );
  };

  const handleBEAMData = (beamData) => {
    beamData[BEAMD_ALL_DATA].designer_data.forEach((d) => {
      d["date"] = new Date(d["date"]);
    });
    return beamData;
  };

  const handleMetrics = (data) => {
    const { filteredMetrics, ramp_data, num_tickets_ramp } = data;
    const last_ramp_date = ramp_data[ramp_data.length - 1];
    let formatted = filteredMetrics;
    formatted.forEach((d, idx) => {
      d["Date"] = new Date(d["Date"]);
      d["Week"] = idx + 1;
    });
    formatted = handleEmptyValues(formatted);
    // add ticket and ramp data onto filterMetrics
    formatted = addData(formatted, ramp_data);
    formatted = addData(formatted, num_tickets_ramp);
    // Handle empty ramp data after 52 weeks
    formatted = handleEmptyRamp(formatted, last_ramp_date);
    formatted.forEach((item) => {
      for (let key in METRIC_BENCHMARK) {
        item[key] = METRIC_BENCHMARK[key];
      }
    });
    return formatted;
  };

  const handleEmptyValues = (data) => {
    let tempData = data;
    let lastVal;
    designersColNames.forEach((col) => {
      let idxToUpdate = [];
      data.forEach((val, idx) => {
        //* Handle case where value does not exist
        if (!val.hasOwnProperty(col) || val[col] === 0 || val[col] === "") {
          idxToUpdate.push(idx); // if there is a 0 value detected, push that index to the array
        } else if (val[col] > 0 && idxToUpdate.length > 0) {
          idxToUpdate.forEach((idx) => {
            tempData[idx][col] = val[col];
          });
          idxToUpdate = [];
          lastVal = val[col];
        } else {
          lastVal = val[col];
        }
      });
      // handle tail end empty values
      if (idxToUpdate.length > 0) {
        idxToUpdate.forEach((idx) => {
          tempData[idx][col] = lastVal;
        });
      }
    });

    return tempData;
  };

  const handleEmptyRamp = (data, ramp) => {
 //* Handle empty ramp data when designer data exceeds 52 weeks
    if (data[data.length - 1]["Week"] > 51) {
      let last_ramp_idx = -1;
      // find index of last item
      for (let i = 0; i < data.length; i ++) {
        if (data[i]["Week"] >= 51) {
          last_ramp_idx = i;
          break;
        }
      }

      if (last_ramp_idx >= 0) {
         for (let i = last_ramp_idx; i < data.length; i ++) {
          let current_property = data[i];
          Object.keys(ramp).map((key) => {
            if (key !== "Week") {
              current_property[key] = ramp[key]
            } 
          });
         };
      };
      return data;
    } ;
    // Data does not exceed 52 weeks, can return
    return data;
  }

  const addData = (data1, data2) => {
    var formattedData = data1;
    // both data sets are array of objects;
    for (var i = 0; i < data2.length; i++) {
      if (i < formattedData.length) {
        for (let rampVal in data2[i]) {
          // as this function will be used to add data from other sheets ad sources, need to ommit the addition of Week key
          if (rampVal !== "Week") {
            formattedData[i][rampVal] = data2[i][rampVal];
          }
        }
      } else {
        break;
      }
    }
    if (formattedData.length > data2.length) {
      // add zero ramp values to remainder of data
      for (var i = data2.length - 1; i < formattedData.length; i++) {
        for (let rampVal in data2[0]) {
          // as this function will be used to add data from other sheets ad sources, need to ommit the addition of Week key
          if (rampVal !== "Week") {
            formattedData[i][rampVal] = 0;
          }
        }
      }
    }

    return formattedData;
  };

  // filters data by usable data
  const filterByDate = (data, key, start, end, optional = false) => {
    data = data.filter((d) => new Date(d[key]) > new Date(start));
    data = data.filter((d) => new Date(d[key]) < new Date(end));
    if (data.length > 0) {
      return data;
    } else {
      if (optional) {
        return false;
      } else {
         throw new Error("No Data within Selected Dates");
      }
    }
  };

  const filterDatasetByDate = (data, start, end) => {
    const { filteredMetrics, beam_data } = data;
    // create a copy of the response data so that we can change the values without destroying original source
    let formattedMetricsData = JSON.parse(JSON.stringify(filteredMetrics));
    let formattedBeamData = JSON.parse(JSON.stringify(beam_data));
    //an error will occur if data is not existing withing targeted date range
    try {
      formattedMetricsData = filterByDate(
        formattedMetricsData,
        "Date",
        start,
        end
      );
      formattedBeamData[BEAMD_ALL_DATA].designer_data = filterByDate(
        formattedBeamData[BEAMD_ALL_DATA].designer_data,
        "date",
        start,
        end,
        true
      );
     return { formattedMetricsData, formattedBeamData };
    } catch (error) {
      return displayError(snackbar, error.message);
    }
  };

  return {
    fetchMetricsData,
    fetchBeamData,
    handleMetrics,
    filterDatasetByDate,
  };
};
