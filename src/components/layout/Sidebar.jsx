import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { MessageCircle, Settings, LogOut, Bot, Phone, MessageCircleCode, User } from 'lucide-react';
import Avatar from '../common/Avatar';
import AIChatModal from '../ai/AIChatModal';
import AutoReplySettings from '../ai/AutoReplySettings';
import CallHistory from '../calls/CallHistory';
import ProfileSettings from '../common/ProfileSettings';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const [showAIChat, setShowAIChat] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCallHistory, setShowCallHistory] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  return (
    <div className="w-16 bg-linear-to-b from-blue-600 to-purple-600 flex flex-col items-center py-4 gap-4">
      {/* Logo */}
      <div className="bg-linear-to-b from-blue-600 to-purple-600 bg-opacity-20 p-2 rounded-full  shadow-3xl shadow-white">
        <MessageCircleCode size={32} className="text-white" />
      </div>

      {/* Spacer */}
      <div className="flex-1"></div>

      {/* Call History */}
      <button
        onClick={() => setShowCallHistory(true)}
        className="p-3 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors text-white"
        title="Call History"
      >
        <Phone size={24} />
      </button>

      {/* AI Chat */}
      <button
        onClick={() => setShowAIChat(true)}
        className="p-3 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors text-white"
        title="AI Assistant"
      >
        <Bot size={24} />
      </button>

      {/* Settings */}
      <button
        onClick={() => setShowSettings(true)}
        className="p-3 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors text-white"
        title="Auto-Reply Settings"
      >
        <Settings size={24} />
      </button>

      {/* Profile */}
      <button
        onClick={() => setShowProfile(true)}
        className="relative"
        title="Profile"
      >
        <Avatar src={user?.avatarUrl} name={user?.name} size="md" />
      </button>

      {/* Logout */}
      <button
        onClick={logout}
        className="p-3 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors text-white"
        title="Logout"
      >
        <LogOut size={24} />
      </button>

      {/* Modals */}
      {showCallHistory && <CallHistory isOpen={showCallHistory} onClose={() => setShowCallHistory(false)} />}
      {showAIChat && <AIChatModal isOpen={showAIChat} onClose={() => setShowAIChat(false)} />}
      {showSettings && (
        <AutoReplySettings isOpen={showSettings} onClose={() => setShowSettings(false)} />
      )}
      {showProfile && <ProfileSettings isOpen={showProfile} onClose={() => setShowProfile(false)} />}
    </div>
  );
};

export default Sidebar;