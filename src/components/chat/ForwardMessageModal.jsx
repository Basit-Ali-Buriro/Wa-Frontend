import { useState } from 'react';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../hooks/useAuth';
import { messageAPI } from '../../services/api';
import Modal from '../common/Modal';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import Input from '../common/Input';
import Loader from '../common/Loader';
import { Search, Send, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const ForwardMessageModal = ({ message, onClose }) => {
  const { conversations } = useChat();
  const { user } = useAuth();
  const [selectedConversations, setSelectedConversations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [forwarding, setForwarding] = useState(false);

  console.log('📤 Forward modal opened for message:', message._id);

  // Filter conversations (exclude current conversation)
  const availableConversations = conversations.filter((conv) => {
    if (!searchQuery.trim()) return true;
    
    const name = conv.isGroup
      ? conv.groupName
      : conv.participants?.find((p) => p._id !== user._id)?.name || '';
    
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const toggleConversation = (convId) => {
    setSelectedConversations((prev) => {
      if (prev.includes(convId)) {
        console.log('➖ Deselected conversation:', convId);
        return prev.filter((id) => id !== convId);
      } else {
        console.log('➕ Selected conversation:', convId);
        return [...prev, convId];
      }
    });
  };

 const handleForward = async () => {
  if (selectedConversations.length === 0) {
    toast.error('Please select at least one conversation');
    return;
  }

  console.log('========================================');
  console.log('📤 FORWARDING MESSAGE');
  console.log('========================================');
  console.log('Message ID:', message._id);
  console.log('Message object:', message);
  console.log('To conversations:', selectedConversations);

  setForwarding(true);
  
  try {
    // Forward to each selected conversation
    for (const convId of selectedConversations) {
      console.log('📤 Forwarding to conversation:', convId);
      
      const payload = {
        conversationId: convId,
      };
      
      console.log('📦 Payload:', payload);
      
      try {
        const response = await messageAPI.forward(message._id, payload);
        console.log('✅ Forward successful to:', convId, response.data);
      } catch (error) {
        console.error('❌ Forward failed to:', convId);
        console.error('Error status:', error.response?.status);
        console.error('Error data:', error.response?.data);
        console.error('Error message:', error.response?.data?.msg);
        throw error; // Re-throw to catch in outer try-catch
      }
    }
    
    console.log('✅ All forwards completed');
    toast.success(`Message forwarded to ${selectedConversations.length} conversation${selectedConversations.length > 1 ? 's' : ''}`);
    onClose();
  } catch (error) {
    console.error('========================================');
    console.error('❌ FORWARD ERROR');
    console.error('========================================');
    console.error('Error object:', error);
    console.error('Response status:', error.response?.status);
    console.error('Response data:', error.response?.data);
    console.error('Response message:', error.response?.data?.msg);
    console.error('========================================');
    toast.error(error.response?.data?.msg || 'Failed to forward message');
  } finally {
    setForwarding(false);
    console.log('========================================');
  }
};

  return (
    <Modal isOpen={true} onClose={onClose} title="Forward Message" size="md">
      <div className="space-y-4">
        {/* Message preview */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border-2 border-blue-200">
          <p className="text-xs text-gray-600 mb-2 font-medium">Forwarding message:</p>
          <div className="bg-white p-3 rounded-lg shadow-sm">
            {message.media && message.media.length > 0 && (
              <div className="mb-2">
                {message.media[0].type === 'image' ? (
                  <img src={message.media[0].url} alt="media" className="max-h-20 rounded" />
                ) : (
                  <video src={message.media[0].url} className="max-h-20 rounded" />
                )}
              </div>
            )}
            <p className="text-gray-800">{message.text || '📷 Media message'}</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Selected count */}
        {selectedConversations.length > 0 && (
          <div className="bg-blue-100 p-3 rounded-lg border border-blue-300">
            <p className="text-sm text-blue-800 font-medium flex items-center gap-2">
              <Check size={16} />
              {selectedConversations.length} conversation{selectedConversations.length > 1 ? 's' : ''} selected
            </p>
          </div>
        )}

        {/* Conversation list */}
        <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg">
          {availableConversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Search size={48} className="mx-auto mb-3 text-gray-300" />
              <p>{searchQuery ? 'No conversations found' : 'No conversations available'}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {availableConversations.map((conv) => {
                const isSelected = selectedConversations.includes(conv._id);
                const name = conv.isGroup
                  ? conv.groupName
                  : conv.participants?.find((p) => p._id !== user._id)?.name || 'Unknown';
                const avatar = conv.isGroup
                  ? conv.groupAvatar
                  : conv.participants?.find((p) => p._id !== user._id)?.avatarUrl;

                return (
                  <div
                    key={conv._id}
                    onClick={() => !forwarding && toggleConversation(conv._id)}
                    className={`flex items-center gap-3 p-3 cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-blue-50 border-l-4 border-blue-500' 
                        : 'hover:bg-gray-50 border-l-4 border-transparent'
                    } ${forwarding ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Avatar src={avatar} name={name} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">{name}</p>
                      <p className="text-xs text-gray-500">
                        {conv.isGroup ? `${conv.participants?.length} members` : 'Private chat'}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Check size={16} className="text-white" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button 
            onClick={onClose} 
            variant="secondary" 
            className="flex-1"
            disabled={forwarding}
          >
            Cancel
          </Button>
          <Button
            onClick={handleForward}
            variant="primary"
            className="flex-1"
            disabled={selectedConversations.length === 0 || forwarding}
          >
            {forwarding ? (
              <span className="flex items-center justify-center gap-2">
                <Loader size="sm" />
                Forwarding...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Send size={18} />
                Forward {selectedConversations.length > 0 && `(${selectedConversations.length})`}
              </span>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ForwardMessageModal;