
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface ApiKeyInputProps {
  onApiKeySave: (key: string) => void;
}

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ onApiKeySave }) => {
  const [apiKey, setApiKey] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [savedKey, setSavedKey] = useState<string | null>(null);
  
  // Check for stored API key on component mount
  useEffect(() => {
    const storedKey = localStorage.getItem('openai_api_key');
    if (storedKey) {
      setSavedKey(storedKey);
      onApiKeySave(storedKey);
    }
  }, [onApiKeySave]);
  
  const handleSaveKey = () => {
    if (!apiKey.trim()) {
      toast.error('Please enter a valid API key');
      return;
    }
    
    try {
      localStorage.setItem('openai_api_key', apiKey);
      setSavedKey(apiKey);
      onApiKeySave(apiKey);
      setShowInput(false);
      toast.success('API key saved successfully');
    } catch (error) {
      console.error('Error saving API key:', error);
      toast.error('Failed to save API key');
    }
  };
  
  const handleRemoveKey = () => {
    localStorage.removeItem('openai_api_key');
    setSavedKey(null);
    onApiKeySave('');
    setApiKey('');
    toast.success('API key removed');
  };
  
  if (!showInput && savedKey) {
    return (
      <div className="flex items-center justify-end gap-2 mb-4">
        <span className="text-xs text-muted-foreground">Using saved OpenAI API key</span>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowInput(true)}
          className="text-xs"
        >
          Change
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRemoveKey}
          className="text-xs text-destructive"
        >
          Remove
        </Button>
      </div>
    );
  }
  
  if (!showInput) {
    return (
      <div className="flex justify-end mb-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowInput(true)}
          className="text-xs"
        >
          Set OpenAI API Key
        </Button>
      </div>
    );
  }
  
  return (
    <Card className="w-full mb-4 animate-fade-in">
      <CardHeader>
        <CardTitle className="text-base">OpenAI API Key</CardTitle>
        <CardDescription>
          Your API key is stored locally in your browser and never sent to our servers.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-2">
          <Input
            type="password"
            placeholder="sk-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="font-mono"
          />
          <p className="text-xs text-muted-foreground">
            Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">OpenAI's dashboard</a>. Your key will be stored securely in your browser's localStorage.
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setShowInput(false)}>Cancel</Button>
        <Button onClick={handleSaveKey}>Save Key</Button>
      </CardFooter>
    </Card>
  );
};

export default ApiKeyInput;
