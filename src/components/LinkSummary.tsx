
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LinkItem } from '@/types';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

interface LinkSummaryProps {
  links: LinkItem[];
}

const LinkSummary: React.FC<LinkSummaryProps> = ({ links }) => {
  const [activeTab, setActiveTab] = useState('formatted');
  
  const checkedLinks = links.filter(link => link.checked);
  
  if (checkedLinks.length === 0) {
    return null;
  }

  // Helper function to remove topic from title if it starts with the topic
  const cleanTitle = (title: string, topic: string) => {
    // If title starts with the topic (case insensitive), remove it and trim
    if (title.toLowerCase().startsWith(topic.toLowerCase())) {
      const remainingText = title.substring(topic.length).trim();
      // If there's a separator like "-" or ":" after the topic, remove it too
      return remainingText.replace(/^[-:]\s*/, '').trim();
    }
    return title;
  };

  const generateMarkdownSummary = () => {
    const lines = [
      '# Links mentioned in this episode',
      '',
    ];
    
    checkedLinks.forEach(link => {
      const cleanedTitle = cleanTitle(link.title, link.topic);
      lines.push(`## ${link.topic}`);
      lines.push(`[${cleanedTitle}](${link.url})`);
      lines.push(`${link.description}`);
      lines.push('');
    });
    
    return lines.join('\n');
  };

  const generateTextSummary = () => {
    const lines = [
      'Links mentioned in this episode:',
      '',
    ];
    
    checkedLinks.forEach(link => {
      const cleanedTitle = cleanTitle(link.title, link.topic);
      lines.push(`${link.topic}: ${cleanedTitle}`);
      lines.push(`  ${link.url}`);
      lines.push(`  ${link.description}`);
      lines.push('');
    });
    
    return lines.join('\n');
  };
  
  const generateHtmlSummary = () => {
    const lines = [
      '<h3>Links mentioned in this episode:</h3>',
      '<ul>',
    ];
    
    checkedLinks.forEach(link => {
      const cleanedTitle = cleanTitle(link.title, link.topic);
      lines.push(`  <li>`);
      lines.push(`    <strong>${link.topic}</strong>: <a href="${link.url}" target="_blank">${cleanedTitle}</a>`);
      lines.push(`    <p>${link.description}</p>`);
      lines.push(`  </li>`);
    });
    
    lines.push('</ul>');
    return lines.join('\n');
  };
  
  // Render markdown as formatted HTML for preview
  const renderFormattedMarkdown = () => {
    return (
      <div className="prose dark:prose-invert max-w-none">
        <h1>Links mentioned in this episode</h1>
        {checkedLinks.map((link, index) => (
          <div key={index} className="mb-6">
            <h2>{link.topic}</h2>
            <p>
              <a href={link.url} target="_blank" rel="noreferrer" className="font-medium underline">
                {cleanTitle(link.title, link.topic)}
              </a>
            </p>
            <p>{link.description}</p>
          </div>
        ))}
      </div>
    );
  };
  
  const markdownSummary = generateMarkdownSummary();
  const textSummary = generateTextSummary();
  const htmlSummary = generateHtmlSummary();
  
  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${type} copied to clipboard!`);
    }).catch(err => {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy to clipboard');
    });
  };

  return (
    <Card className="w-full mt-6 animate-slide-up">
      <CardHeader>
        <CardTitle>Link Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="formatted">Formatted</TabsTrigger>
            <TabsTrigger value="markdown">Markdown</TabsTrigger>
            <TabsTrigger value="text">Plain Text</TabsTrigger>
            <TabsTrigger value="html">HTML</TabsTrigger>
          </TabsList>
          
          <TabsContent value="formatted" className="space-y-4">
            <ScrollArea className="h-[300px] rounded-md border p-4">
              {renderFormattedMarkdown()}
            </ScrollArea>
            <Button 
              onClick={() => copyToClipboard(markdownSummary, 'Formatted summary')}
              className="w-full transition-all hover:bg-primary/90"
            >
              Copy Formatted Summary
            </Button>
          </TabsContent>
          
          <TabsContent value="markdown" className="space-y-4">
            <ScrollArea className="h-[300px] rounded-md border">
              <div className="p-4 bg-secondary/40 font-mono text-sm overflow-x-auto whitespace-pre-wrap">
                {markdownSummary}
              </div>
            </ScrollArea>
            <Button 
              onClick={() => copyToClipboard(markdownSummary, 'Markdown summary')}
              className="w-full transition-all hover:bg-primary/90"
            >
              Copy Markdown Summary
            </Button>
          </TabsContent>
          
          <TabsContent value="text" className="space-y-4">
            <ScrollArea className="h-[300px] rounded-md border">
              <div className="p-4 bg-secondary/40 font-mono text-sm overflow-x-auto whitespace-pre-wrap">
                {textSummary}
              </div>
            </ScrollArea>
            <Button 
              onClick={() => copyToClipboard(textSummary, 'Text summary')}
              className="w-full transition-all hover:bg-primary/90"
            >
              Copy Text Summary
            </Button>
          </TabsContent>
          
          <TabsContent value="html" className="space-y-4">
            <ScrollArea className="h-[300px] rounded-md border">
              <div className="p-4 bg-secondary/40 font-mono text-sm overflow-x-auto whitespace-pre-wrap">
                {htmlSummary}
              </div>
            </ScrollArea>
            <Button 
              onClick={() => copyToClipboard(htmlSummary, 'HTML summary')}
              className="w-full transition-all hover:bg-primary/90"
            >
              Copy HTML Summary
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default LinkSummary;
