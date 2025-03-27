
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ProcessingStage } from '@/types';
import { Loader2, X, Plus, AlertTriangle } from 'lucide-react';
import DomainAvoidList from './DomainAvoidList';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TranscriptInputProps {
  onProcess: (transcript: string, topicCount: number, domainsToAvoid: string[]) => void;
  processingStage: ProcessingStage;
  hasApiKey?: boolean;
}

const TranscriptInput: React.FC<TranscriptInputProps> = ({ 
  onProcess, 
  processingStage,
  hasApiKey = false
}) => {
  const [transcript, setTranscript] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [topicCount, setTopicCount] = useState(5);
  const [domainsToAvoid, setDomainsToAvoid] = useState<string[]>(['wikipedia.org', 'amazon.com']);
  const [newDomain, setNewDomain] = useState('');
  
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setTranscript(value);
    const words = value.trim() ? value.trim().split(/\s+/).length : 0;
    setWordCount(words);
  };

  const handleProcess = () => {
    if (transcript.trim().length > 0) {
      onProcess(transcript, topicCount, domainsToAvoid);
    }
  };
  
  const handleDomainAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDomain && domainsToAvoid.length < 10) {
      let cleanDomain = newDomain.trim()
        .replace(/^(https?:\/\/)?(www\.)?/, '')
        .replace(/\/.*$/, '');
      
      const domainParts = cleanDomain.split('.');
      if (domainParts.length > 2) {
        cleanDomain = domainParts.slice(-2).join('.');
      }
      
      if (cleanDomain && !domainsToAvoid.includes(cleanDomain)) {
        setDomainsToAvoid([...domainsToAvoid, cleanDomain]);
      }
      setNewDomain('');
    }
  };
  
  const handleDomainRemove = (domain: string) => {
    setDomainsToAvoid(domainsToAvoid.filter((d) => d !== domain));
  };
  
  const isDisabled = 
    processingStage === ProcessingStage.ProcessingTranscript || 
    processingStage === ProcessingStage.FindingLinks;

  const showApiKeyNeededAlert = !hasApiKey && transcript.trim().length > 0;

  return (
    <Card className="w-full animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Podcast Transcript</span>
          <div className="chip">
            {wordCount.toLocaleString()} words
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {showApiKeyNeededAlert && (
          <Alert variant="warning" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You will need to enter an OpenAI API key in the settings above to process transcripts and find links.
            </AlertDescription>
          </Alert>
        )}

        <Textarea
          placeholder="Paste your podcast transcript here (including timestamps and speaker names)..."
          className="min-h-[300px] resize-y transition-all focus:shadow-md"
          value={transcript}
          onChange={handleTextChange}
          disabled={isDisabled}
        />
        <p className="text-xs text-muted-foreground mt-2">
          Paste a full podcast transcript including timestamps and speaker names.
        </p>
        
        <div className="mt-6 space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Number of Topics to Find ({topicCount})</h3>
            <div className="flex items-center gap-4">
              <Slider
                min={1}
                max={10}
                step={1}
                value={[topicCount]}
                onValueChange={(value) => setTopicCount(value[0])}
                disabled={isDisabled}
                className="flex-1"
              />
              <span className="text-sm font-medium w-6 text-center">{topicCount}</span>
            </div>
          </div>
          
          <DomainAvoidList 
            domains={domainsToAvoid}
            onRemove={handleDomainRemove}
            newDomain={newDomain}
            setNewDomain={setNewDomain}
            onAdd={handleDomainAdd}
            disabled={isDisabled}
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button 
          onClick={handleProcess} 
          disabled={isDisabled || transcript.trim().length === 0}
          className="relative overflow-hidden group"
        >
          {isDisabled ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
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
