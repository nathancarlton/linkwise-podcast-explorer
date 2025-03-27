
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';

interface TopicListProps {
  topics: Array<{
    topic: string;
    context?: string;
    checked: boolean;
  }>;
  onTopicToggle: (topic: string, checked: boolean) => void;
}

const TopicList: React.FC<TopicListProps> = ({ topics, onTopicToggle }) => {
  if (topics.length === 0) {
    return null;
  }

  return (
    <div className="mb-4">
      <h3 className="text-sm font-medium mb-2">Topics</h3>
      <div className="flex flex-wrap gap-2">
        {topics.map((topicItem) => (
          <div 
            key={topicItem.topic} 
            className={`inline-flex items-center rounded-md px-3 py-1.5 text-sm gap-2 transition-colors 
              ${topicItem.checked 
                ? 'bg-primary/10 text-primary' 
                : 'bg-muted/50 text-muted-foreground'}`}
            title={topicItem.context}
          >
            <Checkbox 
              id={`topic-${topicItem.topic}`}
              checked={topicItem.checked} 
              onCheckedChange={(checked) => onTopicToggle(topicItem.topic, !!checked)}
            />
            <label 
              htmlFor={`topic-${topicItem.topic}`}
              className="cursor-pointer"
            >
              {topicItem.topic}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopicList;
