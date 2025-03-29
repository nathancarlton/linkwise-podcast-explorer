
import { useState } from 'react';
import { toast } from 'sonner';
import { LinkItem, ProcessingStage, TopicItem, SearchApiType } from '@/types';
import { hashString } from '@/utils/hashUtils';
import { processTopicsToLinkItems } from '@/utils/linkProcessingUtils';
import { transcriptService } from '@/services/transcriptService';

export const useTranscriptProcessor = (openAIApiKey: string, braveApiKey?: string, selectedSearchApi: SearchApiType = SearchApiType.OpenAI) => {
  const [processingStage, setProcessingStage] = useState<ProcessingStage>(ProcessingStage.Initial);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [transcriptHash, setTranscriptHash] = useState<string>('');

  // Process transcript and find links
  const handleProcessTranscript = async (
    transcript: string, 
    topicCount: number, 
    domainsToAvoid: string[],
    topicsToAvoid: string[]
  ) => {
    try {
      // Determine which API key to use
      const apiKey = selectedSearchApi === SearchApiType.OpenAI ? openAIApiKey : braveApiKey;
      
      if (!apiKey) {
        toast.error(`No ${selectedSearchApi} API key provided`);
        return;
      }
      
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
      
      // Extract topics from transcript (always use OpenAI for this)
      const { topics: extractedTopics } = await transcriptService.extractTopics(
        transcript,
        openAIApiKey,
        topicCount,
        topicsToAvoid
      );
      
      // Create all topics array
      const allTopics = [...extractedTopics];
      
      console.log('All topics:', allTopics);
      
      // Convert extracted topics to topic items
      const topicItems: TopicItem[] = allTopics.map(topic => ({
        topic: topic.topic,
        context: topic.context,
        checked: true
      }));
      
      setTopics(topicItems);
      
      // Find links for all topics using the selected search API
      setProcessingStage(ProcessingStage.FindingLinks);
      const { processedTopics } = await transcriptService.findLinks(
        allTopics,
        apiKey,
        domainsToAvoid,
        selectedSearchApi
      );
      
      // Convert processed topics to link items
      const linkItems = processTopicsToLinkItems(processedTopics || [], topicItems);
      
      setLinks(linkItems);
      setProcessingStage(ProcessingStage.Complete);
      
      if (linkItems.length > 0) {
        toast.success(`Found ${linkItems.length} links across ${processedTopics?.length || 0} topics using ${selectedSearchApi}`);
      } else {
        toast.error(`No links found for the extracted topics using ${selectedSearchApi}`);
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
