import React, { useState } from 'react';
import { X, Check } from 'lucide-react';

interface BypassRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  payload: string;
  wafOptions: string[];
  onSave: (success: boolean, wafNames: string[]) => Promise<void>;
}

const BypassRecordModal: React.FC<BypassRecordModalProps> = ({
  isOpen,
  onClose,
  payload,
  wafOptions,
  onSave
}) => {
  const [isSuccess, setIsSuccess] = useState(false);
  const [selectedWafs, setSelectedWafs] = useState<string[]>([]);

  const handleSave = async () => {
    await onSave(isSuccess, selectedWafs);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl w-full max-w-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Record Bypass Result</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-700 p-3 rounded">
            <label className="text-sm text-gray-300">Tested Payload:</label>
            <code className="block mt-1 text-sm break-all font-mono">{payload}</code>
          </div>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={isSuccess}
              onChange={(e) => setIsSuccess(e.target.checked)}
              className="rounded border-gray-600"
            />
            <span>Successfully bypassed WAF</span>
          </label>

          {isSuccess && (
            <div className="space-y-2">
              <label className="block text-sm font-medium">Select bypassed WAFs:</label>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {wafOptions.map((waf) => (
                  <label key={waf} className="flex items-center space-x-2 p-2 hover:bg-gray-700 rounded">
                    <input
                      type="checkbox"
                      checked={selectedWafs.includes(waf)}
                      onChange={(e) => {
                        setSelectedWafs(prev =>
                          e.target.checked
                            ? [...prev, waf]
                            : prev.filter(w => w !== waf)
                        );
                      }}
                      className="rounded border-gray-600"
                    />
                    <span className="text-sm">{waf}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSuccess && selectedWafs.length === 0}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Save Result
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BypassRecordModal;
