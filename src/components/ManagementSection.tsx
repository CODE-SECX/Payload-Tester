import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Edit2, Save, X, TestTube, Upload, FileText, AlertTriangle, Shield, List, Search, SortAsc, SortDesc, Filter } from 'lucide-react';
import { RegexPattern } from '../types';
import { supabase } from '../lib/supabase';
import BypassManagement from './BypassManagement';
import FilterSidebar from './FilterSidebar';

interface ManagementSectionProps {
  patterns: RegexPattern[];
  onAdd: (pattern: Omit<RegexPattern, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<RegexPattern>) => void;
  onDelete: (id: string) => void;
  onUpdateBypass: (id: string, updates: Partial<RegexPattern>) => void;
}

interface BulkImportPattern {
  pattern: string;
  name?: string;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH';
  category?: string;
  description?: string;
}

type ActiveView = 'patterns' | 'bypasses' | 'bulk' | 'none';

interface FilterState {
  search: string;
  category: string[];
  waf: string[];
  sortBy: 'name' | 'category' | 'waf';
  sortDirection: 'asc' | 'desc';
}

const ManagementSection: React.FC<ManagementSectionProps> = ({
  patterns,
  onAdd,
  onUpdate,
  onDelete,
  onUpdateBypass
}) => {
  const [activeView, setActiveView] = useState<ActiveView>('none');
  const [editingPattern, setEditingPattern] = useState<RegexPattern | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkImportData, setBulkImportData] = useState<{
    patterns: string;
    defaultCategory: string;
    defaultSeverity: 'LOW' | 'MEDIUM' | 'HIGH';
    defaultFlags: string;
  }>({
    patterns: '',
    defaultCategory: '',
    defaultSeverity: 'MEDIUM',
    defaultFlags: 'gi'
  });
  const [testString, setTestString] = useState('');
  const [testResults, setTestResults] = useState<{ [key: string]: boolean }>({});

  // Initialize all form fields
  const [newPattern, setNewPattern] = useState({
    name: '',
    pattern: '',
    flags: 'gi',
    description: '',
    category: '',
    waf_name: '',
    is_active: true
  });

  // New state for bypass values
  const [bypassOptions, setBypassOptions] = useState<string[]>([]);
  const [selectedBypass, setSelectedBypass] = useState<string>('');

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: [],
    waf: [],
    sortBy: 'name',
    sortDirection: 'asc'
  });

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Get unique values for filters
  const filterOptions = useMemo(() => ({
    category: [...new Set(patterns.map(p => p.category))],
    waf: [...new Set(patterns.map(p => p.waf_name).filter(Boolean))]
  }), [patterns]);

  // Filter and sort patterns
  const filteredPatterns = useMemo(() => {
    return patterns
      .filter(pattern => {
        const matchesSearch = !filters.search || 
          pattern.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          pattern.pattern.toLowerCase().includes(filters.search.toLowerCase());
        
        const matchesCategory = filters.category.length === 0 || 
          filters.category.includes(pattern.category);
        
        const matchesWaf = filters.waf.length === 0 || 
          filters.waf.includes(pattern.waf_name || '');

        return matchesSearch && matchesCategory && matchesWaf;
      })
      .sort((a, b) => {
        const direction = filters.sortDirection === 'asc' ? 1 : -1;
        switch (filters.sortBy) {
          case 'category':
            return direction * (a.category.localeCompare(b.category));
          case 'waf':
            return direction * ((a.waf_name || '').localeCompare(b.waf_name || ''));
          default:
            return direction * (a.name.localeCompare(b.name));
        }
      });
  }, [patterns, filters]);

  const [isLoadingBypassOptions, setIsLoadingBypassOptions] = useState(false);

  // Get unique bypass values for dropdown
  const uniqueBypassValues = useMemo(() => {
    const values = new Set(patterns.map(p => p.waf_name).filter(Boolean));
    return Array.from(values);
  }, [patterns]);

  useEffect(() => {
    const fetchBypassOptions = async () => {
      setIsLoadingBypassOptions(true);
      const { data, error } = await supabase
        .from('xss_patterns')
        .select('waf_name')
        .not('waf_name', 'eq', '')
        .not('waf_name', 'is', null);

      setIsLoadingBypassOptions(false);

      if (error) {
        console.error('Error fetching bypass options:', error);
        return;
      }

      const uniqueOptions = [...new Set(data.map(d => d.waf_name))];
      setBypassOptions(uniqueOptions);
    };

    fetchBypassOptions();
  }, []);

  const handleAdd = () => {
    if (!newPattern.name.trim() || !newPattern.pattern.trim()) return;
    
    try {
      // Test if regex is valid
      new RegExp(newPattern.pattern, newPattern.flags);
      onAdd(newPattern);
      setNewPattern({ name: '', pattern: '', flags: 'gi', description: '' });
      setShowAddForm(false);
    } catch (error) {
      alert('Invalid regex pattern: ' + (error as Error).message);
    }
  };

  const handleEdit = (pattern: RegexPattern) => {
    setEditingPattern({
      ...pattern,
      flags: pattern.flags || 'gi',
      description: pattern.description || '',
      waf_name: pattern.waf_name || '',
      category: pattern.category || ''
    });
    setEditingId(pattern.id);
  };

  const handleUpdate = () => {
    if (!editingPattern || !editingPattern.name.trim() || !editingPattern.pattern.trim()) return;
    
    try {
      // Test if regex is valid
      new RegExp(editingPattern.pattern, editingPattern.flags);
      onUpdate(editingPattern.id, editingPattern);
      setEditingId(null);
      setEditingPattern(null);
    } catch (error) {
      alert('Invalid regex pattern: ' + (error as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this pattern?')) {
      onDelete(id);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingPattern(null);
    setShowAddForm(false);
    setShowBulkImport(false);
    setBulkImportData({
      patterns: '',
      defaultCategory: '',
      defaultSeverity: 'MEDIUM',
      defaultFlags: 'gi'
    });
    setNewPattern({ name: '', pattern: '', flags: 'gi', description: '' });
    setSelectedBypass('');
  };

  const testPattern = (pattern: RegexPattern, testStr: string): boolean => {
    try {
      const regex = new RegExp(pattern.pattern, pattern.flags);
      return regex.test(testStr);
    } catch {
      return false;
    }
  };

  const handleTestAll = () => {
    if (!testString.trim()) return;
    
    const results: { [key: string]: boolean } = {};
    patterns.forEach(pattern => {
      results[pattern.id] = testPattern(pattern, testString);
    });
    setTestResults(results);
  };

  const parseBulkPatterns = (input: string): BulkImportPattern[] => {
    return input
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#') && !line.startsWith('//'))
      .map(line => {
        // Check if line contains metadata in JSON format
        if (line.startsWith('{')) {
          try {
            return JSON.parse(line);
          } catch {
            // If JSON parse fails, treat as regular pattern
            return { pattern: line };
          }
        }
        
        // Handle simple pattern format
        return { pattern: line.replace(/^\/|\/[gimuy]*$/g, '') };
      });
  };

  const handleBulkImport = async () => {
    if (!bulkImportData.patterns.trim()) return;

    const patterns = parseBulkPatterns(bulkImportData.patterns);
    const invalidPatterns: string[] = [];

    // Validate all patterns first
    patterns.forEach((p, index) => {
      try {
        new RegExp(p.pattern, bulkImportData.defaultFlags);
      } catch (error) {
        invalidPatterns.push(`Line ${index + 1}: ${p.pattern}`);
      }
    });

    if (invalidPatterns.length > 0) {
      alert(`Invalid regex patterns found:\n${invalidPatterns.join('\n')}`);
      return;
    }

    // Import valid patterns with bypass information
    for (const pattern of patterns) {
      await onAdd({
        name: pattern.name || `${bulkImportData.defaultCategory} Pattern`,
        pattern: pattern.pattern,
        flags: bulkImportData.defaultFlags,
        description: pattern.description || '',
        category: pattern.category || bulkImportData.defaultCategory,
        waf_name: pattern.waf_name || bulkImportData.defaultBypass,
        is_active: true
      });
    }

    // Reset form including bypass selection
    setSelectedBypass('');
    setBulkImportData({
      patterns: '',
      defaultCategory: '',
      defaultSeverity: 'MEDIUM',
      defaultFlags: 'gi'
    });
    setShowBulkImport(false);
  };

  const loadPresetPatterns = (category: string) => {
    const presets: { [key: string]: string } = {
      'Script Tag Detection': `<script[^>]*>
</script>
<script\\x0b
<script\\x0c`,
      'JavaScript Events': `on\\w+\\s*=
window\\.\\w+\\s*=
document\\.on\\w+\\s*=
<\\w+\\s+on\\w+\\s*=`,
      'JavaScript URI Schemes': `javascript\\s*:
vbscript\\s*:
data\\s*:\\s*text\\/html\\s*;base64
data\\s*:\\s*image\\/svg\\+xml`,
      'Dangerous Functions': `eval\\s*\\(
function\\s*\\(
setTimeout\\s*\\(
setInterval\\s*\\(
new\\s+Function\\s*\\(`,
      'DOM Manipulation': `innerHTML\\s*=
outerHTML\\s*=
insertAdjacentHTML\\s*\\(
document\\.write\\s*\\(
document\\.writeln\\s*\\(`,
      'HTML Injection': `<iframe[^>]*>
<object[^>]*>
<embed[^>]*>
<svg[^>]*>
<math[^>]*>`
    };

    if (presets[category]) {
      setBulkImportData({
        patterns: presets[category],
        defaultCategory: category,
        defaultSeverity: 'MEDIUM',
        defaultFlags: 'gi'
      });
      // setBulkCategory(category);
      // setBulkDescription(`Blocks ${category.toLowerCase()}`);
    }
  };

  const renderBulkImportForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Default Category</label>
          <input
            type="text"
            value={bulkImportData.defaultCategory}
            onChange={(e) => setBulkImportData(prev => ({ ...prev, defaultCategory: e.target.value }))}
            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-sm"
            placeholder="e.g., script-injection"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Default Severity</label>
          <select
            value={bulkImportData.defaultSeverity}
            onChange={(e) => setBulkImportData(prev => ({ 
              ...prev, 
              defaultSeverity: e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' 
            }))}
            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-sm"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Default Flags</label>
          <input
            type="text"
            value={bulkImportData.defaultFlags}
            onChange={(e) => setBulkImportData(prev => ({ ...prev, defaultFlags: e.target.value }))}
            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-sm"
            placeholder="gi"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Patterns (one per line)
        </label>
        <div className="bg-gray-700 p-3 rounded text-xs mb-2">
          <p className="font-medium text-blue-400 mb-1">Supported formats:</p>
          <pre className="text-gray-300">
            {`# Simple pattern:
<script[^>]*>

# JSON format with metadata:
{"pattern": "<script[^>]*>", "name": "Custom Script", "severity": "HIGH", "category": "script-tag"}`}
          </pre>
        </div>
        <textarea
          value={bulkImportData.patterns}
          onChange={(e) => setBulkImportData(prev => ({ ...prev, patterns: e.target.value }))}
          className="w-full h-40 px-3 py-2 bg-gray-600 border border-gray-500 rounded text-sm font-mono"
          placeholder="Enter patterns..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Bypass Type</label>
          <div className="flex gap-2">
            <select
              value={selectedBypass}
              onChange={(e) => setSelectedBypass(e.target.value)}
              className="flex-1 px-3 py-2 bg-gray-600 border border-gray-500 rounded text-sm"
            >
              <option value="">Select or type new...</option>
              {bypassOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            {!bypassOptions.includes(selectedBypass) && selectedBypass && (
              <span className="text-xs text-blue-400 flex items-center">New</span>
            )}
          </div>
          <input
            type="text"
            value={selectedBypass}
            onChange={(e) => setSelectedBypass(e.target.value)}
            placeholder="Or type new bypass type..."
            className="mt-2 w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-sm"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleBulkImport}
          disabled={!bulkImportData.patterns.trim() || !bulkImportData.defaultCategory.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 text-white rounded transition-colors"
        >
          Import Patterns
        </button>
        <button
          onClick={() => setShowBulkImport(false)}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  const renderAddForm = () => (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
          <input
            type="text"
            value={newPattern.name}
            onChange={(e) => setNewPattern({ ...newPattern, name: e.target.value })}
            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-sm"
            placeholder="Pattern name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Flags</label>
          <input
            type="text"
            value={newPattern.flags}
            onChange={(e) => setNewPattern({ ...newPattern, flags: e.target.value })}
            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-sm"
            placeholder="gi"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Regex Pattern</label>
        <input
          type="text"
          value={newPattern.pattern}
          onChange={(e) => setNewPattern({ ...newPattern, pattern: e.target.value })}
          className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-sm font-mono"
          placeholder="<script.*?>"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Description (Optional)</label>
        <input
          type="text"
          value={newPattern.description}
          onChange={(e) => setNewPattern({ ...newPattern, description: e.target.value })}
          className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-sm"
          placeholder="What does this pattern block?"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
          <input
            type="text"
            value={newPattern.category}
            onChange={(e) => setNewPattern({ ...newPattern, category: e.target.value })}
            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Bypasses</label>
          <input
            type="text"
            list="bypass-options"
            value={newPattern.waf_name}
            onChange={(e) => setNewPattern({ ...newPattern, waf_name: e.target.value })}
            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-sm"
            placeholder="What security measure does this bypass?"
          />
          <datalist id="bypass-options">
            {uniqueBypassValues.map(value => (
              <option key={value} value={value} />
            ))}
          </datalist>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
        >
          <Save className="w-4 h-4" />
          Add Pattern
        </button>
        <button
          onClick={handleCancel}
          className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
      </div>
    </div>
  );

  const renderEditForm = () => (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
          <input
            type="text"
            value={editingPattern?.name || ''}
            onChange={(e) => setEditingPattern({ ...editingPattern!, name: e.target.value })}
            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Flags</label>
          <input
            type="text"
            value={editingPattern?.flags}
            onChange={(e) => setEditingPattern({ ...editingPattern!, flags: e.target.value })}
            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-sm"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Regex Pattern</label>
        <input
          type="text"
          value={editingPattern?.pattern}
          onChange={(e) => setEditingPattern({ ...editingPattern!, pattern: e.target.value })}
          className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-sm font-mono"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
        <input
          type="text"
          value={editingPattern?.description || ''}
          onChange={(e) => setEditingPattern({ ...editingPattern!, description: e.target.value })}
          className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-sm"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
          <input
            type="text"
            value={editingPattern?.category || ''}
            onChange={(e) => setEditingPattern(prev => ({ ...prev!, category: e.target.value }))}
            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Bypasses</label>
          <input
            type="text"
            list="bypass-options"
            value={editingPattern?.waf_name || ''}
            onChange={(e) => setEditingPattern(prev => ({ ...prev!, waf_name: e.target.value }))}
            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-sm"
            placeholder="What security measure does this bypass?"
          />
          <datalist id="bypass-options">
            {uniqueBypassValues.map(value => (
              <option key={value} value={value} />
            ))}
          </datalist>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleUpdate}
          className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
        >
          <Save className="w-3 h-3" />
          Save
        </button>
        <button
          onClick={handleCancel}
          className="flex items-center gap-2 px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded transition-colors"
        >
          <X className="w-3 h-3" />
          Cancel
        </button>
      </div>
    </div>
  );

  const renderCard = (
    title: string, 
    description: string, 
    icon: React.ReactNode, 
    view: ActiveView
  ) => (
    <div 
      className={`p-6 bg-gray-700 rounded-lg cursor-pointer transition-all ${
        activeView === view ? 'ring-2 ring-blue-500' : 'hover:bg-gray-600'
      }`}
      onClick={() => setActiveView(activeView === view ? 'none' : view)}
    >
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <p className="text-sm text-gray-300">{description}</p>
    </div>
  );

  const renderPatternManagement = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Pattern Management</h3>
        <button
          onClick={() => setIsFilterOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
        >
          <Filter className="w-4 h-4" />
          Filters
          {(filters.category.length > 0 || filters.waf.length > 0) && (
            <span className="px-2 py-0.5 bg-blue-500 rounded-full text-xs">
              {filters.category.length + filters.waf.length}
            </span>
          )}
        </button>
      </div>

      {/* Filter Sidebar */}
      <FilterSidebar
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        onChange={setFilters}
        patterns={patterns}
      />

      {/* Rest of pattern management content */}
      {/* <div className="bg-gray-700 p-4 rounded-lg space-y-4"> */}
        {/* Search */}
        {/* <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search patterns..."
            value={filters.search}
            onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="w-full pl-10 pr-4 py-2 bg-gray-600 border border-gray-500 rounded text-sm"
          />
        </div> */}

        {/* Filter Controls */}
        {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Category Filter */}
          {/* <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
            <select
              multiple
              value={filters.category}
              onChange={e => setFilters(prev => ({
                ...prev,
                category: Array.from(e.target.selectedOptions, option => option.value)
              }))}
              className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-sm"
            >
              {filterOptions.category.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div> */}

          {/* Bypass Filter */}
          {/* <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">WAF Name</label>
            <select
              multiple
              value={filters.waf}
              onChange={e => setFilters(prev => ({
                ...prev,
                waf: Array.from(e.target.selectedOptions, option => option.value)
              }))}
              className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-sm"
            >
              {filterOptions.waf.map(byp => (
                <option key={byp} value={byp}>{byp}</option>
              ))}
            </select>
          </div> */}

          {/* Sort Controls */}
          {/* <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Sort By</label>
            <div className="flex gap-2">
              <select
                value={filters.sortBy}
                onChange={e => setFilters(prev => ({
                  ...prev,
                  sortBy: e.target.value as FilterState['sortBy']
                }))}
                className="flex-1 px-3 py-2 bg-gray-600 border border-gray-500 rounded text-sm"
              >
                <option value="name">Name</option>
                <option value="category">Category</option>
                <option value="waf">WAF Name</option>
              </select>
              <button
                onClick={() => setFilters(prev => ({
                  ...prev,
                  sortDirection: prev.sortDirection === 'asc' ? 'desc' : 'asc'
                }))}
                className="px-3 py-2 bg-gray-600 border border-gray-500 rounded"
              >
                {filters.sortDirection === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div> */}
      {/* </div> */}

      {/* Pattern List */}
      <div className="space-y-3">
        {filteredPatterns.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No patterns match your filters</p>
        ) : (
          filteredPatterns.map(pattern => (
            <div key={pattern.id} className="p-4 bg-gray-700 rounded-lg">
              {editingId === pattern.id ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editingPattern?.name || ''}
                    onChange={(e) => setEditingPattern(prev => ({ ...prev!, name: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-sm"
                    placeholder="Pattern name"
                  />
                  <input
                    type="text"
                    value={editingPattern?.pattern || ''}
                    onChange={(e) => setEditingPattern(prev => ({ ...prev!, pattern: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-sm font-mono"
                    placeholder="Regex pattern"
                  />
                  <input
                    type="text"
                    value={editingPattern?.flags || ''}
                    onChange={(e) => setEditingPattern(prev => ({ ...prev!, flags: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-sm"
                    placeholder="Flags (e.g., gi)"
                  />
                  <input
                    type="text"
                    value={editingPattern?.description || ''}
                    onChange={(e) => setEditingPattern(prev => ({ ...prev!, description: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-sm"
                    placeholder="Description (optional)"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleUpdate}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{pattern.name}</h4>
                    <code className="text-sm text-gray-300 font-mono">/{pattern.pattern}/{pattern.flags}</code>
                    {pattern.description && (
                      <p className="text-sm text-gray-400 mt-1">{pattern.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded ${
                      pattern.severity === 'HIGH' ? 'bg-red-600' :
                      pattern.severity === 'MEDIUM' ? 'bg-yellow-600' :
                      'bg-blue-600'
                    }`}>
                      {pattern.severity}
                    </span>
                    <button
                      onClick={() => handleEdit(pattern)}
                      className="p-1 text-blue-400 hover:text-blue-300"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(pattern.id)}
                      className="p-1 text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderBulkImport = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold mb-4">Bulk Import Patterns</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Default Category</label>
          <input
            type="text"
            value={bulkImportData.defaultCategory}
            onChange={(e) => setBulkImportData(prev => ({ ...prev, defaultCategory: e.target.value }))}
            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-sm"
            placeholder="e.g., script-injection"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">WAF Name</label>
          <input
            type="text"
            list="bypass-options"
            value={bulkImportData.defaultBypass}
            onChange={(e) => setBulkImportData(prev => ({ ...prev, defaultBypass: e.target.value }))
            }
            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-sm"
            placeholder="Select or type new..."
          />
          <datalist id="bypass-options">
            {uniqueBypassValues.map(value => (
              <option key={value} value={value} />
            ))}
          </datalist>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Patterns (one per line)
        </label>
        <textarea
          value={bulkImportData.patterns}
          onChange={(e) => setBulkImportData(prev => ({ ...prev, patterns: e.target.value }))}
          className="w-full h-64 px-3 py-2 bg-gray-600 border border-gray-500 rounded text-sm font-mono"
          placeholder={`# Simple pattern:
<script[^>]*>

# JSON format with metadata:
{"pattern": "<script[^>]*>", "name": "Custom Script", "severity": "HIGH", "category": "script-tag"}`}
        />
      </div>

      <button
        onClick={handleBulkImport}
        disabled={!bulkImportData.patterns.trim()}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 text-white rounded transition-colors"
      >
        <Upload className="w-4 h-4" />
        Import Patterns
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Management Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {renderCard(
          'Pattern Management',
          'Add, edit, or remove individual XSS detection patterns',
          <List className="w-6 h-6 text-blue-400" />,
          'patterns'
        )}
        {renderCard(
          'Bypass Management',
          'Manage and organize bypass categories across patterns',
          <Shield className="w-6 h-6 text-green-400" />,
          'bypasses'
        )}
        {renderCard(
          'Bulk Import',
          'Import multiple patterns at once with shared properties',
          <Upload className="w-6 h-6 text-purple-400" />,
          'bulk'
        )}
      </div>

      {/* Active View Content */}
      {activeView !== 'none' && (
        <div className="mt-6 p-6 bg-gray-800 rounded-lg border border-gray-700">
          {activeView === 'patterns' && renderPatternManagement()}
          {activeView === 'bypasses' && (
            <BypassManagement 
              patterns={patterns}
              onUpdateBypass={onUpdateBypass}
            />
          )}
          {activeView === 'bulk' && renderBulkImport()}
        </div>
      )}
    </div>
  );
};

export default ManagementSection;