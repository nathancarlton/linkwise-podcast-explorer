
import { useState, useEffect } from 'react';

export const useApiKey = () => {
  const [apiKey, setApiKey] = useState<string>('');

  const handleApiKeySave = (key: string) => {
    setApiKey(key);
  };

  const hasValidApiKey = apiKey && apiKey.trim() !== '' && apiKey.startsWith('sk-');

  return {
    apiKey,
    handleApiKeySave,
    hasValidApiKey
  };
};
