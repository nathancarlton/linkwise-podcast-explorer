
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LinkItem } from '@/types';
import { testLinkSearch, testFullProcess } from '@/utils/testLinkSearch';
import { Loader2 } from 'lucide-react';

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
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Enter Topics (one per line)
                  </label>
                  <Textarea
                    value={topics}
                    onChange={(e) => setTopics(e.target.value)}
                    placeholder="Data Visualization,
Machine Learning Ethics,
Sustainable Technology"
                    className="min-h-[150px]"
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="transcript">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Enter Transcript
                  </label>
                  <Textarea
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    placeholder="Paste podcast transcript here..."
                    className="min-h-[150px]"
                  />
                </div>
              </div>
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

      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            {results.processedTopics && (
              <div className="mb-4">
                <h3 className="font-medium mb-2">Extracted Topics:</h3>
                <div className="bg-muted p-3 rounded text-sm">
                  {results.processedTopics.length > 0 ? (
                    results.processedTopics.map((topic, i) => (
                      <div key={i} className="mb-1">{topic}</div>
                    ))
                  ) : (
                    <p className="text-muted-foreground italic">No topics were extracted.</p>
                  )}
                </div>
              </div>
            )}
            
            <h3 className="font-medium mb-2">Found Links ({results.links.length}):</h3>
            {results.links.length === 0 ? (
              <p className="text-muted-foreground italic">No links found. Ensure you have provided a valid OpenAI API key with appropriate permissions.</p>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-4">
                  {results.links.map((link, i) => (
                    <div key={i} className="p-3 bg-muted rounded">
                      <div className="font-medium">{link.topic}</div>
                      {link.context && (
                        <div className="text-sm text-muted-foreground italic mb-1">
                          {link.context}
                        </div>
                      )}
                      <div className="mt-1">
                        <a 
                          href={link.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-blue-500 hover:text-blue-700 break-all"
                        >
                          {link.title}
                        </a>
                        <div className="text-sm mt-1">{link.url}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {link.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LinkSearchTester;
