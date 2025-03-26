
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LinkItem } from '@/types';
import { toast } from 'sonner';

interface LinkSummaryProps {
  links: LinkItem[];
}

const LinkSummary: React.FC<LinkSummaryProps> = ({ links }) => {
  const [activeTab, setActiveTab] = useState('text');
  
  const checkedLinks = links.filter(link => link.checked);
  
  if (checkedLinks.length === 0) {
    return null;
  }

  const generateTextSummary = () => {
    const lines = [
      'Links mentioned in this episode:',
      '',
    ];
    
    checkedLinks.forEach(link => {
      lines.push(`${link.topic}: ${link.title}`);
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
      lines.push(`  <li>`);
      lines.push(`    <strong>${link.topic}</strong>: <a href="${link.url}" target="_blank">${link.title}</a>`);
      lines.push(`    <p>${link.description}</p>`);
      lines.push(`  </li>`);
    });
    
    lines.push('</ul>');
    return lines.join('\n');
  };
  
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
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="text">Plain Text</TabsTrigger>
            <TabsTrigger value="html">HTML</TabsTrigger>
          </TabsList>
          
          <TabsContent value="text" className="space-y-4">
            <div className="p-4 bg-secondary/40 rounded-lg font-mono text-sm overflow-x-auto whitespace-pre-wrap">
              {textSummary}
            </div>
            <Button 
              onClick={() => copyToClipboard(textSummary, 'Text summary')}
              className="w-full transition-all hover:bg-primary/90"
            >
              Copy Text Summary
            </Button>
          </TabsContent>
          
          <TabsContent value="html" className="space-y-4">
            <div className="p-4 bg-secondary/40 rounded-lg font-mono text-sm overflow-x-auto whitespace-pre-wrap">
              {htmlSummary}
            </div>
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
