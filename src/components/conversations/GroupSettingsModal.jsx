import { useState, useRef } from 'react';
import { conversationAPI, userAPI } from '../../services/api';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../hooks/useAuth';
import Modal from '../common/Modal';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import Input from '../common/Input';
import { UserPlus, UserMinus, Crown, Edit2, Image, X, Camera } from 'lucide-react';
import toast from 'react-hot-toast';

const GroupSettingsModal = ({ conversation, onClose }) => {
  const { user } = useAuth();
  const { fetchConversations, setSelectedConversation } = useChat();
  
  const [groupName, setGroupName] = useState(conversation.groupName || '');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAddUsers, setShowAddUsers] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(conversation.groupAvatar || '');
  const fileInputRef = useRef(null);

  console.log('========================================');
  console.log('👥 GROUP SETTINGS MODAL');
  console.log('========================================');
  console.log('Conversation:', conversation);
  console.log('Current user:', user);
  console.log('Group admins:', conversation.groupAdmins);
  console.log('========================================');

  // Check if current user is admin
  const isAdmin = conversation.groupAdmins?.some((admin) => {
    const adminId = typeof admin === 'string' ? admin : admin._id;
    return adminId === user._id;
  });

  console.log('✅ Is user admin?', isAdmin);

  // Handle rename group
  const handleRenameGroup = async () => {
    if (!groupName.trim()) {
      toast.error('Group name cannot be empty');
      return;
    }

    if (groupName === conversation.groupName) {
      setIsEditing(false);
      return;
    }

    console.log('========================================');
    console.log('✏️ RENAME GROUP');
    console.log('========================================');
    console.log('Group ID:', conversation._id);
    console.log('New name:', groupName);

    setLoading(true);
    try {
      const response = await conversationAPI.renameGroup(conversation._id, { 
        newName: groupName.trim() 
      });
      
      console.log('✅ Group renamed:', response.data);
      
      await fetchConversations();
      setSelectedConversation(response.data);
      toast.success('Group renamed successfully!');
      setIsEditing(false);
    } catch (error) {
      console.error('❌ Rename error:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.msg || 'Failed to rename group');
      setGroupName(conversation.groupName); // Revert
    } finally {
      setLoading(false);
    }
  };

  // Handle remove participant
  const handleRemoveParticipant = async (participantId) => {
    if (!isAdmin) {
      toast.error('Only admins can remove participants');
      return;
    }

    if (participantId === user._id) {
      toast.error('You cannot remove yourself. Use "Leave Group" instead.');
      return;
    }

    const participant = conversation.participants.find(p => p._id === participantId);
    const confirmMessage = `Remove ${participant?.name || 'this user'} from the group?`;

    if (!window.confirm(confirmMessage)) return;

    console.log('========================================');
    console.log('➖ REMOVE PARTICIPANT');
    console.log('========================================');
    console.log('Group ID:', conversation._id);
    console.log('Participant ID:', participantId);

    setLoading(true);
    try {
      const response = await conversationAPI.removeParticipants(conversation._id, {
        participants: [participantId],
      });

      console.log('✅ Participant removed:', response.data);

      await fetchConversations();
      setSelectedConversation(response.data);
      toast.success('Participant removed successfully');
    } catch (error) {
      console.error('❌ Remove participant error:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.msg || 'Failed to remove participant');
    } finally {
      setLoading(false);
    }
  };

  // Handle make admin
  const handleMakeAdmin = async (participantId) => {
    if (!isAdmin) {
      toast.error('Only admins can manage admins');
      return;
    }

    const participant = conversation.participants.find(p => p._id === participantId);
    const confirmMessage = `Make ${participant?.name || 'this user'} an admin?`;

    if (!window.confirm(confirmMessage)) return;

    console.log('========================================');
    console.log('👑 MAKE ADMIN');
    console.log('========================================');
    console.log('Group ID:', conversation._id);
    console.log('New admin ID:', participantId);

    setLoading(true);
    try {
      const response = await conversationAPI.changeAdmin(conversation._id, {
        newAdminId: participantId,
      });

      console.log('✅ Admin changed:', response.data);

      await fetchConversations();
      setSelectedConversation(response.data);
      toast.success('Admin added successfully');
    } catch (error) {
      console.error('❌ Change admin error:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.msg || 'Failed to change admin');
    } finally {
      setLoading(false);
    }
  };

  // Fetch users to add
  const fetchAvailableUsers = async () => {
    try {
      const response = await userAPI.getAllUsers();
      
      // Filter out users already in the group and current user
      const currentParticipantIds = conversation.participants.map(p => p._id);
      const available = response.data.filter(
        u => !currentParticipantIds.includes(u._id) && u._id !== user._id
      );
      
      setAvailableUsers(available);
      console.log('📋 Available users to add:', available.length);
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      toast.error('Failed to load users');
    }
  };

  // Handle add participants
  const handleAddParticipant = async (userId) => {
    if (!isAdmin) {
      toast.error('Only admins can add participants');
      return;
    }

    console.log('========================================');
    console.log('➕ ADD PARTICIPANT');
    console.log('========================================');
    console.log('Group ID:', conversation._id);
    console.log('User ID:', userId);

    setLoading(true);
    try {
      const response = await conversationAPI.addParticipants(conversation._id, {
        participants: [userId],
      });

      console.log('✅ Participant added:', response.data);

      await fetchConversations();
      setSelectedConversation(response.data);
      toast.success('Participant added successfully');
      setShowAddUsers(false);
    } catch (error) {
      console.error('❌ Add participant error:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.msg || 'Failed to add participant');
    } finally {
      setLoading(false);
    }
  };

  // Handle avatar file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setAvatarFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Handle update group avatar
  const handleUpdateAvatar = async () => {
    if (!avatarFile) {
      toast.error('Please select an image');
      return;
    }

    console.log('========================================');
    console.log('🖼️ UPDATE GROUP AVATAR');
    console.log('========================================');
    console.log('Group ID:', conversation._id);
    console.log('File:', avatarFile.name);

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('groupAvatar', avatarFile);

      const response = await conversationAPI.updateGroupAvatar(conversation._id, formData);
      
      console.log('✅ Avatar updated:', response.data);
      
      await fetchConversations();
      setSelectedConversation(response.data);
      toast.success('Group avatar updated successfully!');
      setAvatarFile(null);
    } catch (error) {
      console.error('❌ Avatar update error:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.msg || 'Failed to update group avatar');
    } finally {
      setLoading(false);
    }
  };

  // Handle leave group
  const handleLeaveGroup = async () => {
    const confirmMessage = isAdmin
      ? 'Are you sure you want to leave? You are an admin of this group.'
      : 'Are you sure you want to leave this group?';

    if (!window.confirm(confirmMessage)) return;

    console.log('🚪 LEAVE GROUP:', conversation._id);

    setLoading(true);
    try {
      await conversationAPI.removeParticipants(conversation._id, {
        participants: [user._id],
      });

      await fetchConversations();
      setSelectedConversation(null);
      toast.success('You left the group');
      onClose();
    } catch (error) {
      console.error('❌ Leave group error:', error);
      toast.error('Failed to leave group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Group Settings" size="md">
      <div className="space-y-6">
        {/* Group Avatar */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <Avatar
              src={avatarPreview}
              name={conversation.groupName}
              size="xl"
              className="mb-3"
            />
            {isAdmin && avatarFile && (
              <div className="absolute -top-2 -right-2">
                <button
                  onClick={() => {
                    setAvatarFile(null);
                    setAvatarPreview(conversation.groupAvatar || '');
                  }}
                  className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                disabled={loading}
              >
                <Camera size={16} />
                {avatarFile ? 'Change Photo' : 'Upload Photo'}
              </button>
              {avatarFile && (
                <Button
                  onClick={handleUpdateAvatar}
                  loading={loading}
                  size="sm"
                  className="text-xs"
                >
                  Save
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Group Name */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">Group Name</label>
            {isAdmin && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-blue-600 hover:text-blue-700 p-1 rounded transition-colors"
                disabled={loading}
              >
                <Edit2 size={16} />
              </button>
            )}
          </div>

          {isEditing ? (
            <div className="flex gap-2">
              <Input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Group name"
                disabled={loading}
                className="flex-1"
              />
              <Button 
                onClick={handleRenameGroup} 
                disabled={loading || !groupName.trim()} 
                size="sm"
              >
                {loading ? 'Saving...' : 'Save'}
              </Button>
              <Button
                onClick={() => {
                  setIsEditing(false);
                  setGroupName(conversation.groupName);
                }}
                variant="secondary"
                size="sm"
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <p className="text-gray-800 font-medium">{conversation.groupName}</p>
          )}
        </div>

        {/* Participants */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700">
              Participants ({conversation.participants?.length || 0})
            </h4>
            {isAdmin && (
              <button
                onClick={() => {
                  setShowAddUsers(!showAddUsers);
                  if (!showAddUsers) fetchAvailableUsers();
                }}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                disabled={loading}
              >
                {showAddUsers ? <X size={16} /> : <UserPlus size={16} />}
                {showAddUsers ? 'Cancel' : 'Add'}
              </button>
            )}
          </div>

          {/* Add Users Panel */}
          {showAddUsers && isAdmin && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <Input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mb-2"
              />
              <div className="max-h-40 overflow-y-auto space-y-1">
                {availableUsers
                  .filter(u => 
                    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    u.email.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((availableUser) => (
                    <div
                      key={availableUser._id}
                      onClick={() => handleAddParticipant(availableUser._id)}
                      className="flex items-center gap-2 p-2 hover:bg-blue-100 rounded cursor-pointer transition-colors"
                    >
                      <Avatar src={availableUser.avatarUrl} name={availableUser.name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {availableUser.name}
                        </p>
                        <p className="text-xs text-gray-600 truncate">
                          {availableUser.email}
                        </p>
                      </div>
                    </div>
                  ))}
                {availableUsers.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-2">
                    No users available to add
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Participant List */}
          <div className="max-h-64 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-2">
            {conversation.participants?.map((participant) => {
              const isParticipantAdmin = conversation.groupAdmins?.some((admin) => {
                const adminId = typeof admin === 'string' ? admin : admin._id;
                const participantId = typeof participant === 'string' ? participant : participant._id;
                return adminId === participantId;
              });

              return (
                <div
                  key={participant._id}
                  className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar
                      src={participant.avatarUrl}
                      name={participant.name}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">
                        {participant.name}
                        {participant._id === user._id && ' (You)'}
                      </p>
                      {isParticipantAdmin && (
                        <p className="text-xs text-blue-600 flex items-center gap-1">
                          <Crown size={12} />
                          Admin
                        </p>
                      )}
                    </div>
                  </div>

                  {isAdmin && participant._id !== user._id && (
                    <div className="flex gap-2 shrink-0">
                      {!isParticipantAdmin && (
                        <button
                          onClick={() => handleMakeAdmin(participant._id)}
                          className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 hover:bg-blue-50 rounded transition-colors"
                          disabled={loading}
                        >
                          Make Admin
                        </button>
                      )}
                      <button
                        onClick={() => handleRemoveParticipant(participant._id)}
                        className="text-red-600 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
                        disabled={loading}
                      >
                        <UserMinus size={16} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Leave Group */}
        <div className="pt-4 border-t border-gray-200">
          <Button 
            variant="danger" 
            className="w-full" 
            onClick={handleLeaveGroup}
            disabled={loading}
          >
            {loading ? 'Leaving...' : 'Leave Group'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default GroupSettingsModal;