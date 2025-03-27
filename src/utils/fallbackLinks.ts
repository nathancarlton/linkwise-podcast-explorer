
import { ProcessedTopic } from '../types';

/**
 * Generate fallback links when OpenAI or validation fails
 * 
 * @param topics Array of topics to generate fallback links for
 * @returns Array of ProcessedTopic objects with fallback links
 */
export const generateFallbackLinks = (topics: any[]): ProcessedTopic[] => {
  const fallbackLinks: ProcessedTopic[] = [];
  
  // Map of reliable fallback links for common topic categories
  const fallbackMap: Record<string, Array<{url: string, title: string, description: string}>> = {
    'AI': [
      {
        url: 'https://ai.google/research/',
        title: 'Google AI Research',
        description: 'Research and publications on artificial intelligence from Google.'
      },
      {
        url: 'https://openai.com/research/',
        title: 'OpenAI Research',
        description: 'Latest research and papers on AI technologies and applications.'
      }
    ],
    'Healthcare': [
      {
        url: 'https://www.mayoclinic.org/digital-medicine',
        title: 'Mayo Clinic Digital Health',
        description: 'Information on digital technology in healthcare and medicine.'
      },
      {
        url: 'https://health.harvard.edu/blog/artificial-intelligence-in-health-care-202104222464',
        title: 'AI in Healthcare - Harvard Health',
        description: 'Exploration of AI applications in modern healthcare.'
      }
    ],
    'Business': [
      {
        url: 'https://hbr.org/topic/digital-transformation',
        title: 'Digital Transformation - Harvard Business Review',
        description: 'Articles about digital transformation in business and organizations.'
      },
      {
        url: 'https://sloanreview.mit.edu/big-ideas/artificial-intelligence-business-strategy/',
        title: 'AI and Business Strategy - MIT Sloan',
        description: 'Research on the intersection of AI and business strategy.'
      }
    ],
    'Cancer': [
      {
        url: 'https://www.cancer.gov/research/areas/ai',
        title: 'AI in Cancer Research - National Cancer Institute',
        description: 'Information on AI applications in cancer research and treatment.'
      },
      {
        url: 'https://www.mayoclinic.org/diseases-conditions/cancer/diagnosis-treatment/drc-20370594',
        title: 'Cancer Treatment - Mayo Clinic',
        description: 'Overview of cancer diagnosis and treatment approaches.'
      }
    ],
    'Marketing': [
      {
        url: 'https://hbr.org/topic/marketing',
        title: 'Marketing - Harvard Business Review',
        description: 'Articles and research on marketing strategies and trends.'
      },
      {
        url: 'https://www.thinkwithgoogle.com/',
        title: 'Think with Google',
        description: 'Marketing insights and digital trends from Google.'
      }
    ]
  };
  
  // Process each topic and assign relevant fallback links
  for (const topicObj of topics) {
    const topic = typeof topicObj === 'string' ? topicObj : topicObj.topic;
    const context = typeof topicObj === 'string' ? '' : (topicObj.context || '');
    
    // Find the most appropriate category for the topic
    let bestCategory = 'AI'; // Default category
    let bestScore = 0;
    
    for (const category of Object.keys(fallbackMap)) {
      // Calculate simple relevance score based on keyword presence
      let score = 0;
      if (topic.toLowerCase().includes(category.toLowerCase())) score += 3;
      if (context.toLowerCase().includes(category.toLowerCase())) score += 2;
      
      // Check for related keywords
      const relatedKeywords: Record<string, string[]> = {
        'AI': ['artificial intelligence', 'machine learning', 'deep learning', 'neural network', 'generative'],
        'Healthcare': ['health', 'medical', 'doctor', 'patient', 'hospital', 'clinical'],
        'Business': ['strategy', 'company', 'enterprise', 'leadership', 'executive', 'organization'],
        'Cancer': ['oncology', 'tumor', 'clinical trial', 'drug discovery', 'treatment'],
        'Marketing': ['sales', 'advertising', 'customer', 'brand', 'promotion', 'market']
      };
      
      for (const keyword of relatedKeywords[category] || []) {
        if (topic.toLowerCase().includes(keyword)) score += 1;
        if (context.toLowerCase().includes(keyword)) score += 0.5;
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestCategory = category;
      }
    }
    
    // Create processed topic with fallback links from the best category
    fallbackLinks.push({
      topic,
      context,
      links: fallbackMap[bestCategory]
    });
  }
  
  return fallbackLinks;
};
