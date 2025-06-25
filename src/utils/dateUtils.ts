
// src/utils/dateUtils.ts
export const formatDateToMMDDYY = (date: Date): string => {
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const year = date.getFullYear().toString().slice(-2);
  return `${month}${day}${year}`;
};

export const formatDateForKey = (date: Date): string => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    console.warn('formatDateForKey received an invalid date:', date);
    // Fallback to today's date key or handle error as appropriate
    return new Date().toISOString().split('T')[0];
  }
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
};

export const formatDateForDisplay = (date: Date): string => {
   if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    console.warn('formatDateForDisplay received an invalid date:', date);
    // Fallback to a default display or handle error
    return "Invalid Date";
  }
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};
