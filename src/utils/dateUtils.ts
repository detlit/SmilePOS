/**
 * Convert a date to YYYY-MM-DD string in Thailand timezone (Asia/Bangkok, UTC+7)
 * Fixes the issue where toISOString() returns UTC date which is wrong before 7 AM Thai time
 */
export const toThaiDateString = (date?: Date | string | number): string => {
  const d = date ? new Date(date) : new Date();
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
};
