
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LinkItem } from '@/types';
import { testLinkSearch, testFullProcess } from '@/utils/testLinkSearch';
import { Loader2 } from 'lucide-react';
import { TopicsForm } from '@/components/search-tester/TopicsForm';
import { TranscriptForm } from '@/components/search-tester/TranscriptForm';
import { TestResultsCard } from '@/components/search-tester/TestResultsCard';

interface LinkSearchTesterProps {
  apiKey?: string;
}

const LinkSearchTester: React.FC<LinkSearchTesterProps> = ({ apiKey }) => {
  const [topics, setTopics] = useState<string>('');
  const [transcript, setTranscript] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('topics');
  const [results, setResults] = useState<{
    links: LinkItem[];
    processedTopics?: string[];
  } | null>(null);

  const handleTopicsTest = async () => {
    if (!topics.trim() || !apiKey) return;
    
    try {
      setLoading(true);
      const topicsArray = topics.split('\n').filter(t => t.trim() !== '');
      console.log('Testing topics:', topicsArray);
      
      const links = await testLinkSearch(topicsArray, apiKey);
      setResults({ links });
    } catch (error) {
      console.error('Error testing topics:', error);
      setResults({ links: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleTranscriptTest = async () => {
    if (!transcript.trim() || !apiKey) return;
    
    try {
      setLoading(true);
      console.log('Testing full process with transcript');
      
      const result = await testFullProcess(transcript, apiKey);
      setResults({
        links: result.links,
        processedTopics: result.topics
      });
    } catch (error) {
      console.error('Error testing transcript:', error);
      setResults({ links: [] });
    } finally {
      setLoading(false);
    }
  };

  // Determine if we should show the API key warning
  const showApiKeyWarning = !apiKey || apiKey.trim() === '';

  return (
    <div className="w-full space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Link Search Tester</CardTitle>
        </CardHeader>
        <CardContent>
          {showApiKeyWarning && (
            <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900 rounded-md text-sm">
              ⚠️ An OpenAI API key is required to test link search functionality. Please add your API key in the Settings.
            </div>
          )}
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="topics">Test with Topics</TabsTrigger>
              <TabsTrigger value="transcript">Test with Transcript</TabsTrigger>
            </TabsList>
            
            <TabsContent value="topics">
              <TopicsForm topics={topics} setTopics={setTopics} />
            </TabsContent>
            
            <TabsContent value="transcript">
              <TranscriptForm transcript={transcript} setTranscript={setTranscript} />
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={activeTab === 'topics' ? handleTopicsTest : handleTranscriptTest}
            disabled={loading || (activeTab === 'topics' ? !topics.trim() : !transcript.trim()) || !apiKey}
            className="w-full"
          >
            {loading ? (
              <div className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </div>
            ) : (
              `Test ${activeTab === 'topics' ? 'Topics' : 'Transcript'}`
            )}
          </Button>
        </CardFooter>
      </Card>

      {results && <TestResultsCard results={results} />}
    </div>
  );
};

export default LinkSearchTester;
