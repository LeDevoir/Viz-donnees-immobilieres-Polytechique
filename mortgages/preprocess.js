/**
 * Extracts the minimum and maximum dates from the data.
 *
 * @param {object[]} data The data to analyze
 * @returns {object} An object with the min and max dates
 */
function getDateRange(data) {
  const dates = data.map((d) => new Date(d.DT_DEBUT_MOIS));
  const minDate = new Date(Math.min(...dates));
  const maxDate = new Date(Math.max(...dates));
  return { minDate, maxDate };
}

/**
 * Filters the data by the given years and months.
 *
 * @param {object[]} data The data to filter
 * @param {number} startYear The start year (inclusive)
 * @param {number} endYear The end year (inclusive)
 * @param {number} startMonth The start month (1-12)
 * @param {number} endMonth The end month (1-12)
 * @returns {object[]} The filtered data
 */
function filterYearsAndMonths(data, startYear, endYear, startMonth, endMonth) {
  return data.filter((d) => {
    const date = new Date(d.DT_DEBUT_MOIS);
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1; // getUTCMonth() returns 0-11, so we add 1 to make it 1-12

    const isYearInRange = year >= startYear && year <= endYear;
    let isMonthInRange = false;

    if (year === startYear && year === endYear) {
      isMonthInRange = month >= startMonth && month <= endMonth; // Special case where start and end year are the same
    } else if (year === startYear) {
      isMonthInRange = month >= startMonth;
    } else if (year === endYear) {
      isMonthInRange = month <= endMonth;
    } else {
      isMonthInRange = true;
    }

    return isYearInRange && isMonthInRange;
  });
}

// Example preprocess.js functions
function filterRegions(rawData, regionIds) {
  return rawData.filter((d) =>
    regionIds.includes(d.ID_REGN_ADMIN.toString().padStart(3, "0")),
  );
}

/**
 * Prepares the stacked data for the chart.
 *
 * @param {object[]} rawData The raw data to prepare
 * @param {string[]} regionIdsWanted The IDs of the regions to include
 * @param {number} startYear The start year for filtering
 * @param {number} endYear The end year for filtering
 * @param {number} startMonth The start month for filtering
 * @param {number} endMonth The end month for filtering
 * @returns {object[]} The prepared stacked data
 */
function prepareStackedData(
  rawData,
  regionIdsWanted,
  startYear,
  endYear,
  startMonth,
  endMonth,
) {
  const filteredData = filterYearsAndMonths(
    rawData,
    startYear,
    endYear,
    startMonth,
    endMonth,
  );
  const data = filterRegions(filteredData, regionIdsWanted);
  const groupedData = d3.group(data, (d) => new Date(d.DT_DEBUT_MOIS));

  const stackedData = Array.from(groupedData, ([key, values]) => {
    const entry = { date: key };
    values.forEach((regionData) => {
      entry[regionData.ID_REGN_ADMIN] = regionData.NB_REQST;
    });
    return entry;
  });

  return stackedData;
}
