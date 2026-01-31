import { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { conversationAPI, messageAPI } from '../services/api';
import { useSocket } from './SocketContext';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export const ChatContext = createContext();
export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
  const { socket } = useSocket();
  const { isAuthenticated, user } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [loading, setLoading] = useState(false);

  const fetchConversations = useCallback(async (selectId = null) => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const response = await conversationAPI.getAll();
      const conversationsData = Array.isArray(response.data) ? response.data : [];
      setConversations(conversationsData);

      // Auto-select conversation if selectId provided (for new chats)
      if (selectId) {
        const toSelect = conversationsData.find(c => c._id === selectId);
        if (toSelect) {
          console.log('✅ Auto-selecting conversation:', selectId);
          setSelectedConversation(toSelect);
        }
      }
    } catch {
      toast.error('Failed to load conversations.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchMessages = useCallback(async (conversationId) => {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    setLoading(true);
    try {
      const response = await messageAPI.getMessages(conversationId);
      setMessages(Array.isArray(response.data) ? response.data : []);
    } catch {
      toast.error('Failed to load messages.');
    } finally {
      setLoading(false);
    }
  }, []);

  const sendMessage = async (text, media = null) => {
    if (!selectedConversation) return;
    try {
      if (media) {
        console.log('📤 Sending media message...');
        const formData = new FormData();
        formData.append('conversationId', selectedConversation._id);
        formData.append('text', text || '');
        formData.append('media', media);

        const response = await messageAPI.sendMedia(formData);
        console.log('✅ Media message sent, response:', response.data);

        // Handle both response formats: { message: {...} } or just the message object
        const newMessage = response.data.message || response.data;

        if (newMessage && newMessage._id) {
          console.log('✅ Adding media message to UI:', newMessage._id);

          // Immediately add the message to the UI (optimistic update)
          setMessages(prev => {
            // Check if message already exists
            if (!prev.some(m => m._id === newMessage._id)) {
              return [...prev, newMessage];
            }
            return prev;
          });

          // Update conversation list with new last message
          setConversations(prev => {
            const newConvos = prev.map(c =>
              c._id === selectedConversation._id
                ? { ...c, lastMessage: newMessage, updatedAt: newMessage.createdAt || new Date() }
                : c
            );
            // Sort conversations by most recent
            return newConvos.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
          });

          // Emit socket event so other users get the message
          if (socket?.connected) {
            socket.emit('new-message-broadcast', {
              message: newMessage,
              conversationId: selectedConversation._id,
            });
          }
        }
      } else if (text.trim()) {
        if (!socket?.connected) {
          toast.error('Not connected. Please refresh.');
          return;
        }

        console.log('📤 Sending text message via socket...');
        // No optimistic update for text messages - wait for socket response
        // This prevents duplicate messages (sender gets their own message back from socket)
        socket.emit('send-message', {
          conversationId: selectedConversation._id,
          text: text.trim(),
        });
      }
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      toast.error('Failed to send message.');
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchConversations();
  }, [isAuthenticated, fetchConversations]);

  useEffect(() => {
    if (selectedConversation?._id) {
      fetchMessages(selectedConversation._id);
      setTypingUsers({});

      // Join the conversation room for real-time updates
      if (socket?.connected) {
        socket.emit('join-conversation', selectedConversation._id);
        console.log('🚪 Joined conversation room:', selectedConversation._id);

        // Mark messages as seen when opening conversation
        socket.emit('mark-messages-seen', { conversationId: selectedConversation._id });
        console.log('👁️ Marking messages as seen in:', selectedConversation._id);
      }
    }

    // Cleanup: leave room when switching conversations
    return () => {
      if (selectedConversation?._id && socket?.connected) {
        socket.emit('leave-conversation', selectedConversation._id);
        console.log('👋 Left conversation room:', selectedConversation._id);
      }
    };
  }, [selectedConversation, fetchMessages, socket]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = ({ message, conversationId }) => {
      console.log('📥 Received new message:', message._id);

      setMessages(prev => {
        if (selectedConversation?._id === conversationId) {
          // Add if not duplicate
          if (!prev.some(m => m._id === message._id)) {
            console.log('✅ Adding message to UI');
            return [...prev, message];
          } else {
            console.log('⚠️ Duplicate message, skipping');
          }
        }
        return prev;
      });

      setConversations(prev => {
        const newConvos = prev.map(c =>
          c._id === conversationId ? { ...c, lastMessage: message, updatedAt: message.createdAt } : c
        );
        return newConvos.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      });
    };

    const handleUserTyping = ({ userId, conversationId, userInfo }) => {
      if (user?._id !== userId && selectedConversation?._id === conversationId) {
        setTypingUsers(prev => ({ ...prev, [userId]: userInfo }));
      }
    };

    const handleUserStoppedTyping = ({ userId, conversationId }) => {
      if (user?._id !== userId && selectedConversation?._id === conversationId) {
        setTypingUsers(prev => {
          const newTyping = { ...prev };
          delete newTyping[userId];
          return newTyping;
        });
      }
    };

    const handleMessagesSeen = ({ conversationId, seenBy, messageIds }) => {
      console.log('👁️ Messages seen event:', { conversationId, seenBy, messageCount: messageIds?.length });

      if (selectedConversation?._id === conversationId) {
        setMessages(prev => prev.map(msg => {
          if (messageIds?.includes(msg._id) && !msg.seenBy?.includes(seenBy)) {
            return {
              ...msg,
              seenBy: [...(msg.seenBy || []), seenBy]
            };
          }
          return msg;
        }));
      }
    };

    socket.on('new-message', handleNewMessage);
    socket.on('user-typing', handleUserTyping);
    socket.on('user-stopped-typing', handleUserStoppedTyping);
    socket.on('messages-seen', handleMessagesSeen);

    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('user-typing', handleUserTyping);
      socket.off('user-stopped-typing', handleUserStoppedTyping);
      socket.off('messages-seen', handleMessagesSeen);
    };
  }, [socket, selectedConversation, user]);

  return (
    <ChatContext.Provider
      value={{
        conversations, setConversations,
        selectedConversation, setSelectedConversation,
        messages, setMessages,
        typingUsers, setTypingUsers,
        loading,
        fetchConversations,
        sendMessage,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};