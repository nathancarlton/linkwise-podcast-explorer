
import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import TranscriptInput from '@/components/TranscriptInput';
import LinksList from '@/components/LinksList';
import LinkSummary from '@/components/LinkSummary';
import { Separator } from '@/components/ui/separator';
import { processTranscript, findLinksForTopics } from '@/utils/transcriptProcessor';
import { LinkItem, ProcessingStage, ProcessedTopic } from '@/types';
import { toast } from 'sonner';

const Index = () => {
  const [processingStage, setProcessingStage] = useState<ProcessingStage>(ProcessingStage.Initial);
  const [links, setLinks] = useState<LinkItem[]>([]);

  const handleProcessTranscript = async (transcript: string) => {
    try {
      // Start processing
      setProcessingStage(ProcessingStage.ProcessingTranscript);
      setLinks([]);
      
      // Extract topics from transcript
      const topics = await processTranscript(transcript);
      
      if (topics.length === 0) {
        toast.error('No relevant topics found in the transcript');
        setProcessingStage(ProcessingStage.Initial);
        return;
      }
      
      // Find links for the extracted topics
      setProcessingStage(ProcessingStage.FindingLinks);
      const processedTopics = await findLinksForTopics(topics);
      
      // Convert processed topics to link items
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
      
      setLinks(linkItems);
      setProcessingStage(ProcessingStage.Complete);
      
      if (linkItems.length > 0) {
        toast.success(`Found ${linkItems.length} links across ${processedTopics.length} topics`);
      } else {
        toast.error('No links found for the extracted topics');
      }
    } catch (error) {
      console.error('Error processing transcript:', error);
      toast.error('An error occurred while processing the transcript');
      setProcessingStage(ProcessingStage.Initial);
    }
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
        <TranscriptInput 
          onProcess={handleProcessTranscript} 
          processingStage={processingStage}
        />
        
        {links.length > 0 && (
          <>
            <LinksList 
              links={links}
              onLinkToggle={handleLinkToggle}
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
