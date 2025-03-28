
import React from 'react';
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LinkItem } from '@/types';

interface LinkSummaryProps {
  links: LinkItem[];
}

const LinkSummary: React.FC<LinkSummaryProps> = ({ links }) => {
  const { toast } = useToast();
  
  // Only show checked links
  const checkedLinks = links.filter(link => link.checked);
  
  if (checkedLinks.length === 0) {
    return null;
  }
  
  // Group links by topic
  const topicGroups = checkedLinks.reduce<Record<string, LinkItem[]>>((acc, link) => {
    if (!acc[link.topic]) {
      acc[link.topic] = [];
    }
    acc[link.topic].push(link);
    return acc;
  }, {});
  
  // Build summary text
  const buildSummaryText = () => {
    let summaryText = "";
    
    Object.entries(topicGroups).forEach(([topic, topicLinks]) => {
      // Add topic as header
      summaryText += `${topic}\n`;
      
      // Add each link under the same topic
      topicLinks.forEach(link => {
        summaryText += `${link.title}: ${link.url}\n`;
      });
      
      // Add blank line between topic groups
      summaryText += "\n";
    });
    
    return summaryText.trim();
  };
  
  const summaryText = buildSummaryText();
  
  const handleCopy = () => {
    navigator.clipboard.writeText(summaryText);
    toast({
      title: "Copied to clipboard",
      description: "The link summary has been copied to your clipboard.",
    });
  };

  return (
    <Card className="w-full mt-6 animate-slide-up">
      <CardHeader>
        <CardTitle>Link Summary</CardTitle>
        <CardDescription>
          Ready to share with your audience
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 overflow-auto rounded-md bg-muted p-4">
          <pre className="text-sm whitespace-pre-wrap">
            {Object.entries(topicGroups).map(([topic, topicLinks], i) => (
              <React.Fragment key={topic}>
                <div className="font-semibold">{topic}</div>
                {topicLinks.map((link, j) => (
                  <div key={link.id} className="ml-4">
                    {link.title}: {link.url}
                  </div>
                ))}
                {i < Object.keys(topicGroups).length - 1 && <div className="my-2" />}
              </React.Fragment>
            ))}
          </pre>
        </div>
        <Button 
          onClick={handleCopy}
          variant="secondary"
          className="w-full"
        >
          <Copy className="mr-2 h-4 w-4" />
          Copy to Clipboard
        </Button>
      </CardContent>
    </Card>
  );
};

export default LinkSummary;
