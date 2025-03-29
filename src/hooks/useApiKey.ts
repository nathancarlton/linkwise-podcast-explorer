
import { useState, useEffect } from 'react';
import { SearchApiType } from '../types';

export const useApiKey = () => {
  const [openAIApiKey, setOpenAIApiKey] = useState<string>('');
  const [braveApiKey, setBraveApiKey] = useState<string>('');
  const [selectedSearchApi, setSelectedSearchApi] = useState<SearchApiType>(SearchApiType.OpenAI);

  // Check for stored API keys on component mount
  useEffect(() => {
    const storedOpenAIKey = localStorage.getItem('openai_api_key');
    if (storedOpenAIKey) {
      setOpenAIApiKey(storedOpenAIKey);
    }

    const storedBraveKey = localStorage.getItem('brave_api_key');
    if (storedBraveKey) {
      setBraveApiKey(storedBraveKey);
    }

    const storedSearchApi = localStorage.getItem('selected_search_api');
    if (storedSearchApi && Object.values(SearchApiType).includes(storedSearchApi as SearchApiType)) {
      setSelectedSearchApi(storedSearchApi as SearchApiType);
    }
  }, []);

  const handleApiKeySave = (key: string, type: 'openai' | 'brave') => {
    if (type === 'openai') {
      setOpenAIApiKey(key);
    } else {
      setBraveApiKey(key);
    }
  };

  const handleSearchApiChange = (apiType: SearchApiType) => {
    setSelectedSearchApi(apiType);
    localStorage.setItem('selected_search_api', apiType);
  };

  const hasValidOpenAIApiKey = openAIApiKey && openAIApiKey.trim() !== '' && openAIApiKey.startsWith('sk-');
  const hasValidBraveApiKey = braveApiKey && braveApiKey.trim() !== '';

  return {
    openAIApiKey,
    braveApiKey,
    selectedSearchApi,
    handleApiKeySave,
    handleSearchApiChange,
    hasValidOpenAIApiKey,
    hasValidBraveApiKey
  };
};
