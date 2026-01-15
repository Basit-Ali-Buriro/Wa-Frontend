import { useState, useRef, useEffect } from 'react';
import { useChat } from '../../hooks/useChat';
import { useSocket } from '../../hooks/useSocket';
import { messageAPI, aiAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Send, Paperclip, Smile, X, Sparkles } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import MediaPreview from './MediaPreview';
import SmartSuggestions from '../ai/SmartSuggestions';

const MessageInput = ({ replyingTo, onCancelReply, editingMessage, onCancelEdit }) => {
  const { sendMessage, selectedConversation } = useChat();
  const { socket } = useSocket();

  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.text || '');
    } else {
      setText('');
    }
  }, [editingMessage]);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleTyping = (e) => {
    const newText = e.target.value;
    setText(newText);

    if (!socket || !socket.connected || !selectedConversation) {
      return;
    }

    if (!typingTimeoutRef.current) {
      console.log('✍️ Emitting typing-started...');
      socket.emit('typing-started', selectedConversation._id);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      console.log('✍️ Emitting typing-stopped (timeout)...');
      socket.emit('typing-stopped', selectedConversation._id);
      typingTimeoutRef.current = null;
    }, 3000);
  };
  
  const stopTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      if (socket && socket.connected && selectedConversation) {
        console.log('✍️ Emitting typing-stopped (force)...');
        socket.emit('typing-stopped', selectedConversation._id);
      }
      typingTimeoutRef.current = null;
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((!text.trim() && !selectedFile) || !selectedConversation) {
      return;
    }
    
    setIsSending(true);
    stopTyping(); // Stop typing indicator when message is sent

    try {
      if (editingMessage) {
        socket?.emit('message-edited', { messageId: editingMessage._id, newText: text.trim() });
        onCancelEdit();
      } else if (replyingTo) {
        const payload = {
          conversationId: selectedConversation._id,
          text: text.trim(),
          replyTo: replyingTo._id,
        };
        // Handle media in reply if needed
        await messageAPI.reply(payload);
        onCancelReply();
      } else {
        await sendMessage(text.trim(), selectedFile);
      }
      
      setText('');
      clearFile();
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      toast.error('File size must be less than 50MB');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleEmojiClick = (emojiObject) => {
    setText((prev) => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };
  
  const handleSuggestionClick = (suggestion) => {
    setText(suggestion);
    setShowSuggestions(false);
  };
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [emojiPickerRef]);

  return (
    <div className="border-t border-gray-200 bg-white">
      {(replyingTo || editingMessage) && (
        <div className="bg-gray-100 px-4 py-3 flex items-center justify-between border-b">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-600">
              {editingMessage ? 'Editing message' : `Replying to ${replyingTo.sender.name}`}
            </p>
            <p className="text-sm text-gray-800 truncate">
              {editingMessage ? editingMessage.text : replyingTo.text}
            </p>
          </div>
          <button
            onClick={editingMessage ? onCancelEdit : onCancelReply}
            className="p-1 hover:bg-gray-200 rounded-full"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {selectedFile && <MediaPreview file={selectedFile} preview={preview} onClear={clearFile} />}

      {showSuggestions && selectedConversation && (
        <SmartSuggestions
          conversationId={selectedConversation._id}
          onSelect={handleSuggestionClick}
          onClose={() => setShowSuggestions(false)}
        />
      )}

      <form onSubmit={handleSubmit} className="p-2 sm:p-4 flex items-center gap-1 sm:gap-2">
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <Smile size={20} className="sm:w-6 sm:h-6 text-gray-600" />
        </button>

        <button
          type="button"
          onClick={() => setShowSuggestions(!showSuggestions)}
          className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors hidden sm:block"
          title="Smart Suggestions"
        >
          <Sparkles size={20} className="sm:w-6 sm:h-6 text-purple-600" />
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <Paperclip size={20} className="sm:w-6 sm:h-6 text-gray-600" />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        <input
          type="text"
          value={text}
          onChange={handleTyping}
          placeholder="Type a message..."
          disabled={isSending}
          className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          type="submit"
          disabled={(!text.trim() && !selectedFile) || isSending}
          className="p-1.5 sm:p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 transition-colors shrink-0"
        >
          {isSending ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Send size={20} />}
        </button>
      </form>

      {showEmojiPicker && (
        <div ref={emojiPickerRef} className="absolute bottom-20 right-4 z-50">
          <EmojiPicker onEmojiClick={handleEmojiClick} />
        </div>
      )}
    </div>
  );
};

export default MessageInput;