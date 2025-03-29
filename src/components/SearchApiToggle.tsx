
import React from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { SearchApiType } from '@/types';
import { HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SearchApiToggleProps {
  selectedApi: SearchApiType;
  onToggle: (value: SearchApiType) => void;
  disabled?: boolean;
}

const SearchApiToggle: React.FC<SearchApiToggleProps> = ({ 
  selectedApi, 
  onToggle,
  disabled = false
}) => {
  const handleValueChange = (value: string) => {
    if (value === SearchApiType.OpenAI || value === SearchApiType.Brave) {
      onToggle(value as SearchApiType);
    }
  };

  return (
    <div className="flex items-center gap-3 my-4">
      <span className="text-sm font-medium">Search API:</span>
      <ToggleGroup 
        type="single" 
        value={selectedApi}
        onValueChange={handleValueChange}
        disabled={disabled}
      >
        <ToggleGroupItem value={SearchApiType.OpenAI} aria-label="Use OpenAI API" className="text-xs">
          OpenAI
        </ToggleGroupItem>
        <ToggleGroupItem value={SearchApiType.Brave} aria-label="Use Brave API" className="text-xs">
          Brave
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="ml-1 inline-flex">
                  <HelpCircle className="h-3 w-3 text-muted-foreground" />
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-xs">
                  Due to browser CORS restrictions, we use mock data for Brave API in the browser. 
                  For production use, this should be implemented in a backend service.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
};

export default SearchApiToggle;
