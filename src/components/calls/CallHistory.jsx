import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { callAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';

const CallHistory = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchCallHistory();
      fetchStats();
    }
  }, [isOpen]);

  const fetchCallHistory = async () => {
    setLoading(true);
    try {
      const response = await callAPI.getHistory();
      setCalls(response.data);
    } catch (error) {
      console.error('Failed to load call history:', error);
      toast.error('Failed to load call history');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await callAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const deleteCall = async (callId) => {
    try {
      await callAPI.deleteCall(callId);
      setCalls(calls.filter(call => call._id !== callId));
      toast.success('Call deleted from history');
      fetchStats();
    } catch (error) {
      console.error('Failed to delete call:', error);
      toast.error('Failed to delete call');
    }
  };

  const getCallIcon = (call) => {
    const isOutgoing = call.caller._id === user._id;

    if (call.status === 'missed') {
      return <PhoneMissed className="w-5 h-5 text-red-500" />;
    }

    if (isOutgoing) {
      return call.type === 'video'
        ? <Video className="w-5 h-5 text-green-500" />
        : <PhoneOutgoing className="w-5 h-5 text-green-500" />;
    }

    return call.type === 'video'
      ? <Video className="w-5 h-5 text-blue-500" />
      : <PhoneIncoming className="w-5 h-5 text-blue-500" />;
  };

  const getCallStatus = (call) => {
    const isOutgoing = call.caller._id === user._id;

    switch (call.status) {
      case 'missed':
        return 'Missed';
      case 'rejected':
        return 'Rejected';
      case 'connected':
        return call.duration ? formatDuration(call.duration) : 'Connected';
      default:
        return isOutgoing ? 'Outgoing' : 'Incoming';
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (date) => {
    const callDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (callDate.toDateString() === today.toDateString()) {
      return callDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (callDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return callDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Call History</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="p-4 grid grid-cols-4 gap-4 border-b border-gray-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.outgoing}</div>
              <div className="text-xs text-gray-500">Outgoing</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.incoming}</div>
              <div className="text-xs text-gray-500">Incoming</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.missed}</div>
              <div className="text-xs text-gray-500">Missed</div>
            </div>
          </div>
        )}

        {/* Call List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : calls.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Phone className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No call history</p>
            </div>
          ) : (
            calls.map((call) => {
              const isOutgoing = call.caller._id === user._id;
              const otherUser = isOutgoing ? call.recipient : call.caller;

              return (
                <div
                  key={call._id}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg group"
                >
                  <div className="flex items-center space-x-3 flex-1">
                    {/* Avatar */}
                    <div className="relative">
                      <img
                        src={otherUser.avatarUrl || `https://ui-avatars.com/api/?name=${otherUser.name}`}
                        alt={otherUser.name}
                        className="w-12 h-12 rounded-full"
                      />
                      <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 rounded-full p-0.5">
                        {getCallIcon(call)}
                      </div>
                    </div>

                    {/* Call Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-white truncate">
                        {otherUser.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {getCallStatus(call)}
                      </div>
                    </div>

                    {/* Date/Time */}
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(call.createdAt)}
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={() => deleteCall(call._id)}
                      className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded-full transition-opacity"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default CallHistory;
