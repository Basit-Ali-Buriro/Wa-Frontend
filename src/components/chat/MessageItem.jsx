import { useState, useRef, useEffect } from 'react';
import { formatMessageTime } from '../../utils/helpers';
import { useAuth } from '../../hooks/useAuth';
import Avatar from '../common/Avatar';
import {
  MoreVertical,
  Reply,
  Forward,
  Edit,
  Trash2,
  Check,
  CheckCheck,
  Smile,
  X,
  Copy,
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Video,
} from 'lucide-react';

const MessageItem = ({ message, onReply, onEdit, onDelete, onForward, onReact }) => {
  const { user } = useAuth();
  const [showActions, setShowActions] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const messageRef = useRef(null);
  const isSender = message.sender._id === user._id;

  // Available reactions
  const reactions = ['❤️', '😂', '😮', '😢', '🙏', '👍'];

  // Format call duration
  const formatCallDuration = (seconds) => {
    if (!seconds || seconds === 0) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get call icon and text
  const getCallInfo = () => {
    if (!message.callInfo) return null;

    const { type, status, duration } = message.callInfo;
    const isVideo = type === 'video';
    
    let Icon = Phone;
    let iconColor = 'text-gray-600';
    let callType = isVideo ? 'Video call' : 'Audio call';
    let statusText = '';
    let showDuration = false;

    if (status === 'missed') {
      Icon = PhoneMissed;
      iconColor = 'text-red-500';
      statusText = isSender ? 'Cancelled' : 'Missed';
    } else if (status === 'rejected') {
      Icon = PhoneMissed;
      iconColor = 'text-red-500';
      statusText = 'Declined';
    } else if (status === 'completed') {
      Icon = isSender ? PhoneOutgoing : PhoneIncoming;
      iconColor = 'text-green-500';
      statusText = '';
      showDuration = true;
    } else if (status === 'cancelled') {
      Icon = PhoneMissed;
      iconColor = 'text-gray-500';
      statusText = 'Cancelled';
    }

    // For video calls, always use Video icon
    if (isVideo && status === 'completed') {
      Icon = Video;
    }

    const durationText = showDuration && duration ? formatCallDuration(duration) : null;

    return { Icon, iconColor, callType, statusText, durationText };
  };

  // Close actions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (messageRef.current && !messageRef.current.contains(event.target)) {
        setShowActions(false);
        setShowMenu(false);
        setShowReactionPicker(false);
      }
    };

    if (showActions || showReactionPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showActions, showReactionPicker]);

  const handleDoubleClick = () => {
    console.log('🖱️ Double-clicked message:', message._id);
    setShowActions(!showActions);
  };

  const handleCopyText = () => {
    if (message.text) {
      navigator.clipboard.writeText(message.text);
      setShowMenu(false);
      setShowActions(false);
      // Optional: Add toast notification
    }
  };

  return (
    <div 
      ref={messageRef}
      className={`flex gap-2 mb-4 relative ${isSender ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      {!isSender && (
        <Avatar 
          src={message.sender.avatarUrl} 
          name={message.sender.name} 
          size="sm" 
        />
      )}

      <div className={`max-w-md flex flex-col ${isSender ? 'items-end' : 'items-start'}`}>
        {/* Reply preview */}
        {message.replyTo && (
          <div className={`${
            isSender ? 'bg-blue-100' : 'bg-gray-100'
          } border-l-4 border-blue-500 px-3 py-2 mb-1 rounded text-sm max-w-xs`}>
            <p className="text-xs text-gray-600 font-medium">
              {message.replyTo.sender?.name || 'Unknown'}
            </p>
            <p className="text-gray-700 truncate">
              {message.replyTo.text || 'Media message'}
            </p>
          </div>
        )}

        {/* Forwarded indicator */}
        {message.forwarded && (
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
            <Forward size={12} />
            <span>Forwarded</span>
          </div>
        )}

        <div className="relative">
          {/* Message bubble - DOUBLE CLICK HERE */}
          <div
            onDoubleClick={handleDoubleClick}
            className={`px-4 py-2 rounded-lg shadow-md cursor-pointer select-none transition-all ${
              isSender
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            } ${showActions ? 'ring-2 ring-blue-400' : ''}`}
            title="Double-click for actions"
          >
            {/* Sender name in groups */}
            {!isSender && (
              <p className="text-xs font-semibold mb-1 text-blue-600">
                {message.sender.name}
              </p>
            )}

            {/* Call Message */}
            {message.callInfo && (() => {
              const callInfo = getCallInfo();
              if (!callInfo) return null;
              
              return (
                <div className="flex items-center gap-3 py-1">
                  <callInfo.Icon size={24} className={callInfo.iconColor} />
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${
                        isSender ? 'text-white' : 'text-gray-900'
                      }`}>
                        {callInfo.callType}
                      </span>
                      {callInfo.statusText && (
                        <span className={`text-xs ${
                          callInfo.iconColor === 'text-red-500' 
                            ? (isSender ? 'text-red-200' : 'text-red-600')
                            : (isSender ? 'text-blue-200' : 'text-gray-600')
                        }`}>
                          ({callInfo.statusText})
                        </span>
                      )}
                    </div>
                    {callInfo.durationText && (
                      <span className={`text-xs mt-0.5 ${
                        isSender ? 'text-blue-100' : 'text-gray-600'
                      }`}>
                        {callInfo.durationText}
                      </span>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Media */}
            {message.media && message.media.length > 0 && (
              <div className="mb-2 space-y-2">
                {message.media.map((item, index) => (
                  <div key={index} className="rounded overflow-hidden">
                    {item.type === 'image' ? (
                      <img
                        src={item.url}
                        alt="attachment"
                        className="max-w-xs max-h-64 object-cover rounded cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(item.url, '_blank');
                        }}
                      />
                    ) : item.type === 'video' ? (
                      <video 
                        src={item.url} 
                        controls 
                        className="max-w-xs max-h-64 rounded"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : null}
                  </div>
                ))}
              </div>
            )}

            {/* Text */}
            {message.text && (
              <p className="wrap-break-word whitespace-pre-wrap">{message.text}</p>
            )}

            {/* Edited indicator */}
            {message.isEdited && (
              <span className="text-xs opacity-70 ml-2">(edited)</span>
            )}

            {/* Time and status */}
            <div className="flex items-center gap-1 justify-end mt-1">
              <span className="text-xs opacity-70">
                {formatMessageTime(message.createdAt)}
              </span>
              {isSender && (
                <span className="text-xs">
                  {message.seenBy?.length > 1 ? (
                    <CheckCheck size={14} className="text-blue-300" />
                  ) : (
                    <Check size={14} />
                  )}
                </span>
              )}
            </div>
          </div>

          {/* ✅ ACTION BUTTONS - Show on double-click */}
          {showActions && (
            <div className={`absolute ${
              isSender ? 'left-0 -translate-x-full -ml-2' : 'right-0 translate-x-full mr-2'
            } top-0 flex items-center gap-1 animate-fadeIn z-10`}>
              
              {/* Reply button */}
              <button
                onClick={() => {
                  console.log('🔘 Reply clicked');
                  onReply(message);
                  setShowActions(false);
                }}
                className="p-2 bg-white rounded-full shadow-lg hover:bg-blue-50 hover:scale-110 transition-all border border-gray-200"
                title="Reply"
              >
                <Reply size={18} className="text-blue-600" />
              </button>

              {/* More options button */}
              <div className="relative">
                <button
                  onClick={() => {
                    console.log('🔘 Menu clicked');
                    setShowMenu(!showMenu);
                  }}
                  className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 hover:scale-110 transition-all border border-gray-200"
                  title="More options"
                >
                  <MoreVertical size={18} className="text-gray-600" />
                </button>

                {/* Dropdown menu */}
                {showMenu && (
                  <div 
                    className={`absolute ${
                      isSender ? 'right-0' : 'left-0'
                    } top-full mt-1 bg-white rounded-lg shadow-xl border border-gray-200 py-1 w-56 z-50 animate-slideDown`}
                  >
                    
                    {/* Forward */}
                    <button
                      onClick={() => {
                        console.log('📤 Forward clicked');
                        onForward(message);
                        setShowMenu(false);
                        setShowActions(false);
                      }}
                      className="w-full px-4 py-2.5 text-left hover:bg-gray-100 flex items-center gap-3 text-sm transition-colors"
                    >
                      <Forward size={18} className="text-gray-600" />
                      <span className="font-medium">Forward</span>
                    </button>

                    {/* Copy text */}
                    {message.text && (
                      <button
                        onClick={handleCopyText}
                        className="w-full px-4 py-2.5 text-left hover:bg-gray-100 flex items-center gap-3 text-sm transition-colors"
                      >
                        <Copy size={18} className="text-gray-600" />
                        <span className="font-medium">Copy Text</span>
                      </button>
                    )}

                    {/* Edit (only for sender) */}
                    {isSender && (
                      <button
                        onClick={() => {
                          console.log('✏️ Edit clicked');
                          onEdit(message);
                          setShowMenu(false);
                          setShowActions(false);
                        }}
                        className="w-full px-4 py-2.5 text-left hover:bg-gray-100 flex items-center gap-3 text-sm transition-colors"
                      >
                        <Edit size={18} className="text-gray-600" />
                        <span className="font-medium">Edit</span>
                      </button>
                    )}

                    {/* Divider */}
                    <div className="border-t border-gray-200 my-1"></div>

                    {/* Delete for everyone (only for sender) */}
                    {isSender && (
                      <button
                        onClick={() => {
                          console.log('🗑️ Delete for everyone clicked');
                          onDelete(message._id, 'forEveryone');
                          setShowMenu(false);
                          setShowActions(false);
                        }}
                        className="w-full px-4 py-2.5 text-left hover:bg-red-50 flex items-center gap-3 text-sm transition-colors"
                      >
                        <Trash2 size={18} className="text-red-600" />
                        <span className="font-medium text-red-600">Delete for everyone</span>
                      </button>
                    )}

                    {/* Delete for me */}
                    <button
                      onClick={() => {
                        console.log('🗑️ Delete for me clicked');
                        onDelete(message._id, 'forMe');
                        setShowMenu(false);
                        setShowActions(false);
                      }}
                      className="w-full px-4 py-2.5 text-left hover:bg-red-50 flex items-center gap-3 text-sm transition-colors"
                    >
                      <Trash2 size={18} className="text-red-600" />
                      <span className="font-medium text-red-600">Delete for me</span>
                    </button>
                  </div>
                )}
              </div>

              {/* React button with picker */}
              <div className="relative">
                <button
                  onClick={() => {
                    console.log('😊 React picker toggled');
                    setShowReactionPicker(!showReactionPicker);
                  }}
                  className="p-2 bg-white rounded-full shadow-lg hover:bg-yellow-50 hover:scale-110 transition-all border border-gray-200"
                  title="React"
                >
                  <Smile size={18} className="text-yellow-600" />
                </button>

                {/* Reaction picker popup */}
                {showReactionPicker && (
                  <div
                    className={`absolute ${
                      isSender ? 'right-0' : 'left-0'
                    } bottom-full mb-2 bg-white rounded-lg shadow-xl border border-gray-200 p-2 flex gap-1 animate-slideDown z-50`}
                  >
                    {reactions.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => {
                          console.log('😊 Reaction selected:', emoji);
                          onReact(message._id, emoji);
                          setShowReactionPicker(false);
                          setShowActions(false);
                        }}
                        className="w-10 h-10 flex items-center justify-center text-2xl hover:bg-gray-100 rounded-lg transition-all hover:scale-125"
                        title={`React with ${emoji}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Close button */}
              <button
                onClick={() => setShowActions(false)}
                className="p-2 bg-white rounded-full shadow-lg hover:bg-red-50 hover:scale-110 transition-all border border-gray-200"
                title="Close"
              >
                <X size={18} className="text-red-600" />
              </button>
            </div>
          )}
        </div>

        {/* Reactions display */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.entries(
              message.reactions.reduce((acc, reaction) => {
                if (!acc[reaction.emoji]) {
                  acc[reaction.emoji] = [];
                }
                acc[reaction.emoji].push(reaction.user);
                return acc;
              }, {})
            ).map(([emoji, users]) => (
              <button
                key={emoji}
                onClick={() => onReact(message._id, emoji)}
                className="bg-white border border-gray-300 rounded-full px-2 py-0.5 text-xs flex items-center gap-1 hover:bg-gray-100 hover:scale-105 transition-all shadow-sm"
              >
                <span>{emoji}</span>
                <span className="text-gray-600 font-medium">{users.length}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageItem;