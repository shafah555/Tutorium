/**
 * Generates payable month/year pairs from a joining date up to (and including)
 * the current month, or up to a completion date if provided.
 * No months are generated before the joining month.
 */
function generatePayableMonths(joiningDate, completionDate = null) {
  const start = new Date(joiningDate);
  const startMonth = start.getMonth(); // 0-11
  const startYear = start.getFullYear();

  const end = completionDate ? new Date(completionDate) : new Date();
  const endMonth = end.getMonth();
  const endYear = end.getFullYear();

  const months = [];
  let year = startYear;
  let month = startMonth;

  while (year < endYear || (year === endYear && month <= endMonth)) {
    months.push({ month: month + 1, year }); // store 1-12
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }

  return months;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

module.exports = { generatePayableMonths, MONTH_NAMES };
