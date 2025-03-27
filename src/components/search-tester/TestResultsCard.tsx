
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LinkItem } from '@/types';
import { ExternalLink } from 'lucide-react';

interface TestResultsCardProps {
  results: {
    links: LinkItem[];
    processedTopics?: string[];
  };
}

export const TestResultsCard: React.FC<TestResultsCardProps> = ({ results }) => {
  return (
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
                      className="text-blue-500 hover:text-blue-700 break-all flex items-center gap-1"
                    >
                      {link.title} <ExternalLink className="h-3 w-3" />
                    </a>
                    <div className="text-sm mt-1 break-all text-muted-foreground">{link.url}</div>
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
  );
}
