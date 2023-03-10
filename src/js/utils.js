// Helper functions for index file go here

// filter array into new designers only
const filterNewDesigners = (data, limit) => {
  let rangeLimit = Infinity;
  const WHITELIST = ["Ny N", "John B", "Sarah C", "Total", "Carrie S"];
  const designers = {};
  let listDesigners = [];
  data.forEach((item) => {
    if (designers[item["Designers"]]) {
      designers[item["Designers"]]["val"]++;
      designers[item["Designers"]]["date"] = item.Date;
    } else {
      designers[item["Designers"]] = {
        val: 1,
        date: item.Date,
      };
    }
  });

  // set a limit for designers if one is present and filter out designers that do much meet criteria
  if (limit) {
    for (let name in designers) {
      const {val} = designers[name];
      if (val > limit) {
        delete designers[name];
      }
    }
  }

  for (let key in designers) {
    // checks if designer is active, otherise won't show name
    const then = new Date(designers[key].date);
    const now = new Date();

    const msBetweenDates = Math.abs(then.getTime() - now.getTime());
    const daysBetweenDates = msBetweenDates / (24 * 60 * 60 * 1000);

    if (
      !WHITELIST.includes(key) &&
      designers[key].val >= 5 &&
      daysBetweenDates < 30
      // designers[key].val < limit
    ) {
      listDesigners.push(key);
    }
  }
  listDesigners = listDesigners.sort();
  return listDesigners;
};

// dynamically adds designer names to dropdwn menu
const populateDropdown = (dropdownMenu, data, filter) => {
  // resets the dropwdown designer menu
  dropdownMenu.innerHTML = "";
  if (filter) {
    data = data.filter((str) =>
      str.toLowerCase().includes(filter.toLowerCase())
    );
  }
  data.map((name) => {
    const li = document.createElement("li");
    li.setAttribute("data-value", name);
    li.innerText = name;
    dropdownMenu.appendChild(li);
  });
};

// handle loading function
const handleLoading = (setLoading, selector) => {
  setLoading === true
    ? selector.classList.add("loaderActive")
    : selector.classList.remove("loaderActive");
};

// shows valid ramp data range for designer
const displayUsableData = (selector, data) => {
  const rampRange = data.slice(0, 51);
  const start = rampRange[0]["Date"];
  const end = rampRange[rampRange.length - 1]["Date"];
  selector.innerText = `Available Ramp dates are ${start.toLocaleDateString(
    "en-US",
    { day: "2-digit", month: "2-digit", year: "2-digit" }
  )} - ${end.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  })}`;
};

const displayError = (selector, message) => {
  selector.className += " snackbar-active";
  selector.innerText = message;
  setTimeout(() => {
    selector.classList.remove("snackbar-active");
    selector.innerText = "";
  }, 4000);
};

const initComponentToggle = () => {
  document.querySelectorAll(".section-btn").forEach((el) => {
    el.addEventListener("click", function () {
      this.classList.toggle("section-btn-toggle");
      // button should have an id, use that id to target it's respective section
      document
        .querySelector(`.overflow-content.${this.id}`)
        .classList.toggle("section-hide");
    });
  });
};

// Update print menu
const updatePrintMenu = (container, type) => {
  // clear current form
  container.innerHTML = "";
  document.querySelectorAll(".overflow-container").forEach((el) => {
    const text = el.id.replaceAll("_", " ");
    const div = document.createElement("div");
    div.innerHTML = `
    <input type="checkbox" value=${el.id} name=${el.id} />
    <label for=${el.id}>${text}</>
    `;
    container.appendChild(div);
  });
};

// Update active button for Chart Tabe selectors
const handleChartBtn = (group, select) => {
  group.forEach((el) => {
    el.classList.remove("chart-btn-active");
  });
  select.target.classList.add("chart-btn-active");
};
