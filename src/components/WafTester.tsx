import React, { useState, useMemo } from 'react';
import { Shield, Play, ChevronRight, Check, AlertTriangle } from 'lucide-react';
import { RegexPattern, TestResult } from '../types';

interface WafTesterProps {
  patterns: RegexPattern[];
  onTest: (payload: string, activePatterns: RegexPattern[]) => TestResult;
}

const WafTester: React.FC<WafTesterProps> = ({ patterns, onTest }) => {
  const [selectedWaf, setSelectedWaf] = useState<string>('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [payload, setPayload] = useState('');
  const [result, setResult] = useState<TestResult | null>(null);

  // Get unique WAF names
  const wafNames = useMemo(() => {
    return [...new Set(patterns.map(p => p.waf_name).filter(Boolean))].sort();
  }, [patterns]);

  // Get categories for selected WAF
  const availableCategories = useMemo(() => {
    if (!selectedWaf) return [];
    return [...new Set(
      patterns
        .filter(p => p.waf_name === selectedWaf)
        .map(p => p.category)
    )].sort();
  }, [patterns, selectedWaf]);

  // Get active patterns based on selection
  const activePatterns = useMemo(() => {
    if (!selectedWaf || selectedCategories.length === 0) return [];
    return patterns.filter(p => 
      p.waf_name === selectedWaf && 
      selectedCategories.includes(p.category)
    );
  }, [patterns, selectedWaf, selectedCategories]);

  const handleTest = () => {
    if (!payload.trim() || activePatterns.length === 0) return;
    const result = onTest(payload, activePatterns);
    setResult(result);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-400" />
          WAF Challenge Mode
        </h2>

        {/* WAF Selection */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select WAF to Test
            </label>
            <select
              value={selectedWaf}
              onChange={(e) => {
                setSelectedWaf(e.target.value);
                setSelectedCategories([]);
                setResult(null);
              }}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg"
            >
              <option value="">Choose a WAF...</option>
              {wafNames.map(waf => (
                <option key={waf} value={waf}>{waf}</option>
              ))}
            </select>
          </div>

          {/* Category Selection */}
          {selectedWaf && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Protection Categories
              </label>
              <div className="grid grid-cols-2 gap-2">
                {availableCategories.map(category => (
                  <label 
                    key={category}
                    className={`
                      flex items-center gap-2 p-3 rounded-lg cursor-pointer
                      ${selectedCategories.includes(category) 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 hover:bg-gray-600'}
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category)}
                      onChange={(e) => {
                        setSelectedCategories(prev => 
                          e.target.checked
                            ? [...prev, category]
                            : prev.filter(c => c !== category)
                        );
                        setResult(null);
                      }}
                      className="hidden"
                    />
                    <ChevronRight className={`w-4 h-4 ${
                      selectedCategories.includes(category) ? 'opacity-100' : 'opacity-0'
                    }`} />
                    {category}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Testing Interface */}
          {selectedCategories.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-gray-700">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Test Your Payload
                </label>
                <textarea
                  value={payload}
                  onChange={(e) => setPayload(e.target.value)}
                  placeholder="Enter your XSS payload..."
                  className="w-full h-32 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg resize-none font-mono text-sm"
                />
              </div>

              <button
                onClick={handleTest}
                disabled={!payload.trim()}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                Test Against Selected Categories
              </button>
            </div>
          )}
        </div>

        {/* Results */}
        {result && (
          <div className="mt-6 pt-6 border-t border-gray-700">
            <div className={`p-4 rounded-lg ${
              result.isBlocked ? 'bg-red-900/50' : 'bg-green-900/50'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {result.isBlocked ? (
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                ) : (
                  <Check className="w-5 h-5 text-green-400" />
                )}
                <h3 className="font-medium">
                  {result.isBlocked ? 'Blocked!' : 'Success!'}
                </h3>
              </div>
              <p className="text-sm">
                {result.isBlocked 
                  ? `Your payload was blocked by ${result.matchedPatterns.length} pattern(s)`
                  : 'Your payload successfully bypassed the selected protections!'
                }
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WafTester;
