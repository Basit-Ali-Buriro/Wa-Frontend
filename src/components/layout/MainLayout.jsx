import { useState } from 'react';
import Sidebar from './Sidebar';
import ConversationList from '../conversations/ConversationList';
import ChatArea from '../chat/ChatArea';
import IncomingCallModal from '../calls/IncomingCallModal';
import VideoCallInterface from '../calls/VideoCallInterface';
import { useChat } from '../../hooks/useChat';
import { Menu, X } from 'lucide-react';

const MainLayout = () => {
  const { selectedConversation } = useChat();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Mobile Menu Button - Only visible on small screens */}
      <button
        onClick={() => setShowMobileMenu(!showMobileMenu)}
        className="md:hidden fixed top-4 left-4 z-50 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors"
      >
        {showMobileMenu ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile Overlay */}
      {showMobileMenu && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setShowMobileMenu(false)}
        />
      )}

      {/* Sidebar - Responsive */}
      <div className={`
        fixed md:relative z-40 h-full transition-transform duration-300 ease-in-out
        ${showMobileMenu ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <Sidebar onNavigate={() => setShowMobileMenu(false)} />
      </div>

      {/* Conversation List - Hidden on mobile when chat is selected */}
      <div className={`
        w-full sm:w-80 md:w-96 shrink-0
        ${selectedConversation ? 'hidden md:flex' : 'flex'}
      `}>
        <ConversationList />
      </div>

      {/* Chat Area - Full width on mobile, flexible on desktop */}
      <div className={`
        flex-1 min-w-0
        ${selectedConversation ? 'flex' : 'hidden md:flex'}
      `}>
        <ChatArea key={selectedConversation?._id || 'welcome-screen'} />
      </div>

      <IncomingCallModal />
      <VideoCallInterface />
    </div>
  );
};

export default MainLayout;