// interaction.js

function populateDropdown(regionIdsWanted, addRegionCallback) {
  const dropdown = document.getElementById("region-select");

  const availableRegions = allRegions
    .filter((region) => !regionIdsWanted.includes(region))
    .sort();

  dropdown.innerHTML = `<option value="" disabled selected>Régions administratives</option>`;

  availableRegions.forEach((region) => {
    const option = document.createElement("option");
    option.value = region;
    option.textContent = `${regionsMap[region]}`;
    dropdown.appendChild(option);
  });

  dropdown.addEventListener("change", (event) => {
    const selectedRegion = event.target.value;
    addRegionCallback(selectedRegion);
    const selectedOption = dropdown.querySelector(
      `option[value="${selectedRegion}"]`,
    );
    if (selectedOption) selectedOption.remove();
    dropdown.value = ""; // Reset to placeholder
  });

  updateSelectedRegions(regionIdsWanted, addRegionCallback);
}

function addRegion(regionId, regionIdsWanted, removeRegionCallback) {
  if (!regionIdsWanted.includes(regionId)) {
    regionIdsWanted.push(regionId);
    regionIdsWanted.sort(); // Sort the list after adding a new region

    populateDropdown(regionIdsWanted, removeRegionCallback);
    updateSelectedRegions(regionIdsWanted, removeRegionCallback);
  }
}

function removeRegion(regionId, regionIdsWanted, removeRegionCallback) {
  const index = regionIdsWanted.indexOf(regionId);
  if (index > -1) {
    regionIdsWanted.splice(index, 1);

    populateDropdown(regionIdsWanted, removeRegionCallback);
  }
  updateSelectedRegions(regionIdsWanted, removeRegionCallback);
}

function updateSelectedRegions(regionIdsWanted, removeRegionCallback) {
  const container = document.querySelector(".selected-regions");
  container.innerHTML = "";

  regionIdsWanted.forEach((regionId) => {
    const div = document.createElement("div");
    div.className = "flex p-2 justify-between";
    div.style.backgroundColor = colorMap[regionId];

    const span = document.createElement("span");
    span.textContent = `${regionsMap[regionId]}`;

    const button = document.createElement("button");
    button.textContent = "x";
    button.className = "btn btn-ghost btn-xs";
    button.addEventListener("click", () => {
      removeRegionCallback(regionId);
    });

    div.appendChild(span);
    div.appendChild(button);
    container.appendChild(div);
  });
}

function setDateFilters(callback, minDate, maxDate) {
  const startYearSelect = document.getElementById("start-year");
  const endYearSelect = document.getElementById("end-year");
  const startMonthSelect = document.getElementById("start-month");
  const endMonthSelect = document.getElementById("end-month");

  // Clear previous options
  startYearSelect.innerHTML = "";
  endYearSelect.innerHTML = "";
  startMonthSelect.innerHTML = "";
  endMonthSelect.innerHTML = "";

  // Populate the year dropdowns with the range from minDate to maxDate
  for (
    let year = minDate.getUTCFullYear();
    year <= maxDate.getUTCFullYear();
    year++
  ) {
    const startOption = document.createElement("option");
    startOption.value = year;
    startOption.textContent = year;
    startYearSelect.appendChild(startOption);

    const endOption = document.createElement("option");
    endOption.value = year;
    endOption.textContent = year;
    endYearSelect.appendChild(endOption);
  }

  // Populate the month dropdowns with all months
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  months.forEach((month, index) => {
    const startOption = document.createElement("option");
    startOption.value = index + 1; // Months are 1-12
    startOption.textContent = month;
    startMonthSelect.appendChild(startOption);

    const endOption = document.createElement("option");
    endOption.value = index + 1; // Months are 1-12
    endOption.textContent = month;
    endMonthSelect.appendChild(endOption);
  });

  // Function to update the available end months based on the selected end year
  function updateEndMonths() {
    const selectedEndYear = parseInt(endYearSelect.value, 10);
    const selectedEndMonth = parseInt(endMonthSelect.value, 10);
    const maxEndMonth =
      selectedEndYear === maxDate.getUTCFullYear()
        ? maxDate.getUTCMonth() + 1
        : 12;
    endMonthSelect.innerHTML = ""; // Clear previous options

    for (let i = 0; i < maxEndMonth; i++) {
      const option = document.createElement("option");
      option.value = i + 1;
      option.textContent = months[i];
      endMonthSelect.appendChild(option);
    }

    // Set the end month to the previously selected month if it's still valid, otherwise to the last available month
    if (selectedEndMonth <= maxEndMonth) {
      endMonthSelect.value = selectedEndMonth;
    } else {
      endMonthSelect.value = maxEndMonth;
    }
  }

  function updateFilters() {
    const startYear = parseInt(startYearSelect.value, 10);
    const endYear = parseInt(endYearSelect.value, 10);
    const startMonth = parseInt(startMonthSelect.value, 10);
    const endMonth = parseInt(endMonthSelect.value, 10);
    callback(startYear, endYear, startMonth, endMonth);
  }

  startYearSelect.addEventListener("change", updateFilters);
  endYearSelect.addEventListener("change", () => {
    updateEndMonths();
    updateFilters();
  });
  startMonthSelect.addEventListener("change", updateFilters);
  endMonthSelect.addEventListener("change", updateFilters);

  // Set default values
  startYearSelect.value = minDate.getUTCFullYear();
  endYearSelect.value = maxDate.getUTCFullYear();
  startMonthSelect.value = minDate.getUTCMonth() + 1;
  updateEndMonths();

  // Set the default end month to the last available month
  if (endYearSelect.value === maxDate.getUTCFullYear().toString()) {
    endMonthSelect.value = maxDate.getUTCMonth() + 1;
  }

  updateFilters();
}
