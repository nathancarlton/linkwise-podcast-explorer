
export interface LinkItem {
  id: string;
  topic: string;
  url: string;
  title: string;
  description: string;
  context?: string;
  checked: boolean;
}

export interface ProcessedTopic {
  topic: string;
  context?: string;
  links: {
    url: string;
    title: string;
    description: string;
  }[];
}

export enum ProcessingStage {
  Initial = 'initial',
  ProcessingTranscript = 'processing-transcript',
  FindingLinks = 'finding-links',
  Complete = 'complete',
}

export interface TopicItem {
  topic: string;
  context?: string;
  checked: boolean;
}

export enum SearchApiType {
  OpenAI = 'openai',
  Brave = 'brave'
}
