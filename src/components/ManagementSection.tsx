import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Save, X, TestTube, Upload, FileText } from 'lucide-react';
import { RegexPattern } from '../types';

interface ManagementSectionProps {
  patterns: RegexPattern[];
  onAdd: (pattern: Omit<RegexPattern, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<RegexPattern>) => void;
  onDelete: (id: string) => void;
}

const ManagementSection: React.FC<ManagementSectionProps> = ({
  patterns,
  onAdd,
  onUpdate,
  onDelete
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkPatterns, setBulkPatterns] = useState('');
  const [bulkCategory, setBulkCategory] = useState('');
  const [bulkFlags, setBulkFlags] = useState('gi');
  const [bulkDescription, setBulkDescription] = useState('');
  const [testString, setTestString] = useState('');
  const [testResults, setTestResults] = useState<{ [key: string]: boolean }>({});

  const [newPattern, setNewPattern] = useState({
    name: '',
    pattern: '',
    flags: 'gi',
    description: ''
  });

  const [editingPattern, setEditingPattern] = useState<RegexPattern | null>(null);

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
    setEditingPattern({ ...pattern });
    setEditingId(pattern.id);
  };

  const handleUpdate = () => {
    if (!editingPattern || !editingPattern.name.trim() || !editingPattern.pattern.trim()) return;
    
    try {
      // Test if regex is valid
      new RegExp(editingPattern.pattern, editingPattern.flags);
      onUpdate(editingPattern.id, {
        name: editingPattern.name,
        pattern: editingPattern.pattern,
        flags: editingPattern.flags,
        description: editingPattern.description
      });
      setEditingId(null);
      setEditingPattern(null);
    } catch (error) {
      alert('Invalid regex pattern: ' + (error as Error).message);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingPattern(null);
    setShowAddForm(false);
    setShowBulkImport(false);
    setBulkPatterns('');
    setBulkCategory('');
    setBulkFlags('gi');
    setBulkDescription('');
    setNewPattern({ name: '', pattern: '', flags: 'gi', description: '' });
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

  const handleBulkImport = () => {
    if (!bulkPatterns.trim() || !bulkCategory.trim()) return;
    
    const patterns = bulkPatterns
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#') && !line.startsWith('//'))
      .map((pattern, index) => {
        // Remove common regex delimiters if present
        const cleanPattern = pattern.replace(/^\/|\/[gimuy]*$/g, '');
        return {
          name: `${bulkCategory} ${index + 1}`,
          pattern: cleanPattern,
          flags: bulkFlags,
          description: bulkDescription || `Auto-imported ${bulkCategory.toLowerCase()} pattern`
        };
      });

    // Validate all patterns before adding
    const invalidPatterns: string[] = [];
    patterns.forEach((pattern, index) => {
      try {
        new RegExp(pattern.pattern, pattern.flags);
      } catch (error) {
        invalidPatterns.push(`Line ${index + 1}: ${pattern.pattern}`);
      }
    });

    if (invalidPatterns.length > 0) {
      alert(`Invalid regex patterns found:\n${invalidPatterns.join('\n')}`);
      return;
    }

    // Add all valid patterns
    patterns.forEach(pattern => onAdd(pattern));
    
    // Reset form
    setBulkPatterns('');
    setBulkCategory('');
    setBulkFlags('gi');
    setBulkDescription('');
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
      setBulkPatterns(presets[category]);
      setBulkCategory(category);
      setBulkDescription(`Blocks ${category.toLowerCase()}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Test Section */}
      <div className="bg-gray-700 p-4 rounded-lg">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <TestTube className="w-4 h-4 text-blue-400" />
          Test Patterns
        </h3>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={testString}
            onChange={(e) => setTestString(e.target.value)}
            placeholder="Enter test string..."
            className="flex-1 px-3 py-2 bg-gray-600 border border-gray-500 rounded text-sm"
          />
          <button
            onClick={handleTestAll}
            disabled={!testString.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 text-white text-sm rounded transition-colors"
          >
            Test All
          </button>
        </div>
        {Object.keys(testResults).length > 0 && (
          <div className="text-sm">
            <span className="text-gray-300">Results: </span>
            {patterns.map((pattern, index) => (
              <span
                key={`test-result-${pattern.id}-${index}`}
                className={`inline-block px-2 py-1 rounded mr-2 mb-1 ${
                  testResults[pattern.id]
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-600 text-gray-300'
                }`}
              >
                {pattern.name}: {testResults[pattern.id] ? 'Match' : 'No Match'}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Add New Pattern */}
      <div className="bg-gray-700 p-4 rounded-lg">
        {!showAddForm && !showBulkImport ? (
          <div className="flex gap-3">
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Single Pattern
            </button>
            <button
              onClick={() => setShowBulkImport(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            >
              <Upload className="w-4 h-4" />
              Bulk Import Patterns
            </button>
          </div>
        ) : showBulkImport ? (
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Upload className="w-4 h-4 text-blue-400" />
              Bulk Import Patterns
            </h3>
            
            {/* Preset Categories */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Quick Presets:</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {['Script Tag Detection', 'JavaScript Events', 'JavaScript URI Schemes', 'Dangerous Functions', 'DOM Manipulation', 'HTML Injection'].map(category => (
                  <button
                    key={category}
                    onClick={() => loadPresetPatterns(category)}
                    className="text-xs px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Category Name</label>
                <input
                  type="text"
                  value={bulkCategory}
                  onChange={(e) => setBulkCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-sm"
                  placeholder="e.g., Script Tag Detection"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Flags</label>
                <input
                  type="text"
                  value={bulkFlags}
                  onChange={(e) => setBulkFlags(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-sm"
                  placeholder="gi"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <input
                  type="text"
                  value={bulkDescription}
                  onChange={(e) => setBulkDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-sm"
                  placeholder="Optional description"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Regex Patterns (one per line)
              </label>
              <textarea
                value={bulkPatterns}
                onChange={(e) => setBulkPatterns(e.target.value)}
                className="w-full h-40 px-3 py-2 bg-gray-600 border border-gray-500 rounded text-sm font-mono"
                placeholder={`<script[^>]*>
</script>
<script\\x0b
<script\\x0c

# Lines starting with # or // are ignored
# Each line becomes a separate pattern`}
              />
              <p className="text-xs text-gray-400 mt-1">
                Each line will create a separate pattern. Lines starting with # or // are ignored.
              </p>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleBulkImport}
                disabled={!bulkPatterns.trim() || !bulkCategory.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 text-white rounded transition-colors"
              >
                <Upload className="w-4 h-4" />
                Import {bulkPatterns.split('\n').filter(line => line.trim() && !line.trim().startsWith('#') && !line.trim().startsWith('//')).length} Patterns
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
        ) : (
          <div className="space-y-3">
            <h3 className="font-semibold">Add New Pattern</h3>
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
        )}
      </div>

      {/* Existing Patterns */}
      <div className="space-y-3">
        <h3 className="font-semibold">Existing Patterns ({patterns.length})</h3>
        {patterns.length === 0 ? (
          <p className="text-gray-400 text-sm italic">No patterns configured</p>
        ) : (
          patterns.map((pattern, index) => (
            <div key={`pattern-${pattern.id}-${index}`} className="bg-gray-700 p-4 rounded-lg">
              {editingId === pattern.id && editingPattern ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                      <input
                        type="text"
                        value={editingPattern.name}
                        onChange={(e) => setEditingPattern({ ...editingPattern, name: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Flags</label>
                      <input
                        type="text"
                        value={editingPattern.flags}
                        onChange={(e) => setEditingPattern({ ...editingPattern, flags: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Regex Pattern</label>
                    <input
                      type="text"
                      value={editingPattern.pattern}
                      onChange={(e) => setEditingPattern({ ...editingPattern, pattern: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                    <input
                      type="text"
                      value={editingPattern.description || ''}
                      onChange={(e) => setEditingPattern({ ...editingPattern, description: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-sm"
                    />
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
              ) : (
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium">
                        {pattern.name}
                        {pattern.name.match(/\d+$/) && (
                          <span className="ml-2 px-2 py-1 text-xs bg-blue-600 text-white rounded">
                            #{pattern.name.match(/\d+$/)?.[0]}
                          </span>
                        )}
                      </h4>
                      {testResults[pattern.id] !== undefined && (
                        <span className={`px-2 py-1 text-xs rounded ${
                          testResults[pattern.id] ? 'bg-red-600' : 'bg-gray-600'
                        }`}>
                          {testResults[pattern.id] ? 'Matches' : 'No Match'}
                        </span>
                      )}
                    </div>
                    <code className="text-sm text-gray-300 font-mono break-all">
                      /{pattern.pattern}/{pattern.flags}
                    </code>
                    {pattern.description && (
                      <p className="text-sm text-gray-400 mt-1">{pattern.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(pattern)}
                      className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete pattern "${pattern.name}"?`)) {
                          onDelete(pattern.id);
                        }
                      }}
                      className="p-1 text-red-400 hover:text-red-300 transition-colors"
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
};

export default ManagementSection;