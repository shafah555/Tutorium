const { Receipt } = require('../models');

/**
 * Generates a sequential, human-readable receipt number.
 * Format: RCPT-{YYYYMMDD}-{seq}
 */
async function generateReceiptNumber() {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  const datePart = `${y}${m}${d}`;

  const count = await Receipt.count();
  const seq = String(count + 1).padStart(5, '0');

  return `RCPT-${datePart}-${seq}`;
}

module.exports = { generateReceiptNumber };
