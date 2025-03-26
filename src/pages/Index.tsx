
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
  const [transcriptHash, setTranscriptHash] = useState<string>('');
  
  const handleApiKeySave = (key: string) => {
    setApiKey(key);
  };

  // Simple hash function to detect if we have a new transcript
  const hashTranscript = (transcript: string): string => {
    let hash = 0;
    if (transcript.length === 0) return hash.toString();
    for (let i = 0; i < transcript.length; i++) {
      const char = transcript.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
  };

  const handleProcessTranscript = async (transcript: string) => {
    try {
      // Check if this is a new transcript
      const newHash = hashTranscript(transcript);
      if (newHash === transcriptHash && links.length > 0) {
        toast.info('Processing the same transcript again. Results may be similar.');
      }
      setTranscriptHash(newHash);
      
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
      
      console.log('Successfully extracted topics:', topics);
      
      // Find links for the extracted topics
      setProcessingStage(ProcessingStage.FindingLinks);
      const { processedTopics, usedMockData: usedMockForLinks } = await findLinksForTopics(topics, apiKey);
      
      console.log('Processed topics with links:', processedTopics);
      
      // Set whether mock data was used
      setUsedMockData(usedMockForTopics || usedMockForLinks);
      
      // Convert processed topics to link items
      const linkItems = processTopicsToLinkItems(processedTopics || []);
      
      setLinks(linkItems);
      setProcessingStage(ProcessingStage.Complete);
      
      if (linkItems.length > 0) {
        if (usedMockForTopics || usedMockForLinks) {
          toast.warning('Generated example links - OpenAI API key is missing or invalid. Please add a valid key to get better results.');
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
      
      const topicName = processedTopic.topic || 'Unknown Topic';
      const topicContext = processedTopic.context;
      
      processedTopic.links.forEach(link => {
        if (!link) {
          console.warn('Invalid link object, skipping');
          return;
        }
        
        console.log(`Adding link: ${link.title} - ${link.url}`);
        
        // Clean up title - remove redundant topic name from beginning of title
        let title = link.title || 'Untitled Link';
        
        // Check if title starts with the topic name
        if (title.toLowerCase() === topicName.toLowerCase() || 
            title.toLowerCase().startsWith(topicName.toLowerCase() + ' - ') || 
            title.toLowerCase().startsWith(topicName.toLowerCase() + ': ')) {
          // Remove topic name and any separator (like " - " or ": ")
          title = title.substring(topicName.length).replace(/^[\s-:]+/, '').trim();
        }
        
        // If title became empty after cleanup, use the original
        if (!title.trim()) {
          title = link.title || 'Untitled Link';
        }
        
        linkItems.push({
          id: uuidv4(),
          topic: topicName,
          url: link.url || '#',
          title: title,
          context: topicContext,
          description: link.description || 'No description available',
          checked: true, // Default to checked
        });
      });
    });
    
    console.log(`Created ${linkItems.length} link items total`);
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
