
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProcessingStage } from '@/types';

interface TranscriptInputProps {
  onProcess: (transcript: string) => void;
  onProcessLinks: (linksText: string) => void;
  processingStage: ProcessingStage;
}

const TranscriptInput: React.FC<TranscriptInputProps> = ({ 
  onProcess, 
  onProcessLinks,
  processingStage 
}) => {
  const [transcript, setTranscript] = useState('');
  const [linksText, setLinksText] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [activeTab, setActiveTab] = useState('transcript');
  
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setTranscript(value);
    setCharCount(value.length);
  };

  const handleLinksTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLinksText(e.target.value);
  };

  const handleProcess = () => {
    if (transcript.trim().length > 0) {
      onProcess(transcript);
    }
  };

  const handleProcessLinks = () => {
    if (linksText.trim().length > 0) {
      onProcessLinks(linksText);
    }
  };
  
  const isDisabled = 
    processingStage === ProcessingStage.ProcessingTranscript || 
    processingStage === ProcessingStage.FindingLinks;

  return (
    <Card className="w-full animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Podcast Content</span>
          {activeTab === 'transcript' && (
            <div className="chip">
              {charCount.toLocaleString()} characters
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="transcript">Transcript</TabsTrigger>
            <TabsTrigger value="links">Direct Links</TabsTrigger>
          </TabsList>
          
          <TabsContent value="transcript">
            <Textarea
              placeholder="Paste your podcast transcript here (including timestamps and speaker names)..."
              className="min-h-[300px] resize-y transition-all focus:shadow-md"
              value={transcript}
              onChange={handleTextChange}
              disabled={isDisabled}
            />
            <p className="text-xs text-muted-foreground mt-2">
              Paste a full podcast transcript (up to 12,000 words) including timestamps and speaker names.
            </p>
          </TabsContent>
          
          <TabsContent value="links">
            <Textarea
              placeholder="Paste links in format: 'Topic: https://example.com' (one per line)"
              className="min-h-[300px] resize-y transition-all focus:shadow-md"
              value={linksText}
              onChange={handleLinksTextChange}
              disabled={isDisabled}
            />
            <p className="text-xs text-muted-foreground mt-2">
              Alternatively, paste links directly in the format "Topic: https://example.com" (one per line)
            </p>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-end">
        {activeTab === 'transcript' ? (
          <Button 
            onClick={handleProcess} 
            disabled={isDisabled || transcript.trim().length === 0}
            className="relative overflow-hidden group"
          >
            {isDisabled ? (
              <div className="flex items-center">
                <div className="spinner mr-2 w-4 h-4"></div>
                <span>
                  {processingStage === ProcessingStage.ProcessingTranscript
                    ? 'Finding Topics'
                    : 'Generating Links'}
                </span>
              </div>
            ) : (
              <>
                <span className="relative z-10">Process Transcript</span>
                <div className="absolute bottom-0 left-0 h-full bg-accent/50 w-0 group-hover:w-full transition-all duration-300 ease-in-out -z-0"></div>
              </>
            )}
          </Button>
        ) : (
          <Button 
            onClick={handleProcessLinks} 
            disabled={isDisabled || linksText.trim().length === 0}
            className="relative overflow-hidden group"
          >
            <span className="relative z-10">Process Links</span>
            <div className="absolute bottom-0 left-0 h-full bg-accent/50 w-0 group-hover:w-full transition-all duration-300 ease-in-out -z-0"></div>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default TranscriptInput;
