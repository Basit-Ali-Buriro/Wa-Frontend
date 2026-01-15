import { useState, useEffect } from 'react';
import { useChat } from '../../hooks/useChat';
import { Search, MessageSquarePlus, Users, RefreshCw } from 'lucide-react';
import ConversationItem from './ConversationItem';
import NewChatModal from './NewChatModal';
import NewGroupModal from './NewGroupModal';
import Loader from '../common/Loader';

const ConversationList = () => {
  const { conversations, selectedConversation, setSelectedConversation, loading, fetchConversations } = useChat();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Debug: Log conversations on every change
  useEffect(() => {
    console.log('========================================');
    console.log('📋 CONVERSATION LIST STATE');
    console.log('========================================');
    console.log('Conversations count:', conversations?.length || 0);
    console.log('Conversations data:', conversations);
    console.log('Loading:', loading);
    console.log('Selected:', selectedConversation);
    console.log('========================================');
  }, [conversations, loading, selectedConversation]);

  // Manual refresh function
  const handleRefresh = async () => {
    console.log('🔄 Manual refresh triggered');
    setRefreshing(true);
    await fetchConversations();
    setRefreshing(false);
  };

  // Ensure conversations is always an array
  const conversationsList = Array.isArray(conversations) ? conversations : [];

  // Filter conversations based on search query
  const filteredConversations = conversationsList.filter((conv) => {
    if (!searchQuery.trim()) return true;

    try {
      const name = conv.isGroup
        ? conv.groupName || ''
        : conv.participants?.find((p) => p?._id)?.name || '';
      
      return name.toLowerCase().includes(searchQuery.toLowerCase());
    } catch (error) {
      console.error('Error filtering conversation:', conv, error);
      return false;
    }
  });

  return (
    <div className="w-full bg-white border-r border-gray-200 flex flex-col h-screen">
      {/* ========================================
          HEADER
      ======================================== */}
      <div className="p-3 sm:p-4 border-b border-gray-200 bg-gray-50 shrink-0">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Chats</h2>
          
          {/* Refresh button */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={`p-2 hover:bg-gray-200 rounded-full transition-all ${
              refreshing ? 'animate-spin' : ''
            }`}
            title="Refresh conversations"
          >
            <RefreshCw size={18} className="sm:w-5 sm:h-5 text-gray-600" />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-3 sm:mb-4">
          <Search
            size={18}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 sm:w-5 sm:h-5"
          />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 sm:pl-10 pr-9 sm:pr-10 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm sm:text-base"
            >
              ✕
            </button>
          )}
        </div>

        {/* Stats */}
        {!loading && conversationsList.length > 0 && (
          <div className="text-xs text-gray-500 mb-3">
            {filteredConversations.length} of {conversationsList.length} conversation{conversationsList.length !== 1 ? 's' : ''}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowNewChatModal(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
          >
            <MessageSquarePlus size={18} />
            <span className="text-sm font-medium">New Chat</span>
          </button>
          <button
            onClick={() => setShowNewGroupModal(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-sm"
          >
            <Users size={18} />
            <span className="text-sm font-medium">Group</span>
          </button>
        </div>
      </div>

      {/* ========================================
          CONVERSATION LIST
      ======================================== */}
      <div className="flex-1 overflow-y-auto">
        {loading && conversationsList.length === 0 ? (
          // Initial loading state
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <Loader size="lg" />
            <p className="text-gray-500 text-sm">Loading conversations...</p>
          </div>
        ) : filteredConversations.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center h-64 px-4 text-center">
            {searchQuery ? (
              // No search results
              <>
                <Search size={48} className="text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">No conversations found</p>
                <p className="text-sm text-gray-400 mt-1">
                  Try a different search term
                </p>
              </>
            ) : conversationsList.length === 0 ? (
              // No conversations at all
              <>
                <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-full p-6 mb-4">
                  <MessageSquarePlus size={48} className="text-gray-400" />
                </div>
                <p className="text-gray-600 font-medium mb-2">
                  No conversations yet
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Start a new chat to begin messaging
                </p>
                <button
                  onClick={() => setShowNewChatModal(true)}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
                >
                  Start Your First Chat
                </button>
              </>
            ) : null}
          </div>
        ) : (
          // Conversations list
          <div className="divide-y divide-gray-100">
            {filteredConversations.map((conversation) => {
              if (!conversation || !conversation._id) {
                console.warn('Invalid conversation object:', conversation);
                return null;
              }

              return (
                <ConversationItem
                  key={conversation._id}
                  conversation={conversation}
                  isActive={selectedConversation?._id === conversation._id}
                  onClick={() => {
                    console.log('🔘 Conversation selected:', conversation);
                    setSelectedConversation(conversation);
                  }}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================
          MODALS
      ======================================== */}
      {showNewChatModal && (
        <NewChatModal onClose={() => setShowNewChatModal(false)} />
      )}
      {showNewGroupModal && (
        <NewGroupModal onClose={() => setShowNewGroupModal(false)} />
      )}
    </div>
  );
};

export default ConversationList;