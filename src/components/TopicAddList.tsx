
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, Plus } from 'lucide-react';

interface TopicAddListProps {
  topics: string[];
  onRemove: (topic: string) => void;
  newTopic: string;
  setNewTopic: (topic: string) => void;
  onAdd: (e: React.FormEvent) => void;
  disabled?: boolean;
}

const TopicAddList: React.FC<TopicAddListProps> = ({
  topics,
  onRemove,
  newTopic,
  setNewTopic,
  onAdd,
  disabled = false
}) => {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Topics to Add ({topics.length}/10)</h3>
      
      <div className="flex flex-wrap gap-2 mb-2">
        {topics.map((topic) => (
          <div 
            key={topic} 
            className="inline-flex items-center bg-secondary/70 text-sm rounded-md px-2 py-1"
          >
            <button
              type="button"
              onClick={() => onRemove(topic)}
              className="mr-1 hover:text-destructive transition-colors"
              disabled={disabled}
              aria-label={`Remove ${topic}`}
            >
              <X className="h-3 w-3" />
            </button>
            <span>{topic}</span>
          </div>
        ))}
      </div>
      
      <form onSubmit={onAdd} className="flex items-center gap-2">
        <Input
          type="text"
          placeholder="Enter topic to add (max 32 characters)"
          value={newTopic}
          onChange={(e) => setNewTopic(e.target.value)}
          disabled={disabled || topics.length >= 10}
          className="flex-1"
          maxLength={32}
        />
        <Button 
          type="submit" 
          size="sm" 
          variant="outline"
          disabled={disabled || !newTopic.trim() || topics.length >= 10}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </form>
      
      <p className="text-xs text-muted-foreground">
        Enter topics you want to include in the results. Limited to 32 characters per topic.
      </p>
    </div>
  );
};

export default TopicAddList;
