
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Info } from 'lucide-react';

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
    <Card className="w-full mt-6 animate-slide-up">
      <CardHeader>
        <CardTitle>Discovered Topics ({topics.length})</CardTitle>
      </CardHeader>
      <CardContent className="relative">
        <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
          <Info className="h-4 w-4" />
          <span>Select which topics to include in the generated links.</span>
        </div>
        
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
      </CardContent>
    </Card>
  );
};

export default TopicList;
