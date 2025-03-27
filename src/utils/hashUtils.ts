
/**
 * Utility functions for generating hashes
 */

/**
 * Creates a simple hash from a string
 * 
 * @param str - String to hash
 * @returns A string representation of the hash
 */
export const hashString = (str: string): string => {
  let hash = 0;
  if (str.length === 0) return hash.toString();
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return hash.toString();
};
