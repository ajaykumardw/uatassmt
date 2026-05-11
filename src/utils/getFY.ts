/**
 * Get Indian Financial Year for a given date
 * @param date - JavaScript Date object (defaults to today)
 * @returns Financial year in "YYYY-YY" format (e.g., "2026-27")
 */
export function getFY(date: Date = new Date()): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new Error("Invalid date provided");
  }

  const year: number = date.getFullYear();
  const month: number = date.getMonth() + 1; // JS months are 0-based

  let startYear: number;
  let endYear: number;

  if (month >= 4) {
    // April or later → current year is start
    startYear = year;
    endYear = year + 1;
  } else {
    // Jan–Mar → previous year is start
    startYear = year - 1;
    endYear = year;
  }

  // Format as "YYYY-YY"
  return `${startYear}-${String(endYear).slice(-2)}`;
}

// // Example usage:
// console.log(getFY(new Date("2026-05-09"))); // "2026-27"
// console.log(getFY(new Date("2026-03-15"))); // "2025-26"
// console.log(getFY()); // Current date → e.g. "2025-26"
