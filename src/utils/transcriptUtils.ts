
/**
 * Core transcript processing functionality
 * Extracts topics from podcast transcripts
 */

/**
 * Process a transcript to extract relevant topics
 * 
 * @param transcript - The podcast transcript text
 * @param apiKey - OpenAI API key
 * @param topicCount - Number of topics to extract (1-10)
 * @param topicsToAvoid - List of topics to avoid
 * @returns Promise resolving to topics array and whether mock data was used
 */
export const processTranscript = async (
  transcript: string, 
  apiKey?: string,
  topicCount: number = 5,
  topicsToAvoid: string[] = []
): Promise<{ topics: any[], usedMockData: boolean }> => {
  console.log('Processing transcript with length:', transcript.length);
  console.log('Topic count requested:', topicCount);
  console.log('Topics to avoid:', topicsToAvoid);
  
  if (!apiKey || apiKey.trim() === '' || !apiKey.startsWith('sk-')) {
    console.error('No valid OpenAI API key provided. Cannot process transcript.');
    return { topics: [], usedMockData: false };
  }
  
  try {
    // Clamp topic count between 1-10
    const safeTopicCount = Math.max(1, Math.min(10, topicCount));
    
    // Build the list of topics to avoid as a formatted string
    const topicsToAvoidStr = topicsToAvoid.length > 0 
      ? `Avoid these specific topics: ${topicsToAvoid.join(', ')}.` 
      : '';
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an assistant that extracts the most important, focused, and specific topics from podcast transcripts. 
              
Extract exactly ${safeTopicCount} topics from the transcript provided.

Guidelines:
- Be extremely specific - e.g., "The impact of quantum computing on cryptography" instead of just "Quantum computing"
- Each topic should be 2-5 words, concise yet descriptive
- Focus on the core concepts, techniques, books, products, organizations or people discussed in depth
- For books mentioned, extract the SPECIFIC titles with their authors, not general categories like "Books on Creativity"
- For techniques or methods discussed, be specific about what approach or methodology was mentioned
- Prioritize unique topics that aren't commonly found in every podcast on this subject
- Do not include generic topics that could apply to any podcast
- Extract topics that someone would want to learn more about
- Include the context to understand what's interesting about this topic

${topicsToAvoidStr}

Return ONLY a JSON array with this structure: {"topics": [{"topic": string, "context": string}]}
The "topic" is the specific topic name, and "context" is a brief sentence explaining why this topic is relevant or interesting from the podcast.`
          },
          {
            role: 'user',
            content: `Extract the ${safeTopicCount} most important and specific topics from this podcast transcript, focusing on concepts, techniques, books, products, people or organizations discussed in detail. 
            
Make sure to capture SPECIFIC BOOK TITLES with their authors when mentioned, not just general categories about books.

${topicsToAvoidStr}

Provide each topic as a concise 2-5 word phrase paired with a brief context sentence explaining its significance.

Transcript: ${transcript}`
          }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      return { topics: [], usedMockData: false };
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      console.error('Invalid response format from OpenAI API');
      return { topics: [], usedMockData: false };
    }
    
    try {
      const content = data.choices[0].message.content;
      console.log('Raw API response:', content);
      
      const parsedContent = JSON.parse(content);
      
      if (!parsedContent.topics || !Array.isArray(parsedContent.topics)) {
        console.error('No topics found in API response');
        return { topics: [], usedMockData: false };
      }
      
      // Extract topics from response
      const extractedTopics = parsedContent.topics.map((item: any) => ({
        topic: item.topic,
        context: item.context
      }));
      
      if (extractedTopics.length === 0) {
        console.warn('No topics were extracted from the transcript');
        return { topics: [], usedMockData: false };
      }
      
      console.log('Extracted topics:', extractedTopics);
      return { topics: extractedTopics, usedMockData: false };
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      return { topics: [], usedMockData: false };
    }
  } catch (error) {
    console.error('Error processing transcript:', error);
    return { topics: [], usedMockData: false };
  }
};
