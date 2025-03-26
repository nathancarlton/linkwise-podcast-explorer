
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { LinkItem } from '@/types';

interface LinksListProps {
  links: LinkItem[];
  onLinkToggle: (id: string, checked: boolean) => void;
}

const LinksList: React.FC<LinksListProps> = ({ links, onLinkToggle }) => {
  if (links.length === 0) {
    return null;
  }

  return (
    <Card className="w-full mt-6 animate-slide-up">
      <CardHeader>
        <CardTitle>Discovered Links</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[400px] pr-4">
          <div className="space-y-4">
            {links.map((link, index) => (
              <div key={link.id} className="link-enter" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="flex items-start space-x-3 bg-secondary/40 p-4 rounded-lg transition-colors hover:bg-secondary">
                  <Checkbox 
                    id={link.id} 
                    checked={link.checked} 
                    onCheckedChange={(checked) => onLinkToggle(link.id, !!checked)} 
                    className="mt-1"
                  />
                  <div>
                    <label 
                      htmlFor={link.id} 
                      className="font-medium text-lg cursor-pointer hover:text-primary transition-colors"
                    >
                      {link.topic}
                    </label>
                    <div className="mt-2 pl-2 border-l-2 border-primary/20">
                      <div className="text-sm">
                        <span className="font-medium">{link.title}</span>
                        <a 
                          href={link.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-blue-500 hover:text-blue-700 ml-2 underline"
                        >
                          {link.url}
                        </a>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {link.description}
                      </p>
                    </div>
                  </div>
                </div>
                {index < links.length - 1 && <Separator className="my-4" />}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default LinksList;
