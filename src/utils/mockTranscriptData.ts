
// Mock implementation for fallback or demo purposes
export const mockProcessTranscript = (transcript: string): Promise<string[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Try to simulate finding meaningful topics in transcript
      // Looking for potential valuable topics rather than just random words
      const lines = transcript.split('\n');
      const potentialTopics = new Set<string>();
      
      // Smarter pattern matching for substantial topics
      const patterns = [
        /book (?:called|titled|named) ["']([^"']+)["']/gi,
        /(?:website|site|blog) (?:called|named) ["']?([A-Za-z0-9\s.]+)["']?/gi,
        /(?:organization|foundation|association|university|college) (?:called|named) ["']?([A-Za-z0-9\s.]+)["']?/gi,
        /(?:I recommend|check out|visit|look at) ["']?([A-Za-z0-9\s.]+\.[a-z]{2,})["']?/gi,
        /(?:research|study|paper|report) (?:on|about|by) ["']?([A-Za-z0-9\s.]+)["']?/gi,
        /(?:conference|event|meetup) (?:called|named) ["']?([A-Za-z0-9\s.]+)["']?/gi,
      ];
      
      // Process each line for valuable mentions
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
      
      // If we don't find enough topics, use predefined valuable topics
      // rather than random words
      if (potentialTopics.size < 5) {
        const valuableDefaultTopics = [
          "Harvard Business Review",
          "TED Talks",
          "Y Combinator",
          "MIT Technology Review",
          "Stanford AI Lab",
          "Khan Academy",
          "Web Accessibility Initiative",
          "GitHub",
          "Stack Overflow",
          "Coursera"
        ];
        
        valuableDefaultTopics.forEach(topic => potentialTopics.add(topic));
      }
      
      // Select 5-8 topics (more focused than 5-10)
      const topics = [...potentialTopics].slice(0, Math.min(8, Math.max(5, potentialTopics.size)));
      
      console.log('Extracted mock topics:', topics);
      resolve(topics);
    }, 1500); // Simulate processing time
  });
};

// Enhanced mock function to generate links with context and specific pages
export const mockFindLinksForTopics = (topics: string[]): Promise<import('../types').ProcessedTopic[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const processedTopics: import('../types').ProcessedTopic[] = topics.map(topic => {
        // Generate 1-2 simulated links per topic with context
        const linkCount = Math.floor(Math.random() * 2) + 1;
        const links = [];
        
        // Default context if we don't have a specific one
        let context = "Discussed as a valuable resource for podcast listeners to explore further.";
        
        if (topic.toLowerCase().includes('harvard')) {
          context = "Speakers referenced their research on leadership development strategies.";
          links.push({
            url: "https://hbr.org/2020/05/real-leaders-are-forged-in-crisis",
            title: "Crisis Leadership Article",
            description: "Harvard Business Review article about how real leaders emerge during challenging times.",
          });
        } else if (topic.toLowerCase().includes('ted')) {
          context = "Mentioned this specific talk about innovative problem-solving approaches.";
          links.push({
            url: "https://www.ted.com/talks/simon_sinek_how_great_leaders_inspire_action",
            title: "Simon Sinek: How great leaders inspire action",
            description: "Simon Sinek presents a simple but powerful model for how leaders inspire action, starting with a golden circle and the question 'Why?'",
          });
        } else if (topic.toLowerCase().includes('y combinator')) {
          context = "Referenced their startup funding model and incubator program.";
          links.push({
            url: "https://www.ycombinator.com/library/4D-yc-s-essential-startup-advice",
            title: "Y Combinator Essential Startup Advice",
            description: "A collection of the most important startup advice from Y Combinator's partners and alumni.",
          });
        } else if (topic.toLowerCase().includes('mit')) {
          context = "Discussed their latest research on artificial intelligence applications.";
          links.push({
            url: "https://news.mit.edu/topic/artificial-intelligence2",
            title: "MIT AI Research News",
            description: "The latest artificial intelligence research news and breakthroughs from MIT's labs and research centers.",
          });
        } else if (topic.toLowerCase().includes('stanford')) {
          context = "Highlighted their pioneering work in computer vision technologies.";
          links.push({
            url: "https://ai.stanford.edu/research/computer-vision/",
            title: "Stanford Computer Vision Research",
            description: "Exploring cutting-edge computer vision research at Stanford's AI Lab with real-world applications.",
          });
        } else if (topic.toLowerCase().includes('khan')) {
          context = "Recommended as a free learning resource for continuing education.";
          links.push({
            url: "https://www.khanacademy.org/computing/computer-programming",
            title: "Khan Academy Programming Courses",
            description: "Free courses teaching programming fundamentals through interactive exercises and video tutorials.",
          });
        } else if (topic.toLowerCase().includes('accessibility')) {
          context = "Emphasized importance for inclusive web design practices.";
          links.push({
            url: "https://www.w3.org/WAI/fundamentals/accessibility-intro/",
            title: "Introduction to Web Accessibility",
            description: "Essential guide to understanding web accessibility and implementing inclusive design principles.",
          });
        } else if (topic.toLowerCase().includes('github')) {
          context = "Mentioned as essential for collaboration on coding projects.";
          links.push({
            url: "https://github.com/features/actions",
            title: "GitHub Actions",
            description: "Automate your workflow from idea to production using GitHub Actions with powerful CI/CD capabilities.",
          });
        } else if (topic.toLowerCase().includes('stack')) {
          context = "Referenced as the go-to community for programming questions.";
          links.push({
            url: "https://stackoverflow.com/questions/tagged/javascript",
            title: "JavaScript Questions on Stack Overflow",
            description: "Community-driven Q&A for JavaScript developers with practical solutions to common problems.",
          });
        } else if (topic.toLowerCase().includes('coursera')) {
          context = "Recommended their specialized certifications for career advancement.";
          links.push({
            url: "https://www.coursera.org/professional-certificates/google-data-analytics",
            title: "Google Data Analytics Certificate",
            description: "Professional certificate program teaching in-demand skills for entry-level data analyst roles.",
          });
        } else {
          // For topics we don't have specific mock data for
          context = "Discussed as a valuable resource that listeners should explore further.";
          
          // Generic but specific and valuable links rather than just domain homepages
          const reliableResources = [
            { 
              url: "https://www.forbes.com/sites/forbestechcouncil/2023/05/15/how-to-future-proof-your-career-in-tech/", 
              title: "Future-Proofing Your Tech Career", 
              description: "Forbes article on staying relevant in the rapidly evolving technology landscape."
            },
            { 
              url: "https://hbr.org/2022/11/the-new-rules-of-work", 
              title: "The New Rules of Work", 
              description: "Harvard Business Review's guide to navigating the changing workplace environment."
            },
            { 
              url: "https://www.mckinsey.com/capabilities/mckinsey-digital/our-insights/tech-forward/generative-ai-a-creative-new-world", 
              title: "Generative AI: A Creative New World", 
              description: "McKinsey's analysis of how generative AI is transforming creative processes across industries."
            },
            { 
              url: "https://techcrunch.com/category/artificial-intelligence/", 
              title: "TechCrunch AI Coverage", 
              description: "The latest news and analysis on artificial intelligence technologies and companies."
            }
          ];
          
          // Select a random resource from our curated list
          const randomResource = reliableResources[Math.floor(Math.random() * reliableResources.length)];
          links.push(randomResource);
        }
        
        return {
          topic,
          context,
          links,
        };
      });
      
      resolve(processedTopics);
    }, 1500); // Simulate processing time
  });
};
