import { formatMessageTime } from '../../utils/helpers';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../hooks/useAuth';
import Avatar from '../common/Avatar';

const ConversationItem = ({ conversation, isActive, onClick }) => {
  const { onlineUsers } = useSocket();
  const { user } = useAuth();

  // Null checks
  if (!conversation || !conversation.participants) {
    console.warn('Invalid conversation object:', conversation);
    return null;
  }

  const getConversationName = () => {
    if (conversation.isGroup) {
      return conversation.groupName || 'Unnamed Group';
    }
    
    const otherUser = conversation.participants.find((p) => p?._id !== user?._id);
    return otherUser?.name || 'Unknown User';
  };

  const getConversationAvatar = () => {
    if (conversation.isGroup) {
      return conversation.groupAvatar || null;
    }
    
    const otherUser = conversation.participants.find((p) => p?._id !== user?._id);
    return otherUser?.avatarUrl || null;
  };

  const isOnline = () => {
    if (conversation.isGroup) return false;
    
    const otherUser = conversation.participants.find((p) => p?._id !== user?._id);
    return otherUser?._id ? onlineUsers.includes(otherUser._id) : false;
  };

  const getLastMessageText = () => {
    if (!conversation.lastMessage) return 'No messages yet';
    
    const msg = conversation.lastMessage;
    
    // Check for media
    if (msg.media && Array.isArray(msg.media) && msg.media.length > 0) {
      const mediaType = msg.media[0].type;
      if (mediaType === 'image') return '📷 Photo';
      if (mediaType === 'video') return '🎥 Video';
      if (mediaType === 'audio') return '🎵 Audio';
      return '📎 File';
    }
    
    // Return text or default
    return msg.text || 'Message';
  };

  const getLastMessageTime = () => {
    if (!conversation.lastMessage?.createdAt) return '';
    return formatMessageTime(conversation.lastMessage.createdAt);
  };

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 p-3 cursor-pointer transition-all ${
        isActive 
          ? 'bg-blue-50 border-l-4 border-blue-500' 
          : 'hover:bg-gray-50 border-l-4 border-transparent'
      }`}
    >
      <Avatar
        src={getConversationAvatar()}
        name={getConversationName()}
        online={isOnline()}
        size="md"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h4 className="font-semibold text-gray-800 truncate">
            {getConversationName()}
          </h4>
          {conversation.lastMessage && (
            <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
              {getLastMessageTime()}
            </span>
          )}
        </div>

        <p className="text-sm text-gray-600 truncate">
          {getLastMessageText()}
        </p>
      </div>

      {/* Optional: Unread badge */}
      {/* <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
        3
      </span> */}
    </div>
  );
};

export default ConversationItem;