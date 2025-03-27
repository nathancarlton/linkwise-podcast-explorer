
import { isValidUrl } from './urlValidator';

export const validateUrl = async (url: string): Promise<boolean> => {
  try {
    // First check basic format
    if (!isValidUrl(url)) {
      console.warn(`URL failed basic validation: ${url}`);
      return false;
    }
    
    // Check if this is a Forbes URL, we'll consider them valid
    if (url.includes('forbes.com')) {
      console.log(`Treating Forbes URL as valid: ${url}`);
      return true;
    }
    
    // Consider all others valid for now
    return true;
  } catch (error) {
    console.error(`Error validating URL ${url}:`, error);
    return false;
  }
};
