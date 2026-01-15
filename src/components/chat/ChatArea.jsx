import { useState, useEffect, useRef } from 'react';
import { useChat } from '../../hooks/useChat';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../hooks/useAuth';
import Header from '../layout/Header';
import MessageItem from './MessageItem';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import Loader from '../common/Loader';
import GroupSettingsModal from '../conversations/GroupSettingsModal';
import ForwardMessageModal from './ForwardMessageModal';
import { messageAPI } from '../../services/api';
import toast from 'react-hot-toast';

const ChatArea = () => {
  const { selectedConversation, messages, typingUsers, loading, setMessages } = useChat();
  const { socket } = useSocket();
  const { user } = useAuth();

  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [forwardingMessage, setForwardingMessage] = useState(null);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!selectedConversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center px-4">
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 w-32 h-32 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg">
            <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-3">Welcome to ChatApp</h2>
          <p className="text-gray-600 text-lg mb-2">Select a conversation to start chatting</p>
          <p className="text-gray-500 text-sm">or create a new chat from the sidebar</p>
        </div>
      </div>
    );
  }

  // ✅ REPLY HANDLER
  const handleReply = (message) => {
    console.log('========================================');
    console.log('💬 REPLY TO MESSAGE');
    console.log('========================================');
    console.log('Message ID:', message._id);
    console.log('Message text:', message.text);
    setReplyingTo(message);
    setEditingMessage(null);
  };

  // ✅ EDIT HANDLER
  const handleEdit = (message) => {
    console.log('========================================');
    console.log('✏️ EDIT MESSAGE');
    console.log('========================================');
    console.log('Message ID:', message._id);
    console.log('Current text:', message.text);
    setEditingMessage(message);
    setReplyingTo(null);
  };

  // ✅ DELETE HANDLER
  const handleDelete = async (messageId, deleteType) => {
    console.log('========================================');
    console.log('🗑️ DELETE MESSAGE');
    console.log('========================================');
    console.log('Message ID:', messageId);
    console.log('Delete type:', deleteType);

    const confirmMessage =
      deleteType === 'forEveryone'
        ? 'Delete this message for everyone? This cannot be undone.'
        : 'Delete this message for yourself?';

    if (!window.confirm(confirmMessage)) {
      console.log('❌ User cancelled delete');
      return;
    }

    try {
      if (deleteType === 'forEveryone') {
        console.log('📤 Emitting delete for everyone via socket...');

        // Emit socket event for real-time delete
        socket?.emit('message-deleted', {
          messageId,
          deleteType: 'everyone',
        });

        // Optimistically remove from UI
        setMessages((prev) => prev.filter((msg) => msg._id !== messageId));

        toast.success('Message deleted for everyone');
        console.log('✅ Delete for everyone emitted');
      } else {
        console.log('📤 Calling API to delete for me...');

        // Delete for me via API
        await messageAPI.deleteForMe(messageId);

        // Remove from UI
        setMessages((prev) => prev.filter((msg) => msg._id !== messageId));

        toast.success('Message deleted for you');
        console.log('✅ Delete for me completed');
      }
    } catch (error) {
      console.error('========================================');
      console.error('❌ DELETE ERROR');
      console.error('========================================');
      console.error('Error:', error);
      console.error('Response:', error.response?.data);
      toast.error(error.response?.data?.msg || 'Failed to delete message');
    }
    console.log('========================================');
  };

  // ✅ FORWARD HANDLER
  const handleForward = (message) => {
    console.log('========================================');
    console.log('📤 FORWARD MESSAGE');
    console.log('========================================');
    console.log('Message ID:', message._id);
    console.log('Message text:', message.text);
    setForwardingMessage(message);
  };

  // ✅ REACT HANDLER
  const handleReact = async (messageId, emoji) => {
    console.log('========================================');
    console.log('😊 REACT TO MESSAGE');
    console.log('========================================');
    console.log('Message ID:', messageId);
    console.log('Emoji:', emoji);

    if (!socket || !socket.connected) {
      console.error('❌ Socket not connected');
      toast.error('Connection lost. Please refresh.');
      return;
    }

    try {
      // ✅ OPTIMISTIC UPDATE - Update UI immediately
      setMessages((prevMessages) =>
        prevMessages.map((msg) => {
          if (msg._id === messageId) {
            const reactions = msg.reactions || [];
            const existingReaction = reactions.find(
              (r) => r.user._id === user._id && r.emoji === emoji
            );

            if (existingReaction) {
              // Remove reaction if already exists
              return {
                ...msg,
                reactions: reactions.filter(
                  (r) => !(r.user._id === user._id && r.emoji === emoji)
                ),
              };
            } else {
              // Add new reaction
              return {
                ...msg,
                reactions: [
                  ...reactions,
                  {
                    user: { _id: user._id, name: user.name },
                    emoji,
                  },
                ],
              };
            }
          }
          return msg;
        })
      );

      console.log('📤 Emitting reaction via socket...');
      socket.emit('message-reaction', {
        messageId,
        emoji
      });
      console.log('✅ Reaction emitted and UI updated instantly');
      console.log('========================================');
    } catch (error) {
      console.error('❌ React error:', error);
      toast.error('Failed to react to message');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white h-screen">
      {/* HEADER - Use the Header component */}
      <Header />

      {/* MESSAGES AREA */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 bg-gradient-to-br from-gray-50 to-gray-100">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader size="lg" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-gray-500 text-lg">No messages yet</p>
              <p className="text-sm text-gray-400 mt-1">Start the conversation by sending a message!</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => {
              if (!message || !message._id) {
                console.warn('Invalid message:', message);
                return null;
              }
              return (
                <MessageItem
                  key={message._id}
                  message={message}
                  onReply={handleReply}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onForward={handleForward}
                  onReact={handleReact}
                />
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
        <TypingIndicator users={typingUsers} />
      </div>

      {/* MESSAGE INPUT */}
      <div className="shrink-0">
        <MessageInput
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
          editingMessage={editingMessage}
          onCancelEdit={() => setEditingMessage(null)}
        />
      </div>

      {/* MODALS */}
      {forwardingMessage && (
        <ForwardMessageModal message={forwardingMessage} onClose={() => setForwardingMessage(null)} />
      )}
    </div>
  );
};

export default ChatArea;