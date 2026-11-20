/**
 * NBA season helper. The season is named by the year it ends.
 * The 2026-27 season = 2027 on ESPN, "2026-27" on NBA.com.
 * Switch happens Oct 1.
 */
export function getCurrentSeasonYear(): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed, so Oct = 9
  return month >= 9 ? year + 1 : year;
}

export function getCurrentSeasonLabel(): string {
  const endYear = getCurrentSeasonYear();
  return `${endYear - 1}-${String(endYear).slice(2)}`;
}

export function getCurrentSeasonFull(): string {
  const endYear = getCurrentSeasonYear();
  return `${endYear - 1}-${endYear}`;
}
