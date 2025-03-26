
import axios from 'axios';
import { isValidUrl } from './urlValidator';

// Server-side URL validation function
export const validateUrl = async (url: string): Promise<boolean> => {
  try {
    if (!isValidUrl(url)) {
      return false;
    }
    
    // Use axios to check if the URL actually exists and returns a valid response
    const response = await axios.head(url, { 
      timeout: 5000,
      validateStatus: (status) => status < 400 // Consider any status less than 400 as valid
    });
    
    return true;
  } catch (error) {
    console.warn(`URL validation failed for ${url}:`, error);
    return false;
  }
};
