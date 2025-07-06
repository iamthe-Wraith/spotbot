/**
 * Calculates the Jaro distance between two strings.
 * The Jaro distance is a measure of similarity between two strings.
 */
const calculateJaroDistance = (str1: string, str2: string): number => {
  if (str1 === str2) return 1.0;
  if (str1.length === 0 || str2.length === 0) return 0.0;

  const matchWindow = Math.floor(Math.max(str1.length, str2.length) / 2) - 1;
  if (matchWindow < 0) return 0.0;

  const str1Matches = new Array(str1.length).fill(false);
  const str2Matches = new Array(str2.length).fill(false);

  let matches = 0;
  let transpositions = 0;

  for (let i = 0; i < str1.length; i++) {
    const start = Math.max(0, i - matchWindow);
    const end = Math.min(str2.length, i + matchWindow + 1);

    for (let j = start; j < end; j++) {
      if (str2Matches[j] || str1[i] !== str2[j]) continue;
      
      str1Matches[i] = true;
      str2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0.0;

  // Count transpositions
  let k = 0;
  for (let i = 0; i < str1.length; i++) {
    if (!str1Matches[i]) continue;
    
    while (!str2Matches[k]) k++;
    if (str1[i] !== str2[k]) transpositions++;
    k++;
  }

  transpositions /= 2;

  return (
    (matches / str1.length +
      matches / str2.length +
      (matches - transpositions) / matches) / 3
  );
}

/**
 * Calculates the Jaro-Winkler distance between two strings.
 * This is an extension of the Jaro distance that gives more favorable ratings
 * to strings that match from the beginning.
 * 
 * @param str1 - First string to compare
 * @param str2 - Second string to compare
 * @param prefixWeight - Weight for the prefix bonus (default: 0.1)
 * @param prefixLength - Maximum prefix length to consider (default: 4)
 * @returns Jaro-Winkler distance between 0 and 1, where 1 means identical strings
 */
export const jaroWinklerDistance = (
  str1: string,
  str2: string,
  prefixWeight: number = 0.1,
  prefixLength: number = 4
): number => {
  const jaroDist = calculateJaroDistance(str1, str2);
  
  if (jaroDist < 0.7) return jaroDist;

  // Calculate prefix length
  let prefix = 0;
  const maxPrefix = Math.min(prefixLength, Math.min(str1.length, str2.length));
  
  for (let i = 0; i < maxPrefix; i++) {
    if (str1[i] === str2[i]) {
      prefix++;
    } else {
      break;
    }
  }

  return jaroDist + prefixWeight * prefix * (1 - jaroDist);
}

/**
 * Calculates the Levenshtein distance between two strings.
 * The Levenshtein distance is the minimum number of single-character edits
 * (insertions, deletions, or substitutions) required to change one string into another.
 * 
 * @param str1 - First string to compare
 * @param str2 - Second string to compare
 * @returns Levenshtein distance (number of edits required)
 */
export const levenshteinDistance = (str1: string, str2: string): number => {
  const len1 = str1.length;
  const len2 = str2.length;

  // Handle edge cases
  if (len1 === 0) return len2;
  if (len2 === 0) return len1;
  if (str1 === str2) return 0;

  // Create matrix
  const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));

  // Initialize first row and column
  for (let i = 0; i <= len1; i++) {
    matrix[i][0] = i;
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill the matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
};

/**
 * Calculates the normalized Levenshtein distance between two strings.
 * Returns a similarity score between 0 and 1, where 1 means identical strings.
 * 
 * @param str1 - First string to compare
 * @param str2 - Second string to compare
 * @returns Normalized similarity score between 0 and 1
 */
export const levenshteinSimilarity = (str1: string, str2: string): number => {
  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  
  if (maxLength === 0) return 1.0;
  
  return 1 - (distance / maxLength);
};
