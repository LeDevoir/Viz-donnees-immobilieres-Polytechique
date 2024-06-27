function populateDropdown(regionIdsWanted, addRegionCallback) {
  const dropdown = document.getElementById("region-select");

  const availableRegions = allRegions
    .filter((region) => !regionIdsWanted.includes(region))
    .sort();

  dropdown.innerHTML = `<option value="" disabled selected>Régions administratives</option>`;
  dropdown.innerHTML += `<option value="all">Tout sélectionner</option>`;

  availableRegions.forEach((region) => {
    const option = document.createElement("option");
    option.value = region;
    option.textContent = `${regionsMap[region]}`;
    dropdown.appendChild(option);
  });

  dropdown.addEventListener("change", (event) => {
    const selectedRegion = event.target.value;
    if (selectedRegion === "all") {
      selectAllRegions(regionIdsWanted, addRegionCallback);
    } else {
      addRegionCallback(selectedRegion);
      const selectedOption = dropdown.querySelector(
        `option[value="${selectedRegion}"]`,
      );
      if (selectedOption) selectedOption.remove();
    }
    dropdown.value = ""; // Reset to placeholder
  });

  updateSelectedRegions(regionIdsWanted, addRegionCallback);
}

function selectAllRegions(regionIdsWanted, addRegionCallback) {
  const regionsToAdd = allRegions.filter(
    (region) => !regionIdsWanted.includes(region),
  );
  regionsToAdd.forEach((region) => addRegionCallback(region));
}

function displayPositiveSign(number) {
  if (number > 0) {
    return "+";
  }
  return "";
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
    div.className = "flex p-1.5 justify-between";
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
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
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

function setMarkerFilters(callback, minDate, maxDate) {
  const markerStartYearSelect = document.getElementById("marker-start-year");
  const markerEndYearSelect = document.getElementById("marker-end-year");
  const markerStartMonthSelect = document.getElementById("marker-start-month");
  const markerEndMonthSelect = document.getElementById("marker-end-month");

  // Clear previous options
  markerStartYearSelect.innerHTML = "";
  markerEndYearSelect.innerHTML = "";
  markerStartMonthSelect.innerHTML = "";
  markerEndMonthSelect.innerHTML = "";

  // Populate the year dropdowns with the range from minDate to maxDate
  for (
    let year = minDate.getUTCFullYear();
    year <= maxDate.getUTCFullYear();
    year++
  ) {
    const startOption = document.createElement("option");
    startOption.value = year;
    startOption.textContent = year;
    markerStartYearSelect.appendChild(startOption);

    const endOption = document.createElement("option");
    endOption.value = year;
    endOption.textContent = year;
    markerEndYearSelect.appendChild(endOption);
  }

  // Populate the month dropdowns with all months
  const months = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ];
  months.forEach((month, index) => {
    const startOption = document.createElement("option");
    startOption.value = index + 1; // Months are 1-12
    startOption.textContent = month;
    markerStartMonthSelect.appendChild(startOption);

    const endOption = document.createElement("option");
    endOption.value = index + 1; // Months are 1-12
    endOption.textContent = month;
    markerEndMonthSelect.appendChild(endOption);
  });

  // Function to update the available end months based on the selected end year
  function updateMarkerEndMonths() {
    const selectedEndYear = parseInt(markerEndYearSelect.value, 10);
    const selectedEndMonth = parseInt(markerEndMonthSelect.value, 10);
    const maxEndMonth =
      selectedEndYear === maxDate.getUTCFullYear()
        ? maxDate.getUTCMonth() + 1
        : 12;
    markerEndMonthSelect.innerHTML = ""; // Clear previous options

    for (let i = 0; i < maxEndMonth; i++) {
      const option = document.createElement("option");
      option.value = i + 1;
      option.textContent = months[i];
      markerEndMonthSelect.appendChild(option);
    }

    // Set the end month to the previously selected month if it's still valid, otherwise to the last available month
    if (selectedEndMonth <= maxEndMonth) {
      markerEndMonthSelect.value = selectedEndMonth;
    } else {
      markerEndMonthSelect.value = maxEndMonth;
    }
  }

  function updateMarkerFilters() {
    const markerStartYear = parseInt(markerStartYearSelect.value, 10);
    const markerEndYear = parseInt(markerEndYearSelect.value, 10);
    const markerStartMonth = parseInt(markerStartMonthSelect.value, 10);
    const markerEndMonth = parseInt(markerEndMonthSelect.value, 10);
    callback(markerStartYear, markerEndYear, markerStartMonth, markerEndMonth);
  }

  markerStartYearSelect.addEventListener("change", updateMarkerFilters);
  markerEndYearSelect.addEventListener("change", () => {
    updateMarkerEndMonths();
    updateMarkerFilters();
  });
  markerStartMonthSelect.addEventListener("change", updateMarkerFilters);
  markerEndMonthSelect.addEventListener("change", updateMarkerFilters);

  // Set default values
  markerStartYearSelect.value = minDate.getUTCFullYear();
  markerEndYearSelect.value = maxDate.getUTCFullYear();
  markerStartMonthSelect.value = minDate.getUTCMonth() + 1;
  updateMarkerEndMonths();

  // Set the default end month to the last available month
  if (markerEndYearSelect.value === maxDate.getUTCFullYear().toString()) {
    markerEndMonthSelect.value = maxDate.getUTCMonth() + 1;
  }

  updateMarkerFilters();
}
