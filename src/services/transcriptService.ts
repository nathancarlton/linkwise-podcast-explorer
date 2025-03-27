
import { toast } from 'sonner';
import { 
  processTranscript, 
  findLinksForTopics
} from '@/utils/transcriptProcessor';
import { ProcessedTopic } from '@/types';

/**
 * Service for processing transcripts and finding links
 */
export const transcriptService = {
  /**
   * Process a transcript to extract topics
   * 
   * @param transcript - The transcript text
   * @param apiKey - OpenAI API key
   * @param topicCount - Number of topics to extract
   * @param topicsToAvoid - Topics to exclude
   * @returns Extracted topics
   */
  async extractTopics(
    transcript: string, 
    apiKey: string, 
    topicCount: number, 
    topicsToAvoid: string[]
  ): Promise<{ topics: any[] }> {
    try {
      const { topics: extractedTopics } = await processTranscript(
        transcript, 
        apiKey, 
        topicCount,
        topicsToAvoid
      );
      
      if (!extractedTopics || extractedTopics.length === 0) {
        toast.error('No relevant topics found in the transcript');
        throw new Error('No topics found');
      }
      
      console.log('Successfully extracted topics:', extractedTopics);
      return { topics: extractedTopics };
    } catch (error) {
      console.error('Error extracting topics:', error);
      throw error;
    }
  },
  
  /**
   * Find links for topics
   * 
   * @param topics - List of topics
   * @param apiKey - OpenAI API key
   * @param domainsToAvoid - Domains to exclude
   * @returns Processed topics with links
   */
  async findLinks(
    topics: any[], 
    apiKey: string, 
    domainsToAvoid: string[]
  ): Promise<{ processedTopics: ProcessedTopic[] }> {
    try {
      // Make sure each topic has proper structure
      const formattedTopics = topics.map(topic => {
        if (typeof topic === 'string') {
          return { topic, context: 'Manually added topic' };
        }
        return topic;
      });
      
      const { processedTopics } = await findLinksForTopics(
        formattedTopics, 
        apiKey,
        domainsToAvoid
      );
      
      console.log('Processed topics with links:', processedTopics);
      return { processedTopics };
    } catch (error) {
      console.error('Error finding links:', error);
      throw error;
    }
  }
};
