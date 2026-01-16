import { useState, useEffect } from 'react';
import { userAPI, conversationAPI } from '../../services/api';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../hooks/useAuth';
import Modal from '../common/Modal';
import Avatar from '../common/Avatar';
import Input from '../common/Input';
import Button from '../common/Button';
import Loader from '../common/Loader';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';

const NewGroupModal = ({ onClose }) => {
  const { fetchConversations, setSelectedConversation } = useChat();
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchAllUsers();
  }, []);

  const fetchAllUsers = async () => {
    setLoading(true);
    try {
      console.log('📋 Fetching all users for group...');
      const response = await userAPI.getAllUsers();

      // Filter out current user
      const filteredUsers = Array.isArray(response.data)
        ? response.data.filter((u) => u._id !== user._id)
        : [];

      console.log('👥 Available users for group:', filteredUsers.length);
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
      console.log('🔄 Search cleared, fetching all users');
      fetchAllUsers();
      return;
    }

    setLoading(true);
    try {
      console.log('🔍 Searching for:', query);
      const response = await userAPI.searchUsers(query);

      // Filter out current user
      const filteredUsers = Array.isArray(response.data)
        ? response.data.filter((u) => u._id !== user._id)
        : [];

      console.log('👥 Search results:', filteredUsers.length);
      setUsers(filteredUsers);
    } catch (error) {
      console.error('❌ Error searching users:', error);
      toast.error('Search failed');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserSelection = (selectedUser) => {
    setSelectedUsers((prev) => {
      const isSelected = prev.find((u) => u._id === selectedUser._id);
      if (isSelected) {
        console.log('➖ Removed user:', selectedUser.name);
        return prev.filter((u) => u._id !== selectedUser._id);
      } else {
        console.log('➕ Added user:', selectedUser.name);
        return [...prev, selectedUser];
      }
    });
  };

  const handleCreateGroup = async () => {
    console.log('========================================');
    console.log('👥 CREATE GROUP ATTEMPT');
    console.log('========================================');
    console.log('Group name:', groupName);
    console.log('Selected users count:', selectedUsers.length);
    console.log('Selected user IDs:', selectedUsers.map(u => u._id));

    // Validation
    if (!groupName.trim()) {
      toast.error('Please enter a group name');
      console.log('❌ No group name provided');
      return;
    }

    if (selectedUsers.length < 2) {
      toast.error('Please select at least 2 participants');
      console.log('❌ Not enough participants');
      return;
    }

    setCreating(true);

    try {
      // Prepare payload matching backend expectations
      const payload = {
        name: groupName.trim(),
        participants: selectedUsers.map((u) => u._id),
      };

      console.log('📦 Payload:', payload);
      console.log('📤 Sending request to create group...');

      const response = await conversationAPI.createGroup(payload);

      console.log('✅ Group created successfully:', response.data);

      // Refresh conversations and auto-select the newly created group
      await fetchConversations(response.data._id);

      toast.success(`Group "${groupName}" created successfully!`);
      console.log('========================================');
      onClose();
    } catch (error) {
      console.error('========================================');
      console.error('❌ CREATE GROUP ERROR');
      console.error('========================================');
      console.error('Error object:', error);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      console.error('Error message:', error.message);
      console.error('========================================');

      const errorMessage = error.response?.data?.msg ||
        error.response?.data?.message ||
        'Failed to create group';
      toast.error(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Create New Group" size="md">
      <div className="space-y-4">
        {/* Group name input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Group Name *
          </label>
          <Input
            type="text"
            placeholder="Enter group name (e.g., Team Project)"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            disabled={creating}
            className="w-full"
          />
        </div>

        {/* Selected users chips */}
        {selectedUsers.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selected ({selectedUsers.length})
            </label>
            <div className="flex flex-wrap gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg max-h-32 overflow-y-auto">
              {selectedUsers.map((selectedUser) => (
                <div
                  key={selectedUser._id}
                  className="flex items-center gap-2 bg-blue-500 text-white px-3 py-1.5 rounded-full text-sm shadow-sm"
                >
                  <span className="font-medium">{selectedUser.name}</span>
                  <button
                    onClick={() => toggleUserSelection(selectedUser)}
                    className="hover:bg-blue-600 rounded-full p-0.5 transition-colors"
                    disabled={creating}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Add Participants {selectedUsers.length < 2 && <span className="text-red-500">(minimum 2)</span>}
          </label>
          <div className="relative">
            <Input
              type="text"
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              disabled={loading || creating}
              className="w-full"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearch('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={loading || creating}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* User list */}
        <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader size="md" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="text-gray-300 mb-3">
                <svg
                  className="w-16 h-16 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">
                {searchQuery ? 'No users found' : 'No users available'}
              </p>
              {searchQuery && (
                <p className="text-sm text-gray-400 mt-1">
                  Try a different search term
                </p>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {users.map((selectedUser) => {
                const isSelected = selectedUsers.find((u) => u._id === selectedUser._id);
                return (
                  <div
                    key={selectedUser._id}
                    onClick={() => !creating && toggleUserSelection(selectedUser)}
                    className={`flex items-center gap-3 p-3 cursor-pointer transition-all ${isSelected
                        ? 'bg-blue-50 border-l-4 border-blue-500'
                        : 'hover:bg-gray-50 border-l-4 border-transparent'
                      } ${creating ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                    {isSelected && (
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg
                          className="w-4 h-4 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Create button */}
        <div className="flex gap-3 pt-2">
          <Button
            onClick={onClose}
            variant="secondary"
            className="flex-1"
            disabled={creating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateGroup}
            variant="primary"
            className="flex-1"
            disabled={creating || selectedUsers.length < 2 || !groupName.trim()}
          >
            {creating ? (
              <span className="flex items-center justify-center gap-2">
                <Loader size="sm" />
                Creating...
              </span>
            ) : (
              `Create Group${selectedUsers.length > 0 ? ` (${selectedUsers.length} members)` : ''}`
            )}
          </Button>
        </div>

        {/* Helper text */}
        <p className="text-xs text-gray-500 text-center">
          {selectedUsers.length < 2
            ? `Select at least ${2 - selectedUsers.length} more participant${2 - selectedUsers.length > 1 ? 's' : ''} to create a group`
            : `Ready to create group with ${selectedUsers.length} participants`
          }
        </p>
      </div>
    </Modal>
  );
};

export default NewGroupModal;