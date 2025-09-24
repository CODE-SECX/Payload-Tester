import React, { useState, useEffect } from 'react';
import { AlertOctagon, Search, Trash2, Calendar, Shield, Copy, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { BypassRecord } from '../types';

interface BypassRecordsSectionProps {
  onClose: () => void;
}

const BypassRecordsSection: React.FC<BypassRecordsSectionProps> = ({ onClose }) => {
  const [records, setRecords] = useState<BypassRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadBypassRecords();
  }, []);

  const loadBypassRecords = async () => {
    const { data, error } = await supabase
      .from('bypass_records')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading bypass records:', error);
      return;
    }

    setRecords(data || []);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;

    const { error } = await supabase
      .from('bypass_records')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting record:', error);
      return;
    }

    setRecords(prev => prev.filter(r => r.id !== id));
  };

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const filteredRecords = records.filter(record =>
    record.payload.toLowerCase().includes(search.toLowerCase()) ||
    record.waf_names.some(waf => waf.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <AlertOctagon className="w-6 h-6 text-yellow-500" />
          WAF Bypass Records
        </h2>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
        >
          Close
        </button>
      </div>

      <div className="flex items-center gap-4 bg-gray-700 p-4 rounded-lg">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search payloads or WAF names..."
          className="flex-1 bg-transparent border-none outline-none text-sm"
        />
      </div>

      {loading ? (
        <div className="text-center py-8">Loading records...</div>
      ) : filteredRecords.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          No bypass records found
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRecords.map((record) => (
            <div key={record.id} className="bg-gray-700 rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="font-mono text-sm break-all bg-gray-800 p-2 rounded relative group">
                    {record.payload}
                    <button
                      onClick={() => handleCopy(record.payload, record.id)}
                      className="absolute right-2 top-2 p-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-700 rounded"
                    >
                      {copiedId === record.id ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-400 hover:text-white" />
                      )}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Calendar className="w-4 h-4" />
                    {new Date(record.created_at!).toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(record.id)}
                  className="p-2 text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {record.waf_names.map((waf, index) => (
                  <span
                    key={index}
                    className="flex items-center gap-1 px-2 py-1 bg-blue-500 bg-opacity-20 text-blue-300 rounded text-xs"
                  >
                    <Shield className="w-3 h-3" />
                    {waf}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BypassRecordsSection;
