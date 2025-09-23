import React, { useState, useEffect } from 'react';
import { Shield, Settings, AlertTriangle, CheckCircle, Plus, Trash2, Search } from 'lucide-react';
import TestingInterface from './components/TestingInterface';
import ManagementSection from './components/ManagementSection';
import BypassManagement from './components/BypassManagement';
import { RegexPattern, TestResult } from './types';
import { supabase } from './lib/supabase';

function App() {
  const [patterns, setPatterns] = useState<RegexPattern[]>([]);
  const [showManagement, setShowManagement] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  // Load patterns from Supabase on mount
  useEffect(() => {
    const loadPatterns = async () => {
      const { data, error } = await supabase
        .from('xss_patterns')
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.error('Error loading patterns:', error);
        return;
      }

      // Add default flags if not present
      const patternsWithFlags = data.map(pattern => ({
        ...pattern,
        flags: 'gi' // Default flags if not specified
      }));

      setPatterns(patternsWithFlags);
    };

    loadPatterns();
  }, []);

  // Save patterns to localStorage whenever patterns change
  useEffect(() => {
    localStorage.setItem('xss-regex-patterns', JSON.stringify(patterns));
  }, [patterns]);

  const testPayload = (payload: string): TestResult => {
    const matchedPatterns: Array<{ pattern: RegexPattern; matches: string[] }> = [];
    
    for (const pattern of patterns) {
      try {
        const regex = new RegExp(pattern.pattern, pattern.flags);
        const matches = payload.match(regex);
        if (matches) {
          matchedPatterns.push({ pattern, matches });
        }
      } catch (error) {
        console.error(`Invalid regex pattern: ${pattern.pattern}`, error);
      }
    }

    const result: TestResult = {
      payload,
      isBlocked: matchedPatterns.length > 0,
      matchedPatterns,
      timestamp: new Date()
    };

    setTestResult(result);
    return result;
  };

  const addPattern = async (pattern: Omit<RegexPattern, 'id'>) => {
    const { flags, ...dbPattern } = pattern;
    
    const { data, error } = await supabase
      .from('xss_patterns')
      .insert([{ 
        ...dbPattern,
        severity: pattern.severity || 'MEDIUM',
        category: pattern.category || 'custom',
        is_active: true
      }])
      .select()
      .single();

    if (error) {
      console.error('Error adding pattern:', error);
      return;
    }

    // Add flags back to the pattern for UI
    setPatterns(prev => [...prev, { ...data, flags: flags || 'gi' }]);
  };

  const updatePattern = async (id: string, updates: Partial<RegexPattern>) => {
    const { error } = await supabase
      .from('xss_patterns')
      .update({ 
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating pattern:', error);
      return;
    }

    setPatterns(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deletePattern = async (id: string) => {
    const { error } = await supabase
      .from('xss_patterns')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting pattern:', error);
      return;
    }

    setPatterns(prev => prev.filter(p => p.id !== id));
  };

  const updateBypassValue = async (oldValue: string, newValue: string) => {
    const { error } = await supabase
      .from('xss_patterns')
      .update({ bypass_of_what: newValue })
      .eq('bypass_of_what', oldValue);

    if (error) {
      console.error('Error updating bypass values:', error);
      return;
    }

    setPatterns(prev => prev.map(p => ({
      ...p,
      bypass_of_what: p.bypass_of_what === oldValue ? newValue : p.bypass_of_what
    })));
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-400" />
            <h1 className="text-2xl font-bold">XSS Payload Tester</h1>
          </div>
          <button
            onClick={() => setShowManagement(!showManagement)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showManagement 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
          >
            <Settings className="w-4 h-4" />
            Manage Patterns
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Testing Interface */}
          <div className="lg:col-span-2">
            <TestingInterface onTest={testPayload} result={testResult} />
          </div>

          {/* Sidebar - Current Patterns */}
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-400" />
                Active Patterns ({patterns.length})
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {patterns.length === 0 ? (
                  <p className="text-gray-400 text-sm italic">No patterns configured</p>
                ) : (
                  patterns.map((pattern) => (
                    <div key={pattern.id} className="bg-gray-700 p-3 rounded-lg">
                      <div className="font-medium text-sm">{pattern.name}</div>
                      <div className="text-xs text-gray-400 font-mono mt-1 break-all">
                        /{pattern.pattern}/{pattern.flags}
                      </div>
                      {pattern.description && (
                        <div className="text-xs text-gray-500 mt-1">
                          {pattern.description}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Statistics */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4">Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Patterns:</span>
                  <span className="font-medium">{patterns.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Last Test:</span>
                  <span className="font-medium">
                    {testResult ? (
                      <span className={testResult.isBlocked ? 'text-red-400' : 'text-green-400'}>
                        {testResult.isBlocked ? 'Blocked' : 'Allowed'}
                      </span>
                    ) : (
                      'None'
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Management Modal */}
      {showManagement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Pattern Management</h2>
              <button
                onClick={() => setShowManagement(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <ManagementSection
                patterns={patterns}
                onAdd={addPattern}
                onUpdate={updatePattern}
                onDelete={deletePattern}
                onUpdateBypass={updateBypassValue}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;