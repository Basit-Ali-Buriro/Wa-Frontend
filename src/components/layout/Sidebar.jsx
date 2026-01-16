import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { MessageCircle, Settings, LogOut, Bot, Phone, MessageCircleCode, User } from 'lucide-react';
import Avatar from '../common/Avatar';
import AIChatModal from '../ai/AIChatModal';
import AutoReplySettings from '../ai/AutoReplySettings';
import CallHistory from '../calls/CallHistory';
import ProfileSettings from '../common/ProfileSettings';

const Sidebar = ({ onNavigate }) => {
  const { user, logout } = useAuth();
  const [showAIChat, setShowAIChat] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCallHistory, setShowCallHistory] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const handleItemClick = (callback) => {
    callback();
    // Close mobile menu after clicking an item
    if (onNavigate) {
      onNavigate();
    }
  };

  return (
    <div className="w-16 md:w-16 bg-gradient-to-b from-blue-600 to-purple-600 flex flex-col items-center py-4 gap-4 h-full overflow-y-auto">
      {/* Logo */}
      <div className="bg-gradient-to-br from-blue-400 to-purple-400 bg-opacity-20 p-2 rounded-full shadow-lg flex-shrink-0">
        <MessageCircleCode size={32} className="text-white" />
      </div>

      {/* Spacer */}
      <div className="flex-1"></div>

      {/* Call History */}
      <button
        onClick={() => handleItemClick(() => setShowCallHistory(true))}
        className="p-3 hover:bg-white/20 rounded-full transition-colors text-white flex-shrink-0"
        title="Call History"
      >
        <Phone size={24} />
      </button>

      {/* AI Chat */}
      <button
        onClick={() => handleItemClick(() => setShowAIChat(true))}
        className="p-3 hover:bg-white/20 rounded-full transition-colors text-white flex-shrink-0"
        title="AI Assistant"
      >
        <Bot size={24} />
      </button>

      {/* Settings */}
      <button
        onClick={() => handleItemClick(() => setShowSettings(true))}
        className="p-3 hover:bg-white/20 rounded-full transition-colors text-white flex-shrink-0"
        title="Auto-Reply Settings"
      >
        <Settings size={24} />
      </button>

      {/* Profile */}
      <button
        onClick={() => handleItemClick(() => setShowProfile(true))}
        className="relative flex-shrink-0"
        title="Profile"
      >
        <Avatar src={user?.avatarUrl} name={user?.name} size="md" />
      </button>

      {/* Logout */}
      <button
        onClick={() => handleItemClick(logout)}
        className="p-3 hover:bg-white/20 rounded-full transition-colors text-white flex-shrink-0"
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