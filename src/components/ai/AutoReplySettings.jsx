import { useState, useEffect } from 'react';
import { aiAPI } from '../../services/api';
import Modal from '../common/Modal';
import Button from '../common/Button';
import toast from 'react-hot-toast';

const AutoReplySettings = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState({
    enabled: false,
    mode: 'friendly',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen]);

  const fetchSettings = async () => {
    try {
      const response = await aiAPI.getAutoReplySettings();
      setSettings(response.data.autoReply);
    } catch (error) {
      toast.error('Failed to load settings');
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await aiAPI.updateAutoReply(settings);
      toast.success('Settings updated!');
      onClose();
    } catch (error) {
      toast.error('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Auto-Reply Settings" size="md">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-gray-700 font-medium">Enable Auto-Reply</label>
          <button
            onClick={() => setSettings({ ...settings, enabled: !settings.enabled })}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              settings.enabled ? 'bg-blue-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                settings.enabled ? 'transform translate-x-6' : ''
              }`}
            ></span>
          </button>
        </div>

        {settings.enabled && (
          <div>
            <label className="text-gray-700 font-medium mb-2 block">Reply Mode</label>
            <div className="space-y-2">
              {['friendly', 'professional', 'funny'].map((mode) => (
                <label
                  key={mode}
                  className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                    settings.mode === mode
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="mode"
                    value={mode}
                    checked={settings.mode === mode}
                    onChange={(e) => setSettings({ ...settings, mode: e.target.value })}
                    className="mr-3"
                  />
                  <div>
                    <p className="font-medium capitalize">{mode}</p>
                    <p className="text-sm text-gray-600">
                      {mode === 'friendly' && 'Warm and conversational with emojis 😊'}
                      {mode === 'professional' && 'Formal, clear, and concise'}
                      {mode === 'funny' && 'Witty and humorous responses 😄'}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        <Button onClick={handleSave} variant="primary" className="w-full" disabled={loading}>
          {loading ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </Modal>
  );
};

export default AutoReplySettings;