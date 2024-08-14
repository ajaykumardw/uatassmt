// utils/dateUtils.js

/**
 * Formats a date string into MM/DD/YYYY HH:MM AM/PM format.
 * @param {string|Date} dateInput - The date to format.
 * @returns {string} - The formatted date string.
 */
export function formatDate(dateInput: string | Date | undefined): string {
  if (!dateInput) return '';

  const date = new Date(dateInput);
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';

  hours = hours % 12;
  hours = hours ? hours : 12; // Hour '0' should be '12'
  const formattedHours = String(hours).padStart(2, '0');

  return `${day}/${month}/${year} ${formattedHours}:${minutes} ${ampm}`;
}
