
export interface LinkItem {
  id: string;
  topic: string;
  url: string;
  title: string;
  description: string;
  checked: boolean;
}

export interface ProcessedTopic {
  topic: string;
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
