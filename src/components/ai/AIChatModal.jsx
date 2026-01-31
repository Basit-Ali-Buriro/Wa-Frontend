import { useState } from 'react';
import { aiAPI } from '../../services/api';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { Bot, Send } from 'lucide-react';
import toast from 'react-hot-toast';

const AIChatModal = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    { sender: 'AI', text: 'Hello! How can I assist you today?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: 'User', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await aiAPI.chat({
        prompt: input,
        conversationHistory: messages,
      });

      const aiMessage = { sender: 'AI', text: response.data.response };
      setMessages((prev) => [...prev, aiMessage]);
    } catch {
      toast.error('AI request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="AI Assistant" size="lg">
      <div className="flex flex-col h-[60vh] sm:h-96">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-3">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.sender === 'User' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-md px-4 py-2 rounded-lg ${msg.sender === 'User'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-800'
                  }`}
              >
                {msg.sender === 'AI' && (
                  <div className="flex items-center gap-2 mb-1">
                    <Bot size={16} />
                    <span className="text-xs font-semibold">AI Assistant</span>
                  </div>
                )}
                <p className="whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100"></span>
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200"></span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask me anything..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button onClick={handleSend} disabled={loading || !input.trim()}>
            <Send size={18} />
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AIChatModal;