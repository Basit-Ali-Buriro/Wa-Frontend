import { useChat } from '../../hooks/useChat';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../hooks/useAuth';
import { useContext } from 'react';
import { CallContext } from '../../context/CallContext';
import { Phone, Video, MoreVertical, Search, X, Trash2, UserCircle, ArrowLeft } from 'lucide-react';
import Avatar from '../common/Avatar';
import UserProfileModal from '../common/UserProfileModal';
import { useState, useRef, useEffect } from 'react';
import GroupSettingsModal from '../conversations/GroupSettingsModal';
import { conversationAPI } from '../../services/api';
import toast from 'react-hot-toast';

const Header = () => {
  const { selectedConversation, setSelectedConversation, fetchConversations } = useChat();
  const { onlineUsers } = useSocket();
  const { user } = useAuth();
  const { initiateCall } = useContext(CallContext);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  if (!selectedConversation) {
    return null;
  }

  const getConversationName = () => {
    if (selectedConversation.isGroup) {
      return selectedConversation.groupName;
    }
    const otherUser = selectedConversation.participants.find(
      (p) => p._id !== user._id
    );
    return otherUser?.name || 'Unknown';
  };

  const getConversationAvatar = () => {
    if (selectedConversation.isGroup) {
      return selectedConversation.groupAvatar;
    }
    const otherUser = selectedConversation.participants.find(
      (p) => p._id !== user._id
    );
    return otherUser?.avatarUrl;
  };

  const isOnline = () => {
    if (selectedConversation.isGroup) return false;
    const otherUser = selectedConversation.participants.find(
      (p) => p._id !== user._id
    );
    return onlineUsers.includes(otherUser?._id);
  };

  const getParticipantCount = () => {
    if (selectedConversation.isGroup) {
      return `${selectedConversation.participants.length} participants`;
    }
    return isOnline() ? 'Online' : 'Offline';
  };

  const handleDeleteConversation = async () => {
    console.log('🗑️ Delete conversation clicked');
    console.log('Selected conversation:', selectedConversation);
    
    if (!window.confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      console.log('❌ User cancelled deletion');
      return;
    }

    console.log('✅ User confirmed deletion');
    
    try {
      console.log('📤 Calling delete API...');
      await conversationAPI.delete(selectedConversation._id);
      console.log('✅ Conversation deleted successfully');
      
      toast.success('Conversation deleted successfully');
      setSelectedConversation(null);
      
      // Refresh conversations list
      if (fetchConversations) {
        console.log('🔄 Refreshing conversations...');
        fetchConversations();
      }
      
      setShowMenu(false);
    } catch (error) {
      console.error('❌ Failed to delete conversation:', error);
      toast.error(error.response?.data?.msg || 'Failed to delete conversation');
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <div className="bg-gray-100 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        {/* Back button for mobile */}
        <button
          onClick={() => setSelectedConversation(null)}
          className="lg:hidden p-2 hover:bg-gray-200 rounded-full transition-colors mr-2"
          title="Back to conversations"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>

        <div 
          className="flex items-center gap-3 cursor-pointer hover:bg-gray-200 p-2 rounded-lg transition-colors flex-1 min-w-0"
          onClick={() => {
            if (selectedConversation.isGroup) {
              setShowGroupSettings(true);
            } else {
              // For 1-on-1 chat, show the other user's profile
              setShowUserProfile(true);
            }
          }}
          title={selectedConversation.isGroup ? 'Group info' : 'Contact info'}
        >
          <Avatar
            src={getConversationAvatar()}
            name={getConversationName()}
            online={isOnline()}
            size="md"
          />
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-800 truncate">
              {getConversationName()}
            </h3>
            <p className="text-xs text-gray-500 truncate">{getParticipantCount()}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors hidden sm:block"
            title="Search in conversation"
          >
            <Search size={20} className="text-gray-600" />
          </button>

          {!selectedConversation.isGroup && (
            <>
              <button 
                onClick={() => {
                  const recipientId = selectedConversation.participants.find(p => p._id !== user._id)?._id;
                  if (recipientId) {
                    initiateCall(recipientId, 'voice', selectedConversation._id);
                    toast.success('Calling...');
                  }
                }}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors hidden md:block"
                title="Voice call"
              >
                <Phone size={20} className="text-gray-600" />
              </button>
              <button 
                onClick={() => {
                  const recipientId = selectedConversation.participants.find(p => p._id !== user._id)?._id;
                  if (recipientId) {
                    initiateCall(recipientId, 'video', selectedConversation._id);
                    toast.success('Calling...');
                  }
                }}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors hidden md:block"
                title="Video call"
              >
                <Video size={20} className="text-gray-600" />
              </button>
            </>
          )}

          <div className="relative" ref={menuRef}>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                console.log('🖱️ Three dots clicked, current state:', showMenu);
                setShowMenu(!showMenu);
              }}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              title="More options"
            >
              <MoreVertical size={20} className="text-gray-600" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                {selectedConversation.isGroup && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('📋 Group settings clicked');
                      setShowGroupSettings(true);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <UserCircle size={18} />
                    <span>Group Settings</span>
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('🗑️ Delete conversation clicked from menu');
                    handleDeleteConversation();
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2"
                >
                  <Trash2 size={18} />
                  <span>Delete Conversation</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search bar (when active) */}
      {showSearch && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3 flex items-center gap-2">
          <Search size={18} className="text-gray-500" />
          <input
            type="text"
            placeholder="Search messages..."
            className="flex-1 bg-transparent outline-none text-sm"
            autoFocus
          />
          <button
            onClick={() => setShowSearch(false)}
            className="p-1 hover:bg-yellow-100 rounded-full"
          >
            <X size={18} className="text-gray-600" />
          </button>
        </div>
      )}

      {/* Group settings modal */}
      {showGroupSettings && (
        <GroupSettingsModal
          conversation={selectedConversation}
          onClose={() => setShowGroupSettings(false)}
        />
      )}

      {/* User profile modal */}
      {showUserProfile && !selectedConversation.isGroup && (
        <UserProfileModal
          isOpen={showUserProfile}
          onClose={() => setShowUserProfile(false)}
          user={selectedConversation.participants.find(p => p._id !== user._id)}
        />
      )}
    </>
  );
};

export default Header;