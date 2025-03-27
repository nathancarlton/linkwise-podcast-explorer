
import { isValidUrl } from './urlValidator';

export const validateUrl = async (url: string): Promise<boolean> => {
  try {
    // First check basic format
    if (!isValidUrl(url)) {
      console.warn(`URL failed basic validation: ${url}`);
      return false;
    }
    
    // Consider all URLs valid for now
    return true;
  } catch (error) {
    console.error(`Error validating URL ${url}:`, error);
    return false;
  }
};
