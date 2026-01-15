import io from 'socket.io-client';
import { SOCKET_URL } from '../utils/constants';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
  }

  connect() {
    if (this.socket?.connected) {
      console.log('✅ Socket already connected');
      return this.socket;
    }

    console.log('🔌 Connecting to socket server...');
    this.socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket.id);
      this.connected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      this.connected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('🔄 Attempting to reconnect...', attemptNumber);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ Socket reconnection failed');
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  emit(event, data) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Message events
  sendMessage(data) {
    this.emit('send-message', data);
  }

  editMessage(data) {
    this.emit('message-edited', data);
  }

  deleteMessage(data) {
    this.emit('message-deleted', data);
  }

  reactToMessage(data) {
    this.emit('message-reaction', data);
  }

  // Typing events
  startTyping(conversationId) {
    this.emit('typing-started', conversationId);
  }

  stopTyping(conversationId) {
    this.emit('typing-stopped', conversationId);
  }

  // Conversation events
  joinConversation(conversationId) {
    this.emit('join-conversation', conversationId);
  }

  leaveConversation(conversationId) {
    this.emit('leave-conversation', conversationId);
  }

  // Call events
  initiateCall(data) {
    this.emit('call:initiate', data);
  }

  acceptCall(data) {
    this.emit('call:accept', data);
  }

  rejectCall(data) {
    this.emit('call:reject', data);
  }

  endCall(data) {
    this.emit('call:end', data);
  }

  // WebRTC signaling
  sendOffer(data) {
    this.emit('webrtc:offer', data);
  }

  sendAnswer(data) {
    this.emit('webrtc:answer', data);
  }

  sendIceCandidate(data) {
    this.emit('webrtc:ice-candidate', data);
  }
}

export default new SocketService();