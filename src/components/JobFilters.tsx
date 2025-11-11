import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface JobFiltersProps {
  currentFilter: string;
  showExpired: boolean;
  onFilterChange: (filter: string) => void;
  onToggleExpired: (show: boolean) => void;
}

/**
 * JobFilters component for filtering jobs by deadline
 * Provides dropdown filter and "show expired jobs" checkbox
 */
export function JobFilters({
  currentFilter,
  showExpired,
  onFilterChange,
  onToggleExpired,
}: JobFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
      {/* Filter Dropdown */}
      <div className="w-full sm:w-64">
        <Select value={currentFilter} onValueChange={onFilterChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Filter by deadline" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Jobs</SelectItem>
            <SelectItem value="urgent">🔴 Urgent (&lt; 3 days)</SelectItem>
            <SelectItem value="week">🟡 This Week (&lt; 7 days)</SelectItem>
            <SelectItem value="month">📅 This Month (&lt; 30 days)</SelectItem>
            <SelectItem value="no_deadline">⏰ No Deadline</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Show Expired Checkbox */}
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={showExpired}
          onChange={(e) => onToggleExpired(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer"
        />
        <span className="text-sm text-gray-700">Show expired jobs</span>
      </label>
    </div>
  );
}
