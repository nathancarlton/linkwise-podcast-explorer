
// Mock implementation for fallback or demo purposes
export const mockProcessTranscript = (transcript: string): Promise<string[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate finding topics in transcript
      // Detect book mentions, websites, organizations
      const lines = transcript.split('\n');
      const potentialTopics = new Set<string>();
      
      // Simple pattern matching for demonstration
      // Look for patterns like "book called X", "website Y", "organization Z"
      const patterns = [
        /book (?:called|titled|named) ["']([^"']+)["']/gi,
        /(?:website|site|blog) (?:called|named) ["']?([A-Za-z0-9\s.]+)["']?/gi,
        /(?:organization|foundation|association) (?:called|named) ["']?([A-Za-z0-9\s.]+)["']?/gi,
        /(?:I recommend|check out|visit) ["']?([A-Za-z0-9\s.]+\.[a-z]{2,})["']?/gi,
      ];
      
      // Process each line for mentions
      lines.forEach(line => {
        patterns.forEach(pattern => {
          const matches = [...line.matchAll(pattern)];
          matches.forEach(match => {
            if (match[1] && match[1].length > 3) {
              potentialTopics.add(match[1].trim());
            }
          });
        });
      });
      
      // If we don't find enough topics with pattern matching,
      // fallback to some simulated "important" phrases
      if (potentialTopics.size < 5) {
        // Extract nouns that appear frequently
        const words = transcript.toLowerCase().match(/\b[a-z]{5,}\b/g) || [];
        const wordFrequency: Record<string, number> = {};
        
        words.forEach(word => {
          if (!wordFrequency[word]) {
            wordFrequency[word] = 0;
          }
          wordFrequency[word]++;
        });
        
        // Get top words by frequency
        const topWords = Object.entries(wordFrequency)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(entry => entry[0]);
          
        // Add them to potential topics
        topWords.forEach(word => potentialTopics.add(word.charAt(0).toUpperCase() + word.slice(1)));
      }
      
      // Select 5-10 topics
      const topics = [...potentialTopics].slice(0, Math.min(10, Math.max(5, potentialTopics.size)));
      
      console.log('Extracted topics:', topics);
      resolve(topics);
    }, 1500); // Simulate processing time
  });
};

// Enhanced mock function to generate links for topics with more reliable URLs
export const mockFindLinksForTopics = (topics: string[]): Promise<import('../types').ProcessedTopic[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const processedTopics: import('../types').ProcessedTopic[] = topics.map(topic => {
        // Generate 1-2 simulated links per topic
        const linkCount = Math.floor(Math.random() * 2) + 1;
        const links = [];
        
        const topicSlug = topic.toLowerCase().replace(/\s+/g, '-');
        
        if (topic.toLowerCase().includes('book') || topic.toLowerCase().includes('author')) {
          // Create a reliable book publisher link
          links.push({
            url: `https://www.penguinrandomhouse.com/books/search/book-title-${topicSlug}/`,
            title: `${topic}`,
            description: `The official information page for "${topic}", including author information, reviews, and where to purchase.`,
          });
        } else if (topic.toLowerCase().includes('university') || topic.toLowerCase().includes('college')) {
          // Create a reliable educational institution link
          const domain = topic.toLowerCase().includes('harvard') ? 'harvard.edu' : 
                        topic.toLowerCase().includes('stanford') ? 'stanford.edu' :
                        topic.toLowerCase().includes('mit') ? 'mit.edu' : 'edu';
          links.push({
            url: `https://www.${domain}/`,
            title: `${topic}`,
            description: `The official website of ${topic}, providing information about programs, faculty, and resources.`,
          });
        } else if (topic.toLowerCase().includes('newsletter')) {
          // Create a reliable newsletter link
          links.push({
            url: `https://www.substack.com/${topicSlug}`,
            title: `${topic}`,
            description: `Subscribe to ${topic}, delivering the latest insights and information to your inbox.`,
          });
        } else {
          // Create a generic but reliable link for other topics
          const reliableDomains = [
            { domain: 'forbes.com', path: 'business' },
            { domain: 'hbr.org', path: 'topic' },
            { domain: 'mckinsey.com', path: 'industries' },
            { domain: 'techcrunch.com', path: 'category' }
          ];
          
          const randomDomain = reliableDomains[Math.floor(Math.random() * reliableDomains.length)];
          
          links.push({
            url: `https://www.${randomDomain.domain}/${randomDomain.path}/${topicSlug}`,
            title: `${topic}`,
            description: `Learn more about ${topic} from this authoritative source, including detailed information and resources.`,
          });
        }
        
        return {
          topic,
          links,
        };
      });
      
      resolve(processedTopics);
    }, 1500); // Simulate processing time
  });
};
