
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ProcessingStage } from '@/types';

interface TranscriptInputProps {
  onProcess: (transcript: string) => void;
  processingStage: ProcessingStage;
}

const TranscriptInput: React.FC<TranscriptInputProps> = ({ 
  onProcess, 
  processingStage 
}) => {
  const [transcript, setTranscript] = useState('');
  const [charCount, setCharCount] = useState(0);
  
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setTranscript(value);
    setCharCount(value.length);
  };

  const handleProcess = () => {
    if (transcript.trim().length > 0) {
      onProcess(transcript);
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
          <div className="chip">
            {charCount.toLocaleString()} characters
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
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
      </CardContent>
      <CardFooter className="flex justify-end">
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
      </CardFooter>
    </Card>
  );
};

export default TranscriptInput;
