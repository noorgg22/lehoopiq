function getCurrentSeasonYear() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  return month >= 9 ? year + 1 : year;
}

function getCurrentSeasonLabel() {
  const endYear = getCurrentSeasonYear();
  return `${endYear - 1}-${String(endYear).slice(2)}`;
}

function getCurrentSeasonFull() {
  const endYear = getCurrentSeasonYear();
  return `${endYear - 1}-${endYear}`;
}

module.exports = { getCurrentSeasonYear, getCurrentSeasonLabel, getCurrentSeasonFull };
