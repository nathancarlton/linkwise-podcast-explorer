
import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import TranscriptInput from '@/components/TranscriptInput';
import LinksList from '@/components/LinksList';
import LinkSummary from '@/components/LinkSummary';
import ApiKeyInput from '@/components/ApiKeyInput';
import { Separator } from '@/components/ui/separator';
import { 
  processTranscript, 
  findLinksForTopics, 
  parseUserProvidedLinks 
} from '@/utils/transcriptProcessor';
import { LinkItem, ProcessingStage, ProcessedTopic } from '@/types';
import { toast } from 'sonner';

const Index = () => {
  const [processingStage, setProcessingStage] = useState<ProcessingStage>(ProcessingStage.Initial);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [apiKey, setApiKey] = useState<string>('');
  const [usedMockData, setUsedMockData] = useState<boolean>(false);
  
  const handleApiKeySave = (key: string) => {
    setApiKey(key);
  };

  const handleProcessTranscript = async (transcript: string) => {
    try {
      // Start processing
      setProcessingStage(ProcessingStage.ProcessingTranscript);
      setLinks([]);
      setUsedMockData(false);
      
      // Extract topics from transcript
      const { topics, usedMockData: usedMockForTopics } = await processTranscript(transcript, apiKey);
      
      if (topics.length === 0) {
        toast.error('No relevant topics found in the transcript');
        setProcessingStage(ProcessingStage.Initial);
        return;
      }
      
      // Find links for the extracted topics
      setProcessingStage(ProcessingStage.FindingLinks);
      const { processedTopics, usedMockData: usedMockForLinks } = await findLinksForTopics(topics, apiKey);
      
      // Set whether mock data was used
      setUsedMockData(usedMockForTopics || usedMockForLinks);
      
      // Convert processed topics to link items
      const linkItems = processTopicsToLinkItems(processedTopics);
      
      setLinks(linkItems);
      setProcessingStage(ProcessingStage.Complete);
      
      if (linkItems.length > 0) {
        if (usedMockForTopics || usedMockForLinks) {
          toast.warning('Generated example links - API key may be invalid');
        } else {
          toast.success(`Found ${linkItems.length} links across ${processedTopics.length} topics`);
        }
      } else {
        toast.error('No links found for the extracted topics');
      }
    } catch (error) {
      console.error('Error processing transcript:', error);
      toast.error('An error occurred while processing the transcript');
      setProcessingStage(ProcessingStage.Initial);
    }
  };

  const handleProcessLinks = (linksText: string) => {
    try {
      setProcessingStage(ProcessingStage.FindingLinks);
      setLinks([]);
      setUsedMockData(false);
      
      // Parse user-provided links
      const processedTopics = parseUserProvidedLinks(linksText);
      
      if (processedTopics.length === 0) {
        toast.error('No valid links found in the provided text');
        setProcessingStage(ProcessingStage.Initial);
        return;
      }
      
      // Convert processed topics to link items
      const linkItems = processTopicsToLinkItems(processedTopics);
      
      setLinks(linkItems);
      setProcessingStage(ProcessingStage.Complete);
      
      toast.success(`Processed ${linkItems.length} links across ${processedTopics.length} topics`);
    } catch (error) {
      console.error('Error processing links:', error);
      toast.error('An error occurred while processing the links');
      setProcessingStage(ProcessingStage.Initial);
    }
  };

  // Helper function to convert processed topics to link items
  const processTopicsToLinkItems = (processedTopics: ProcessedTopic[]): LinkItem[] => {
    const linkItems: LinkItem[] = [];
    
    processedTopics.forEach((processedTopic: ProcessedTopic) => {
      processedTopic.links.forEach(link => {
        linkItems.push({
          id: uuidv4(),
          topic: processedTopic.topic,
          url: link.url,
          title: link.title,
          description: link.description,
          checked: true, // Default to checked
        });
      });
    });
    
    return linkItems;
  };

  const handleLinkToggle = (id: string, checked: boolean) => {
    setLinks(links.map(link => 
      link.id === id ? { ...link, checked } : link
    ));
  };

  // Add fade effect when component mounts
  useEffect(() => {
    document.body.classList.add('animate-fade-in');
    return () => {
      document.body.classList.remove('animate-fade-in');
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center py-12 px-4 md:px-8">
      <header className="w-full max-w-4xl text-center mb-8 animate-slide-down">
        <div className="chip mb-2">Link Generation Tool</div>
        <h1 className="text-4xl font-bold mb-2">PodcastLinker</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto text-balance">
          Extract meaningful topics and generate authoritative links from your podcast transcripts.
          Perfect for show notes and resource pages.
        </p>
      </header>
      
      <main className="w-full max-w-4xl">
        <ApiKeyInput onApiKeySave={handleApiKeySave} />
        
        <TranscriptInput 
          onProcess={handleProcessTranscript}
          onProcessLinks={handleProcessLinks}
          processingStage={processingStage}
        />
        
        {links.length > 0 && (
          <>
            <LinksList 
              links={links}
              onLinkToggle={handleLinkToggle}
              usedMockData={usedMockData}
            />
            
            <LinkSummary links={links} />
          </>
        )}
      </main>
      
      <footer className="mt-12 text-center text-sm text-muted-foreground animate-fade-in">
        <p>Designed for podcasters to easily share relevant resources with their audience.</p>
      </footer>
    </div>
  );
};

export default Index;
