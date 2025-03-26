
import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import TranscriptInput from '@/components/TranscriptInput';
import LinksList from '@/components/LinksList';
import LinkSummary from '@/components/LinkSummary';
import ApiKeyInput from '@/components/ApiKeyInput';
import { Separator } from '@/components/ui/separator';
import { 
  processTranscript, 
  findLinksForTopics
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
      
      if (!topics || topics.length === 0) {
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
      const linkItems = processTopicsToLinkItems(processedTopics || []);
      
      setLinks(linkItems);
      setProcessingStage(ProcessingStage.Complete);
      
      if (linkItems.length > 0) {
        if (usedMockForTopics || usedMockForLinks) {
          toast.warning('Generated example links - API key may be invalid');
        } else {
          toast.success(`Found ${linkItems.length} links across ${processedTopics?.length || 0} topics`);
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

  // Helper function to convert processed topics to link items
  const processTopicsToLinkItems = (processedTopics: ProcessedTopic[]): LinkItem[] => {
    const linkItems: LinkItem[] = [];
    
    if (!processedTopics || !Array.isArray(processedTopics)) {
      console.error('Invalid processedTopics:', processedTopics);
      return [];
    }
    
    processedTopics.forEach((processedTopic: ProcessedTopic) => {
      // Skip if topic is undefined or links array is missing
      if (!processedTopic || !processedTopic.links || !Array.isArray(processedTopic.links)) {
        console.warn('Invalid topic object:', processedTopic);
        return;
      }
      
      // Make sure the topic has links before processing
      if (processedTopic.links.length > 0) {
        processedTopic.links.forEach(link => {
          if (!link) return;
          
          // Create a title that doesn't repeat the topic name
          let title = link.title || 'Untitled Link';
          
          // Remove topic from beginning of title if it exists
          if (title.toLowerCase().startsWith(processedTopic.topic.toLowerCase())) {
            // Extract the remainder after the topic
            const remainder = title.substring(processedTopic.topic.length).trim();
            // Remove any leading separators like ":" or "-"
            title = remainder.replace(/^[-:]\s*/, '').trim() || title;
          }
          
          linkItems.push({
            id: uuidv4(),
            topic: processedTopic.topic || 'Unknown Topic',
            url: link.url || '#',
            title: title,
            description: link.description || 'No description available',
            checked: true, // Default to checked
          });
        });
      }
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
