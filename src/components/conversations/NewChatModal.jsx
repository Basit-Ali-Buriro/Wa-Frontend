import { useState, useEffect } from 'react';
import { userAPI, conversationAPI } from '../../services/api';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../hooks/useAuth';
import Modal from '../common/Modal';
import Avatar from '../common/Avatar';
import Input from '../common/Input';
import Loader from '../common/Loader';
import toast from 'react-hot-toast';

const NewChatModal = ({ onClose }) => {
  const { fetchConversations, setSelectedConversation } = useChat();
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchAllUsers();
  }, []);

  const fetchAllUsers = async () => {
    setLoading(true);
    try {
      const response = await userAPI.getAllUsers();
      const filteredUsers = Array.isArray(response.data)
        ? response.data.filter((u) => u._id !== user._id)
        : [];
      setUsers(filteredUsers);
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      toast.error('Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);

    if (!query || !query.trim()) {
      fetchAllUsers();
      return;
    }

    setLoading(true);
    try {
      const response = await userAPI.searchUsers(query);
      const filteredUsers = Array.isArray(response.data)
        ? response.data.filter((u) => u._id !== user._id)
        : [];
      setUsers(filteredUsers);
    } catch (error) {
      console.error('❌ Error searching users:', error);
      toast.error('Search failed');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChat = async (selectedUser) => {
    console.log('========================================');
    console.log('🚀 CREATE CHAT DEBUG INFO');
    console.log('========================================');
    console.log('Current User:', user);
    console.log('Current User ID:', user?._id);
    console.log('Selected User:', selectedUser);
    console.log('Selected User ID:', selectedUser?._id);
    console.log('========================================');

    // Validation
    if (!user || !user._id) {
      console.error('❌ Current user is not defined');
      toast.error('Authentication error. Please log in again.');
      return;
    }

    if (!selectedUser || !selectedUser._id) {
      console.error('❌ Selected user is invalid:', selectedUser);
      toast.error('Invalid user selected');
      return;
    }

    if (selectedUser._id === user._id) {
      console.error('❌ User trying to chat with themselves');
      toast.error('You cannot chat with yourself');
      return;
    }

    const payload = {
      participantId: selectedUser._id
    };

    console.log('📦 Payload to send:', payload);
    console.log('📦 Payload JSON:', JSON.stringify(payload));

    setCreating(true);

    try {
      console.log('📤 Sending request to create conversation...');
      const response = await conversationAPI.create(payload);

      console.log('✅ Response received:', response);
      console.log('✅ Conversation data:', response.data);

      // Refresh conversations and auto-select the newly created one
      await fetchConversations(response.data._id);

      toast.success(`Chat started with ${selectedUser.name}`);
      onClose();
    } catch (error) {
      console.error('========================================');
      console.error('❌ CREATE CONVERSATION ERROR');
      console.error('========================================');
      console.error('Error object:', error);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      console.error('Error response status:', error.response?.status);
      console.error('Error response headers:', error.response?.headers);
      console.error('Error message:', error.message);
      console.error('========================================');

      const errorMessage = error.response?.data?.msg ||
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to create chat. Please try again.';

      toast.error(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="New Chat" size="md">
      <div className="space-y-4">
        <div className="relative">
          <Input
            type="text"
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            disabled={loading || creating}
          />
          {searchQuery && (
            <button
              onClick={() => handleSearch('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>

        {!loading && users.length > 0 && (
          <p className="text-sm text-gray-600">
            {users.length} user{users.length !== 1 ? 's' : ''} available
          </p>
        )}

        <div className="max-h-96 overflow-y-auto space-y-2">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader size="md" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {searchQuery ? 'No users found' : 'No other users available'}
              </p>
            </div>
          ) : (
            users.map((selectedUser) => (
              <div
                key={selectedUser._id}
                onClick={() => !creating && handleCreateChat(selectedUser)}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all ${creating
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-gray-100 cursor-pointer hover:shadow-sm'
                  }`}
              >
                <Avatar
                  src={selectedUser.avatarUrl}
                  name={selectedUser.name}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-800 truncate">
                    {selectedUser.name}
                  </h4>
                  <p className="text-sm text-gray-600 truncate">
                    {selectedUser.email}
                  </p>
                </div>
                {creating && <Loader size="sm" />}
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
};

export default NewChatModal;