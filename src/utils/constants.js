export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
  FILE: 'file',
};

export const CALL_TYPES = {
  VOICE: 'voice',
  VIDEO: 'video',
};

export const CALL_STATUS = {
  RINGING: 'ringing',
  ACCEPTED: 'accepted',
  CONNECTED: 'connected',
  ENDED: 'ended',
  MISSED: 'missed',
  REJECTED: 'rejected',
  BUSY: 'busy',
};

export const AUTO_REPLY_MODES = {
  FRIENDLY: 'friendly',
  PROFESSIONAL: 'professional',
  FUNNY: 'funny',
};

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export const TYPING_TIMEOUT = 3000; // 3 seconds