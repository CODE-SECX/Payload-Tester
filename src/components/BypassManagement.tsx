import React, { useState, useEffect } from 'react';
import { Edit2, Save, X } from 'lucide-react';

interface BypassManagementProps {
  patterns: Array<{ id: string; bypass_of_what: string }>;
  onUpdateBypass: (oldValue: string, newValue: string) => Promise<void>;
}

const BypassManagement: React.FC<BypassManagementProps> = ({ patterns, onUpdateBypass }) => {
  const [editingValue, setEditingValue] = useState<string | null>(null);
  const [newValue, setNewValue] = useState('');

  const uniqueBypassValues = Array.from(new Set(
    patterns
      .map(p => p.bypass_of_what)
      .filter(Boolean)
  )).sort();

  const handleUpdate = async (oldValue: string) => {
    if (newValue && newValue !== oldValue) {
      await onUpdateBypass(oldValue, newValue);
    }
    setEditingValue(null);
    setNewValue('');
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Manage Bypass Values</h3>
      <div className="space-y-2">
        {uniqueBypassValues.map(value => (
          <div 
            key={value}
            className="flex items-center justify-between p-3 bg-gray-700 rounded-lg group"
          >
            {editingValue === value ? (
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="text"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="flex-1 px-3 py-1 bg-gray-600 border border-gray-500 rounded text-sm"
                  autoFocus
                />
                <button
                  onClick={() => handleUpdate(value)}
                  className="p-1 text-green-400 hover:text-green-300"
                >
                  <Save className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setEditingValue(null);
                    setNewValue('');
                  }}
                  className="p-1 text-red-400 hover:text-red-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <span className="flex-1">
                  {value}
                  <span className="ml-2 text-sm text-gray-400">
                    ({patterns.filter(p => p.bypass_of_what === value).length} patterns)
                  </span>
                </span>
                <button
                  onClick={() => {
                    setEditingValue(value);
                    setNewValue(value);
                  }}
                  className="p-1 opacity-0 group-hover:opacity-100 text-blue-400 hover:text-blue-300"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BypassManagement;
