import React from 'react';
import { X, Filter, SortAsc, SortDesc } from 'lucide-react';
import { RegexPattern } from '../types';

interface FilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  filters: {
    search: string;
    category: string[];
    waf: string[];
    sortBy: string;
    sortDirection: 'asc' | 'desc';
  };
  onChange: (filters: any) => void;
  patterns: RegexPattern[];
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({
  isOpen,
  onClose,
  filters,
  onChange,
  patterns
}) => {
  const uniqueCategories = [...new Set(patterns.map(p => p.category))].sort();
  const uniqueWafs = [...new Set(patterns.map(p => p.waf_name).filter(Boolean))].sort();

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed right-0 top-0 h-full w-80 bg-gray-800 border-l border-gray-700 
        transform transition-transform duration-300 ease-in-out z-50
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </h3>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-700 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-6 overflow-y-auto" style={{ height: 'calc(100vh - 65px)' }}>
          {/* Search */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={e => onChange({ ...filters, search: e.target.value })}
              placeholder="Search patterns..."
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm"
            />
          </div>

          {/* Categories */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">Categories</label>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {uniqueCategories.map(category => (
                <label key={category} className="flex items-center space-x-2 p-2 hover:bg-gray-700 rounded">
                  <input
                    type="checkbox"
                    checked={filters.category.includes(category)}
                    onChange={(e) => {
                      const newCategories = e.target.checked
                        ? [...filters.category, category]
                        : filters.category.filter(c => c !== category);
                      onChange({ ...filters, category: newCategories });
                    }}
                    className="rounded border-gray-600 text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-300">{category}</span>
                </label>
              ))}
            </div>
          </div>

          {/* WAF Names */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">WAF Names</label>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {uniqueWafs.map(waf => (
                <label key={waf} className="flex items-center space-x-2 p-2 hover:bg-gray-700 rounded">
                  <input
                    type="checkbox"
                    checked={filters.waf.includes(waf)}
                    onChange={(e) => {
                      const newWafs = e.target.checked
                        ? [...filters.waf, waf]
                        : filters.waf.filter(w => w !== waf);
                      onChange({ ...filters, waf: newWafs });
                    }}
                    className="rounded border-gray-600 text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-300">{waf}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Sort Options */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">Sort By</label>
            <div className="flex gap-2">
              <select
                value={filters.sortBy}
                onChange={e => onChange({ ...filters, sortBy: e.target.value })}
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm"
              >
                <option value="name">Name</option>
                <option value="category">Category</option>
                <option value="waf">WAF Name</option>
              </select>
              <button
                onClick={() => onChange({
                  ...filters,
                  sortDirection: filters.sortDirection === 'asc' ? 'desc' : 'asc'
                })}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
              >
                {filters.sortDirection === 'asc' 
                  ? <SortAsc className="w-4 h-4" /> 
                  : <SortDesc className="w-4 h-4" />
                }
              </button>
            </div>
          </div>

          {/* Active Filters Summary */}
          {(filters.category.length > 0 || filters.waf.length > 0) && (
            <div className="pt-4 border-t border-gray-700">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Active Filters:</h4>
              <div className="flex flex-wrap gap-2">
                {filters.category.map(cat => (
                  <span 
                    key={cat}
                    className="px-2 py-1 bg-blue-500 bg-opacity-20 text-blue-300 rounded text-xs"
                  >
                    {cat}
                  </span>
                ))}
                {filters.waf.map(waf => (
                  <span 
                    key={waf}
                    className="px-2 py-1 bg-green-500 bg-opacity-20 text-green-300 rounded text-xs"
                  >
                    {waf}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default FilterSidebar;
