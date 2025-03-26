
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { LinkItem } from '@/types';
import { ExternalLink, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LinksListProps {
  links: LinkItem[];
  onLinkToggle: (id: string, checked: boolean) => void;
  usedMockData?: boolean;
}

const LinksList: React.FC<LinksListProps> = ({ links, onLinkToggle, usedMockData }) => {
  if (links.length === 0) {
    return null;
  }

  // Group links by topic to avoid duplicates
  const groupedLinks = links.reduce<Record<string, LinkItem[]>>((acc, link) => {
    if (!acc[link.topic]) {
      acc[link.topic] = [];
    }
    
    // Check if the URL already exists in this topic group
    const urlExists = acc[link.topic].some(existingLink => existingLink.url === link.url);
    if (!urlExists) {
      acc[link.topic].push(link);
    }
    
    return acc;
  }, {});

  // Count total number of links
  const totalLinks = Object.values(groupedLinks).reduce((count, links) => count + links.length, 0);

  return (
    <Card className="w-full mt-6 animate-slide-up">
      <CardHeader>
        <CardTitle>Discovered Links ({totalLinks})</CardTitle>
      </CardHeader>
      <CardContent>
        {usedMockData && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Using example links because of an API key issue. Please check your OpenAI API key.
            </AlertDescription>
          </Alert>
        )}
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {Object.entries(groupedLinks).map(([topic, topicLinks], topicIndex) => (
              <div key={topic} className="link-enter" style={{ animationDelay: `${topicIndex * 100}ms` }}>
                <div className="flex flex-col space-y-3 bg-secondary/40 p-4 rounded-lg">
                  <h3 className="font-medium text-lg">{topic} ({topicLinks.length})</h3>
                  
                  {topicLinks.map((link, linkIndex) => (
                    <div key={link.id} className="flex items-start space-x-3 pl-2 transition-colors hover:bg-secondary/60 p-2 rounded">
                      <Checkbox 
                        id={link.id} 
                        checked={link.checked} 
                        onCheckedChange={(checked) => onLinkToggle(link.id, !!checked)} 
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <label 
                          htmlFor={link.id} 
                          className="font-medium cursor-pointer hover:text-primary transition-colors"
                        >
                          {link.title}
                        </label>
                        <div className="mt-1">
                          <a 
                            href={link.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="flex items-center text-blue-500 hover:text-blue-700 underline group w-fit"
                          >
                            <span className="truncate max-w-[300px]">{link.url}</span>
                            <ExternalLink className="ml-1 h-3 w-3 opacity-70 group-hover:opacity-100 transition-opacity" />
                          </a>
                          <p className="text-sm text-muted-foreground mt-1">
                            {link.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {topicIndex < Object.keys(groupedLinks).length - 1 && <Separator className="my-4" />}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default LinksList;
