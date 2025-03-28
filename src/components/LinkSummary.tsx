
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LinkItem } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface LinkSummaryProps {
  links: LinkItem[];
}

const LinkSummary: React.FC<LinkSummaryProps> = ({ links }) => {
  const { toast } = useToast();
  const [formatType, setFormatType] = useState<'plain' | 'markdown' | 'html' | 'rich'>('plain');
  
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
  
  // Build summary text based on format type
  const buildSummaryText = () => {
    let summaryText = "";
    
    Object.entries(topicGroups).forEach(([topic, topicLinks]) => {
      switch (formatType) {
        case 'markdown':
          // Markdown format
          summaryText += `## ${topic}\n\n`;
          topicLinks.forEach(link => {
            summaryText += `- [${link.title}](${link.url})\n`;
          });
          summaryText += "\n";
          break;
          
        case 'html':
          // HTML format
          summaryText += `<h2>${topic}</h2>\n<ul>\n`;
          topicLinks.forEach(link => {
            summaryText += `  <li><a href="${link.url}" target="_blank">${link.title}</a></li>\n`;
          });
          summaryText += "</ul>\n\n";
          break;
          
        case 'rich':
          // Rich text format (for pasting into editors like Google Docs)
          summaryText += `${topic}\n`;
          topicLinks.forEach(link => {
            summaryText += `${link.title}: ${link.url}\n`;
          });
          summaryText += "\n";
          break;
          
        case 'plain':
        default:
          // Plain text format (default)
          summaryText += `${topic}\n`;
          topicLinks.forEach(link => {
            summaryText += `${link.title}: ${link.url}\n`;
          });
          summaryText += "\n";
          break;
      }
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
        <Tabs defaultValue="plain" value={formatType} onValueChange={(value) => setFormatType(value as any)} className="mb-4">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="plain">Plain Text</TabsTrigger>
            <TabsTrigger value="markdown">Markdown</TabsTrigger>
            <TabsTrigger value="html">HTML</TabsTrigger>
            <TabsTrigger value="rich">Rich Text</TabsTrigger>
          </TabsList>
          
          <TabsContent value="plain" className="mt-0">
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
          </TabsContent>
          
          <TabsContent value="markdown" className="mt-0">
            <div className="mb-4 overflow-auto rounded-md bg-muted p-4">
              <pre className="text-sm whitespace-pre-wrap">
                {Object.entries(topicGroups).map(([topic, topicLinks], i) => (
                  <React.Fragment key={topic}>
                    <div className="font-semibold">## {topic}</div>
                    {topicLinks.map((link, j) => (
                      <div key={link.id} className="ml-4">
                        - [{link.title}]({link.url})
                      </div>
                    ))}
                    {i < Object.keys(topicGroups).length - 1 && <div className="my-2" />}
                  </React.Fragment>
                ))}
              </pre>
            </div>
          </TabsContent>
          
          <TabsContent value="html" className="mt-0">
            <div className="mb-4 overflow-auto rounded-md bg-muted p-4">
              <pre className="text-sm whitespace-pre-wrap">
                {Object.entries(topicGroups).map(([topic, topicLinks], i) => (
                  <React.Fragment key={topic}>
                    <div className="font-semibold">&lt;h2&gt;{topic}&lt;/h2&gt;</div>
                    <div>&lt;ul&gt;</div>
                    {topicLinks.map((link, j) => (
                      <div key={link.id} className="ml-4">
                        &lt;li&gt;&lt;a href="{link.url}" target="_blank"&gt;{link.title}&lt;/a&gt;&lt;/li&gt;
                      </div>
                    ))}
                    <div>&lt;/ul&gt;</div>
                    {i < Object.keys(topicGroups).length - 1 && <div className="my-2" />}
                  </React.Fragment>
                ))}
              </pre>
            </div>
          </TabsContent>
          
          <TabsContent value="rich" className="mt-0">
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
          </TabsContent>
        </Tabs>
        
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
