
import React, { useState, useEffect } from 'react';
import LinkSearchTester from '@/components/LinkSearchTester';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Tester = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const navigate = useNavigate();

  // Load API key from localStorage on component mount
  useEffect(() => {
    const storedApiKey = localStorage.getItem('openai_api_key');
    if (storedApiKey) {
      setApiKey(storedApiKey);
    }
  }, []);

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/')}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Link Search Testing Tools</h1>
        </div>
        
        <div className="mb-6">
          <p className="text-muted-foreground">
            This interface allows you to test the link search functionality directly. 
            You can either test with specific topics or a full transcript.
          </p>
        </div>
        
        <LinkSearchTester apiKey={apiKey} />
      </div>
    </div>
  );
};

export default Tester;
