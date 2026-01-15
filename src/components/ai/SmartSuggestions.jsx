import { useState, useEffect } from 'react';
import { aiAPI } from '../../services/api';
import { Sparkles, X } from 'lucide-react';

const SmartSuggestions = ({ conversationId, onSelect, onClose }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (conversationId) {
      fetchSuggestions();
    }
  }, [conversationId]);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const response = await aiAPI.getSuggestions(conversationId);
      setSuggestions(response.data.suggestions || []);
    } catch {
      console.error('Failed to fetch suggestions');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-t border-gray-200 p-3">
        <div className="flex items-center justify-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-600 border-t-transparent"></div>
          <span className="text-sm text-purple-600">Generating suggestions...</span>
        </div>
      </div>
    );
  }

  if (!suggestions.length) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-t border-gray-200 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-purple-600">
            <Sparkles size={16} />
            <span className="text-sm">No suggestions available</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-purple-100 rounded-full">
            <X size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-t border-gray-200 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-purple-600">
          <Sparkles size={16} />
          <span className="text-sm font-medium">Smart Suggestions</span>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-purple-100 rounded-full">
          <X size={16} />
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSelect(suggestion)}
            className="px-3 py-1.5 bg-white border border-purple-200 rounded-full text-sm hover:bg-purple-100 transition-colors"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SmartSuggestions;