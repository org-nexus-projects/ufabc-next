export function capitalizeStr(str: string): string {
  if (!str) return str;

  // Split into words and process each one
  return str
    .toLowerCase()
    .split(' ')
    .map(word => {
      // Skip empty strings
      if (!word) return word;

      // List of words that should remain in lowercase (can be expanded)
      const lowercaseWords = ['da', 'de', 'do', 'das', 'dos'];

      if (lowercaseWords.includes(word)) {
        return word;
      }

      // Capitalize first letter and keep rest lowercase
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

