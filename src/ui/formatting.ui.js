/**
 * Misc functions for parsing and formatting UI text
 * @module formatting
 */

/**
 * @function formatMaybeCurrency
 * @param {number} value The value to format
 * @param {object} param1 Fallback configuration object
 * @param {string} currency Optional currency identifier for formatting
 * @returns {string} Formatted string
 */
function formatMaybeCurrency(value, currency = 'USD') {
  if (!Number.isFinite(value)) {
    return '—';
  }
  let formatted;
  try {
    formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
  } catch (e) {
    console.error('Formatting error', e);
    formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
      value,
    );
  }
  return formatted;
}

/**
 * @function parseFloatNumber
 * @param {object|string} value Value to parse to float number
 * @returns {number} Parsed float number or null
 */
function parseFloatNumber(value) {
  if (value === '' || value === undefined || value === null) {
    return null;
  }
  const parsed = Number.parseFloat(String(value).trim());
  return Number.isFinite(parsed) ? parsed : null;
}

export { formatMaybeCurrency, parseFloatNumber };
