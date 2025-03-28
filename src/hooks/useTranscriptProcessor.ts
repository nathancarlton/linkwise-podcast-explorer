
import { useState } from 'react';
import { toast } from 'sonner';
import { LinkItem, ProcessingStage, TopicItem } from '@/types';
import { hashString } from '@/utils/hashUtils';
import { processTopicsToLinkItems } from '@/utils/linkProcessingUtils';
import { transcriptService } from '@/services/transcriptService';

export const useTranscriptProcessor = (apiKey: string) => {
  const [processingStage, setProcessingStage] = useState<ProcessingStage>(ProcessingStage.Initial);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [transcriptHash, setTranscriptHash] = useState<string>('');

  // Process transcript and find links
  const handleProcessTranscript = async (
    transcript: string, 
    topicCount: number, 
    domainsToAvoid: string[],
    topicsToAvoid: string[],
    topicsToAdd: string[]
  ) => {
    try {
      // Check if this is a new transcript
      const newHash = hashString(transcript);
      if (newHash === transcriptHash && links.length > 0) {
        toast.info('Processing the same transcript again. Results may be similar.');
      }
      setTranscriptHash(newHash);
      
      // Start processing
      setProcessingStage(ProcessingStage.ProcessingTranscript);
      setLinks([]);
      setTopics([]);
      
      console.log(`Processing transcript with requested topic count: ${topicCount}`);
      
      // Extract topics from transcript
      const { topics: extractedTopics } = await transcriptService.extractTopics(
        transcript,
        apiKey,
        topicCount,
        topicsToAvoid
      );
      
      console.log(`Received ${extractedTopics.length} topics from API, requested ${topicCount}`);
      
      // Create all topics array including extracted and manually added topics
      const allTopics = [...extractedTopics];
      
      // Add manually entered topics with proper structure
      if (topicsToAdd.length > 0) {
        console.log('Adding manual topics:', topicsToAdd);
        topicsToAdd.forEach(topic => {
          // Check if the topic already exists (case insensitive)
          if (!allTopics.some(t => typeof t === 'object' && t.topic && 
              t.topic.toLowerCase() === topic.toLowerCase())) {
            allTopics.push({ 
              topic, 
              context: 'Manually added topic' 
            });
          }
        });
      }
      
      console.log('All topics including manually added:', allTopics);
      
      // Convert extracted topics to topic items
      const topicItems: TopicItem[] = allTopics.map(topic => ({
        topic: topic.topic,
        context: topic.context,
        checked: true
      }));
      
      setTopics(topicItems);
      
      // Find links for all topics (extracted + manually added)
      setProcessingStage(ProcessingStage.FindingLinks);
      const { processedTopics } = await transcriptService.findLinks(
        allTopics,
        apiKey,
        domainsToAvoid
      );
      
      // Convert processed topics to link items
      const linkItems = processTopicsToLinkItems(processedTopics || [], topicItems);
      
      setLinks(linkItems);
      setProcessingStage(ProcessingStage.Complete);
      
      if (linkItems.length > 0) {
        toast.success(`Found ${linkItems.length} links across ${processedTopics?.length || 0} topics`);
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
  
  const handleTopicToggle = (topic: string, checked: boolean) => {
    // Update the topic
    setTopics(topics.map(t => 
      t.topic === topic ? { ...t, checked } : t
    ));
    
    // Update all links for this topic
    setLinks(links.map(link => 
      link.topic === topic ? { ...link, checked } : link
    ));
  };

  return {
    processingStage,
    links,
    topics,
    handleProcessTranscript,
    handleLinkToggle,
    handleTopicToggle
  };
};
