
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { LinkItem } from '@/types';
import { ExternalLink, AlertCircle, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useIsMobile } from '@/hooks/use-mobile';

interface LinksListProps {
  links: LinkItem[];
  onLinkToggle: (id: string, checked: boolean) => void;
  usedMockData?: boolean;
}

const LinksList: React.FC<LinksListProps> = ({ links, onLinkToggle, usedMockData }) => {
  const isMobile = useIsMobile();
  
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
      <CardContent className="relative">
        {usedMockData && (
          <Alert className="mb-4" variant="warning">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Currently showing example links. For more accurate and relevant links based on your transcript, 
              please add a valid OpenAI API key using the "Set OpenAI API Key" button above.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
          <Info className="h-4 w-4" />
          <span>Use checkboxes to select which links appear in the summary below. Unchecked links will be excluded.</span>
        </div>
        
        <ScrollArea className="h-[400px] pr-4 overflow-y-auto [&>div]:!overflow-y-visible [&_[data-radix-scroll-area-thumb]]:w-2 [&_[data-radix-scroll-area-thumb]]:bg-muted-foreground/50">
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
                      <div className="flex-1 min-w-0">
                        <label 
                          htmlFor={link.id} 
                          className="font-medium cursor-pointer hover:text-primary transition-colors"
                        >
                          {link.title}
                        </label>
                        {link.context && (
                          <p className="text-sm text-muted-foreground italic mt-1">
                            {link.context}
                          </p>
                        )}
                        <div className="mt-1">
                          <a 
                            href={link.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="flex items-center text-blue-500 hover:text-blue-700 underline group w-fit"
                          >
                            <span className={`truncate ${isMobile ? 'max-w-[200px]' : 'max-w-[300px]'}`}>{link.url}</span>
                            <ExternalLink className="ml-1 h-3 w-3 opacity-70 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                          </a>
                          <p className="text-sm text-muted-foreground mt-1 break-words">
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
        
        {/* Fade-out gradient overlay at the bottom */}
        <div className="absolute bottom-0 left-0 right-4 h-20 bg-gradient-to-t from-card to-transparent pointer-events-none"></div>
      </CardContent>
    </Card>
  );
};

export default LinksList;
