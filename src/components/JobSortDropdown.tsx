import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface JobSortDropdownProps {
  currentSort: string;
  onSortChange: (sort: string) => void;
}

/**
 * JobSortDropdown component for sorting jobs
 * Provides various sort options with visual indicator for active sort
 */
export function JobSortDropdown({ currentSort, onSortChange }: JobSortDropdownProps) {
  const getSortLabel = (sortValue: string): string => {
    switch (sortValue) {
      case 'deadline_asc':
        return '⏰ Earliest Deadline';
      case 'deadline_desc':
        return '📅 Latest Deadline';
      case 'created_desc':
        return '🆕 Recently Posted';
      case 'title_asc':
        return '🔤 Alphabetical (A-Z)';
      default:
        return 'Sort By';
    }
  };

  return (
    <div className="w-full sm:w-64">
      <Select value={currentSort} onValueChange={onSortChange}>
        <SelectTrigger className="w-full">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Sort:</span>
            <SelectValue>
              {getSortLabel(currentSort)}
            </SelectValue>
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="deadline_asc">
            <div className="flex items-center gap-2">
              <span>⏰</span>
              <span>Earliest Deadline</span>
              {currentSort === 'deadline_asc' && (
                <span className="ml-auto text-blue-600">✓</span>
              )}
            </div>
          </SelectItem>
          <SelectItem value="deadline_desc">
            <div className="flex items-center gap-2">
              <span>📅</span>
              <span>Latest Deadline</span>
              {currentSort === 'deadline_desc' && (
                <span className="ml-auto text-blue-600">✓</span>
              )}
            </div>
          </SelectItem>
          <SelectItem value="created_desc">
            <div className="flex items-center gap-2">
              <span>🆕</span>
              <span>Recently Posted</span>
              {currentSort === 'created_desc' && (
                <span className="ml-auto text-blue-600">✓</span>
              )}
            </div>
          </SelectItem>
          <SelectItem value="title_asc">
            <div className="flex items-center gap-2">
              <span>🔤</span>
              <span>Alphabetical (A-Z)</span>
              {currentSort === 'title_asc' && (
                <span className="ml-auto text-blue-600">✓</span>
              )}
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
