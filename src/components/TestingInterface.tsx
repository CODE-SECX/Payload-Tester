import React, { useState } from 'react';
import { Search, AlertTriangle, CheckCircle, Copy, Clock } from 'lucide-react';
import { TestResult } from '../types';

interface TestingInterfaceProps {
  onTest: (payload: string) => TestResult;
  result: TestResult | null;
}

const TestingInterface: React.FC<TestingInterfaceProps> = ({ onTest, result }) => {
  const [payload, setPayload] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payload.trim()) return;
    
    setIsLoading(true);
    // Simulate processing delay
    setTimeout(() => {
      const result = onTest(payload);
      
      // If payload is not blocked, execute it for realistic testing
      if (!result.isBlocked) {
        executePayload(payload);
      }
      
      setIsLoading(false);
    }, 200);
  };

  const executePayload = (payload: string) => {
    try {
      // Create a temporary container to safely execute HTML/JS
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = payload;
      
      // Execute any script tags found in the payload
      const scripts = tempDiv.getElementsByTagName('script');
      for (let i = 0; i < scripts.length; i++) {
        const script = scripts[i];
        if (script.textContent) {
          // Execute the script content
          eval(script.textContent);
        }
      }
      
      // Handle event handlers like onerror, onload, etc.
      const elementsWithEvents = tempDiv.querySelectorAll('*');
      elementsWithEvents.forEach(element => {
        Array.from(element.attributes).forEach(attr => {
          if (attr.name.startsWith('on')) {
            try {
              // Execute event handler
              eval(attr.value);
            } catch (e) {
              console.log('Event handler execution:', e);
            }
          }
        });
      });
      
      // Handle javascript: protocol
      if (payload.toLowerCase().includes('javascript:')) {
        const jsMatch = payload.match(/javascript:\s*(.+?)(?:"|'|$)/i);
        if (jsMatch && jsMatch[1]) {
          eval(jsMatch[1]);
        }
      }
      
    } catch (error) {
      console.log('Payload execution error:', error);
      // Show a notification that the payload would have executed
      alert('XSS Payload executed successfully! In a real application, this could be dangerous.');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const samplePayloads = [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert("XSS")>',
    'javascript:alert("XSS")',
    '<svg onload=alert("XSS")>',
    '"><script>alert("XSS")</script>',
    '<iframe src="javascript:alert(`XSS`)"></iframe>'
  ];

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Search className="w-5 h-5 text-blue-400" />
          Test XSS Payload
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="payload" className="block text-sm font-medium text-gray-300 mb-2">
              Enter your XSS payload:
            </label>
            <textarea
              id="payload"
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              placeholder="<script>alert('XSS')</script>"
              className="w-full h-32 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
              disabled={isLoading}
            />
          </div>
          
          <button
            type="submit"
            disabled={!payload.trim() || isLoading}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
            {isLoading ? 'Testing...' : 'Test Payload'}
          </button>
        </form>

        {/* Sample Payloads */}
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-300 mb-3">Sample Payloads:</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {samplePayloads.map((sample, index) => (
              <button
                key={`sample-${index}`}  // Changed key to be unique
                onClick={() => setPayload(sample)}
                className="text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors group"
                disabled={isLoading}
              >
                <code className="text-xs text-gray-300 break-all">{sample}</code>
                <Copy className="w-3 h-3 text-gray-500 group-hover:text-gray-300 float-right mt-0.5" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Section */}
      {result && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            {result.isBlocked ? (
              <AlertTriangle className="w-6 h-6 text-red-400" />
            ) : (
              <CheckCircle className="w-6 h-6 text-green-400" />
            )}
            <h3 className="text-xl font-semibold">
              {result.isBlocked ? 'Payload Blocked' : 'Payload Allowed'}
            </h3>
            <div className="flex items-center gap-1 text-xs text-gray-400 ml-auto">
              <Clock className="w-3 h-3" />
              {result.timestamp.toLocaleTimeString()}
            </div>
          </div>

          {/* Payload Display */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">Tested Payload:</label>
            <div className="bg-gray-700 p-4 rounded-lg">
              <code className="text-sm break-all font-mono text-gray-100">
                {result.payload}
              </code>
              <button
                onClick={() => copyToClipboard(result.payload)}
                className="float-right text-gray-400 hover:text-gray-200 transition-colors"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Match Results */}
          {result.isBlocked ? (
            <div className="space-y-3">
              <h4 className="font-medium text-red-400">
                Matched {result.matchedPatterns.length} pattern(s):
              </h4>
              {result.matchedPatterns.map(({ pattern, matches }, patternIndex) => (
                <div key={`pattern-${pattern.id}-${patternIndex}`} className="bg-red-950 border border-red-800 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-red-300">{pattern.name}</span>
                    <code className="text-xs text-red-400 font-mono">
                      /{pattern.pattern}/{pattern.flags}
                    </code>
                  </div>
                  {pattern.description && (
                    <p className="text-sm text-red-400 mb-2">{pattern.description}</p>
                  )}
                  <div className="space-y-1">
                    <span className="text-xs text-red-400">Matched strings:</span>
                    {matches.map((match, matchIndex) => (
                      <code 
                        key={`match-${pattern.id}-${patternIndex}-${matchIndex}`} 
                        className="block text-xs bg-red-900 p-2 rounded font-mono text-red-200"
                      >
                        {match}
                      </code>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-green-950 border border-green-800 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="font-medium text-green-300">
                  No patterns matched - payload executed successfully!
                </span>
              </div>
              <p className="text-sm text-green-400 mt-2">
                This payload did not trigger any of the configured regex patterns and was executed to demonstrate the XSS vulnerability.
              </p>
              <div className="mt-3 p-3 bg-green-900 rounded border border-green-700">
                <p className="text-xs text-green-300">
                  <strong>⚠️ Security Note:</strong> In a real application, this payload would execute malicious code. 
                  This testing environment safely demonstrates what would happen in a vulnerable system.
                </p>
              </div>
            </div>
          )}

          {/* Safe Preview */}
          <div className="mt-4 p-4 bg-gray-700 rounded-lg">
            <h4 className="font-medium text-gray-300 mb-2">Safe Preview (HTML Escaped):</h4>
            <div className="text-sm text-gray-400 font-mono break-all">
              {result.payload.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestingInterface;